import { injectFile, serializeForLegacy } from "./inject";

/**
 * Compatibility wrapper around the injection IR.
 * New code should call injectFile() and consume NormalizedDocument.
 */
export async function readCourseFile(file: File): Promise<{ text: string; pages: number | null }> {
  const doc = await injectFile(file, { kind: "upload" });
  return {
    text: serializeForLegacy(doc),
    pages: doc.source.pageCount ?? null,
  };
}

export async function extractPdfText(file: File): Promise<{ text: string; pages: number }> {
  const doc = await injectFile(file, { kind: "upload" });
  if (doc.source.format !== "pdf") {
    return { text: serializeForLegacy(doc), pages: 0 };
  }
  return { text: serializeForLegacy(doc), pages: doc.source.pageCount ?? 0 };
}
