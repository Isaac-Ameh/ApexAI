import { loadAiConfig } from "./config";
import { errorCategory, LlmError, publicLlmMessage } from "./errors";
import { extractJsonObject, tryExtractJsonObject } from "./json";
import { getFallbackLlmProvider, getLlmProvider, hasLlm } from "./resolve.server";
import type { ChatMessage, GenerateResult, LLMRequest, LLMResponse, ModelPlan } from "./types";

export { extractJsonObject, tryExtractJsonObject, hasLlm };
export type { GenerateResult, ModelPlan };

const MAX_MESSAGES = 16;
const MAX_CONTENT_CHARS = 24_000;
const MAX_TOKENS = 4_096;
const MIN_TOKENS = 16;

type ChatTextOpts = {
  system: string;
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  maxTokens?: number;
  plan?: ModelPlan;
  feature?: string;
  userId?: string;
};

type ChatJsonOpts = {
  system: string;
  user: string;
  maxTokens?: number;
  plan?: ModelPlan;
  feature?: string;
  userId?: string;
};

/**
 * App-facing generation API. Tutor / quiz / course-map call this — never Groq.
 * `plan` is reserved for a future server-side subscription check; do not take it from the client.
 */
export async function chatText(opts: ChatTextOpts): Promise<GenerateResult> {
  const messages: ChatMessage[] = [
    { role: "system", content: clip(opts.system, MAX_CONTENT_CHARS) },
    ...sanitizeHistory(opts.messages),
  ];
  return generate({
    messages,
    maxTokens: opts.maxTokens ?? 900,
    json: false,
    temperature: 0.4,
    feature: opts.feature ?? "tutor",
    plan: opts.plan,
    userId: opts.userId,
  });
}

export async function chatJson(opts: ChatJsonOpts): Promise<GenerateResult> {
  const system = clip(opts.system, MAX_CONTENT_CHARS);
  const user = clip(opts.user, MAX_CONTENT_CHARS);
  const result = await generate({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    maxTokens: opts.maxTokens ?? 1800,
    json: true,
    temperature: 0.2,
    feature: opts.feature ?? "json",
    plan: opts.plan,
    userId: opts.userId,
  });
  if (!result.ok) return result;
  if (tryExtractJsonObject(result.text) == null) {
    logAi({
      feature: opts.feature ?? "json",
      ok: false,
      errorCategory: "malformed",
      latencyMs: 0,
    });
    return { ok: false, error: publicLlmMessage(new LlmError("malformed", "invalid json")) };
  }
  return result;
}

async function generate(opts: {
  messages: ChatMessage[];
  maxTokens?: number;
  json: boolean;
  temperature: number;
  feature: string;
  plan?: ModelPlan;
  userId?: string;
}): Promise<GenerateResult> {
  const requestId = crypto.randomUUID();
  const started = Date.now();
  try {
    assertRateLimit(opts.userId);
    const request: LLMRequest = {
      messages: opts.messages,
      maxTokens: clampTokens(opts.maxTokens),
      json: opts.json,
      temperature: opts.temperature,
      feature: opts.feature,
      requestId,
    };
    const provider = getLlmProvider({ plan: opts.plan });
    let response: LLMResponse;
    try {
      response = await provider.generateText(request);
    } catch (err) {
      const fallback = shouldFallback(err) ? getFallbackLlmProvider({ plan: opts.plan }) : null;
      if (!fallback) throw err;
      logAi({
        provider: provider.id,
        feature: opts.feature,
        requestId,
        ok: false,
        errorCategory: errorCategory(err),
        latencyMs: Date.now() - started,
        fallback: true,
      });
      response = await fallback.generateText(request);
    }
    logAi({
      provider: response.provider,
      model: response.model,
      feature: opts.feature,
      requestId: response.requestId,
      ok: true,
      latencyMs: response.latencyMs,
      promptTokens: response.usage?.promptTokens,
      completionTokens: response.usage?.completionTokens,
    });
    return { ok: true, text: response.text };
  } catch (err) {
    logAi({
      provider: loadAiConfig().provider,
      feature: opts.feature,
      requestId,
      ok: false,
      errorCategory: errorCategory(err),
      latencyMs: Date.now() - started,
    });
    return { ok: false, error: publicLlmMessage(err) };
  }
}

function shouldFallback(err: unknown): boolean {
  if (!(err instanceof LlmError)) return false;
  return err.retryable || err.category === "missing_key" || err.category === "auth";
}

function sanitizeHistory(
  messages: Array<{ role: string; content: string }>,
): ChatMessage[] {
  const allowed: ChatMessage["role"][] = ["user", "assistant", "system"];
  return messages
    .filter((m): m is ChatMessage => allowed.includes(m.role as ChatMessage["role"]) && typeof m.content === "string")
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: clip(m.content, MAX_CONTENT_CHARS) }));
}

function clip(value: string, max: number): string {
  return (value ?? "").slice(0, max);
}

function clampTokens(n?: number): number {
  if (n == null || !Number.isFinite(n)) return 900;
  return Math.min(MAX_TOKENS, Math.max(MIN_TOKENS, Math.round(n)));
}

const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_MAX = 40;
const hits = new Map<string, number[]>();

export function resetLlmRateLimit(): void {
  hits.clear();
}

function assertRateLimit(userId?: string): void {
  if (!userId) return;
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    throw new LlmError("rate_limited_local", "local rate limit");
  }
  recent.push(now);
  hits.set(userId, recent);
}

function logAi(fields: {
  provider?: string;
  model?: string;
  feature?: string;
  requestId?: string;
  ok: boolean;
  latencyMs: number;
  errorCategory?: string;
  promptTokens?: number;
  completionTokens?: number;
  fallback?: boolean;
}): void {
  // Never log prompts, documents, API keys, or Authorization headers.
  console.info(
    "[apex-ai]",
    JSON.stringify({
      provider: fields.provider,
      model: fields.model,
      feature: fields.feature,
      requestId: fields.requestId,
      ok: fields.ok,
      latencyMs: fields.latencyMs,
      errorCategory: fields.errorCategory,
      promptTokens: fields.promptTokens,
      completionTokens: fields.completionTokens,
      fallback: fields.fallback,
    }),
  );
}
