import type { EmbeddingProvider } from "./embeddings/provider";
import type { VectorStore } from "./store/vector-store";
import { EmbeddingProviderError, type EmbeddingVector } from "./types";

export type SemanticHit = {
  chunkId: number;
  score: number;
};

/**
 * Semantic / vector retrieval. Requires a real embedding of the query and
 * stored chunk vectors. Callers must not substitute lexical scores here.
 */
export async function semanticRetrieve(opts: {
  provider: EmbeddingProvider;
  store: VectorStore;
  userId: string;
  courseId: number;
  queryText: string;
  limit: number;
}): Promise<{ hits: SemanticHit[]; queryEmbedding: EmbeddingVector }> {
  const available = await opts.provider.available();
  if (!available) {
    throw new EmbeddingProviderError(
      "Embedding provider is not available",
      "unavailable",
      true,
    );
  }
  const embedded = await opts.provider.embed({
    texts: [opts.queryText],
    purpose: "query",
  });
  const values = embedded.vectors[0];
  if (!values?.length) {
    throw new EmbeddingProviderError("Query embedding was empty", "malformed", true);
  }
  const queryEmbedding: EmbeddingVector = {
    provider: embedded.provider,
    model: embedded.model,
    dimensions: embedded.dimensions,
    values,
  };
  const hits = await opts.store.search(
    { userId: opts.userId, courseId: opts.courseId },
    queryEmbedding,
    opts.limit,
  );
  return { hits, queryEmbedding };
}
