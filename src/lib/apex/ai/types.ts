/** Server-side LLM contracts. Callers never send provider/model from the client. */

export type ModelPlan = "free" | "paid";

export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type LlmErrorCategory =
  | "missing_key"
  | "auth"
  | "rate_limited"
  | "timeout"
  | "provider_error"
  | "malformed"
  | "model_error"
  | "unsupported_provider"
  | "rate_limited_local";

export type LLMRequest = {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
  /** Set only by the server factory from env/plan — never from a client payload. */
  model?: string;
  feature?: string;
  requestId?: string;
};

export type LLMUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type LLMResponse = {
  text: string;
  model: string;
  provider: string;
  usage?: LLMUsage;
  latencyMs: number;
  requestId: string;
};

export type GenerateResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export type AiConfig = {
  provider: string;
  fallbackProvider: string | null;
  freeModel: string;
  paidModel: string;
  timeoutMs: number;
  retryBaseMs: number;
  maxRetries: number;
};
