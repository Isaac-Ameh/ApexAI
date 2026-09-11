import { InjectionError } from "./errors";
import { assembleDocument, capDocument } from "./document";
import { childTagged, extractTagged, loadZip, xmlAttr, xmlLocalText, zipText } from "./ooxml";
import type { NormalizedBlock, NormalizedDocument, NormalizedSource } from "./types";

function headingFromStyle(style: string | null): number | null {
  if (!style) return null;
  const s = style.replace(/\s+/g, "").toLowerCase();
  if (s === "title" || s === "heading") return 1;
  const m = /^heading(\d)$/.exec(s);
  if (m) return Number(m[1]);
  return null;
}

function paragraphText(pXml: string): string {
  return xmlLocalText(pXml, "t").replace(/\s+/g, " ").trim();
}

function isListParagraph(pXml: string): boolean {
  return /<(?:[\w.-]+:)?numPr\b/.test(pXml);
}

function tableText(tblXml: string): string {
  const rows = extractTagged(tblXml, "tr");
  return rows
    .map((row) =>
      extractTagged(row, "tc")
        .map((cell) => paragraphText(cell))
        .filter(Boolean)
        .join(" | "),
    )
    .filter(Boolean)
    .join("\n");
}

export async function extractDocx(file: File, source: NormalizedSource): Promise<NormalizedDocument> {
  try {
    const zip = await loadZip(await file.arrayBuffer());
    const xml = await zipText(zip, "word/document.xml");
    if (!xml) throw new InjectionError("That Word file has no document.xml.", "unreadable");
    const bodies = extractTagged(xml, "body");
    const body = bodies[0] ?? xml;
    const children = childTagged(body, ["p", "tbl"]);
    const blocks: NormalizedBlock[] = [];
    let heading: string | undefined;

    for (const child of children) {
      if (child.name === "tbl") {
        const text = tableText(child.xml);
        if (!text) continue;
        const order = blocks.length;
        blocks.push({
          type: "table",
          text,
          heading,
          order,
          locator: { type: "section", heading, section: heading, order },
        });
        continue;
      }
      const text = paragraphText(child.xml);
      if (!text) continue;
      const style = xmlAttr(child.xml.match(/<(?:[\w.-]+:)?pStyle\b[^>]*>/)?.[0] ?? "", "w:val")
        ?? xmlAttr(child.xml.match(/<(?:[\w.-]+:)?pStyle\b[^>]*>/)?.[0] ?? "", "val");
      const level = headingFromStyle(style);
      const order = blocks.length;
      if (level != null) {
        heading = text;
        blocks.push({
          type: "heading",
          text,
          heading,
          order,
          locator: { type: "section", heading, section: heading, order },
        });
        continue;
      }
      const type = isListParagraph(child.xml) ? "list" : "paragraph";
      blocks.push({
        type,
        text,
        heading,
        order,
        locator: { type: "section", heading, section: heading, order },
      });
    }

    return capDocument(assembleDocument({ ...source, format: "docx" }, blocks));
  } catch (err) {
    if (err instanceof InjectionError) throw err;
    throw new InjectionError("I could not read that Word document.", "unreadable");
  }
}
