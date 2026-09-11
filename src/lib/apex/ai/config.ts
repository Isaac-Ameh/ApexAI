import type { AiConfig, ModelPlan } from "./types";

/** Current Groq production chat models (free/dev vs higher-quality). */
export const GROQ_DEFAULT_FREE_MODEL = "openai/gpt-oss-20b";
export const GROQ_DEFAULT_PAID_MODEL = "openai/gpt-oss-120b";

export const REGISTERED_PROVIDERS = ["groq"] as const;
export type RegisteredProvider = (typeof REGISTERED_PROVIDERS)[number];

function read(key: string): string | undefined {
  const v = process.env[key]?.trim();
  return v || undefined;
}

function intEnv(key: string, fallback: number, min: number, max: number): number {
  const raw = read(key);
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/**
 * Central LLM configuration. Model IDs live here (and env), not in feature code.
 * Client requests must never supply these values.
 */
export function loadAiConfig(): AiConfig {
  return {
    provider: (read("AI_PROVIDER") ?? "groq").toLowerCase(),
    fallbackProvider: read("AI_FALLBACK_PROVIDER")?.toLowerCase() ?? null,
    freeModel: read("AI_FREE_MODEL") ?? GROQ_DEFAULT_FREE_MODEL,
    paidModel: read("AI_PAID_MODEL") ?? read("AI_FREE_MODEL") ?? GROQ_DEFAULT_PAID_MODEL,
    timeoutMs: intEnv("AI_TIMEOUT_MS", 25_000, 3_000, 120_000),
    retryBaseMs: intEnv("AI_RETRY_BASE_MS", 400, 0, 10_000),
    maxRetries: intEnv("AI_MAX_RETRIES", 2, 0, 4),
  };
}

export function isRegisteredProvider(id: string): id is RegisteredProvider {
  return (REGISTERED_PROVIDERS as readonly string[]).includes(id);
}

export function modelForPlan(plan: ModelPlan = "free"): string {
  const cfg = loadAiConfig();
  return plan === "paid" ? cfg.paidModel : cfg.freeModel;
}

export function groqApiKey(): string | undefined {
  return read("GROQ_API_KEY");
}
