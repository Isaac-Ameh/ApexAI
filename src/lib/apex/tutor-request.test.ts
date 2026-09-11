import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyTutorRequest,
  routeTutorRequest,
  shouldRetrieveTutorEvidence,
} from "./tutor-request.ts";

describe("tutor request classification", () => {
  it("classifies greetings without retrieval", () => {
    assert.equal(classifyTutorRequest("Hi"), "greeting");
    assert.equal(classifyTutorRequest("Hello"), "greeting");
    assert.equal(routeTutorRequest("Good morning").shouldRetrieve, false);
  });

  it("classifies grounded course requests", () => {
    assert.equal(classifyTutorRequest("What is curriculum delivery?"), "course_question");
    assert.equal(classifyTutorRequest("Explain differentiated instruction"), "explanation");
    assert.equal(shouldRetrieveTutorEvidence("course_question"), true);
    assert.equal(shouldRetrieveTutorEvidence("explanation"), true);
  });

  it("preserves practice and exam routing with requested counts", () => {
    assert.deepEqual(routeTutorRequest("Give me 6 practice questions"), {
      kind: "practice",
      shouldRetrieve: false,
      count: 6,
    });
    assert.deepEqual(routeTutorRequest("Start an exam"), {
      kind: "exam",
      shouldRetrieve: false,
      count: 12,
    });
  });

  it("keeps navigation and product questions out of course retrieval", () => {
    assert.equal(classifyTutorRequest("What am I studying?"), "navigation");
    assert.equal(classifyTutorRequest("Should I use ApexStudy or ChatGPT?"), "meta");
    assert.equal(routeTutorRequest("What chapters are in this course?").shouldRetrieve, false);
    assert.equal(routeTutorRequest("What can you do?").shouldRetrieve, false);
  });

  it("uses a safe non-retrieval default for unrelated messages", () => {
    assert.equal(classifyTutorRequest("What is the weather today?"), "unrelated");
    assert.equal(routeTutorRequest("What is the weather today?").shouldRetrieve, false);
  });
});
