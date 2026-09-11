import type { LocatorType } from "../inject";
import type { Chunk, Evidence, RetrievalCandidate, SourceCitation } from "./types";

type CitationSource = Chunk | Evidence;

function legacyPage(source: CitationSource): number | null {
  return "page" in source ? source.page : null;
}

function locatorValue(source: CitationSource): string | number | null {
  const locator = source.locator;
  if (locator?.type === "page" && legacyPage(source) != null) return legacyPage(source);
  if (locator?.type === "page" && locator.page != null) return locator.page;
  if (locator?.type === "slide" && locator.slide != null) return locator.slide;
  if (locator?.type === "section") return locator.section ?? source.heading;
  if (locator?.type === "text") return locator.heading ?? source.heading;
  if (source.sourceFormat === "pdf" && legacyPage(source) != null) return legacyPage(source);
  if (source.sourceFormat == null && legacyPage(source) != null) return legacyPage(source);
  return source.heading;
}

function locatorType(source: CitationSource): LocatorType | null {
  if (source.locator?.type) return source.locator.type;
  if (source.sourceFormat === "pdf" || (source.sourceFormat == null && legacyPage(source) != null)) return "page";
  if (source.heading) return "section";
  return null;
}

function locatorText(source: CitationSource): string {
  const type = locatorType(source);
  const value = locatorValue(source);
  if (type === "page" && value != null) return `p. ${value}`;
  if (type === "slide" && value != null) return `slide ${value}`;
  if (type === "section" && value) return `section: ${value}`;
  if (type === "text" && value) return `text: ${value}`;
  if (source.heading) return source.heading;
  return "source";
}

export function citationLabel(source: CitationSource): string {
  const name = source.sourceName?.replace(/\.[a-z0-9]+$/i, "") || "Source";
  const locator = locatorText(source);
  return locator === "source" ? `[${name}]` : `[${name} — ${locator}]`;
}

export function toEvidence(candidate: RetrievalCandidate, status: Evidence["status"]): Evidence {
  const { chunk } = candidate;
  return {
    status,
    chunkId: chunk.id,
    chunkUid: chunk.uid,
    documentId: chunk.documentId,
    courseId: chunk.courseId,
    sourceName: chunk.sourceName || "Source",
    sourceFormat: chunk.sourceFormat,
    locator: chunk.locator,
    locatorType: locatorType(chunk),
    locatorValue: locatorValue(chunk),
    heading: chunk.heading,
    topicTitle: chunk.topicTitle,
    chapterTitle: chunk.chapterTitle,
    text: chunk.content,
    scores: candidate.scores,
    reasons: candidate.reasons,
  };
}

export function toCitation(source: CitationSource): SourceCitation {
  return {
    chunkId: "chunkId" in source ? source.chunkId : source.id,
    chunkUid: "chunkUid" in source ? source.chunkUid : source.uid,
    documentId: source.documentId,
    sourceName: source.sourceName || "Source",
    sourceFormat: source.sourceFormat as SourceCitation["sourceFormat"],
    page:
      locatorType(source) === "page" && typeof locatorValue(source) === "number"
        ? (locatorValue(source) as number)
        : null,
    heading: source.heading,
    topicTitle: source.topicTitle,
    chapterTitle: source.chapterTitle,
    locatorType: locatorType(source),
    locator: locatorText(source),
    label: citationLabel(source),
    excerpt: ("content" in source ? source.content : source.text).trim().slice(0, 420),
  };
}

export function formatContext(selected: RetrievalCandidate[]): string {
  if (!selected.length) return "(No source excerpts retrieved.)";
  return selected
    .map((c, i) => {
      const topic = c.chunk.topicTitle ? ` · ${c.chunk.topicTitle}` : "";
      return `[${i + 1} ${c.chunk.sourceName || "Source"} — ${locatorText(c.chunk)}${topic}]\n${c.chunk.content.trim()}`;
    })
    .join("\n\n");
}

export function formatEvidenceContext(evidence: Evidence[]): string {
  if (!evidence.length) return "(No source excerpts retrieved.)";
  return evidence
    .map((item, i) => {
      const topic = item.topicTitle ? ` · ${item.topicTitle}` : "";
      return `[${i + 1} ${item.sourceName} — ${locatorText(item)}${topic}]\n${item.text.trim()}`;
    })
    .join("\n\n");
}

export function formatCitationLine(citations: SourceCitation[]): string {
  if (!citations.length) return "";
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const c of citations) {
    if (seen.has(c.label)) continue;
    seen.add(c.label);
    labels.push(c.label);
  }
  return labels.join(" ");
}
