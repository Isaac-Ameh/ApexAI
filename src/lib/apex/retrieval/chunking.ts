import type { DraftCourse, DraftTopic } from "../chunk";
import type { NormalizedDocument } from "../inject";
import { CHUNKING } from "./config";
import { estimateTokens } from "./math";
import type { AssignedChunk, AssignedNormalizedChunk, ChunkDraft, NormalizedChunkDraft } from "./types";

const PAGE_RE = /\[\[page\s+(\d+)\]\]/i;

const HEADING_LINE =
  /^(?:#{1,6}\s+\S.{1,80}|chapter\s+\d+\b.{0,80}|[0-9]{1,2}(?:\.[0-9]{1,2}){0,3}\s+\S.{2,80}|[A-Z][A-Z0-9 ,/()\-]{8,72})$/;

export function splitPages(raw: string): Array<{ page: number | null; text: string }> {
  if (!PAGE_RE.test(raw)) return [{ page: null, text: raw }];
  const parts = raw.split(/\[\[page\s+(\d+)\]\]/i);
  const out: Array<{ page: number | null; text: string }> = [];
  if (parts[0]?.trim()) out.push({ page: null, text: parts[0] });
  for (let i = 1; i < parts.length; i += 2) {
    const page = Number(parts[i]);
    const text = parts[i + 1] ?? "";
    if (text.trim()) out.push({ page: Number.isFinite(page) ? page : null, text });
  }
  return out;
}

function isHeading(line: string): boolean {
  const t = line.trim();
  if (t.length < 4 || t.length > 90) return false;
  if (/[.?!]$/.test(t) && t.length > 40) return false;
  return HEADING_LINE.test(t);
}

function stripHeadingMarks(line: string): string {
  return line.replace(/^#{1,6}\s+/, "").trim();
}

function splitSentences(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const parts = clean.split(/(?<=[.!?])\s+(?=[A-Z("])|\n+/);
  return parts.map((s) => s.trim()).filter(Boolean);
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/[ \t]+\n/g, "\n").trim())
    .filter(Boolean);
}

type Section = { heading: string | null; paragraphs: string[] };

function sectionsFromPage(text: string): Section[] {
  const lines = text.split(/\n/);
  const sections: Section[] = [];
  let heading: string | null = null;
  let buf: string[] = [];

  function flush(): void {
    const body = buf.join("\n").trim();
    if (!body && !heading) return;
    sections.push({
      heading,
      paragraphs: body ? splitParagraphs(body) : [],
    });
    buf = [];
  }

  for (const line of lines) {
    if (isHeading(line)) {
      flush();
      heading = stripHeadingMarks(line);
      continue;
    }
    buf.push(line);
  }
  flush();
  return sections.length ? sections : [{ heading: null, paragraphs: splitParagraphs(text) }];
}

function packSentences(
  sentences: string[],
  heading: string | null,
  page: number | null,
  startIndex: number,
): ChunkDraft[] {
  const { targetChars, minChars, maxChars, overlapSentences } = CHUNKING;
  const chunks: ChunkDraft[] = [];
  let current: string[] = [];
  let index = startIndex;

  const flush = (force = false) => {
    const content = current.join(" ").replace(/\s+/g, " ").trim();
    if (!content) {
      current = [];
      return;
    }
    if (!force && content.length < minChars && chunks.length === 0) return;
    chunks.push({
      content,
      page,
      heading,
      chunkIndex: index,
      tokenEstimate: estimateTokens(content),
    });
    index += 1;
    if (overlapSentences > 0 && current.length > overlapSentences) {
      current = current.slice(-overlapSentences);
    } else {
      current = [];
    }
  };

  for (const sentence of sentences) {
    const next = [...current, sentence].join(" ");
    if (next.length > maxChars && current.length) {
      flush(true);
      current = [sentence];
      if (sentence.length > maxChars) {
        for (let i = 0; i < sentence.length; i += targetChars) {
          current = [sentence.slice(i, i + targetChars)];
          flush(true);
        }
        current = [];
      }
      continue;
    }
    current.push(sentence);
    if (next.length >= targetChars) flush(true);
  }
  if (current.length) flush(true);
  return chunks;
}

/**
 * Chunk source text along semantic boundaries: pages → headings/sections →
 * paragraphs → sentences. Character windows are a last resort for oversized
 * sentences, not the primary strategy.
 */
export function chunkSourceText(raw: string): ChunkDraft[] {
  const pages = splitPages(raw);
  const out: ChunkDraft[] = [];

  for (const page of pages) {
    for (const section of sectionsFromPage(page.text)) {
      const sentences: string[] = [];
      if (section.heading) {
        // Keep the heading attached to the first packed chunk via metadata,
        // and also include it in content so embeddings see the topic.
      }
      for (const para of section.paragraphs) {
        const bits = splitSentences(para);
        if (bits.length) sentences.push(...bits);
        else if (para.trim()) sentences.push(para.trim());
      }
      if (!sentences.length && section.heading) sentences.push(section.heading);
      const packed = packSentences(sentences, section.heading, page.page, out.length);
      for (const chunk of packed) {
        const headed =
          chunk.heading && !chunk.content.toLowerCase().startsWith(chunk.heading.toLowerCase())
            ? `${chunk.heading}. ${chunk.content}`
            : chunk.content;
        out.push({
          ...chunk,
          content: headed,
          chunkIndex: out.length,
          tokenEstimate: estimateTokens(headed),
        });
        if (out.length >= CHUNKING.maxChunksPerDocument) return out;
      }
    }
  }
  return out;
}

/**
 * Primary chunking path for injected sources. A chunk never crosses a
 * NormalizedBlock boundary, which lets `(document_id, block_order)` remain a
 * truthful, stable link to its originating source block.
 */
export function chunkNormalizedDocument(document: NormalizedDocument): NormalizedChunkDraft[] {
  const out: NormalizedChunkDraft[] = [];
  let latestHeading: string | null = null;

  const push = (draft: Omit<NormalizedChunkDraft, "chunkIndex" | "tokenEstimate">) => {
    if (out.length >= CHUNKING.maxChunksPerDocument) return false;
    const content = draft.content.replace(/\s+/g, " ").trim();
    if (!content) return true;
    out.push({
      ...draft,
      content,
      chunkIndex: out.length,
      tokenEstimate: estimateTokens(content),
    });
    return out.length < CHUNKING.maxChunksPerDocument;
  };

  for (const block of document.blocks) {
    if (block.type === "heading") {
      latestHeading = block.text;
      continue;
    }
    const heading = block.heading ?? latestHeading;
    const prefix = heading && !block.text.toLowerCase().startsWith(heading.toLowerCase()) ? `${heading}. ` : "";
    const sentences = splitSentences(block.text);
    const units = sentences.length ? sentences : [block.text];
    const packed = packSentences(units, heading ?? null, null, 0);
    for (const part of packed) {
      if (!push({
        content: `${prefix}${part.content}`,
        heading: heading ?? null,
        locator: { ...block.locator },
        blockOrder: block.order,
        blockType: block.type,
      })) return out;
    }
  }

  // A heading-only document is still valid learning material and must remain traceable.
  if (!out.length) {
    for (const block of document.blocks) {
      if (block.type !== "heading") continue;
      if (!push({
        content: block.text,
        heading: block.text,
        locator: { ...block.locator },
        blockOrder: block.order,
        blockType: block.type,
      })) break;
    }
  }
  return out;
}

function scoreAgainst(topic: DraftTopic, text: string, heading: string | null): number {
  const hay = `${heading ?? ""} ${text}`.toLowerCase();
  let score = 0;
  const title = topic.title.toLowerCase();
  if (title && hay.includes(title)) score += 14;
  if (heading && heading.toLowerCase().includes(title)) score += 10;
  for (const word of title.split(/\s+/).filter((w) => w.length > 3)) {
    if (hay.includes(word)) score += 2;
  }
  for (const idea of topic.keyIdeas) {
    const bit = idea.toLowerCase().slice(0, 48);
    if (bit.length > 5 && hay.includes(bit)) score += 5;
  }
  return score;
}

export function assignChunksToTopics(course: DraftCourse, raw: string): AssignedChunk[] {
  const topics = course.chapters.flatMap((ch) => ch.topics);
  const drafts = chunkSourceText(raw);
  return drafts.map((draft, i) => {
    let best = 0;
    let bestScore = -1;
    topics.forEach((topic, idx) => {
      const s = scoreAgainst(topic, draft.content, draft.heading);
      if (s > bestScore) {
        bestScore = s;
        best = idx;
      }
    });
    return {
      topicIndex: topics.length ? best : 0,
      page: draft.page,
      heading: draft.heading,
      content: draft.content,
      chunkIndex: i,
      tokenEstimate: draft.tokenEstimate,
    };
  });
}

/**
 * Structure-aware equivalent of assignChunksToTopics(). It deliberately leaves
 * weak lexical matches unassigned instead of silently attaching them to topic 0.
 */
export function assignNormalizedChunksToTopics(
  course: DraftCourse,
  document: NormalizedDocument,
): AssignedNormalizedChunk[] {
  const topics = course.chapters.flatMap((chapter) => chapter.topics);
  return chunkNormalizedDocument(document).map((chunk) => {
    let topicIndex: number | null = null;
    let bestScore = 0;
    topics.forEach((topic, index) => {
      const score = scoreAgainst(topic, chunk.content, chunk.heading);
      if (score > bestScore) {
        bestScore = score;
        topicIndex = index;
      }
    });
    return {
      ...chunk,
      topicIndex: bestScore >= 5 ? topicIndex : null,
    };
  });
}
