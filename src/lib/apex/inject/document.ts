import {
  INJECTION_LIMITS,
  type BlockType,
  type NormalizedBlock,
  type NormalizedDocument,
  type NormalizedSource,
  type SourceLocator,
} from "./types";

export function assembleDocument(source: NormalizedSource, blocks: NormalizedBlock[]): NormalizedDocument {
  const ordered = blocks
    .filter((b) => b.text.trim())
    .map((b, order) => {
      const locator: SourceLocator = { ...b.locator, order, heading: b.locator.heading ?? b.heading };
      return { ...b, text: b.text.trim(), order, locator, heading: b.heading ?? locator.heading };
    });
  return { source, blocks: ordered };
}

export function capDocument(doc: NormalizedDocument): NormalizedDocument {
  const blocks: NormalizedBlock[] = [];
  let chars = 0;
  let truncated = Boolean(doc.source.truncated);
  for (const block of doc.blocks) {
    if (chars >= INJECTION_LIMITS.maxChars) {
      truncated = true;
      break;
    }
    const room = INJECTION_LIMITS.maxChars - chars;
    if (block.text.length > room) {
      blocks.push({ ...block, text: block.text.slice(0, room).trimEnd() });
      truncated = true;
      break;
    }
    blocks.push(block);
    chars += block.text.length;
  }
  return assembleDocument({ ...doc.source, truncated }, blocks);
}

export function looksLikeMarkdown(text: string): boolean {
  return /(?:^|\n)#{1,6}\s+\S/.test(text);
}

function headingFromAtx(line: string): string | null {
  const m = /^(#{1,6})\s+(\S.*)$/.exec(line.trim());
  return m ? m[2].trim() : null;
}

function isFence(line: string): boolean {
  return /^```/.test(line.trim());
}

function isTableRow(line: string): boolean {
  const t = line.trim();
  return t.startsWith("|") && t.includes("|", 1);
}

function isMdList(line: string): boolean {
  return /^(?:[-*+]|[0-9]{1,2}[.)])\s+\S/.test(line.trim());
}

function listText(line: string): string {
  return line.trim().replace(/^(?:[-*+]|[0-9]{1,2}[.)])\s+/, "");
}

function pushBlock(
  blocks: NormalizedBlock[],
  type: BlockType,
  text: string,
  locatorType: SourceLocator["type"],
  heading: string | undefined,
): void {
  const trimmed = text.replace(/[ \t]+\n/g, "\n").trim();
  if (!trimmed) return;
  const order = blocks.length;
  blocks.push({
    type,
    text: trimmed,
    heading,
    order,
    locator: {
      type: locatorType,
      heading,
      section: heading,
      order,
    },
  });
}

export function parseMarkdown(text: string, locatorType: SourceLocator["type"] = "section"): NormalizedBlock[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: NormalizedBlock[] = [];
  let heading: string | undefined;
  let para: string[] = [];
  let inFence = false;
  let table: string[] = [];

  const flushPara = () => {
    const body = para.join("\n");
    para = [];
    pushBlock(blocks, "paragraph", body, locatorType, heading);
  };
  const flushTable = () => {
    if (!table.length) return;
    const rows = table
      .map((r) =>
        r
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim())
          .join(" | "),
      )
      .filter((r) => r && !/^:?-{2,}(?:\s*\|\s*:?-{2,})*$/.test(r));
    table = [];
    if (rows.length) pushBlock(blocks, "table", rows.join("\n"), locatorType, heading);
  };

  for (const raw of lines) {
    if (isFence(raw)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      para.push(raw);
      continue;
    }
    if (isTableRow(raw)) {
      flushPara();
      table.push(raw);
      continue;
    }
    if (table.length) flushTable();
    const atx = headingFromAtx(raw);
    if (atx) {
      flushPara();
      heading = atx;
      pushBlock(blocks, "heading", atx, locatorType, atx);
      continue;
    }
    if (isMdList(raw)) {
      flushPara();
      pushBlock(blocks, "list", listText(raw), locatorType, heading);
      continue;
    }
    if (!raw.trim()) {
      flushPara();
      continue;
    }
    para.push(raw);
  }
  flushTable();
  flushPara();
  return blocks;
}

function isPlainHeading(line: string): boolean {
  const t = line.trim();
  if (t.length < 4 || t.length > 90) return false;
  if (/[.?!]$/.test(t) && t.length > 40) return false;
  if (/^(?:chapter\s+\d+\b|[0-9]{1,2}(?:\.[0-9]{1,2}){0,3}\s+\S.{2,80})$/i.test(t)) return true;
  if (/^[A-Z][A-Z0-9 ,/()\-]{8,72}$/.test(t)) return true;
  const words = t.split(/\s+/);
  return (
    words.length >= 2 &&
    words.length <= 12 &&
    words.filter((w) => /^[A-Z]/.test(w)).length >= Math.ceil(words.length * 0.6) &&
    !/[.?!]$/.test(t)
  );
}

export function parsePlainText(text: string): NormalizedBlock[] {
  const chunks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const blocks: NormalizedBlock[] = [];
  let heading: string | undefined;
  for (const chunk of chunks) {
    const useful = chunk.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim());
    if (!useful.length) continue;
    const body: string[] = [];
    const flushBody = () => {
      if (!body.length) return;
      pushBlock(blocks, "paragraph", body.join(" "), "text", heading);
      body.length = 0;
    };
    for (const line of useful) {
      if (isMdList(line)) {
        flushBody();
        pushBlock(blocks, "list", listText(line), "text", heading);
        continue;
      }
      if (isPlainHeading(line) && line.length <= 80) {
        flushBody();
        heading = line.trim();
        pushBlock(blocks, "heading", heading, "text", heading);
        continue;
      }
      body.push(line.trim());
    }
    flushBody();
  }
  return blocks;
}

/**
 * Compatibility projection for the existing mapper/chunker.
 * Headings become markdown ATX lines so structure survives.
 * PDF page locators still emit [[page N]] so today's chunker can keep page metadata.
 * Other formats do NOT invent page numbers.
 */
export function serializeForLegacy(doc: NormalizedDocument): string {
  const parts: string[] = [];
  let lastPage: number | undefined;
  for (const block of doc.blocks) {
    if (block.locator.type === "page" && block.locator.page != null && block.locator.page !== lastPage) {
      lastPage = block.locator.page;
      parts.push(`[[page ${lastPage}]]`);
    }
    if (block.type === "heading") {
      parts.push(`# ${block.text.replace(/^#+\s+/, "")}`);
    } else if (block.type === "list") {
      parts.push(`- ${block.text}`);
    } else if (block.type === "table") {
      parts.push(block.text);
    } else {
      parts.push(block.text);
    }
    parts.push("");
  }
  return parts.join("\n").trim();
}

export function documentPlainText(doc: NormalizedDocument): string {
  return doc.blocks.map((b) => b.text).join("\n");
}
