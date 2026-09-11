import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { topicHasProgress } from "./adapt.ts";

describe("topicHasProgress", () => {
  it("does not treat navigation-only last-viewed as explored", () => {
    assert.equal(topicHasProgress(0, null), false);
  });

  it("counts a topic with attempts", () => {
    assert.equal(topicHasProgress(1, null), true);
  });

  it("counts a topic with a mastery score", () => {
    assert.equal(topicHasProgress(0, 40), true);
    assert.equal(topicHasProgress(2, 80), true);
  });
});
