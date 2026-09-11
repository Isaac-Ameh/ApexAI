import { InjectionError } from "./errors";
import { assembleDocument, capDocument } from "./document";
import { extractTagged, loadZip, xmlAttr, xmlLocalText, xmlLocalTexts, zipText } from "./ooxml";
import { INJECTION_LIMITS, type NormalizedBlock, type NormalizedDocument, type NormalizedSource } from "./types";

function parseRelationships(relsXml: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const rel of extractTagged(relsXml, "Relationship")) {
    const id = xmlAttr(rel, "Id");
    const target = xmlAttr(rel, "Target");
    if (id && target) map.set(id, target.replace(/\\/g, "/"));
  }
  return map;
}

function slideOrder(presentationXml: string, rels: Map<string, string>): string[] {
  const ordered: string[] = [];
  for (const idEl of extractTagged(presentationXml, "sldId")) {
    const rid = xmlAttr(idEl, "r:id") ?? xmlAttr(idEl, "Id") ?? xmlAttr(idEl, "id");
    if (!rid) continue;
    const target = rels.get(rid);
    if (target) ordered.push(target);
  }
  return ordered;
}

function resolveSlidePath(target: string): string {
  const t = target.replace(/^\.\//, "");
  if (t.startsWith("ppt/")) return t;
  if (t.startsWith("/ppt/")) return t.slice(1);
  if (t.startsWith("slides/")) return `ppt/${t}`;
  return `ppt/${t}`;
}

function isTitleShape(spXml: string): boolean {
  return /<(?:[\w.-]+:)?ph\b[^>]*(?:type="(?:title|ctrTitle|subTitle)")/.test(spXml);
}

function shapeParagraphs(spXml: string): string[] {
  return extractTagged(spXml, "p")
    .map((p) => xmlLocalTexts(p, "t").join(""))
    .map((t) => t.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export async function extractPptx(file: File, source: NormalizedSource): Promise<NormalizedDocument> {
  try {
    const zip = await loadZip(await file.arrayBuffer());
    const presentation = await zipText(zip, "ppt/presentation.xml");
    const relsXml = await zipText(zip, "ppt/_rels/presentation.xml.rels");
    if (!presentation) throw new InjectionError("That PowerPoint file has no slides.", "unreadable");

    let targets = relsXml ? slideOrder(presentation, parseRelationships(relsXml)) : [];
    if (!targets.length) {
      const names = Object.keys(zip.files)
        .filter((n) => /ppt\/slides\/slide\d+\.xml$/i.test(n.replace(/\\/g, "/")))
        .sort((a, b) => {
          const na = Number(/slide(\d+)/i.exec(a)?.[1] ?? 0);
          const nb = Number(/slide(\d+)/i.exec(b)?.[1] ?? 0);
          return na - nb;
        });
      targets = names;
    }

    const max = Math.min(targets.length, INJECTION_LIMITS.maxSlides);
    const blocks: NormalizedBlock[] = [];

    for (let i = 0; i < max; i += 1) {
      const path = resolveSlidePath(targets[i]!);
      const xml = await zipText(zip, path);
      if (!xml) continue;
      const slide = i + 1;
      const shapes = extractTagged(xml, "sp");
      let title: string | undefined;
      const body: string[] = [];
      for (const sp of shapes) {
        const paras = shapeParagraphs(sp);
        if (!paras.length) continue;
        if (!title && isTitleShape(sp)) {
          title = paras.join(" ");
          continue;
        }
        body.push(...paras);
      }
      if (!title) {
        const all = xmlLocalTexts(xml, "t").map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
        title = all[0];
        if (all.length > 1) body.push(...all.slice(1));
      }
      if (title) {
        const order = blocks.length;
        blocks.push({
          type: "heading",
          text: title,
          heading: title,
          order,
          locator: { type: "slide", slide, heading: title, section: title, order },
        });
      }
      for (const para of body) {
        if (title && para === title) continue;
        const order = blocks.length;
        const list = /^(?:[-•·]|[0-9]{1,2}[.)])\s+/.test(para);
        blocks.push({
          type: list ? "list" : "paragraph",
          text: para.replace(/^(?:[-•·]|[0-9]{1,2}[.)])\s+/, ""),
          heading: title,
          order,
          locator: { type: "slide", slide, heading: title, section: title, order },
        });
      }
    }

    return capDocument(
      assembleDocument(
        {
          ...source,
          format: "pptx",
          slideCount: targets.length,
          truncated: targets.length > INJECTION_LIMITS.maxSlides,
        },
        blocks,
      ),
    );
  } catch (err) {
    if (err instanceof InjectionError) throw err;
    throw new InjectionError("I could not read that PowerPoint file.", "unreadable");
  }
}
