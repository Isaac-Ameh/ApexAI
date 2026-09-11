import type { LLMRequest, LLMResponse, ModelPlan } from "./types";

/**
 * Generation-only LLM port. Retrieval, chunking, and embeddings stay outside.
 *
 * To add Gemini or OpenAI later:
 *   1. Implement this interface under `providers/<name>/`
 *   2. Register it in `resolve.server.ts`
 *   3. Set AI_PROVIDER (and optional AI_FALLBACK_PROVIDER)
 * ApexStudy features (tutor, quiz, course map) keep calling `chatJson` / `chatText`.
 */
export interface LLMProvider {
  readonly id: string;
  generateText(request: LLMRequest): Promise<LLMResponse>;
}

export type ProviderFactory = (opts: { model: string; plan: ModelPlan }) => LLMProvider;
