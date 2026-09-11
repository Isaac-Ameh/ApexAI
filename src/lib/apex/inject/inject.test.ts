import assert from "node:assert/strict";
import { describe, it } from "node:test";
import JSZip from "jszip";
import {
  InjectionError,
  assembleDocument,
  detectFormat,
  injectFile,
  injectText,
  parseMarkdown,
  parsePlainText,
  serializeForLegacy,
  type NormalizedDocument,
} from "./index.ts";
import { blocksFromPdfPage } from "./pdf.ts";

function assertCanonical(doc: NormalizedDocument) {
  assert.ok(doc.blocks.length >= 1, "expected at least one block");
  doc.blocks.forEach((block, i) => {
    assert.ok(["heading", "paragraph", "list", "table"].includes(block.type), block.type);
    assert.equal(typeof block.text, "string");
    assert.ok(block.text.trim().length > 0, "empty block text");
    assert.ok(["page", "slide", "section", "text"].includes(block.locator.type), block.locator.type);
    assert.equal(block.order, i);
    assert.equal(block.locator.order, i);
    assert.equal("format" in doc.source, true);
  });
}

async function zipFile(name: string, type: string, files: Record<string, string>): Promise<File> {
  const zip = new JSZip();
  for (const [path, body] of Object.entries(files)) zip.file(path, body);
  const buf = await zip.generateAsync({ type: "arraybuffer" });
  return new File([buf], name, { type });
}

describe("detectFormat", () => {
  it("maps extensions without assuming everything is a PDF", () => {
    assert.equal(detectFormat("notes.pdf", "application/pdf"), "pdf");
    assert.equal(detectFormat("unit.docx"), "docx");
    assert.equal(detectFormat("deck.pptx"), "pptx");
    assert.equal(detectFormat("outline.md"), "markdown");
    assert.equal(detectFormat("notes.txt"), "txt");
    assert.equal(detectFormat("scan.jpg"), null);
    assert.equal(detectFormat("old.doc"), null);
  });
});

