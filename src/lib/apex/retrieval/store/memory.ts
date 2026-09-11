import { cosineSimilarity } from "../math";
import type { ChunkEmbedding, EmbeddingVector } from "../types";
import type { VectorHit, VectorScope, VectorStore } from "./vector-store";

/** In-memory store for tests and local experiments. Same contract as Postgres. */
export class MemoryVectorStore implements VectorStore {
  readonly id = "memory";
  private readonly data = new Map<string, Map<number, EmbeddingVector>>();

  private bucket(scope: VectorScope): Map<number, EmbeddingVector> {
    const key = `${scope.userId}:${scope.courseId}`;
    let map = this.data.get(key);
    if (!map) {
      map = new Map();
      this.data.set(key, map);
    }
    return map;
  }

  async upsert(scope: VectorScope, records: ChunkEmbedding[]): Promise<void> {
    const bucket = this.bucket(scope);
    for (const rec of records) bucket.set(rec.chunkId, rec.embedding);
  }

  async loadEmbeddings(scope: VectorScope): Promise<Map<number, EmbeddingVector>> {
    return new Map(this.bucket(scope));
  }

  async search(scope: VectorScope, query: EmbeddingVector, limit: number): Promise<VectorHit[]> {
    const embeddings = await this.loadEmbeddings(scope);
    const hits: VectorHit[] = [];
    for (const [chunkId, embedding] of embeddings) {
      const score = cosineSimilarity(query.values, embedding.values);
      if (score > 0) hits.push({ chunkId, score });
    }
    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, limit);
  }

  async embeddedCount(scope: VectorScope): Promise<number> {
    return this.bucket(scope).size;
  }
}
