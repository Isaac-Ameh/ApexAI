import { EMBEDDING_CONFIG } from "../config";
import { EmbeddingProviderError } from "../types";
import type { EmbedRequest, EmbedResult, EmbeddingProvider } from "./provider";

type Cooldown = { until: number; reason: string };

let cooldown: Cooldown | null = null;

function modelName(): string {
  return process.env.XAI_EMBEDDING_MODEL?.trim() || EMBEDDING_CONFIG.defaultModel;
}

function inCooldown(): string | null {
  if (!cooldown) return null;
  if (Date.now() >= cooldown.until) {
    cooldown = null;
    return null;
  }
  return cooldown.reason;
}

function startCooldown(reason: string): void {
  cooldown = { until: Date.now() + EMBEDDING_CONFIG.cooldownMs, reason };
}

/**
 * Real xAI embeddings via POST /v1/embeddings.
 * If the key is missing or the provider rejects the call, this class does not
 * invent vectors — it reports unavailable / throws EmbeddingProviderError.
 */
export class XaiEmbeddingProvider implements EmbeddingProvider {
  readonly id = "xai";
  get model(): string {
    return modelName();
  }

  async available(): Promise<boolean> {
    if (!process.env.XAI_API_KEY) return false;
    return inCooldown() == null;
  }

  async embed(request: EmbedRequest): Promise<EmbedResult> {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      throw new EmbeddingProviderError(
        "No XAI_API_KEY — cannot create embeddings",
        "missing_key",
        false,
      );
    }
    const cooled = inCooldown();
    if (cooled) {
      throw new EmbeddingProviderError(
        `Embedding provider cooling down: ${cooled}`,
        "cooldown",
        true,
      );
    }
    const texts = request.texts.map((t) => t.slice(0, 8000)).filter((t) => t.trim());
    if (!texts.length) {
      return { provider: this.id, model: this.model, dimensions: 0, vectors: [] };
    }

    const batches: number[][] = [];
    let dimensions = 0;
    let usedModel = this.model;

    for (let i = 0; i < texts.length; i += EMBEDDING_CONFIG.batchSize) {
      const slice = texts.slice(i, i + EMBEDDING_CONFIG.batchSize);
      const part = await embedOnce(apiKey, usedModel, slice);
      usedModel = part.model;
      dimensions = part.dimensions;
      batches.push(...part.vectors);
    }

    return {
      provider: this.id,
      model: usedModel,
      dimensions,
      vectors: batches,
    };
  }
}

async function embedOnce(
  apiKey: string,
  model: string,
  input: string[],
): Promise<EmbedResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EMBEDDING_CONFIG.timeoutMs);
  let res: Response;
  try {
    res = await fetch(EMBEDDING_CONFIG.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, input }),
      signal: controller.signal,
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    throw new EmbeddingProviderError(
      aborted ? "Embedding request timed out" : "Embedding request failed to send",
      aborted ? "timeout" : "network",
      true,
    );
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 402 || res.status === 429) {
    const body = await res.text().catch(() => "");
    startCooldown(`http_${res.status}`);
    throw new EmbeddingProviderError(
      `Embedding provider unavailable (${res.status}): ${body.slice(0, 180)}`,
      res.status === 402 ? "quota" : "rate_limited",
      true,
    );
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new EmbeddingProviderError(
      `xAI embeddings error ${res.status}: ${body.slice(0, 180)}`,
      `http_${res.status}`,
      res.status >= 500,
    );
  }

  const json = (await res.json()) as {
    model?: string;
    data?: Array<{ embedding?: number[]; index?: number }>;
  };
  const rows = [...(json.data ?? [])].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  const vectors = rows.map((row) => row.embedding ?? []);
  if (vectors.some((v) => !v.length) || vectors.length !== input.length) {
    throw new EmbeddingProviderError(
      "Embedding provider returned an incomplete vector set",
      "malformed",
      true,
    );
  }
  return {
    provider: "xai",
    model: json.model ?? model,
    dimensions: vectors[0]?.length ?? 0,
    vectors,
  };
}
