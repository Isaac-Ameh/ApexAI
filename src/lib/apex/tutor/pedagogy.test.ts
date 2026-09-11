import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyTutorRequest, routeTutorRequest } from "../tutor-request.ts";
import type { CourseWorkspace, TopicRow } from "../types.ts";
import { buildConversationState } from "./conversation-state.ts";
import { decidePedagogy, formatPedagogicalInstruction } from "./pedagogy.ts";

function topic(overrides: Partial<TopicRow> = {}): TopicRow {
  return {
    id: 7,
    chapterId: 3,
    position: 1,
    title: "Delivery Lecture Method",
    summary: "A lecture method summary.",
    keyIdeas: ["teacher-centred"],
    mastery: null,
    attempts: 0,
    correct: 0,
    lastAssessedAt: null,
    ...overrides,
  };
}

function decision(message: string, topicOverride?: Partial<TopicRow>) {
  const request = routeTutorRequest(message);
  const activeTopic = topic(topicOverride);
  return decidePedagogy({
    conversation: buildConversationState({
      workspace: workspace([assistantMessage()]),
      message,
      request,
      topic: activeTopic,
    }),
  });
}

function assistantMessage() {
  return {
    id: 1,
    role: "assistant" as const,
    content: "Previous explanation.",
    topicId: 7,
    createdAt: "2026-09-11T00:00:00.000Z",
    citations: [],
  };
}

function workspace(messages: CourseWorkspace["messages"]): CourseWorkspace {
  return {
    course: {
      id: 1,
      code: "EDU201",
      title: "Education",
      sourceKind: "upload",
      sourceName: "EDU201.pdf",
      lastTopicId: 7,
      lastStudiedAt: null,
      createdAt: "2026-09-11T00:00:00.000Z",
    },
    chapters: [{ id: 3, position: 1, title: "Methods", topics: [topic()] }],
    recommendation: { kind: "study", title: "Study", body: "Study", cta: "Study" },
    messages,
    readiness: {
      label: "Not started",
      overall: 0,
      exploredPct: 0,
      assessedPct: 0,
      strong: [],
      needsAttention: [],
      weakest: null,
    },
  };
}

describe("pedagogical decision engine", () => {
  it("selects answer for a direct course question", () => {
    assert.equal(decision("What is curriculum delivery?").mode, "answer");
  });

  it("selects explain for an explicit explanation request", () => {
    const result = decision("Explain differentiated instruction");
    assert.equal(result.mode, "explain");
    assert.match(formatPedagogicalInstruction(result), /PEDAGOGICAL MODE: EXPLAIN/);
  });

  it("selects clarify for an incomprehension follow-up", () => {
    assert.equal(decision("I don't understand", { mastery: 80 }).mode, "clarify");
  });

  it("selects review for a weak topic when review is requested", () => {
    const result = decision("Review this topic", { mastery: 40 });
    assert.equal(result.mode, "review");
    assert.equal(result.targetTopicId, 7);
  });

  it("preserves practice and exam routing", () => {
    assert.equal(decision("Give me practice questions").mode, "practice");
    assert.equal(decision("Start an exam").mode, "diagnose");
  });

  it("does not turn non-teaching requests into teaching modes", () => {
    for (const message of ["Hi", "What am I studying?", "What can you do?"]) {
      const result = decidePedagogy({
        conversation: buildConversationState({
          workspace: workspace([]),
          message,
          request: routeTutorRequest(message),
          topic: topic(),
        }),
      });
      assert.equal(result.mode, "none", `${classifyTutorRequest(message)} should not teach`);
    }
  });
});
