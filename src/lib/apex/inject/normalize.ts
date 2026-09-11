import { InjectionError } from "./errors";
import { assembleDocument, capDocument, parseMarkdown, parsePlainText, looksLikeMarkdown } from "./document";
import type { NormalizedDocument, NormalizedSource, SourceFormat, SourceOrigin } from "./types";

const MIME: Record<SourceFormat, string[]> = {
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  markdown: ["text/markdown", "text/x-markdown"],
  txt: ["text/plain"],
};

export function detectFormat(name: string, mimeType?: string | null): SourceFormat | null {
  const lower = name.toLowerCase();
  const mime = (mimeType ?? "").toLowerCase();
  if (lower.endsWith(".pdf") || mime === "application/pdf") return "pdf";
  if (lower.endsWith(".docx") || MIME.docx.includes(mime)) return "docx";
  if (lower.endsWith(".pptx") || MIME.pptx.includes(mime)) return "pptx";
  if (lower.endsWith(".md") || lower.endsWith(".markdown") || MIME.markdown.includes(mime)) return "markdown";
  if (lower.endsWith(".txt") || mime === "text/plain") return "txt";
  if (!lower.includes(".") && mime === "text/plain") return "txt";
  return null;
}

export function unsupportedMessage(name: string): string {
  return `I can't read ${name || "that file"} yet. Upload a PDF, Word (.docx), PowerPoint (.pptx), text, or markdown file.`;
}

function sourceMeta(opts: {
  name: string;
  format: SourceFormat;
  mimeType?: string | null;
  kind: SourceOrigin;
  title?: string;
}): NormalizedSource {
  return {
    name: opts.name,
    format: opts.format,
    mimeType: opts.mimeType ?? null,
    kind: opts.kind,
    title: opts.title,
  };
}

function assertNotBinaryText(text: string): void {
  if (text.includes("\u0000") || /[\x00-\x08\x0e-\x1f]/.test(text.slice(0, 2000))) {
    throw new InjectionError("That file does not look like readable text.", "unreadable");
  }
}

function finish(doc: NormalizedDocument): NormalizedDocument {
  const capped = capDocument(doc);
  if (!capped.blocks.length) {
    throw new InjectionError("I could not find readable text in that file.", "empty_source");
  }
  return capped;
}

export async function injectFile(
  file: File,
  opts?: { kind?: SourceOrigin; title?: string },
): Promise<NormalizedDocument> {
  const format = detectFormat(file.name, file.type);
  if (!format) throw new InjectionError(unsupportedMessage(file.name), "unsupported_format");
  const source = sourceMeta({
    name: file.name,
    format,
    mimeType: file.type || null,
    kind: opts?.kind ?? "upload",
    title: opts?.title,
  });

  if (format === "pdf") {
    const { extractPdf } = await import("./pdf");
    return finish(await extractPdf(file, source));
  }
  if (format === "docx") {
    const { extractDocx } = await import("./docx");
    return finish(await extractDocx(file, source));
  }
  if (format === "pptx") {
    const { extractPptx } = await import("./pptx");
    return finish(await extractPptx(file, source));
  }

  const text = await file.text();
  assertNotBinaryText(text);
  const blocks = format === "markdown" || looksLikeMarkdown(text) ? parseMarkdown(text) : parsePlainText(text);
  return finish(assembleDocument(source, blocks));
}

export function injectText(
  text: string,
  opts: { name?: string; kind?: SourceOrigin; title?: string },
): NormalizedDocument {
  const raw = text.replace(/\r\n/g, "\n");
  if (!raw.trim()) throw new InjectionError("Paste some notes first.", "empty_source");
  assertNotBinaryText(raw);
  const format: SourceFormat = looksLikeMarkdown(raw) ? "markdown" : "txt";
  const blocks = format === "markdown" ? parseMarkdown(raw) : parsePlainText(raw);
  return finish(
    assembleDocument(
      sourceMeta({
        name: opts.name ?? "Pasted notes",
        format,
        mimeType: "text/plain",
        kind: opts.kind ?? "paste",
        title: opts.title,
      }),
      blocks,
    ),
  );
}
