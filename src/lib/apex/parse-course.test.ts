import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  COURSE_INTELLIGENCE_BATCH_CHARS,
  courseIntelligenceBatches,
  fallbackStructureFromDocument,
} from "./parse-course.ts";
import type { NormalizedDocument } from "./inject/types.ts";

function document(blocks: NormalizedDocument["blocks"]): NormalizedDocument {
  return {
    source: {
      name: "EDU201.pdf",
      format: "pdf",
      mimeType: "application/pdf",
      kind: "upload",
      pageCount: 12,
    },
    blocks,
  };
}

describe("Course Intelligence document input", () => {
  it("keeps heading blocks distinct from paragraphs and exposes their locators", () => {
    const batches = courseIntelligenceBatches(document([
      {
        type: "heading",
        text: "Delivery Lecture Method",
        heading: "Delivery Lecture Method",
        order: 4,
        locator: { type: "page", page: 7, heading: "Delivery Lecture Method", order: 4 },
      },
      {
        type: "paragraph",
        text: "A lecture is a teacher-centred method of teaching.",
        heading: "Delivery Lecture Method",
        order: 5,
        locator: { type: "page", page: 7, heading: "Delivery Lecture Method", order: 5 },
      },
    ]));

    assert.equal(batches.length, 1);
    assert.equal(batches[0]!.blocks[0]!.type, "heading");
    assert.equal(batches[0]!.blocks[1]!.type, "paragraph");
    assert.match(batches[0]!.text, /BLOCK type=heading; order=4; locator: type=page; order=4; page=7/);
    assert.match(batches[0]!.text, /BLOCK type=paragraph; order=5; locator: type=page; order=5; page=7/);
    assert.match(batches[0]!.text, /Delivery Lecture Method/);
  });

  it("does not silently reduce a long normalized document to its first prefix", () => {
    const early = "Early material. ".repeat(1_000);
    const late = "Late material that must reach Course Intelligence. ".repeat(1_000);
    const batches = courseIntelligenceBatches(document([
      { type: "paragraph", text: early, order: 0, locator: { type: "text", order: 0 } },
      { type: "heading", text: "Final unit", heading: "Final unit", order: 1, locator: { type: "text", order: 1 } },
      { type: "paragraph", text: late, heading: "Final unit", order: 2, locator: { type: "text", heading: "Final unit", order: 2 } },
    ]));

    assert.ok(early.length + late.length > 24_000);
    assert.ok(batches.length > 1);
    assert.ok(batches.every((batch) => batch.text.length <= COURSE_INTELLIGENCE_BATCH_CHARS));
    assert.ok(batches.some((batch) => batch.text.includes("Late material that must reach Course Intelligence.")));
    assert.equal(batches.at(-1)?.endOrder, 2);
  });

  it("retains a Title Case EDU201 heading in the document-aware fallback", () => {
    const draft = fallbackStructureFromDocument(document([
      {
        type: "heading",
        text: "Delivery Lecture Method",
        heading: "Delivery Lecture Method",
        order: 0,
        locator: { type: "page", page: 7, heading: "Delivery Lecture Method", order: 0 },
      },
    ]), { code: "EDU 201" });

    assert.equal(draft.code, "EDU 201");
    assert.equal(draft.chapters[0]?.topics[0]?.title, "Delivery Lecture Method");
  });
});
