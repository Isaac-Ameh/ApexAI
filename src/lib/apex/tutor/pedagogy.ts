import type { TutorRequestKind } from "../tutor-request";
import type { ConversationState } from "./conversation-state";

export type PedagogicalMode =
  | "none"
  | "answer"
  | "explain"
  | "teach"
  | "diagnose"
  | "practice"
  | "feedback"
  | "review"
  | "clarify"
  | "continue";

export type PedagogicalDecision = {
  mode: PedagogicalMode;
  reason: string;
  targetTopicId: number | null;
  targetChapterId: number | null;
  prerequisiteTopicIds: number[];
  suggestedInteraction: string | null;
  desiredResponseShape: string;
};

export type PedagogicalContext = {
  conversation: ConversationState;
};

function baseDecision(mode: PedagogicalMode, context: PedagogicalContext, reason: string): PedagogicalDecision {
  return {
    mode,
    reason,
    targetTopicId: context.conversation.activeTopic?.id ?? null,
    targetChapterId: context.conversation.activeTopic?.chapterId ?? null,
    prerequisiteTopicIds: [],
    suggestedInteraction: null,
    desiredResponseShape: "Respond directly and stay within the selected course evidence.",
  };
}

function isClarification(message: string): boolean {
  return /\b(i (still )?don['’]?t understand|i['’]?m confused|simpler|again|say that another way|make it easier)\b/i.test(
    message,
  );
}

function isTeachingRequest(message: string): boolean {
  return /\b(teach me|teach|walk me through|lesson on|learn about)\b/i.test(message);
}

function isReviewRequest(message: string): boolean {
  return /\b(review|revise|study|go over|struggling|weak at)\b/i.test(message);
}

function withInteraction(
  decision: PedagogicalDecision,
  suggestedInteraction: string,
  desiredResponseShape: string,
): PedagogicalDecision {
  return { ...decision, suggestedInteraction, desiredResponseShape };
}

/** Deterministic pedagogical strategy selection. It does not retrieve or call an LLM. */
export function decidePedagogy(context: PedagogicalContext): PedagogicalDecision {
  const { conversation } = context;
  const { request, message, activeTopic: topic } = conversation;

  if (request.kind === "practice") {
    return withInteraction(
      baseDecision("practice", context, "The student explicitly requested practice."),
      "Use the existing practice flow.",
      "Do not generate the practice set in the tutor response.",
    );
  }
  if (request.kind === "exam") {
    return withInteraction(
      baseDecision("diagnose", context, "The student explicitly requested an exam or readiness check."),
      "Use the existing exam flow.",
      "Do not generate the exam in the tutor response.",
    );
  }
  if (["greeting", "navigation", "meta", "unrelated"].includes(request.kind)) {
    return baseDecision("none", context, "This request is not a course teaching interaction.");
  }

  if (conversation.isContinuation && isClarification(message)) {
    return withInteraction(
      baseDecision("clarify", context, "The student asked for clarification of the current interaction."),
      "Restate the concept more simply and check understanding.",
      "Use a simpler explanation, one concrete example, then one short check question.",
    );
  }

  if (topic && topic.mastery !== null && topic.mastery < 60 && isReviewRequest(message)) {
    return withInteraction(
      baseDecision("review", context, "The active topic has existing low mastery and the student requested review."),
      "Revisit the core idea before extending to new material.",
      "Review the core concept, connect it to the evidence, then ask one retrieval check.",
    );
  }

  if (isTeachingRequest(message)) {
    return withInteraction(
      baseDecision("teach", context, "The student explicitly requested teaching rather than a short answer."),
      "Teach progressively from the grounded evidence.",
      "Build from the basic idea to one example, then check understanding.",
    );
  }

  if (request.kind === "explanation") {
    return withInteraction(
      baseDecision("explain", context, "The request asks for an explanation."),
      "Explain the requested concept clearly.",
      "Explain in 2–4 short paragraphs, then ask one check question.",
    );
  }

  if (request.kind === "course_question") {
    return withInteraction(
      baseDecision("answer", context, "The student asked a direct course question."),
      "Answer the requested course question directly.",
      "Give a concise answer first, then add only necessary context and one check question.",
    );
  }

  return baseDecision("none", context, "No teaching action was selected for this request.");
}

export function formatPedagogicalInstruction(decision: PedagogicalDecision): string {
  if (decision.mode === "none") return "PEDAGOGICAL MODE: NONE\nDo not initiate a teaching interaction.";
  return [
    `PEDAGOGICAL MODE: ${decision.mode.toUpperCase()}`,
    `GOAL: ${decision.reason}`,
    `INTERACTION: ${decision.suggestedInteraction ?? "Respond appropriately."}`,
    `RESPONSE SHAPE: ${decision.desiredResponseShape}`,
  ].join("\n");
}

export function isTeachingRequestKind(kind: TutorRequestKind): boolean {
  return kind === "course_question" || kind === "explanation";
}
