import type { EmbeddingVector } from "../types";

export type EmbedPurpose = "document" | "query";

export type EmbedRequest = {
  texts: string[];
  purpose: EmbedPurpose;
};

export type EmbedResult = {
  provider: string;
  model: string;
  dimensions: number;
  vectors: number[][];
};

/**
 * Provider-agnostic embedding interface.
 * Production uses the xAI implementation. A later OpenAI/Voyage/pgvector-side
 * embedder can implement this without touching the pipeline.
 *
 * Implementations MUST call a real embedding model. Keyword hashes, random
 * vectors, and bag-of-words sketches are not embeddings and must not appear here.
 */
export interface EmbeddingProvider {
  readonly id: string;
  readonly model: string;
  available(): Promise<boolean>;
  embed(request: EmbedRequest): Promise<EmbedResult>;
}

export function toEmbeddingVector(result: EmbedResult, index: number): EmbeddingVector {
  const values = result.vectors[index] ?? [];
  return {
    provider: result.provider,
    model: result.model,
    dimensions: values.length || result.dimensions,
    values,
  };
}
