import type { ScoreWeights } from "./types";

/** Chunk packing targets. Semantic boundaries take priority over these. */
export const CHUNKING = {
  targetChars: 850,
  minChars: 240,
  maxChars: 1400,
  overlapSentences: 1,
  maxChunksPerDocument: 280,
} as const;

/** Default hybrid weights. Semantic similarity is the primary signal. */
export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  semantic: 0.62,
  lexical: 0.18,
  hierarchy: 0.14,
  citation: 0.06,
};

/** When the embedding provider is down we drop semantic to 0 and renormalize. */
export const LEXICAL_FALLBACK_WEIGHTS: ScoreWeights = {
  semantic: 0,
  lexical: 0.72,
  hierarchy: 0.22,
  citation: 0.06,
};

export const RETRIEVAL_DEFAULTS = {
  limit: 6,
  candidateLimit: 24,
  tokenBudget: 1800,
} as const;

export const EMBEDDING_CONFIG = {
  /** Real xAI embedding model. Swap via XAI_EMBEDDING_MODEL without code changes. */
  defaultProvider: "xai",
  defaultModel: "grok-embedding-small",
  endpoint: "https://api.x.ai/v1/embeddings",
  batchSize: 64,
  timeoutMs: 20_000,
  /** After a billing/quota failure, skip embedding calls for this long. */
  cooldownMs: 60_000,
} as const;

export const HIERARCHY = {
  currentTopicBoost: 0.85,
  sameChapterBoost: 0.4,
  relatedTopicBoost: 0.12,
  otherCoursePenalty: 1, // we never retrieve outside the course
} as const;
