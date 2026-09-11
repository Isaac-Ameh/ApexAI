import { LlmError } from "../errors";
import type { LLMProvider } from "../provider";
import type { LLMRequest, LLMResponse, LLMUsage } from "../types";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

export type GroqProviderOptions = {
  apiKey: string;
  defaultModel: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxRetries?: number;
  retryBaseMs?: number;
};

/**
 * Official Groq Chat Completions API (OpenAI-compatible).
 * The rest of ApexStudy must not import this module — only the AI factory.
 */
export class GroqProvider implements LLMProvider {
  readonly id = "groq";
  private readonly apiKey: string;
  private readonly defaultModel: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryBaseMs: number;

  constructor(options: GroqProviderOptions) {
    this.apiKey = options.apiKey;
    this.defaultModel = options.defaultModel;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 25_000;
    this.maxRetries = options.maxRetries ?? 2;
    this.retryBaseMs = options.retryBaseMs ?? 400;
  }

  async generateText(request: LLMRequest): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new LlmError("missing_key", "missing Groq API key");
    }
    const model = request.model ?? this.defaultModel;
    const requestId = request.requestId ?? newRequestId();
    const started = Date.now();
    const attempts = this.maxRetries + 1;
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const result = await this.once(request, model, requestId);
        return { ...result, latencyMs: Date.now() - started, requestId };
      } catch (err) {
        lastError = err;
        const retryable = err instanceof LlmError && err.retryable && attempt < attempts;
        if (!retryable) break;
        const waitMs = backoffMs(this.retryBaseMs, attempt, err.retryAfterMs);
        await sleep(waitMs);
      }
    }

    throw lastError instanceof LlmError
      ? lastError
      : new LlmError("provider_error", "Groq request failed");
  }

  private async once(
    request: LLMRequest,
    model: string,
    requestId: string,
  ): Promise<Omit<LLMResponse, "latencyMs" | "requestId"> & { requestId: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let res: Response;
    try {
      res = await this.fetchImpl(GROQ_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "X-Request-Id": requestId,
        },
        body: JSON.stringify(groqBody(request, model)),
        signal: controller.signal,
      });
    } catch (err) {
      const aborted = err instanceof Error && err.name === "AbortError";
      throw new LlmError(aborted ? "timeout" : "provider_error", aborted ? "Groq timeout" : "Groq network error", {
        retryable: true,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      throw await groqHttpError(res);
    }

    let body: GroqChatResponse;
    try {
      body = (await res.json()) as GroqChatResponse;
    } catch {
      throw new LlmError("malformed", "Groq returned a non-JSON body");
    }

    const text = messageText(body.choices?.[0]?.message?.content);
    if (!text) {
      throw new LlmError("malformed", "Groq returned an empty completion");
    }

    return {
      text,
      model: body.model ?? model,
      provider: this.id,
      usage: usageFrom(body.usage),
      requestId,
    };
  }
}

type GroqChatResponse = {
  model?: string;
  choices?: Array<{ message?: { content?: unknown } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

function groqBody(request: LLMRequest, model: string): Record<string, unknown> {
  const messages = request.messages.map((m) => ({ role: m.role, content: m.content }));
  const body: Record<string, unknown> = {
    model,
    temperature: request.temperature ?? (request.json ? 0.2 : 0.4),
    max_completion_tokens: request.maxTokens ?? (request.json ? 1800 : 900),
    messages,
  };
  if (request.json) {
    body.response_format = { type: "json_object" };
  }
  return body;
}

function messageText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: unknown }).text ?? "");
        }
        return "";
      })
      .join("");
  }
  return "";
}

function usageFrom(usage: GroqChatResponse["usage"]): LLMUsage | undefined {
  if (!usage) return undefined;
  return {
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
  };
}

async function groqHttpError(res: Response): Promise<LlmError> {
  const retryAfterMs = parseRetryAfter(res.headers.get("retry-after"));
  if (res.status === 401 || res.status === 403) {
    return new LlmError("auth", `Groq auth ${res.status}`, { status: res.status });
  }
  if (res.status === 429) {
    return new LlmError("rate_limited", "Groq rate limited", {
      status: 429,
      retryable: true,
      retryAfterMs,
    });
  }
  if (res.status === 408) {
    return new LlmError("timeout", "Groq request timed out", { status: 408, retryable: true });
  }
  if (res.status >= 500) {
    return new LlmError("provider_error", `Groq HTTP ${res.status}`, {
      status: res.status,
      retryable: true,
    });
  }
  if (res.status === 400) {
    return new LlmError("model_error", "Groq rejected the request", { status: 400 });
  }
  return new LlmError("provider_error", `Groq HTTP ${res.status}`, { status: res.status });
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(30_000, seconds * 1000);
  return undefined;
}

function backoffMs(base: number, attempt: number, retryAfterMs?: number): number {
  if (retryAfterMs && retryAfterMs > 0) return Math.min(retryAfterMs, 30_000);
  if (base <= 0) return 0;
  const exp = Math.min(8_000, base * 2 ** (attempt - 1));
  const jitter = Math.floor(Math.random() * Math.max(1, base));
  return exp + jitter;
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function newRequestId(): string {
  return crypto.randomUUID();
}

