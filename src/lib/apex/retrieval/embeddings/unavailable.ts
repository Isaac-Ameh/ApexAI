import { EmbeddingProviderError } from "../types";
import type { EmbedRequest, EmbedResult, EmbeddingProvider } from "./provider";

/**
 * Explicit stand-in used when no embedding credentials exist.
 * It never returns vectors. The pipeline must take the lexical fallback path.
 */
export class UnavailableEmbeddingProvider implements EmbeddingProvider {
  readonly id = "unavailable";
  readonly model = "none";

  async available(): Promise<boolean> {
    return false;
  }

  async embed(_request: EmbedRequest): Promise<EmbedResult> {
    throw new EmbeddingProviderError(
      "No embedding provider is configured",
      "unavailable",
      false,
    );
  }
}
