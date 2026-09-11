import type { ChunkEmbedding, EmbeddingVector } from "../types";


export type VectorScope = {
  userId: string;
  courseId: number;
};

export type VectorHit = {
  chunkId: number;
  score: number;
};

/**
 * Vector store contract. The first implementation is Postgres + JSON vectors
 * with in-process cosine search (works on PGLite and Neon). A later pgvector,
 * Pinecone, or xAI Collections store can implement this without pipeline changes.
 */
export interface VectorStore {
  readonly id: string;
  upsert(scope: VectorScope, records: ChunkEmbedding[]): Promise<void>;
  search(
    scope: VectorScope,
    query: EmbeddingVector,
    limit: number,
  ): Promise<VectorHit[]>;
  loadEmbeddings(scope: VectorScope): Promise<Map<number, EmbeddingVector>>;
  embeddedCount(scope: VectorScope): Promise<number>;
}
