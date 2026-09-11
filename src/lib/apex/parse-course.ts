import { fallbackStructure, type DraftCourse } from "./chunk";
import {
  assembleDocument,
  looksLikeMarkdown,
  parseMarkdown,
  parsePlainText,
  type NormalizedBlock,
  type NormalizedDocument,
  type SourceLocator,
} from "./inject";
import { SAMPLE_CIT102 } from "./sample-cit102";
import { assignChunksToTopics } from "./retrieval/chunking";
import { chatJson, extractJsonObject } from "./ai/service.server";

/** Keep each mapper request beneath the AI service's input cap without dropping
 * later parts of a document. Blocks are never merged or stripped of identity. */
export const COURSE_INTELLIGENCE_BATCH_CHARS = 18_000;

export type CourseIntelligenceBlock = Pick<NormalizedBlock, "type" | "text" | "heading" | "order" | "locator">;

export type CourseIntelligenceBatch = {
  startOrder: number;
  endOrder: number;
  blocks: CourseIntelligenceBlock[];
  text: string;
};

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

export function sampleAsDraft(): DraftCourse {
  return {
    code: SAMPLE_CIT102.code,
    title: SAMPLE_CIT102.title,
    chapters: SAMPLE_CIT102.chapters.map((ch) => ({
      title: ch.title,
      topics: ch.topics.map((t) => ({
        title: t.title,
        summary: t.summary,
        keyIdeas: t.keyIdeas,
      })),
    })),
  };
}

function locatorLabel(locator: SourceLocator): string {
  const parts = [`type=${locator.type}`, `order=${locator.order}`];
  if (locator.page != null) parts.push(`page=${locator.page}`);
  if (locator.slide != null) parts.push(`slide=${locator.slide}`);
  if (locator.section) parts.push(`section=${JSON.stringify(locator.section)}`);
  if (locator.heading) parts.push(`heading=${JSON.stringify(locator.heading)}`);
  return parts.join("; ");
}

/**
 * Deliberately unlike serializeForLegacy(): this is a mapper-only rendering of
 * the canonical IR. It makes block kind, ordering, and native source locator
 * explicit to the LLM while retaining the original block content.
 */
