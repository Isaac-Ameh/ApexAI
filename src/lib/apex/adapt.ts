import type {
  ActionKind,
  ChapterRow,
  ExamReadiness,
  NextAction,
  TopicRow,
} from "./types";

const STALE_MS = 12 * 24 * 60 * 60 * 1000;

function flatten(chapters: ChapterRow[]): TopicRow[] {
  return chapters.flatMap((ch) => ch.topics);
}

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

/** Real study evidence — navigation / last-viewed is not progress. */
export function topicHasProgress(attempts: number, mastery: number | null): boolean {
  return attempts > 0 || mastery != null;
}

export function computeReadiness(chapters: ChapterRow[]): ExamReadiness {
  const topics = flatten(chapters);
  const assessed = topics.filter((t) => t.mastery !== null);
  const mastered = assessed.map((t) => t.mastery as number);
  const overall = avg(mastered) ?? 0;
  const explored = topics.filter((t) => topicHasProgress(t.attempts, t.mastery));
  const strong = assessed
    .filter((t) => (t.mastery ?? 0) >= 75)
    .map((t) => ({ id: t.id, title: t.title, mastery: t.mastery as number }))
    .sort((a, b) => b.mastery - a.mastery);
  const needsAttention = topics
    .filter((t) => t.mastery === null || (t.mastery ?? 0) < 60)
    .map((t) => ({ id: t.id, title: t.title, mastery: t.mastery }))
    .sort((a, b) => (a.mastery ?? -1) - (b.mastery ?? -1));
  const weakest = needsAttention[0] ?? null;

  let label: ExamReadiness["label"] = "Not started";
  if (assessed.length === 0) label = "Not started";
  else if (overall >= 80 && needsAttention.length === 0) label = "Exam ready";
  else if (overall >= 65 && assessed.length >= Math.ceil(topics.length * 0.6))
    label = "Almost ready";
  else label = "Developing";

  return {
    label,
    overall,
    exploredPct: topics.length ? Math.round((explored.length / topics.length) * 100) : 0,
    assessedPct: topics.length ? Math.round((assessed.length / topics.length) * 100) : 0,
    strong: strong.slice(0, 6),
    needsAttention: needsAttention.slice(0, 8),
    weakest,
  };
}

export function recommend(input: {
  chapters: ChapterRow[];
  lastTopicId: number | null;
  lastStudiedAt: string | null;
}): NextAction {
  const topics = flatten(input.chapters);
  if (!topics.length) {
    return {
      kind: "study",
      title: "Add your course",
      body: "Upload material and I will map the course before we study.",
      cta: "Add course",
    };
  }

  const first = topics[0];
  const last = topics.find((t) => t.id === input.lastTopicId) ?? null;
  const unassessed = topics.find((t) => t.mastery === null);
  const weakest = topics
    .filter((t) => t.mastery !== null)
    .sort((a, b) => (a.mastery ?? 0) - (b.mastery ?? 0))[0];
  const stale =
    input.lastStudiedAt && Date.now() - Date.parse(input.lastStudiedAt) > STALE_MS;

  if (!last && !input.lastTopicId) {
    return {
      kind: "study",
      title: "Start with the first topic",
      body: `Let's begin with ${first.title}. I'll walk you through the ideas, then we'll check whether they stuck.`,
      cta: "Begin study",
      topicId: first.id,
      topicTitle: first.title,
    };
  }

  if (last && last.attempts === 0) {
    return {
      kind: "check",
      title: "A short check before we continue",
      body: `You just studied ${last.title}. A 5-question check will show what landed and what still needs work.`,
      cta: "Start check",
      topicId: last.id,
      topicTitle: last.title,
      count: 5,
    };
  }

  if (last && last.mastery !== null && last.mastery < 50) {
    return {
      kind: "review",
      title: "Let's approach this differently",
      body: `You've struggled with ${last.title}. We'll re-explain the core ideas from the source, then try a smaller set of questions.`,
      cta: "Review topic",
      topicId: last.id,
      topicTitle: last.title,
    };
  }

  if (last && last.mastery !== null && last.mastery < 75) {
    return {
      kind: "practice",
      title: "Targeted practice",
      body: `You performed well on the basics of ${last.title}, but the application questions still need work. I recommend a short practice set before moving on.`,
      cta: "Practice this topic",
      topicId: last.id,
      topicTitle: last.title,
      count: 6,
    };
  }

  if (stale && last) {
    return {
      kind: "review",
      title: "A quick retrieval check",
      body: `You haven't reviewed ${last.title} in a while. A short retrieval check would be useful before new material.`,
      cta: "Review now",
      topicId: last.id,
      topicTitle: last.title,
      count: 5,
    };
  }

  if (weakest && (weakest.mastery ?? 0) < 55) {
    return {
      kind: "practice",
      title: "Your most important weakness",
      body: `${weakest.title} is the topic pulling exam readiness down. Targeted practice here will move the needle fastest.`,
      cta: "Practice weak topic",
      topicId: weakest.id,
      topicTitle: weakest.title,
      count: 8,
    };
  }

  if (last && last.mastery !== null && last.mastery >= 75) {
    const idx = topics.findIndex((t) => t.id === last.id);
    const next = topics[idx + 1];
    if (next) {
      return {
        kind: "advance",
        title: "Ready for the next topic",
        body: `You are solid on ${last.title}. Next up is ${next.title}.`,
        cta: "Continue",
        topicId: next.id,
        topicTitle: next.title,
      };
    }
  }

  if (unassessed) {
    return {
      kind: "study",
      title: "Still unassessed",
      body: `${unassessed.title} has not been checked yet. Study it, then take a short check so I can update your learner model.`,
      cta: "Study this topic",
      topicId: unassessed.id,
      topicTitle: unassessed.title,
    };
  }

  const readiness = computeReadiness(input.chapters);
  if (readiness.label !== "Exam ready") {
    return {
      kind: "exam",
      title: "Diagnostic exam",
      body: "Most topics have evidence. A practice exam will show whether you are actually exam-ready.",
      cta: "Start practice exam",
      count: 12,
    };
  }

  return {
    kind: "exam",
    title: "Keep the edge",
    body: "You look exam-ready. A mixed practice exam will keep retrieval strong.",
    cta: "Sit a practice exam",
    count: 12,
  };
}

export function detectIntent(message: string): {
  kind: ActionKind | "chat";
  count?: number;
} {
  const text = message.trim().toLowerCase();
  const n = text.match(/(\d+)\s*(questions?|mcqs?|items?)/);
  const count = n ? Math.max(3, Math.min(20, Number(n[1]))) : undefined;
  if (/exam ready|am i ready|readiness|practice exam/.test(text)) {
    return { kind: "exam", count: count ?? 12 };
  }
  if (/quiz|practice|questions?|test me|mcq/.test(text)) {
    return { kind: "practice", count: count ?? 8 };
  }
  if (/review|don't understand|dont understand|still don't|confused/.test(text)) {
    return { kind: "review" };
  }
  return { kind: "chat" };
}

export function updateMastery(prev: number | null, correct: boolean): number {
  const incoming = correct ? 100 : 25;
  if (prev === null) return incoming;
  return Math.round(prev * 0.65 + incoming * 0.35);
}