describe("PDF adapter", () => {
  it("keeps page locators on blocks and does not flatten a page into one string", () => {
    const blocks = blocksFromPdfPage(
      [
        { str: "Delivery Lecture Method", x: 72, y: 700, width: 240, height: 18, hasEOL: true },
        { str: "A lecture is a teacher-centred method of teaching.", x: 72, y: 668, width: 360, height: 11, hasEOL: true },
        { str: "It is useful for introducing a new topic.", x: 72, y: 652, width: 300, height: 11, hasEOL: true },
        { str: "Discussion Method", x: 72, y: 610, width: 180, height: 18, hasEOL: true },
        { str: "Learners talk through the problem with the teacher.", x: 72, y: 580, width: 340, height: 11, hasEOL: true },
      ],
      7,
      0,
    );
    assert.ok(blocks.length >= 3);
    const heading = blocks.find((b) => b.text === "Delivery Lecture Method");
    assert.ok(heading);
    assert.equal(heading?.type, "heading");
    assert.equal(heading?.locator.type, "page");
    assert.equal(heading?.locator.page, 7);
    assert.equal(heading?.text.includes("[[page"), false);
    assert.ok(blocks.some((b) => b.type === "paragraph" && b.text.includes("teacher-centred")));
    assert.ok(blocks.some((b) => b.text === "Discussion Method" && b.locator.page === 7));
    const doc = assembleDocument(
      { name: "EDU201.pdf", format: "pdf", mimeType: "application/pdf", kind: "upload", pageCount: 12 },
      blocks,
    );
    assertCanonical(doc);
    const legacy = serializeForLegacy(doc);
    assert.match(legacy, /\[\[page 7\]\]/);
    assert.match(legacy, /# Delivery Lecture Method/);
    assert.equal(doc.blocks[0]?.locator.page, 7);
  });
});

describe("Markdown adapter", () => {
  it("preserves headings as structured blocks", async () => {
    const md = `# Course outline

## Delivery Lecture Method

The lecture method is teacher-centred.

- Prepare the notes
- Deliver clearly

| Topic | Hours |
| --- | --- |
| Lecture | 2 |
`;
    const file = new File([md], "edu201.md", { type: "text/markdown" });
    const doc = await injectFile(file);
    assertCanonical(doc);
    assert.equal(doc.source.format, "markdown");
    const headings = doc.blocks.filter((b) => b.type === "heading").map((b) => b.text);
    assert.deepEqual(headings, ["Course outline", "Delivery Lecture Method"]);
    assert.equal(doc.blocks.find((b) => b.text === "Delivery Lecture Method")?.locator.type, "section");
    assert.ok(doc.blocks.some((b) => b.type === "list" && /Prepare the notes/.test(b.text)));
    assert.ok(doc.blocks.some((b) => b.type === "table" && /Lecture/.test(b.text)));
    assert.equal(serializeForLegacy(doc).includes("[[page"), false);
  });
});

describe("TXT adapter", () => {
  it("keeps paragraph and heading boundaries", async () => {
    const text = `Delivery Lecture Method

A lecture is a teacher-centred method.

Discussion Method

Learners exchange ideas in a group.`;
    const file = new File([text], "notes.txt", { type: "text/plain" });
    const doc = await injectFile(file);
    assertCanonical(doc);
    assert.equal(doc.source.format, "txt");
    assert.ok(doc.blocks.some((b) => b.type === "heading" && b.text === "Delivery Lecture Method"));
    assert.ok(doc.blocks.some((b) => b.type === "paragraph" && b.text.includes("teacher-centred")));
    const plain = parsePlainText(text);
    assert.ok(plain.length >= 4);
  });
});

describe("DOCX adapter", () => {
  it("extracts heading and paragraph structure", async () => {
    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>Delivery Lecture Method</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>A lecture is a teacher-centred method of teaching.</w:t></w:r>
    </w:p>
    <w:tbl>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Method</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Focus</w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>
  </w:body>
</w:document>`;
    const file = await zipFile(
      "edu201.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      { "word/document.xml": documentXml },
    );
    const doc = await injectFile(file);
    assertCanonical(doc);
    assert.equal(doc.source.format, "docx");
    const heading = doc.blocks.find((b) => b.type === "heading");
    assert.equal(heading?.text, "Delivery Lecture Method");
    assert.equal(heading?.locator.type, "section");
    assert.ok(doc.blocks.some((b) => b.type === "paragraph" && /teacher-centred/.test(b.text)));
    assert.ok(doc.blocks.some((b) => b.type === "table" && /Method/.test(b.text)));
  });
});

describe("PPTX adapter", () => {
  it("preserves slide provenance", async () => {
    const presentation = `<?xml version="1.0" encoding="UTF-8"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId2"/>
    <p:sldId id="257" r:id="rId3"/>
  </p:sldIdLst>
</p:presentation>`;
    const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/>
</Relationships>`;
    const slide = (title: string, body: string) => `<?xml version="1.0" encoding="UTF-8"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:nvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
        <p:txBody><a:p><a:r><a:t>${title}</a:t></a:r></a:p></p:txBody>
      </p:sp>
      <p:sp>
        <p:txBody><a:p><a:r><a:t>${body}</a:t></a:r></a:p></p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;
    const file = await zipFile(
      "edu201.pptx",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      {
        "ppt/presentation.xml": presentation,
        "ppt/_rels/presentation.xml.rels": rels,
        "ppt/slides/slide1.xml": slide("Delivery Lecture Method", "Teacher-centred exposition of content."),
        "ppt/slides/slide2.xml": slide("Discussion Method", "Learners talk through the problem."),
      },
    );
    const doc = await injectFile(file);
    assertCanonical(doc);
    assert.equal(doc.source.format, "pptx");
    assert.equal(doc.source.slideCount, 2);
    const first = doc.blocks.find((b) => b.text === "Delivery Lecture Method");
    assert.equal(first?.type, "heading");
    assert.equal(first?.locator.type, "slide");
    assert.equal(first?.locator.slide, 1);
    assert.ok(doc.blocks.some((b) => b.locator.slide === 2 && /Discussion Method/.test(b.text)));
    assert.equal(serializeForLegacy(doc).includes("[[page"), false);
  });
});

describe("generic IR", () => {
  it("is format-agnostic: consumers only need blocks and locators", async () => {
    const md = await injectFile(new File(["# Title\n\nA paragraph about teaching methods in EDU201 courses.\n"], "a.md"));
    const txt = injectText("Title\n\nA paragraph about teaching methods in EDU201 courses.\n", { name: "paste" });
    for (const doc of [md, txt]) {
      assertCanonical(doc);
      for (const block of doc.blocks) {
        assert.ok(block.locator.type);
        assert.equal(typeof block.text, "string");
      }
    }
  });
});

describe("validation", () => {
  it("rejects unsupported formats instead of reading garbage", async () => {
    const file = new File(["not a picture"], "scan.jpg", { type: "image/jpeg" });
    await assert.rejects(() => injectFile(file), (err: unknown) => {
      assert.ok(err instanceof InjectionError);
      assert.equal(err.code, "unsupported_format");
      return true;
    });
  });

  it("rejects old .doc and empty files", async () => {
    await assert.rejects(
      () => injectFile(new File(["legacy"], "unit.doc", { type: "application/msword" })),
      (err: unknown) => err instanceof InjectionError && err.code === "unsupported_format",
    );
    await assert.rejects(
      () => injectFile(new File(["   "], "empty.txt", { type: "text/plain" })),
      (err: unknown) => err instanceof InjectionError && err.code === "empty_source",
    );
  });

  it("does not treat a random zip as a Word document silently", async () => {
    const file = await zipFile("unit.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", {
      "readme.txt": "no document xml here",
    });
    await assert.rejects(
      () => injectFile(file),
      (err: unknown) => err instanceof InjectionError && err.code === "unreadable",
    );
  });
});

describe("markdown parser", () => {
  it("does not require a markdown framework for headings", () => {
    const blocks = parseMarkdown("# Hardware\n\nPhysical parts of a computer.");
    assert.equal(blocks[0]?.type, "heading");
    assert.equal(blocks[0]?.text, "Hardware");
    assert.equal(blocks[1]?.type, "paragraph");
  });
});