export function serializeForCourseIntelligenceBlock(block: CourseIntelligenceBlock): string {
  return [
    `[BLOCK type=${block.type}; order=${block.order}; locator: ${locatorLabel(block.locator)}]`,
    block.heading && block.heading !== block.text ? `[CONTEXT HEADING] ${block.heading}` : "",
    block.text,
    "[/BLOCK]",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Splits only between normalized blocks whenever possible. Oversized individual
 * blocks retain their type, locator, and order in every continuation, so a long
 * source is fully considered instead of being silently truncated to a prefix.
 */
export function courseIntelligenceBatches(
  document: NormalizedDocument,
  maxChars = COURSE_INTELLIGENCE_BATCH_CHARS,
): CourseIntelligenceBatch[] {
  const batches: CourseIntelligenceBatch[] = [];
  let current: CourseIntelligenceBlock[] = [];
  let currentText: string[] = [];
  let currentLength = 0;

  const flush = () => {
    if (!current.length) return;
    batches.push({
      startOrder: current[0]!.order,
      endOrder: current[current.length - 1]!.order,
      blocks: current,
      text: currentText.join("\n\n"),
    });
    current = [];
    currentText = [];
    currentLength = 0;
  };

  for (const block of document.blocks) {
    const rendered = serializeForCourseIntelligenceBlock(block);
    if (rendered.length <= maxChars) {
      if (current.length && currentLength + rendered.length + 2 > maxChars) flush();
      current.push(block);
      currentText.push(rendered);
      currentLength += rendered.length + (currentText.length > 1 ? 2 : 0);
      continue;
    }

    flush();
    // The fixed wrapper is small; preserve it for every content continuation.
    const textBudget = Math.max(1, maxChars - rendered.length + block.text.length);
    for (let start = 0; start < block.text.length; start += textBudget) {
      const continuation: CourseIntelligenceBlock = {
        ...block,
        text: block.text.slice(start, start + textBudget),
      };
      const part = serializeForCourseIntelligenceBlock(continuation);
      batches.push({ startOrder: block.order, endOrder: block.order, blocks: [continuation], text: part });
    }
  }
  flush();
  return batches;
}

function parsedDraft(value: unknown, hints: { code?: string; title?: string }): DraftCourse | null {
  const parsed = value as {
    code?: unknown;
    title?: unknown;
    chapters?: Array<{
      title?: unknown;
      topics?: Array<{ title?: unknown; summary?: unknown; keyIdeas?: unknown }>;
    }>;
  };
  const chapters = (parsed.chapters ?? [])
    .map((ch) => ({
      title: asString(ch.title, "Chapter"),
      topics: (ch.topics ?? [])
        .map((t) => ({
          title: asString(t.title),
          summary: asString(t.summary),
          keyIdeas: Array.isArray(t.keyIdeas)
            ? t.keyIdeas.filter((x): x is string => typeof x === "string").slice(0, 8)
            : [],
        }))
        .filter((t) => t.title)
        .slice(0, 6),
    }))
    .filter((ch) => ch.topics.length)
    .slice(0, 10);
  return chapters.length
    ? { code: asString(parsed.code, hints.code || "COURSE"), title: asString(parsed.title, hints.title || "Untitled course"), chapters }
    : null;
}

function mergeDrafts(drafts: DraftCourse[], hints: { code?: string; title?: string }): DraftCourse | null {
  const first = drafts[0];
  if (!first) return null;
  const chapters = new Map<string, DraftCourse["chapters"][number]>();
  for (const draft of drafts) {
    for (const chapter of draft.chapters) {
      const key = chapter.title.trim().toLowerCase();
      const existing = chapters.get(key);
      if (!existing) {
        chapters.set(key, { ...chapter, topics: [...chapter.topics] });
        continue;
      }
      for (const topic of chapter.topics) {
        if (!existing.topics.some((candidate) => candidate.title.toLowerCase() === topic.title.toLowerCase())) {
          existing.topics.push(topic);
        }
      }
    }
  }
  return {
    code: hints.code || first.code,
    title: hints.title || first.title,
    chapters: [...chapters.values()],
  };
}

/** A deterministic document-aware fallback which sees typed heading blocks. */
export function fallbackStructureFromDocument(
  document: NormalizedDocument,
  hint?: { code?: string; title?: string },
): DraftCourse {
  const headings = document.blocks.filter((block) => block.type === "heading" && block.text.trim());
  if (!headings.length) {
    return fallbackStructure(document.blocks.map((block) => block.text).join("\n\n"), hint);
  }
  const title = hint?.title || document.source.title || headings[0]!.text || "Untitled course";
  const code = hint?.code || (title.match(/\b[A-Z]{2,4}\s?\d{2,3}\b/)?.[0] ?? "COURSE");
  return {
    code,
    title,
    chapters: [{
      title: "Course material",
      topics: headings.map((heading) => ({
        title: heading.text,
        summary: `Material under the source heading “${heading.text}”.`,
        keyIdeas: [heading.text],
      })),
    }],
  };
}

export async function structureFromDocument(input: {
  document: NormalizedDocument;
  hintCode?: string;
  hintTitle?: string;
}): Promise<DraftCourse> {
  const hints = { code: input.hintCode, title: input.hintTitle };
  const batches = courseIntelligenceBatches(input.document);
  const drafts: DraftCourse[] = [];

  for (const batch of batches) {
    const ai = await chatJson({
      maxTokens: 2200,
      feature: "course-map",
      system: `You extract a course map from normalized source blocks. Block type, order, and locator are evidence, not prose to repeat.
Do not invent chapters or topics that are not evidenced in the blocks. Prefer heading blocks and keep their wording where appropriate.
Return JSON only with shape:
{"code":"string","title":"string","chapters":[{"title":"string","topics":[{"title":"string","summary":"string","keyIdeas":["string"]}]}]}
Rules: at most 10 chapters, at most 6 topics each. Summaries are 2-3 grounded sentences. keyIdeas are short.`,
      user: `Hint code: ${hints.code || "(none)"}
Hint title: ${hints.title || input.document.source.title || "(none)"}
Source format: ${input.document.source.format}
Blocks ${batch.startOrder} through ${batch.endOrder} of the normalized document:

${batch.text}`,
    });
    if (!ai.ok) continue;
    try {
      const draft = parsedDraft(extractJsonObject(ai.text), hints);
      if (draft) drafts.push(draft);
    } catch {
      // This batch can fall back with the rest of the document.
    }
  }

  return mergeDrafts(drafts, hints) ?? fallbackStructureFromDocument(input.document, hints);
}

export async function structureFromText(input: {
  text: string;
  hintCode?: string;
  hintTitle?: string;
}): Promise<DraftCourse> {
  const markdown = looksLikeMarkdown(input.text);
  const document = assembleDocument(
    {
      name: "Legacy text input",
      format: markdown ? "markdown" : "txt",
      mimeType: "text/plain",
      kind: "paste",
      title: input.hintTitle,
    },
    markdown ? parseMarkdown(input.text) : parsePlainText(input.text),
  );
  return structureFromDocument({ document, hintCode: input.hintCode, hintTitle: input.hintTitle });
}

export function materialChunks(draft: DraftCourse, raw: string) {
  return assignChunksToTopics(draft, raw);
}
