export { retrieveForCourse, selectedChunks } from "./pipeline";
export { formatContext, formatEvidenceContext, formatCitationLine, citationLabel, toCitation, toEvidence } from "./citations";
export { chunkSourceText, assignChunksToTopics, splitPages } from "./chunking";
export { indexCourseMaterial, ensureCourseEmbeddings } from "./indexer";
export { understandQuery } from "./query-understanding";
export { lexicalRetrieve } from "./lexical";
export { resolveEmbeddingProvider } from "./embeddings/resolve";
export { PostgresVectorStore } from "./store/postgres";
export { MemoryVectorStore } from "./store/memory";
export { DiversityReranker } from "./rerank";
export { DEFAULT_SCORE_WEIGHTS, LEXICAL_FALLBACK_WEIGHTS } from "./config";

export type {
  Chunk,
  ChunkEmbedding,
  EmbeddingVector,
  RetrievalQuery,
  RetrievalCandidate,
  RetrievalResult,
  RetrievalOptions,
  SourceCitation,
  SourceDocument,
  UnderstoodQuery,
  RetrievalMode,
  Evidence,
  EvidenceStatus,
} from "./types";
