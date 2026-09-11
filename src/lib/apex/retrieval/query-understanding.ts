import { tokenize } from "./math";
import type { QueryIntent, RetrievalOptions, RetrievalQuery, UnderstoodQuery } from "./types";

function detectIntent(text: string): QueryIntent {
  const q = text.toLowerCase();
  if (/\b(vs|versus|differ|compare|comparison|contrast)\b/.test(q)) return "compare";
  if (/\b(example|for instance|illustrat)/.test(q)) return "example";
  if (/\b(why|reason|because|cause)\b/.test(q)) return "why";
  if (/\b(how (do|does|can|to)|steps?|process|procedure)\b/.test(q)) return "how";
  if (/\b(what is|define|definition|meaning of)\b/.test(q)) return "define";
  if (/\b(review|recap|remind|summar)/.test(q)) return "review";
  if (/\b(explain|describe|tell me about|walk me)\b/.test(q)) return "explain";
  return "other";
}

function wantsRelated(text: string, options: RetrievalOptions): boolean {
  const q = text.toLowerCase();
  if (options.strictTopic) return false;
  if (/\b(only this topic|just this topic|stay on this|don't go beyond)\b/.test(q)) return false;
  if (/\b(whole course|other (topics|chapters)|related|elsewhere)\b/.test(q)) return true;
  return options.preferCurrentTopic !== false;
}

/**
 * Query understanding stage.
 * Rewrites the student question with course/topic context so both the
 * embedding model and the lexical fallback see the same focused query.
 * A later LLM rewriter can replace `rewritten` without changing callers.
 */
export function understandQuery(
  query: RetrievalQuery,
  options: RetrievalOptions = {},
): UnderstoodQuery {
  const original = query.text.trim();
  const intent = detectIntent(original);
  const expandToRelated = wantsRelated(original, options);
  const parts = [original];
  if (options.topicTitle) parts.push(`Topic: ${options.topicTitle}`);
  if (options.chapterTitle) parts.push(`Chapter: ${options.chapterTitle}`);
  if (options.keyIdeas?.length) parts.push(`Key ideas: ${options.keyIdeas.slice(0, 6).join("; ")}`);
  if (intent === "define") parts.push("Provide the definition as stated in the source.");
  if (intent === "compare") parts.push("Contrast the concepts using the source.");
  if (intent === "example") parts.push("Prefer worked examples and concrete cases from the source.");

  const rewritten = parts.join("\n");
  const keywords = tokenize(
    [original, options.topicTitle ?? "", ...(options.keyIdeas ?? [])].join(" "),
  );

  return {
    original,
    rewritten,
    intent,
    keywords: [...new Set(keywords)].slice(0, 24),
    expandToRelated,
    focus: {
      courseId: query.courseId,
      chapterId: options.chapterId ?? query.chapterId ?? null,
      topicId: options.topicId ?? query.topicId ?? null,
    },
  };
}
