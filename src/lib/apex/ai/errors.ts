import type { LlmErrorCategory } from "./types";

const PUBLIC_MESSAGE: Record<LlmErrorCategory, string> = {
  missing_key: "AI is not available in this environment",
  auth: "AI is temporarily unavailable",
  rate_limited: "The tutor is busy right now. Please try again in a moment.",
  rate_limited_local: "Too many study requests. Please wait a moment and try again.",
  timeout: "The tutor took too long to respond. Please try again.",
  provider_error: "The tutor is temporarily unavailable. Please try again.",
  malformed: "The tutor returned an unreadable response. Please try again.",
  model_error: "The tutor could not complete that request. Please try again.",
  unsupported_provider: "AI is not available in this environment",
};

export class LlmError extends Error {
  readonly category: LlmErrorCategory;
  readonly retryable: boolean;
  readonly retryAfterMs?: number;
  readonly status?: number;

  constructor(
    category: LlmErrorCategory,
    message: string,
    opts?: { retryable?: boolean; retryAfterMs?: number; status?: number },
  ) {
    super(message);
    this.name = "LlmError";
    this.category = category;
    this.retryable = opts?.retryable ?? retryableDefault(category);
    this.retryAfterMs = opts?.retryAfterMs;
    this.status = opts?.status;
  }
}

function retryableDefault(category: LlmErrorCategory): boolean {
  return category === "rate_limited" || category === "timeout" || category === "provider_error";
}

export function publicLlmMessage(err: unknown): string {
  if (err instanceof LlmError) return PUBLIC_MESSAGE[err.category];
  return PUBLIC_MESSAGE.provider_error;
}

export function errorCategory(err: unknown): LlmErrorCategory {
  if (err instanceof LlmError) return err.category;
  return "provider_error";
}
