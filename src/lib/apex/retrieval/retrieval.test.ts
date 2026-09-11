import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { citationLabel, formatContext, toCitation, toEvidence } from "./citations.ts";
import { assignChunksToTopics, assignNormalizedChunksToTopics, chunkNormalizedDocument, chunkSourceText } from "./chunking.ts";
import { selectContext } from "./context.ts";
import { hierarchyScore } from "./hierarchy.ts";
import { citationSignal, combineScores, weightsFor } from "./hybrid.ts";
import { lexicalRetrieve } from "./lexical.ts";
import { cosineSimilarity, tokenize } from "./math.ts";
import { understandQuery } from "./query-understanding.ts";
import { DiversityReranker } from "./rerank.ts";
import { MemoryVectorStore } from "./store/memory.ts";
import type { Chunk, RetrievalCandidate, UnderstoodQuery } from "./types.ts";

function chunk(partial: Partial<Chunk> & { id: number; content: string }): Chunk {
  return {
    uid: `c:${partial.id}`,
    courseId: 1,
    documentId: 1,
    chapterId: 1,
    topicId: 1,
    page: partial.page ?? 3,
    locator: partial.locator ?? { type: "page", page: partial.page ?? 3, order: partial.id },
    blockOrder: partial.id,
    blockType: "paragraph",
    heading: "What is a Computer",
    chunkIndex: partial.id,
    tokenEstimate: Math.round(partial.content.length / 4),
    topicTitle: "What is a Computer",
    chapterTitle: "Introduction to Computing",
    sourceName: "CIT 102 handbook.pdf",
    sourceFormat: "pdf",
    ...partial,
  };
}

describe("chunking", () => {
  it("splits on page markers and headings instead of a raw character window", () => {
    const raw = `[[page 2]]
# What is a Computer
A computer is an electronic device that accepts data and processes it.
It stores results and produces output.

# Hardware versus software
Hardware is the physical machinery. Software is the set of instructions.

[[page 3]]
# Stored-program concept
Programs and data both reside in memory, so the same machine can run different tasks.
`;
    const chunks = chunkSourceText(raw);
    assert.ok(chunks.length >= 2);
    assert.equal(chunks[0]?.page, 2);
    assert.equal(chunks[0]?.heading, "What is a Computer");
    assert.ok(chunks.some((c) => c.page === 3 && c.heading === "Stored-program concept"));
    assert.ok(chunks.every((c) => c.content.length < 1400));
  });

  it("assigns chunks to the topic whose title/key ideas match", () => {
    const assigned = assignChunksToTopics(
      {
        code: "CIT 102",
        title: "Computer Fundamentals",
        chapters: [
          {
            title: "Ch1",
            topics: [
              { title: "What is a Computer", summary: "", keyIdeas: ["stored-program"] },
              { title: "Generations of Computers", summary: "", keyIdeas: ["vacuum tubes"] },
            ],
          },
        ],
      },
      `[[page 5]]
# Generations of Computers
First-generation computers used vacuum tubes and were programmed in machine language.
`,
    );
    assert.equal(assigned[0]?.topicIndex, 1);
    assert.equal(assigned[0]?.page, 5);
  });

  it("keeps PDF page provenance, block order, and heading context from a normalized document", () => {
    const chunks = chunkNormalizedDocument({
      source: { name: "EDU201.pdf", format: "pdf", mimeType: "application/pdf", kind: "upload" },
      blocks: [
        { type: "heading", text: "Delivery Lecture Method", heading: "Delivery Lecture Method", order: 10, locator: { type: "page", page: 3, heading: "Delivery Lecture Method", order: 10 } },
        { type: "paragraph", text: "A lecture is a teacher-centred method of teaching.", heading: "Delivery Lecture Method", order: 11, locator: { type: "page", page: 3, heading: "Delivery Lecture Method", order: 11 } },
      ],
    });
    assert.equal(chunks[0]?.locator.type, "page");
    assert.equal(chunks[0]?.locator.page, 3);
    assert.equal(chunks[0]?.blockOrder, 11);
    assert.equal(chunks[0]?.heading, "Delivery Lecture Method");
    assert.match(chunks[0]?.content ?? "", /Delivery Lecture Method/);
  });

  it("retains PPTX slide and DOCX section locators without inventing PDF pages", () => {
    const pptx = chunkNormalizedDocument({
      source: { name: "methods.pptx", format: "pptx", mimeType: null, kind: "upload" },
      blocks: [
        { type: "paragraph", text: "Teacher-centred exposition.", heading: "Lecture", order: 2, locator: { type: "slide", slide: 4, section: "Lecture", order: 2 } },
      ],
    });
    const docx = chunkNormalizedDocument({
      source: { name: "methods.docx", format: "docx", mimeType: null, kind: "upload" },
      blocks: [
        { type: "table", text: "Method | Focus", heading: "Teaching methods", order: 7, locator: { type: "section", section: "Teaching methods", order: 7 } },
      ],
    });
    assert.equal(pptx[0]?.locator.slide, 4);
    assert.equal(pptx[0]?.locator.type, "slide");
    assert.equal(pptx[0]?.locator.page, undefined);
    assert.equal(docx[0]?.locator.type, "section");
    assert.equal(docx[0]?.locator.section, "Teaching methods");
  });

  it("leaves weak normalized-topic matches unassigned while retaining the chunk", () => {
    const assigned = assignNormalizedChunksToTopics(
      { code: "EDU 201", title: "Education", chapters: [{ title: "Methods", topics: [{ title: "Lecture Method", summary: "", keyIdeas: ["teacher-centred"] }] }] },
      {
        source: { name: "notes.txt", format: "txt", mimeType: "text/plain", kind: "upload" },
        blocks: [{ type: "paragraph", text: "Attendance is recorded every morning.", order: 0, locator: { type: "text", order: 0 } }],
      },
    );
    assert.equal(assigned[0]?.topicIndex, null);
    assert.equal(assigned[0]?.blockOrder, 0);
  });
});

