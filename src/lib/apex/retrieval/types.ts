/** Strongly typed retrieval objects. Kept here so the rest of ApexStudy
 *  consumes a stable contract rather than a bag of ad-hoc chunk fields. */
import type { BlockType, LocatorType, SourceFormat, SourceLocator } from "../inject";

export type SourceKind = "sample" | "upload" | "paste";

export type RetrievalMode = "hybrid" | "semantic" | "lexical-fallback";

export type QueryIntent =
  | "explain"
  | "define"
  | "compare"
  | "example"
  | "why"
  | "how"
  | "review"
  | "other";

export type SourceDocument = {
  id: number;
  courseId: number;
  kind: SourceKind;
  name: string;
  pageCount: number | null;
};

export type Chunk = {
  id: number;
  uid: string;
  courseId: number;
  documentId: number | null;
  chapterId: number | null;
  topicId: number | null;
  page: number | null;
  /** Canonical source position, persisted as JSON for every new normalized chunk. */
  locator: SourceLocator | null;
  /** Stable within its document; `(documentId, blockOrder)` identifies the source block. */
  blockOrder: number | null;
  blockType: BlockType | null;
  heading: string | null;
  chunkIndex: number;
  content: string;
  tokenEstimate: number;
  topicTitle: string | null;
  chapterTitle: string | null;
  sourceName: string | null;
  sourceFormat: SourceFormat | null;
};

export type EmbeddingVector = {
  provider: string;
  model: string;
  dimensions: number;
  values: number[];
};

export type ChunkEmbedding = {
  chunkId: number;
  embedding: EmbeddingVector;
};

export type RetrievalQuery = {
  text: string;
  courseId: number;
  userId: string;
  topicId?: number | null;
  chapterId?: number | null;
};

export type RetrievalOptions = {
  topicId?: number | null;
  chapterId?: number | null;
  topicTitle?: string | null;
  chapterTitle?: string | null;
  keyIdeas?: string[];
  courseTitle?: string | null;
  sourceName?: string | null;
  /** Prefer current topic without dropping related chapters/topics. */
  preferCurrentTopic?: boolean;
  /** If true, only return chunks from the current topic. Default false. */
  strictTopic?: boolean;
  limit?: number;
  candidateLimit?: number;
  tokenBudget?: number;
  /**
   * auto: semantic/hybrid when real embeddings exist, else lexical fallback.
   * semantic: fail closed to lexical-fallback if vectors are missing (never fakes them).
   * hybrid: semantic + lexical + hierarchy.
   * lexical: skip embeddings on purpose (tests / explicit fallback).
   */
  mode?: "auto" | "semantic" | "hybrid" | "lexical";
};

export type ScoreWeights = {
  semantic: number;
  lexical: number;
  hierarchy: number;
  citation: number;
};

export type ScoreParts = {
  semantic: number | null;
  lexical: number;
  hierarchy: number;
  citation: number;
  combined: number;
  rerank: number;
};

export type RetrievalCandidate = {
  chunk: Chunk;
  scores: ScoreParts;
  reasons: string[];
};

export type EvidenceStatus = "candidate" | "used";

/** Source material with enough provenance to trace it back to its stored chunk. */
export type Evidence = {
  status: EvidenceStatus;
  chunkId: number;
  chunkUid: string;
  documentId: number | null;
  courseId: number;
  sourceName: string;
  sourceFormat: SourceFormat | null;
  locator: SourceLocator | null;
  locatorType: LocatorType | null;
  locatorValue: string | number | null;
  heading: string | null;
  topicTitle: string | null;
  chapterTitle: string | null;
  text: string;
  scores: ScoreParts;
  reasons: string[];
};

export type SourceCitation = {
  chunkId: number;
  chunkUid: string;
  documentId: number | null;
  sourceName: string;
  sourceFormat: SourceFormat | null;
  page: number | null;
  heading: string | null;
  topicTitle: string | null;
  chapterTitle: string | null;
  locatorType: LocatorType | null;
  locator: string;
  label: string;
  excerpt: string;
};

export type UnderstoodQuery = {
  original: string;
  rewritten: string;
  intent: QueryIntent;
  keywords: string[];
  expandToRelated: boolean;
  focus: {
    courseId: number;
    chapterId: number | null;
    topicId: number | null;
  };
};

export type RetrievalDiagnostics = {
  embeddingProvider: string | null;
  embeddingModel: string | null;
  vectorStore: string;
  totalChunkCount: number;
  embeddedChunkCount: number;
  candidateCount: number;
  fallbackReason?: string;
};

export type RetrievalResult = {
  mode: RetrievalMode;
  query: UnderstoodQuery;
  candidates: RetrievalCandidate[];
  selected: RetrievalCandidate[];
  evidenceCandidates: Evidence[];
  evidence: Evidence[];
  citations: SourceCitation[];
  context: string;
  diagnostics: RetrievalDiagnostics;
};

export type ChunkDraft = {
  content: string;
  page: number | null;
  heading: string | null;
  chunkIndex: number;
  tokenEstimate: number;
};

export type NormalizedChunkDraft = {
  content: string;
  heading: string | null;
  locator: SourceLocator;
  blockOrder: number;
  blockType: BlockType;
  chunkIndex: number;
  tokenEstimate: number;
};

export type AssignedChunk = {
  topicIndex: number;
  page: number | null;
  heading: string | null;
  content: string;
  chunkIndex: number;
  tokenEstimate: number;
};

export type AssignedNormalizedChunk = NormalizedChunkDraft & {
  /** Null means the lexical evidence did not meet the assignment threshold. */
  topicIndex: number | null;
};

export class EmbeddingProviderError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  constructor(message: string, code = "provider_error", retryable = false) {
    super(message);
    this.name = "EmbeddingProviderError";
    this.code = code;
    this.retryable = retryable;
  }
}
