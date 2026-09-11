import { groqApiKey, isRegisteredProvider, loadAiConfig, modelForPlan } from "./config";
import { LlmError } from "./errors";
import type { LLMProvider } from "./provider";
import { GroqProvider } from "./providers/groq.server";
import type { ModelPlan } from "./types";

/**
 * Provider registry. Add Gemini/OpenAI here later — feature code stays unchanged.
 *
 *   groq: implemented
 *   gemini: not registered
 *   openai: not registered
 */
function createProvider(id: string, model: string): LLMProvider {
  if (id === "groq") {
    const apiKey = groqApiKey();
    if (!apiKey) throw new LlmError("missing_key", "GROQ_API_KEY is not set");
    const cfg = loadAiConfig();
    return new GroqProvider({
      apiKey,
      defaultModel: model,
      timeoutMs: cfg.timeoutMs,
      maxRetries: cfg.maxRetries,
      retryBaseMs: cfg.retryBaseMs,
    });
  }
  throw new LlmError("unsupported_provider", `No implementation for provider '${id}'`);
}

/**
 * Resolve the generation provider for a plan/tier.
 * `plan` is a server-side value (future: user.plan). It is never read from the client.
 */
export function getLlmProvider(opts?: { plan?: ModelPlan }): LLMProvider {
  const cfg = loadAiConfig();
  const id = cfg.provider;
  if (!isRegisteredProvider(id)) {
    throw new LlmError("unsupported_provider", `Unknown AI_PROVIDER '${id}'`);
  }
  return createProvider(id, modelForPlan(opts?.plan ?? "free"));
}

/** Only used when AI_FALLBACK_PROVIDER names a *registered* second provider. */
export function getFallbackLlmProvider(opts?: { plan?: ModelPlan }): LLMProvider | null {
  const cfg = loadAiConfig();
  const id = cfg.fallbackProvider;
  if (!id || id === cfg.provider) return null;
  if (!isRegisteredProvider(id)) return null;
  try {
    return createProvider(id, modelForPlan(opts?.plan ?? "free"));
  } catch {
    return null;
  }
}

export function hasLlm(): boolean {
  const cfg = loadAiConfig();
  if (cfg.provider === "groq") return Boolean(groqApiKey());
  return false;
}