describe("math", () => {
  it("computes cosine similarity for real vectors", () => {
    assert.ok(cosineSimilarity([1, 0], [1, 0]) > 0.99);
    assert.ok(cosineSimilarity([1, 0], [0, 1]) < 0.01);
    assert.ok(cosineSimilarity([1, 1], [2, 2]) > 0.99);
  });

  it("drops stopwords when tokenizing", () => {
    assert.deepEqual(tokenize("What is the stored program concept"), [
      "stored",
      "program",
      "concept",
    ]);
  });
});

describe("query understanding", () => {
  it("rewrites with topic context and detects compare intent", () => {
    const u = understandQuery(
      { text: "How does RAM differ from ROM?", courseId: 1, userId: "u" },
      { topicTitle: "Memory", keyIdeas: ["volatile", "non-volatile"], topicId: 4, chapterId: 2 },
    );
    assert.equal(u.intent, "compare");
    assert.match(u.rewritten, /Topic: Memory/);
    assert.equal(u.focus.topicId, 4);
    assert.equal(u.expandToRelated, true);
  });
});

describe("lexical fallback", () => {
  it("ranks by overlap without claiming to be semantic", () => {
    const chunks = [
      chunk({ id: 1, content: "Vacuum tubes defined the first generation of computers." }),
      chunk({
        id: 2,
        content: "The stored-program concept lets one machine run many different jobs.",
        heading: "Stored-program concept",
        topicTitle: "What is a Computer",
      }),
    ];
    const hits = lexicalRetrieve(chunks, "stored program concept", 5);
    assert.equal(hits[0]?.chunkId, 2);
    assert.ok((hits[0]?.score ?? 0) > (hits[1]?.score ?? 0));
  });
});

describe("hierarchy + hybrid scoring", () => {
  it("boosts the current topic without zeroing related topics", () => {
    const query: UnderstoodQuery = {
      original: "memory",
      rewritten: "memory",
      intent: "explain",
      keywords: ["memory"],
      expandToRelated: true,
      focus: { courseId: 1, chapterId: 1, topicId: 10 },
    };
    const current = hierarchyScore(chunk({ id: 1, content: "x", topicId: 10 }), query, false);
    const related = hierarchyScore(chunk({ id: 2, content: "x", topicId: 11, chapterId: 1 }), query, false);
    const other = hierarchyScore(
      chunk({ id: 3, content: "x", topicId: 20, chapterId: 2 }),
      query,
      false,
    );
    assert.ok(current.score > related.score);
    assert.ok(related.score > other.score);
    assert.ok(related.score > 0);
  });

  it("uses semantic as the dominant hybrid weight", () => {
    const w = weightsFor("hybrid");
    assert.ok(w.semantic > w.lexical);
    assert.ok(w.semantic > w.hierarchy);
    const withVec = combineScores({
      semantic: 0.9,
      lexical: 0.1,
      hierarchy: 0.1,
      citation: 1,
      weights: w,
    });
    const withoutVec = combineScores({
      semantic: 0.1,
      lexical: 0.9,
      hierarchy: 0.1,
      citation: 1,
      weights: w,
    });
    assert.ok(withVec.combined > withoutVec.combined);
  });

  it("drops semantic weight in lexical-fallback mode", () => {
    const w = weightsFor("lexical-fallback");
    assert.equal(w.semantic, 0);
    assert.ok(w.lexical > 0.5);
    assert.ok(citationSignal(17, "Heading") > citationSignal(null, null));
  });
});

