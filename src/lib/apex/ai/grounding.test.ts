import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toCitation } from "../retrieval/citations.ts";
import type { Evidence, ScoreParts, UnderstoodQuery } from "../retrieval/types.ts";
import { evaluateGrounding } from "./grounding.ts";

const query: UnderstoodQuery = {
  original: "Explain differentiated instruction disadvantages",
  rewritten: "Explain differentiated instruction disadvantages",
  intent: "explain",
  keywords: ["differentiated", "instruction", "disadvantages"],
  expandToRelated: true,
  focus: { courseId: 1, chapterId: 2, topicId: 3 },
};

function evidence(
  id: number,
  text: string,
  scores: Partial<ScoreParts> = {},
  reasons = ["semantic", "current-topic"],
): Evidence {
  return {
    status: "candidate",
    chunkId: id,
    chunkUid: `course:document:${id}`,
    documentId: 10,
    courseId: 1,
    sourceName: "EDU201.pdf",
    sourceFormat: "pdf",
    locator: { type: "page", page: id, order: id },
    locatorType: "page",
    locatorValue: id,
    heading: "Differentiated instruction",
    topicTitle: "Instructional methods",
    chapterTitle: "Teaching methods",
    text,
    scores: {
      semantic: 0.8,
      lexical: 0.8,
      hierarchy: 0.85,
      citation: 0.7,
      combined: 0.9,
      rerank: 0.9,
      ...scores,
    },
    reasons,
  };
}

describe("tutor grounding policy", () => {
  it("grounds on strong directly relevant Evidence", () => {
    const decision = evaluateGrounding(
      query,
      [evidence(1, "Differentiated instruction explains how teachers adapt instruction to learner needs and its disadvantages.")],
    );
    assert.equal(decision.status, "grounded");
    assert.deepEqual(decision.evidence.map((item) => item.chunkId), [1]);
  });

  it("marks related but incomplete Evidence as insufficient", () => {
    const decision = evaluateGrounding(
      query,
      [evidence(2, "Differentiated instruction adapts teaching to different learner needs.")],
    );
    assert.equal(decision.status, "insufficient_evidence");
    assert.deepEqual(decision.evidence, []);
  });

  it("marks empty retrieval as having no relevant Evidence", () => {
    const decision = evaluateGrounding(query, []);
    assert.equal(decision.status, "no_relevant_evidence");
    assert.deepEqual(decision.evidence, []);
  });

  it("rejects unrelated course chunks as no relevant Evidence", () => {
    const decision = evaluateGrounding(query, [
      evidence(9, "The university library opens at eight in the morning.", { combined: 0.2, rerank: 0.2 }, ["current-topic"]),
    ]);
    assert.equal(decision.status, "no_relevant_evidence");
    assert.deepEqual(decision.evidence, []);
  });

  it("excludes irrelevant candidates and limits grounding Evidence", () => {
    const decision = evaluateGrounding(query, [
      evidence(3, "Differentiated instruction disadvantages include increased planning demands and resource needs."),
      evidence(4, "The university library opens at eight in the morning.", { combined: 0.95, rerank: 0.95 }, ["semantic"]),
      evidence(5, "Instruction can be adapted to learner needs and classroom context."),
    ]);
    assert.equal(decision.status, "grounded");
    assert.deepEqual(decision.evidence.map((item) => item.chunkId), [3]);
  });

  it("preserves provenance on selected Evidence", () => {
    const source = evidence(6, "Differentiated instruction disadvantages include increased planning demands and resource needs.");
    const decision = evaluateGrounding(query, [source]);
    const selected = decision.evidence[0];
    assert.equal(selected?.documentId, 10);
    assert.equal(selected?.chunkUid, "course:document:6");
    assert.equal(selected?.locatorType, "page");
    assert.equal(selected?.locatorValue, 6);
    assert.equal(selected?.sourceFormat, "pdf");
    assert.equal(selected?.heading, "Differentiated instruction");
    assert.equal(selected?.topicTitle, "Instructional methods");
    assert.equal(selected?.chapterTitle, "Teaching methods");
  });

  it("derives citations from grounding Evidence only", () => {
    const decision = evaluateGrounding(query, [
      evidence(7, "Differentiated instruction disadvantages include increased planning demands and resource needs."),
      evidence(8, "The university library opens at eight in the morning.", { combined: 0.95, rerank: 0.95 }, ["semantic"]),
    ]);
    const citations = decision.evidence.map(toCitation);
    assert.deepEqual(citations.map((citation) => citation.chunkId), [7]);
  });
});
