import type { Sql } from "@/lib/db";
import { cosineSimilarity } from "../math";
import type { ChunkEmbedding, EmbeddingVector } from "../types";
import type { VectorScope, VectorHit, VectorStore } from "./vector-store";

function parseVector(raw: string): number[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.map(Number).filter((n) => Number.isFinite(n)) : [];
  } catch {
    return [];
  }
}

/**
 * Database-backed vector store. Vectors live in `chunk_embeddings.vector_json`
 * so we don't depend on pgvector (unavailable in the PGLite preview).
 * Course-scale brute-force cosine is the intended first search; replace this
 * class when a managed ANN index is ready.
 */
export class PostgresVectorStore implements VectorStore {
  readonly id = "postgres-json";
  constructor(private readonly sql: Sql) {}

  async upsert(scope: VectorScope, records: ChunkEmbedding[]): Promise<void> {
    for (const rec of records) {
      if (!rec.embedding.values.length) continue;
      await this.sql`
        insert into chunk_embeddings (
          chunk_id, user_id, course_id, provider, model, dimensions, vector_json
        ) values (
          ${rec.chunkId}, ${scope.userId}, ${scope.courseId},
          ${rec.embedding.provider}, ${rec.embedding.model},
          ${rec.embedding.dimensions}, ${JSON.stringify(rec.embedding.values)}
        )
        on conflict (chunk_id, provider, model)
        do update set
          dimensions = excluded.dimensions,
          vector_json = excluded.vector_json,
          created_at = now()
      `;
    }
  }

  async loadEmbeddings(scope: VectorScope): Promise<Map<number, EmbeddingVector>> {
    const rows = await this.sql<{
      chunk_id: number;
      provider: string;
      model: string;
      dimensions: number;
      vector_json: string;
    }>`
      select chunk_id, provider, model, dimensions, vector_json
      from chunk_embeddings
      where user_id = ${scope.userId} and course_id = ${scope.courseId}
    `;
    const map = new Map<number, EmbeddingVector>();
    for (const row of rows) {
      const values = parseVector(row.vector_json);
      if (!values.length) continue;
      map.set(row.chunk_id, {
        provider: row.provider,
        model: row.model,
        dimensions: values.length,
        values,
      });
    }
    return map;
  }

  async search(
    scope: VectorScope,
    query: EmbeddingVector,
    limit: number,
  ): Promise<VectorHit[]> {
    const embeddings = await this.loadEmbeddings(scope);
    const hits: VectorHit[] = [];
    for (const [chunkId, embedding] of embeddings) {
      if (embedding.model !== query.model || embedding.dimensions !== query.dimensions) {
        continue;
      }
      const score = cosineSimilarity(query.values, embedding.values);
      if (score > 0) hits.push({ chunkId, score });
    }
    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, limit);
  }

  async embeddedCount(scope: VectorScope): Promise<number> {
    const rows = await this.sql<{ n: number }>`
      select count(*)::int as n from chunk_embeddings
      where user_id = ${scope.userId} and course_id = ${scope.courseId}
    `;
    return rows[0]?.n ?? 0;
  }
}
