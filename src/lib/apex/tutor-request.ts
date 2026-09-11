import { detectIntent } from "./adapt";

export type TutorRequestKind =
  | "greeting"
  | "navigation"
  | "course_question"
  | "explanation"
  | "practice"
  | "exam"
  | "meta"
  | "unrelated";

export type TutorRequestRoute = {
  kind: TutorRequestKind;
  shouldRetrieve: boolean;
  count?: number;
};

function requestedCount(text: string): number | undefined {
  const match = text.match(/(\d+)[^\d\n]{0,32}(questions?|mcqs?|items?)/i);
  if (!match) return undefined;
  return Math.max(3, Math.min(20, Number(match[1])));
}

function isGreeting(text: string): boolean {
  return /^(hi|hello|hey|good morning|good afternoon|good evening|morning|afternoon|evening)[!. ,]*$/i.test(text);
}

function isNavigation(text: string): boolean {
  return /\b(what am i studying|what topic am i on|which topic am i on|what chapters? (are in|does .* (have|contain))|course structure|show me .*course|show .*chapters?|where am i in (the )?course)\b/i.test(
    text,
  );
}

function isMeta(text: string): boolean {
  return /\b(apexstudy|chatgpt|notebooklm|what can you do|what do you do|why should i use you|how are you different|what are you different|capabilities|feature|features)\b/i.test(
    text,
  );
}

function isExam(text: string): boolean {
  return /\b(start|begin|take|run|give me|create)?\s*(an?\s*)?(exam|practice exam|readiness check)\b|\b(am i exam ready|exam readiness)\b/i.test(
    text,
  );
}

function isPractice(text: string): boolean {
  return /\b(quiz|practice questions?|test me|mcqs?|multiple[- ]choice|check my understanding|short check)\b/i.test(
    text,
  );
}

function isExplanation(text: string): boolean {
  return /\b(explain|why is|why are|how does|how do|how can|describe|tell me about|walk me through|help me understand|i don['’]?t understand|i am confused|i['’]?m confused|confused)\b/i.test(
    text,
  );
}

function isCourseQuestion(text: string): boolean {
  const asksAQuestion = /^(what|which|who|when|where|define|does|do|is|are|can|compare|difference|advantages?|disadvantages?|purpose|meaning)\b/i.test(text);
  const courseTerms = /\b(curriculum|instruction|assessment|teaching|learning|pedagog|delivery|course|topic|chapter|syllabus|mastery|lesson|education)\b/i.test(text);
  return asksAQuestion && courseTerms;
}

/** Classifies a student request before any course retrieval is started. */
export function classifyTutorRequest(message: string): TutorRequestKind {
  const text = message.trim();
  if (isGreeting(text)) return "greeting";
  const existingIntent = detectIntent(text);
  if (existingIntent.kind === "exam") return "exam";
  if (existingIntent.kind === "practice") return "practice";
  if (existingIntent.kind === "review") return "explanation";
  if (isExam(text)) return "exam";
  if (isPractice(text)) return "practice";
  if (isNavigation(text)) return "navigation";
  if (isMeta(text)) return "meta";
  if (isExplanation(text)) return "explanation";
  if (isCourseQuestion(text)) return "course_question";
  return "unrelated";
}

export function routeTutorRequest(message: string): TutorRequestRoute {
  const kind = classifyTutorRequest(message);
  return {
    kind,
    shouldRetrieve: kind === "course_question" || kind === "explanation",
    count: kind === "exam" ? requestedCount(message) ?? 12 : kind === "practice" ? requestedCount(message) ?? 8 : undefined,
  };
}

export function shouldRetrieveTutorEvidence(kind: TutorRequestKind): boolean {
  return kind === "course_question" || kind === "explanation";
}