describe("rerank + context + citations", () => {
  it("keeps source locators of the form [Source — p. N]", () => {
    const c = chunk({ id: 9, content: "Programs and data share memory.", page: 17 });
    assert.equal(citationLabel(c), "[CIT 102 handbook — p. 17]");
    assert.equal(toCitation(c).locator, "p. 17");
    assert.equal(toCitation(c).sourceFormat, "pdf");
  });

  it("preserves native locators without fabricating PDF pages", () => {
    const pptx = chunk({
      id: 10,
      content: "Lecture slide evidence.",
      sourceName: "methods.pptx",
      sourceFormat: "pptx",
      page: null,
      locator: { type: "slide", slide: 4, order: 10 },
    });
    const docx = chunk({
      id: 11,
      content: "Teaching methods evidence.",
      sourceName: "methods.docx",
      sourceFormat: "docx",
      page: null,
      locator: { type: "section", section: "Teaching methods", order: 11 },
    });
    const text = chunk({
      id: 12,
      content: "Plain text evidence.",
      sourceName: "notes.txt",
      sourceFormat: "txt",
      page: 8,
      locator: { type: "text", order: 12 },
    });
    assert.equal(citationLabel(pptx), "[methods — slide 4]");
    assert.equal(citationLabel(docx), "[methods — section: Teaching methods]");
    assert.equal(toCitation(text).page, null);
    assert.equal(toCitation(text).locatorType, "text");
  });

  it("keeps same-page chunks distinct and traceable through evidence", () => {
    const first = chunk({ id: 20, uid: "course:doc:20", content: "First evidence." });
    const second = chunk({ id: 21, uid: "course:doc:21", content: "Second evidence." });
    const firstEvidence = toEvidence(
      { chunk: first, scores: { semantic: 0.9, lexical: 0, hierarchy: 0, citation: 0, combined: 0.9, rerank: 0.9 }, reasons: ["semantic"] },
      "used",
    );
    const secondEvidence = toEvidence(
      { chunk: second, scores: { semantic: 0.8, lexical: 0, hierarchy: 0, citation: 0, combined: 0.8, rerank: 0.8 }, reasons: ["lexical"] },
      "candidate",
    );
    assert.equal(firstEvidence.status, "used");
    assert.equal(secondEvidence.status, "candidate");
    assert.notEqual(firstEvidence.chunkUid, secondEvidence.chunkUid);
    assert.equal(toCitation(firstEvidence).documentId, first.documentId);
  });

  it("deduplicates near-identical chunks during rerank", () => {
    const mk = (id: number, content: string, combined: number): RetrievalCandidate => ({
      chunk: chunk({ id, content, page: id }),
      scores: {
        semantic: combined,
        lexical: 0.2,
        hierarchy: 0.2,
        citation: 0.7,
        combined,
        rerank: combined,
      },
      reasons: ["semantic"],
    });
    const ranked = new DiversityReranker().rerank(
      [
        mk(1, "The stored-program concept keeps programs and data in the same memory.", 0.9),
        mk(2, "The stored-program concept keeps programs and data in the same memory.", 0.88),
        mk(3, "Transistors replaced vacuum tubes in the second generation.", 0.7),
      ],
      {
        original: "stored program",
        rewritten: "stored program",
        intent: "define",
        keywords: ["stored", "program", "transistors"],
        expandToRelated: true,
        focus: { courseId: 1, chapterId: 1, topicId: 1 },
      },
    );
    const selected = selectContext(ranked, { limit: 2, tokenBudget: 2000 });
    const ids = selected.map((s) => s.chunk.id);
    assert.ok(ids.includes(1));
    assert.ok(ids.includes(3));
    assert.match(formatContext(selected), /p\. \d/);
  });
});

describe("memory vector store", () => {
  it("ranks by cosine similarity of stored vectors", async () => {
    const store = new MemoryVectorStore();
    const scope = { userId: "u", courseId: 1 };
    await store.upsert(scope, [
      { chunkId: 1, embedding: { provider: "test", model: "test", dimensions: 2, values: [1, 0] } },
      { chunkId: 2, embedding: { provider: "test", model: "test", dimensions: 2, values: [0, 1] } },
    ]);
    const hits = await store.search(
      scope,
      { provider: "test", model: "test", dimensions: 2, values: [0.9, 0.1] },
      2,
    );
    assert.equal(hits[0]?.chunkId, 1);
    assert.ok((hits[0]?.score ?? 0) > (hits[1]?.score ?? 0));
  });
});
