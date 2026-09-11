import { InjectionError } from "./errors";
import { INJECTION_LIMITS, type NormalizedBlock, type NormalizedDocument, type NormalizedSource } from "./types";
import { assembleDocument, capDocument } from "./document";

export type PdfTextRun = {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hasEOL: boolean;
};

type PdfLine = {
  text: string;
  y: number;
  height: number;
  kind: "heading" | "list" | "body";
};

function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

export function isPdfHeadingLine(text: string, height: number, typicalHeight: number): boolean {
  const t = text.trim();
  if (t.length < 3 || t.length > 90) return false;
  if (/[.?!]$/.test(t) && t.length > 40) return false;
  if (/^(?:chapter\s+\d+\b|[0-9]{1,2}(?:\.[0-9]{1,2}){0,3}\s+\S.{2,80})$/i.test(t)) return true;
  if (/^[A-Z][A-Z0-9 ,/()\-]{8,72}$/.test(t)) return true;
  const words = t.split(/\s+/);
  const titleCase =
    words.length >= 2 &&
    words.length <= 12 &&
    words.every((w) => /^[A-Z0-9]/.test(w) || /^(and|of|the|for|to|in|on|a|an)$/i.test(w)) &&
    words.filter((w) => /^[A-Z]/.test(w)).length >= Math.ceil(words.length * 0.6);
  if (titleCase && t.length <= 80 && !/[.?!]$/.test(t)) return true;
  if (typicalHeight > 0 && height >= typicalHeight * 1.25 && t.length <= 80 && !/[.?!]$/.test(t)) return true;
  return false;
}

function isListLine(text: string): boolean {
  return /^(?:[-*•·]|[0-9]{1,2}[.)]|[a-z][.)])\s+\S/.test(text.trim());
}

function joinRuns(runs: PdfTextRun[]): string {
  const sorted = [...runs].sort((a, b) => a.x - b.x || b.y - a.y);
  let out = "";
  let prevEnd = Number.NEGATIVE_INFINITY;
  for (const run of sorted) {
    const gap = run.x - prevEnd;
    const space = out && gap > Math.max(0.8, run.height * 0.12);
    out += (space ? " " : "") + run.str;
    prevEnd = run.x + (run.width || run.str.length * run.height * 0.5);
  }
  return out.replace(/[ \t]+/g, " ").trim();
}

export function linesFromPdfRuns(runs: PdfTextRun[]): PdfLine[] {
  const usable = runs.filter((r) => r.str && r.str.trim());
  if (!usable.length) return [];
  const typical = median(usable.map((r) => r.height).filter((h) => h > 0)) || 12;
  const yTol = Math.max(2, typical * 0.35);
  const sorted = [...usable].sort((a, b) => b.y - a.y || a.x - b.x);
  const groups: PdfTextRun[][] = [];
  for (const run of sorted) {
    const last = groups[groups.length - 1];
    const ref = last?.[0];
    if (last && ref && Math.abs(run.y - ref.y) <= yTol) last.push(run);
    else groups.push([run]);
  }
  const lines: PdfLine[] = [];
  for (const group of groups) {
    const text = joinRuns(group);
    if (!text) continue;
    const height = median(group.map((g) => g.height)) || typical;
    const y = median(group.map((g) => g.y));
    const kind: PdfLine["kind"] = isListLine(text)
      ? "list"
      : isPdfHeadingLine(text, height, typical)
        ? "heading"
        : "body";
    lines.push({ text, y, height, kind });
  }
  return lines;
}

export function blocksFromPdfPage(runs: PdfTextRun[], page: number, startOrder: number): NormalizedBlock[] {
  const lines = linesFromPdfRuns(runs);
  const blocks: NormalizedBlock[] = [];
  let heading: string | undefined;
  let para: string[] = [];
  let paraHeading = heading;
  let order = startOrder;

  const locator = (h?: string) => ({
    type: "page" as const,
    page,
    heading: h,
    section: h,
    order,
  });

  const flushPara = () => {
    const text = para.join(" ").replace(/\s+/g, " ").trim();
    para = [];
    if (!text) return;
    blocks.push({
      type: "paragraph",
      text,
      heading: paraHeading,
      order,
      locator: locator(paraHeading),
    });
    order += 1;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    const next = lines[i + 1];
    if (line.kind === "heading") {
      flushPara();
      heading = line.text;
      blocks.push({
        type: "heading",
        text: line.text,
        heading: line.text,
        order,
        locator: locator(line.text),
      });
      order += 1;
      continue;
    }
    if (line.kind === "list") {
      flushPara();
      blocks.push({
        type: "list",
        text: line.text.replace(/^(?:[-*•·]|[0-9]{1,2}[.)]|[a-z][.)])\s+/, "").trim() || line.text,
        heading,
        order,
        locator: locator(heading),
      });
      order += 1;
      continue;
    }
    if (!para.length) paraHeading = heading;
    para.push(line.text);
    const gap = next ? line.y - next.y : 0;
    const breakPara = !next || next.kind !== "body" || gap > line.height * 1.7;
    if (breakPara) flushPara();
  }
  flushPara();
  return blocks;
}

async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  if (typeof window !== "undefined") {
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  }
  return pdfjs;
}

function itemToRun(item: unknown): PdfTextRun | null {
  if (!item || typeof item !== "object" || !("str" in item)) return null;
  const rec = item as {
    str?: unknown;
    transform?: unknown;
    width?: unknown;
    height?: unknown;
    hasEOL?: unknown;
  };
  const str = typeof rec.str === "string" ? rec.str : "";
  if (!str) return null;
  const transform = Array.isArray(rec.transform) ? rec.transform : [];
  const x = typeof transform[4] === "number" ? transform[4] : 0;
  const y = typeof transform[5] === "number" ? transform[5] : 0;
  const height =
    typeof rec.height === "number" && rec.height > 0
      ? rec.height
      : typeof transform[3] === "number"
        ? Math.abs(transform[3])
        : 12;
  const width = typeof rec.width === "number" ? rec.width : str.length * height * 0.5;
  return { str, x, y, width, height, hasEOL: Boolean(rec.hasEOL) };
}

export async function extractPdf(file: File, source: NormalizedSource): Promise<NormalizedDocument> {
  try {
    const pdfjs = await loadPdfJs();
    const data = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data }).promise;
    const maxPages = Math.min(doc.numPages, INJECTION_LIMITS.maxPages);
    const blocks: NormalizedBlock[] = [];
    for (let i = 1; i <= maxPages; i += 1) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const runs = content.items.map(itemToRun).filter((r): r is PdfTextRun => Boolean(r));
      blocks.push(...blocksFromPdfPage(runs, i, blocks.length));
    }
    const assembled = assembleDocument(
      {
        ...source,
        format: "pdf",
        pageCount: doc.numPages,
        truncated: doc.numPages > INJECTION_LIMITS.maxPages,
      },
      blocks,
    );
    return capDocument(assembled);
  } catch (err) {
    if (err instanceof InjectionError) throw err;
    throw new InjectionError("I could not read that PDF.", "unreadable");
  }
}
