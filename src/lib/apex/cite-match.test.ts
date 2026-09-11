import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { looksLikeCitation, parseCitationTag, resolveCitation, splitCitationText } from "./cite-match.ts";
import type { MessageCitation } from "./types.ts";

const sample: MessageCitation = {
  chunkId: 9,
  sourceName: "CIT 102 handbook.pdf",
  page: 3,
  heading: "What is a Computer",
  locator: "p. 3",
  label: "[CIT 102 handbook — p. 3]",
  excerpt:
    "A computer is an electronic device that accepts data, processes it, stores results, and produces output.",
};

describe("cite-match", () => {
  it("parses page citations", () => {
    assert.deepEqual(parseCitationTag("[CIT 102 handbook — p. 3]"), {
      title: "CIT 102 handbook",
      page: 3,
    });
  });

  it("splits assistant text into text and cite tokens", () => {
    const parts = splitCitationText("A computer stores data [CIT 102 handbook — p. 3] in memory.");
    assert.deepEqual(
      parts.map((p) => p.type),
      ["text", "cite", "text"],
    );
    assert.equal(parts[1]?.value, "[CIT 102 handbook — p. 3]");
  });

  it("does not treat markdown-like brackets as citations", () => {
    assert.equal(looksLikeCitation("[ok]"), false);
    const parts = splitCitationText("Use an array [ok] for this.");
    assert.equal(
      parts.every((p) => p.type === "text"),
      true,
    );
  });

  it("resolves a citation by label or page", () => {
    const hit = resolveCitation("[CIT 102 handbook — p. 3]", [sample]);
    assert.equal(hit?.chunkId, 9);
    assert.ok(hit?.excerpt.includes("electronic device"));
  });

  it("matches nbsp and case-insensitive labels", () => {
    const hit = resolveCitation("[cit 102 handbook — p. 3]".replace(" ", "\u00a0"), [sample]);
    assert.equal(hit?.chunkId, 9);
  });

  it("falls back to a retrieved excerpt when the model cites a nearby page", () => {
    const hit = resolveCitation("[Source — p. 4]", [sample]);
    assert.equal(hit?.chunkId, 9);
    assert.ok(hit?.excerpt.includes("electronic device"));
  });
});
