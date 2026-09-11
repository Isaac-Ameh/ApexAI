import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { routeTutorRequest } from "../tutor-request.ts";
import type { CourseWorkspace, TopicRow } from "../types.ts";
import { buildConversationState } from "./conversation-state.ts";
import { decidePedagogy } from "./pedagogy.ts";

const activeTopic: TopicRow = {
  id: 7,
  chapterId: 3,
  position: 1,
  title: "Delivery Lecture Method",
  summary: "A lecture method summary.",
  keyIdeas: ["teacher-centred"],
  mastery: 40,
  attempts: 2,
  correct: 1,
  lastAssessedAt: null,
};

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
    chapters: [{ id: 3, position: 1, title: "Methods", topics: [activeTopic] }],
    recommendation: { kind: "study", title: "Study", body: "Study", cta: "Study" },
    messages,
    readiness: {
      label: "Developing",
      overall: 40,
      exploredPct: 100,
      assessedPct: 100,
      strong: [],
      needsAttention: [{ id: 7, title: activeTopic.title, mastery: 40 }],
      weakest: { id: 7, title: activeTopic.title, mastery: 40 },
    },
  };
}

function message(
  role: "user" | "assistant",
  content: string,
  topicId: number | null = 7,
): CourseWorkspace["messages"][number] {
  return {
    id: Math.random(),
    role,
    content,
    topicId,
    createdAt: "2026-09-11T00:00:00.000Z",
    citations: [],
  };
}

describe("conversation state", () => {
  it("derives a new conversation with no history", () => {
    const state = buildConversationState({
      workspace: workspace([]),
      message: "What is curriculum delivery?",
      request: routeTutorRequest("What is curriculum delivery?"),
      topic: activeTopic,
    });
    assert.equal(state.recentMessages.length, 0);
    assert.equal(state.previousRequestKind, null);
    assert.equal(state.isContinuation, false);
  });

  it("preserves recent user and assistant messages", () => {
    const messages = [message("user", "Explain lecture method"), message("assistant", "A lecture is...")];
    const state = buildConversationState({
      workspace: workspace(messages),
      message: "I don't understand",
      topic: activeTopic,
    });
    assert.equal(state.recentMessages.length, 2);
    assert.equal(state.previousRequestKind, "explanation");
    assert.equal(state.isContinuation, true);
  });

  it("preserves the active topic and chapter and references topic performance", () => {
    const state = buildConversationState({ workspace: workspace([]), message: "Review this topic", topic: activeTopic });
    assert.equal(state.activeTopic?.id, 7);
    assert.equal(state.activeChapter?.id, 3);
    assert.deepEqual(state.activeTopicPerformance, { mastery: 40, attempts: 2, correct: 1 });
  });

  it("passes derived context into the existing pedagogical decision", () => {
    const state = buildConversationState({
      workspace: workspace([message("assistant", "Previous explanation")]),
      message: "Review this topic",
      topic: activeTopic,
    });
    const decision = decidePedagogy({ conversation: state });
    assert.equal(decision.mode, "review");
    assert.equal(decision.targetTopicId, 7);
  });

  it("keeps practice, exam, and non-teaching routes unchanged", () => {
    for (const [text, expected] of [
      ["Give me practice questions", "practice"],
      ["Start an exam", "diagnose"],
      ["Hi", "none"],
      ["What am I studying?", "none"],
      ["What can you do?", "none"],
    ] as const) {
      const state = buildConversationState({ workspace: workspace([]), message: text, topic: activeTopic });
      assert.equal(decidePedagogy({ conversation: state }).mode, expected);
    }
  });
});
