import { UnavailableEmbeddingProvider } from "./unavailable";
import { XaiEmbeddingProvider } from "./xai";
import type { EmbeddingProvider } from "./provider";

let cached: EmbeddingProvider | null = null;

/**
 * Resolve the active embedding provider. Swap implementations here (or via
 * env) without rewriting retrieval. Never returns a fake/hash embedder.
 */
export function resolveEmbeddingProvider(): EmbeddingProvider {
  if (cached) return cached;
  if (process.env.XAI_API_KEY) {
    cached = new XaiEmbeddingProvider();
  } else {
    cached = new UnavailableEmbeddingProvider();
  }
  return cached;
}

export function resetEmbeddingProviderCache(): void {
  cached = null;
}
