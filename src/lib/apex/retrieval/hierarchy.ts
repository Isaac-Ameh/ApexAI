import { HIERARCHY } from "./config";
import type { Chunk, UnderstoodQuery } from "./types";

export type HierarchySignal = {
  score: number;
  reason: string | null;
};

/**
 * Course → chapter → topic awareness.
 * Boosts the student's current place in the hierarchy without dropping
 * related material from neighbouring topics.
 */
export function hierarchyScore(chunk: Chunk, query: UnderstoodQuery, strictTopic: boolean): HierarchySignal {
  const topicId = query.focus.topicId;
  const chapterId = query.focus.chapterId;

  if (strictTopic && topicId != null && chunk.topicId !== topicId) {
    return { score: 0, reason: "outside-strict-topic" };
  }

  if (topicId != null && chunk.topicId === topicId) {
    return { score: HIERARCHY.currentTopicBoost, reason: "current-topic" };
  }
  if (chapterId != null && chunk.chapterId === chapterId) {
    return { score: HIERARCHY.sameChapterBoost, reason: "same-chapter" };
  }
  if (topicId != null && chunk.topicId != null && chunk.topicId !== topicId) {
    return {
      score: query.expandToRelated ? HIERARCHY.relatedTopicBoost : 0,
      reason: query.expandToRelated ? "related-topic" : null,
    };
  }
  return { score: 0, reason: null };
}

export function passesMetadataFilter(
  chunk: Chunk,
  query: UnderstoodQuery,
  strictTopic: boolean,
): boolean {
  if (chunk.courseId !== query.focus.courseId) return false;
  if (strictTopic && query.focus.topicId != null) return chunk.topicId === query.focus.topicId;
  return true;
}
