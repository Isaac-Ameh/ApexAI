import { routeTutorRequest, type TutorRequestRoute } from "../tutor-request";
import type { ChapterRow, CourseWorkspace, TopicRow } from "../types";

export type ConversationMessage = CourseWorkspace["messages"][number];

export type ConversationState = {
  course: CourseWorkspace["course"];
  request: TutorRequestRoute;
  message: string;
  activeTopic: TopicRow | undefined;
  activeChapter: ChapterRow | undefined;
  recentMessages: ConversationMessage[];
  previousRequestKind: TutorRequestRoute["kind"] | null;
  isContinuation: boolean;
  activeTopicPerformance: {
    mastery: number | null;
    attempts: number;
    correct: number;
  } | null;
};

export type ConversationStateInput = {
  workspace: CourseWorkspace;
  message: string;
  request?: TutorRequestRoute;
  topic?: TopicRow;
  recentMessageLimit?: number;
};

function activeChapterFor(workspace: CourseWorkspace, topic: TopicRow | undefined): ChapterRow | undefined {
  return topic ? workspace.chapters.find((chapter) => chapter.id === topic.chapterId) : undefined;
}

function previousRequestKind(messages: ConversationMessage[]): TutorRequestRoute["kind"] | null {
  const previousUserMessage = [...messages].reverse().find((message) => message.role === "user");
  return previousUserMessage ? routeTutorRequest(previousUserMessage.content).kind : null;
}

function isContinuation(message: string, recentMessages: ConversationMessage[]): boolean {
  if (!recentMessages.some((item) => item.role === "assistant")) return false;
  return /\b(i (still )?don['’]?t understand|i['’]?m confused|simpler|again|say that another way|make it easier|what do you mean)\b/i.test(
    message,
  );
}

/** Derives transient conversation context from existing workspace state. */
export function buildConversationState(input: ConversationStateInput): ConversationState {
  const request = input.request ?? routeTutorRequest(input.message);
  const activeTopic = input.topic;
  const recentMessages = input.workspace.messages.slice(-(input.recentMessageLimit ?? 8));

  return {
    course: input.workspace.course,
    request,
    message: input.message,
    activeTopic,
    activeChapter: activeChapterFor(input.workspace, activeTopic),
    recentMessages,
    previousRequestKind: previousRequestKind(recentMessages),
    isContinuation: isContinuation(input.message, recentMessages),
    activeTopicPerformance: activeTopic
      ? {
          mastery: activeTopic.mastery,
          attempts: activeTopic.attempts,
          correct: activeTopic.correct,
        }
      : null,
  };
}
