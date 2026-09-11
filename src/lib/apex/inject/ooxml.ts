import JSZip from "jszip";

export async function loadZip(data: ArrayBuffer): Promise<JSZip> {
  return JSZip.loadAsync(data);
}

export function findZipFile(zip: JSZip, ending: string): JSZip.JSZipObject | null {
  const want = ending.replace(/\\/g, "/").toLowerCase();
  const names = Object.keys(zip.files);
  const hit = names.find((n) => !zip.files[n]?.dir && n.replace(/\\/g, "/").toLowerCase().endsWith(want));
  return hit ? zip.files[hit] ?? null : null;
}

export async function zipText(zip: JSZip, ending: string): Promise<string | null> {
  const file = findZipFile(zip, ending);
  if (!file) return null;
  return file.async("string");
}

export function decodeXmlEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n: string) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/'/g, "'");
}

export function xmlAttr(fragment: string, name: string): string | null {
  const re = new RegExp(`${name}="([^"]*)"`);
  return re.exec(fragment)?.[1] ?? null;
}

/** Collect text of every <ns:local>...</ns:local> in document order. */
export function xmlLocalTexts(fragment: string, localName: string): string[] {
  const re = new RegExp(`<(?:[\\w.-]+:)?${localName}\\b[^>]*>([\\s\\S]*?)</(?:[\\w.-]+:)?${localName}>`, "g");
  const out: string[] = [];
  for (const m of fragment.matchAll(re)) {
    out.push(decodeXmlEntities(m[1].replace(/<[^>]+>/g, "")));
  }
  return out;
}

export function xmlLocalText(fragment: string, localName: string): string {
  return xmlLocalTexts(fragment, localName).join("");
}

/**
 * Extract outer XML of elements named `tag` (with optional namespace prefix),
 * respecting nesting so `w:tbl` is not split by inner `w:tbl`.
 */
export function extractTagged(xml: string, tag: string): string[] {
  const results: string[] = [];
  const openRe = new RegExp(`<(?:[\\w.-]+:)?${tag}(?=[\\s>/])[^>]*>`, "g");
  const closeRe = new RegExp(`</(?:[\\w.-]+:)?${tag}>`, "g");
  let open: RegExpExecArray | null;
  while ((open = openRe.exec(xml))) {
    if (open[0].endsWith("/>")) {
      results.push(open[0]);
      continue;
    }
    closeRe.lastIndex = openRe.lastIndex;
    let depth = 1;
    let close: RegExpExecArray | null;
    let end = -1;
    while (depth > 0 && (close = closeRe.exec(xml))) {
      const between = xml.slice(openRe.lastIndex, close.index);
      const innerOpens = between.match(new RegExp(`<(?:[\\w.-]+:)?${tag}(?=[\\s>/])[^>]*>`, "g")) ?? [];
      const realOpens = innerOpens.filter((s) => !s.endsWith("/>")).length;
      depth += realOpens;
      depth -= 1;
      if (depth === 0) {
        end = close.index + close[0].length;
        break;
      }
    }
    if (end < 0) break;
    results.push(xml.slice(open.index, end));
    openRe.lastIndex = end;
  }
  return results;
}

/** Direct children of a parent element that match any of `localNames`. */
export function childTagged(parentXml: string, localNames: string[]): Array<{ name: string; xml: string }> {
  const inner = parentXml.replace(/^<[^>]+>/, "").replace(/<\/[^>]+>$/, "");
  const nameAlt = localNames.join("|");
  const openRe = new RegExp(`<(?:[\\w.-]+:)?(${nameAlt})(?=[\\s>/])[^>]*>`, "g");
  const out: Array<{ name: string; xml: string }> = [];
  let open: RegExpExecArray | null;
  while ((open = openRe.exec(inner))) {
    const name = open[1];
    if (open[0].endsWith("/>")) {
      out.push({ name, xml: open[0] });
      continue;
    }
    const chunks = extractTagged(inner.slice(open.index), name);
    const xml = chunks[0];
    if (!xml) continue;
    out.push({ name, xml });
    openRe.lastIndex = open.index + xml.length;
  }
  return out;
}
