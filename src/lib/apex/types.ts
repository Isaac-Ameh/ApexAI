/** Frozen ApexStudy product types. Course model + learner model + next action. */

export type SourceKind = "sample" | "upload" | "paste";

export type CourseStatus = "processing" | "ready";

export type QuizKind = "check" | "practice" | "exam";

export type Difficulty = "recall" | "application" | "analysis";

export type ActionKind =
  | "study"
  | "check"
  | "practice"
  | "review"
  | "advance"
  | "exam";

export type NextAction = {
  kind: ActionKind;
  title: string;
  body: string;
  cta: string;
  topicId?: number;
  topicTitle?: string;
  count?: number;
};

export type SampleQuestion = {
  stem: string;
  choices: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  difficulty: Difficulty;
};

export type SampleChunk = {
  page: number;
  content: string;
};

export type SampleTopic = {
  title: string;
  summary: string;
  keyIdeas: string[];
  chunks: SampleChunk[];
  questions: SampleQuestion[];
};

export type SampleChapter = {
  title: string;
  topics: SampleTopic[];
};

export type SampleCourse = {
  code: string;
  title: string;
  sourceName: string;
  chapters: SampleChapter[];
};

export type TopicRow = {
  id: number;
  chapterId: number;
  position: number;
  title: string;
  summary: string;
  keyIdeas: string[];
  mastery: number | null;
  attempts: number;
  correct: number;
  lastAssessedAt: string | null;
};

export type ChapterRow = {
  id: number;
  position: number;
  title: string;
  topics: TopicRow[];
};

export type CourseCard = {
  id: number;
  code: string;
  title: string;
  sourceKind: SourceKind;
  sourceName: string | null;
  lastTopicTitle: string | null;
  lastStudiedAt: string | null;
  topicCount: number;
  exploredCount: number;
  openedCount: number;
  assessedCount: number;
  avgMastery: number | null;
};

export type MessageCitation = {
  chunkId: number;
  chunkUid?: string;
  documentId?: number | null;
  sourceName: string;
  sourceFormat?: "pdf" | "docx" | "pptx" | "markdown" | "txt" | null;
  page: number | null;
  heading: string | null;
  locatorType?: "page" | "slide" | "section" | "text" | null;
  locator: string;
  label: string;
  excerpt: string;
};

export type CourseWorkspace = {
  course: {
    id: number;
    code: string;
    title: string;
    sourceKind: SourceKind;
    sourceName: string | null;
    lastTopicId: number | null;
    lastStudiedAt: string | null;
    createdAt: string;
  };
  chapters: ChapterRow[];
  recommendation: NextAction;
  messages: Array<{
    id: number;
    role: "user" | "assistant";
    content: string;
    topicId: number | null;
    createdAt: string;
    citations: MessageCitation[];
  }>;
  readiness: ExamReadiness;
};

export type ExamReadiness = {
  label: "Not started" | "Developing" | "Almost ready" | "Exam ready";
  overall: number;
  exploredPct: number;
  assessedPct: number;
  strong: Array<{ id: number; title: string; mastery: number }>;
  needsAttention: Array<{ id: number; title: string; mastery: number | null }>;
  weakest: { id: number; title: string; mastery: number | null } | null;
};

export type QuizQuestion = {
  id: number;
  topicId: number;
  topicTitle: string;
  stem: string;
  choices: string[];
  difficulty: Difficulty;
  sourcePage: number | null;
  selectedIndex: number | null;
  correctIndex?: number;
  explanation?: string;
  isCorrect?: boolean;
};

export type QuizView = {
  sessionId: number;
  kind: QuizKind;
  status: "active" | "complete";
  questions: QuizQuestion[];
  score: number | null;
};
