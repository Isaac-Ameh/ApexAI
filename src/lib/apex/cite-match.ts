import type { MessageCitation } from "./types";

const TAG_RE = /\[[^[\]]+\]/g;

export function looksLikeCitation(tag: string): boolean {
  return /\bsource\b/i.test(tag) || /p\.\s*\d+/i.test(tag) || /[—–]/.test(tag);
}

export function parseCitationTag(tag: string): { title: string; page: number | null } {
  const inner = tag
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/[\u00a0\u202f\u2007\u2060]/g, " ")
    .trim();
  const pageMatch = inner.match(/p\.\s*(\d+)/i);
  const title = inner.replace(/\s*[—–-]\s*p\.\s*\d+\s*$/i, "").trim() || "Source";
  return { title, page: pageMatch ? Number(pageMatch[1]) : null };
}

export function resolveCitation(tag: string, citations: MessageCitation[]): MessageCitation | null {
  if (!citations.length) return null;
  const exact = citations.find((c) => c.label === tag);
  if (exact) return exact;
  const lower = tag.replace(/[\u00a0\u202f\u2007\u2060]/g, " ").toLowerCase();
  const caseInsensitive = citations.find(
    (c) => c.label.replace(/[\u00a0\u202f\u2007\u2060]/g, " ").toLowerCase() === lower,
  );
  if (caseInsensitive) return caseInsensitive;
  const parsed = parseCitationTag(tag);
  if (parsed.page != null) {
    const byPage = citations.find((c) => c.page === parsed.page);
    if (byPage) return byPage;
  }
  const byLocator = citations.find((c) => c.locator && lower.includes(c.locator.toLowerCase()));
  if (byLocator) return byLocator;
  // The model may cite a nearby page; still open the retrieved excerpt for this reply.
  return citations[0] ?? null;
}

export function splitCitationText(text: string): Array<{ type: "text" | "cite"; value: string }> {
  const parts: Array<{ type: "text" | "cite"; value: string }> = [];
  const re = new RegExp(TAG_RE.source, "g");
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    if (match.index > last) parts.push({ type: "text", value: text.slice(last, match.index) });
    const tag = match[0];
    parts.push({ type: looksLikeCitation(tag) ? "cite" : "text", value: tag });
    last = match.index + tag.length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts;
}

export function toMessageCitations(raw: unknown): MessageCitation[] {
  if (raw == null || raw === "") return [];
  try {
    const v = typeof raw === "string" ? (JSON.parse(raw) as unknown) : raw;
    if (!Array.isArray(v)) return [];
    const out: MessageCitation[] = [];
    for (const item of v) {
      if (!item || typeof item !== "object") continue;
      const c = item as Record<string, unknown>;
      const excerpt = typeof c.excerpt === "string" ? c.excerpt : "";
      const label = typeof c.label === "string" ? c.label : "";
      if (!excerpt && !label) continue;
      out.push({
        chunkId: typeof c.chunkId === "number" ? c.chunkId : Number(c.chunkId) || 0,
        chunkUid: typeof c.chunkUid === "string" ? c.chunkUid : undefined,
        documentId: c.documentId == null ? null : Number(c.documentId),
        sourceName: typeof c.sourceName === "string" ? c.sourceName : "Source",
        sourceFormat: typeof c.sourceFormat === "string" ? c.sourceFormat as MessageCitation["sourceFormat"] : null,
        page: c.page == null || c.page === "" ? null : Number(c.page),
        heading: typeof c.heading === "string" ? c.heading : null,
        locatorType: typeof c.locatorType === "string" ? c.locatorType as MessageCitation["locatorType"] : null,
        locator: typeof c.locator === "string" ? c.locator : "",
        label: label || "[Source]",
        excerpt,
      });
    }
    return out;
  } catch {
    return [];
  }
}
