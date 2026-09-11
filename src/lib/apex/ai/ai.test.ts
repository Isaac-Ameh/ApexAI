import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { GROQ_DEFAULT_FREE_MODEL, GROQ_DEFAULT_PAID_MODEL, loadAiConfig, modelForPlan } from "./config.ts";
import { LlmError, publicLlmMessage } from "./errors.ts";
import { extractJsonObject, tryExtractJsonObject } from "./json.ts";
import { GroqProvider } from "./providers/groq.server.ts";
import { getFallbackLlmProvider, getLlmProvider, hasLlm } from "./resolve.server.ts";
import { chatJson, chatText, resetLlmRateLimit } from "./service.server.ts";

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_FETCH = globalThis.fetch;

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  globalThis.fetch = ORIGINAL_FETCH;
  resetLlmRateLimit();
});

function groqOk(content: string, model = "openai/gpt-oss-20b"): Response {
  return new Response(
    JSON.stringify({
      model,
      choices: [{ message: { content } }],
      usage: { prompt_tokens: 11, completion_tokens: 7, total_tokens: 18 },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function groqStatus(status: number, body: unknown, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

describe("config", () => {
  it("defaults to groq and current production model ids", () => {
    delete process.env.AI_PROVIDER;
    delete process.env.AI_FREE_MODEL;
    delete process.env.AI_PAID_MODEL;
    const cfg = loadAiConfig();
    assert.equal(cfg.provider, "groq");
    assert.equal(cfg.freeModel, GROQ_DEFAULT_FREE_MODEL);
    assert.equal(cfg.paidModel, GROQ_DEFAULT_PAID_MODEL);
    assert.equal(modelForPlan("free"), GROQ_DEFAULT_FREE_MODEL);
    assert.equal(modelForPlan("paid"), GROQ_DEFAULT_PAID_MODEL);
  });

  it("reads model names from env instead of scattering them", () => {
    process.env.AI_FREE_MODEL = "openai/gpt-oss-20b";
    process.env.AI_PAID_MODEL = "openai/gpt-oss-120b";
    assert.equal(modelForPlan("free"), "openai/gpt-oss-20b");
    assert.equal(modelForPlan("paid"), "openai/gpt-oss-120b");
  });
});

describe("json extraction", () => {
  it("parses fenced and raw objects and rejects garbage", () => {
    assert.deepEqual(extractJsonObject('```json\n{"a":1}\n```'), { a: 1 });
    assert.deepEqual(tryExtractJsonObject("not json"), null);
    assert.throws(() => extractJsonObject("nope"));
  });
});

describe("GroqProvider", () => {
  it("sends retrieved context through unchanged (generation-only)", async () => {
    const captured: { url?: string; headers?: Headers; body?: Record<string, unknown> } = {};
    const provider = new GroqProvider({
      apiKey: "gsk_test_not_real",
      defaultModel: "openai/gpt-oss-20b",
      maxRetries: 0,
      fetchImpl: async (input, init) => {
        captured.url = String(input);
        captured.headers = new Headers(init?.headers);
        captured.body = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return groqOk("Grounded answer [Source — p. 17]");
      },
    });
    const rag = "RETRIEVED SOURCE (hybrid):\n[Source — p. 17] A computer is an electronic device.";
    const res = await provider.generateText({
      messages: [
        { role: "system", content: `Teach ONLY from excerpts.\n${rag}` },
        { role: "user", content: "What is a computer?" },
      ],
      feature: "tutor",
    });
    assert.equal(res.provider, "groq");
    assert.ok(res.text.includes("[Source — p. 17]"));
    assert.equal(captured.url, "https://api.groq.com/openai/v1/chat/completions");
    assert.equal(captured.headers?.get("Authorization"), "Bearer gsk_test_not_real");
    const messages = captured.body?.messages as Array<{ role: string; content: string }>;
    assert.ok(messages[0]?.content.includes("[Source — p. 17] A computer is an electronic device."));
    assert.equal(captured.body?.model, "openai/gpt-oss-20b");
  });

  it("retries rate limits then succeeds", async () => {
    let calls = 0;
    const provider = new GroqProvider({
      apiKey: "gsk_test_not_real",
      defaultModel: "openai/gpt-oss-20b",
      maxRetries: 2,
      retryBaseMs: 0,
      fetchImpl: async () => {
        calls += 1;
        if (calls < 3) {
          return groqStatus(429, { error: { message: "rate" } }, { "retry-after": "0" });
        }
        return groqOk("ok after retry");
      },
    });
    const res = await provider.generateText({
      messages: [{ role: "user", content: "hi" }],
    });
    assert.equal(calls, 3);
    assert.equal(res.text, "ok after retry");
  });

  it("does not retry auth failures", async () => {
    let calls = 0;
    const provider = new GroqProvider({
      apiKey: "gsk_test_not_real",
      defaultModel: "openai/gpt-oss-20b",
      maxRetries: 2,
      retryBaseMs: 0,
      fetchImpl: async () => {
        calls += 1;
        return groqStatus(401, { error: { message: "Invalid API Key gsk_test_not_real" } });
      },
    });
    await assert.rejects(
      () => provider.generateText({ messages: [{ role: "user", content: "hi" }] }),
      (err: unknown) => err instanceof LlmError && err.category === "auth" && calls === 1,
    );
  });
});

describe("AI service", () => {
  it("returns a safe error when the Groq key is missing", async () => {
    delete process.env.GROQ_API_KEY;
    process.env.AI_PROVIDER = "groq";
    const result = await chatText({
      system: "tutor",
      messages: [{ role: "user", content: "hello" }],
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "AI is not available in this environment");
      assert.equal(result.error.includes("GROQ"), false);
      assert.equal(result.error.includes("gsk_"), false);
    }
    assert.equal(hasLlm(), false);
  });

  it("never leaks secrets on an invalid key", async () => {
    process.env.GROQ_API_KEY = "gsk_super_secret_value";
    process.env.AI_PROVIDER = "groq";
    process.env.AI_MAX_RETRIES = "0";
    globalThis.fetch = (async () =>
      groqStatus(401, { error: { message: "Invalid API Key gsk_super_secret_value" } })) as typeof fetch;
    const result = await chatText({
      system: "tutor",
      messages: [{ role: "user", content: "hello" }],
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "AI is temporarily unavailable");
      assert.equal(result.error.includes("gsk_super_secret_value"), false);
      assert.equal(result.error.includes("401"), false);
    }
  });

  it("surfaces a safe message for provider rate limits", async () => {
    process.env.GROQ_API_KEY = "gsk_test_not_real";
    process.env.AI_PROVIDER = "groq";
    process.env.AI_MAX_RETRIES = "0";
    globalThis.fetch = (async () => groqStatus(429, { error: { message: "Slow down" } })) as typeof fetch;
    const result = await chatJson({
      system: "Return JSON only",
      user: "make a quiz",
      feature: "quiz",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "The tutor is busy right now. Please try again in a moment.");
    }
  });

  it("generates text through the abstraction and keeps RAG context in the payload", async () => {
    process.env.GROQ_API_KEY = "gsk_test_not_real";
    process.env.AI_PROVIDER = "groq";
    process.env.AI_FREE_MODEL = "openai/gpt-oss-20b";
    const captured: { body?: Record<string, unknown> } = {};
    globalThis.fetch = (async (_input, init) => {
      captured.body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return groqOk("A computer accepts data and processes it [Source — p. 17]");
    }) as typeof fetch;
    const result = await chatText({
      system: "RETRIEVED SOURCE (hybrid):\n[Source — p. 17] A computer accepts data.",
      messages: [{ role: "user", content: "What is a computer?" }],
      feature: "tutor",
      userId: "user-1",
    });
    assert.equal(result.ok, true);
    if (result.ok) assert.match(result.text, /computer/i);
    const messages = captured.body?.messages as Array<{ content: string }>;
    assert.ok(messages[0]?.content.includes("RETRIEVED SOURCE"));
    assert.equal(captured.body?.model, "openai/gpt-oss-20b");
    assert.equal(captured.body?.response_format, undefined);
  });

  it("rejects malformed JSON instead of crashing", async () => {
    process.env.GROQ_API_KEY = "gsk_test_not_real";
    process.env.AI_PROVIDER = "groq";
    globalThis.fetch = (async () => groqOk("sure, here are questions but not json")) as typeof fetch;
    const result = await chatJson({
      system: "Return JSON only",
      user: "quiz",
      feature: "quiz",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error, "The tutor returned an unreadable response. Please try again.");
    }
  });

  it("accepts valid JSON objects for quiz-shaped output", async () => {
    process.env.GROQ_API_KEY = "gsk_test_not_real";
    process.env.AI_PROVIDER = "groq";
    globalThis.fetch = (async () =>
      groqOk(JSON.stringify({ questions: [{ stem: "Q", choices: ["a", "b", "c", "d"], correctIndex: 0 }] }))) as typeof fetch;
    const result = await chatJson({
      system: "Return JSON only",
      user: "quiz",
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      const parsed = extractJsonObject(result.text) as { questions: unknown[] };
      assert.equal(parsed.questions.length, 1);
    }
  });

  it("uses the paid model only when the server passes plan=paid", async () => {
    process.env.GROQ_API_KEY = "gsk_test_not_real";
    process.env.AI_PROVIDER = "groq";
    process.env.AI_FREE_MODEL = "openai/gpt-oss-20b";
    process.env.AI_PAID_MODEL = "openai/gpt-oss-120b";
    const captured: { body?: Record<string, unknown> } = {};
    globalThis.fetch = (async (_input, init) => {
      captured.body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return groqOk("ok");
    }) as typeof fetch;
    const result = await chatText({
      system: "sys",
      messages: [{ role: "user", content: "hi" }],
      plan: "paid",
    });
    assert.equal(result.ok, true);
    assert.equal(captured.body?.model, "openai/gpt-oss-120b");
  });

  it("does not construct an unknown provider from env", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.GROQ_API_KEY = "gsk_test_not_real";
    const result = await chatText({
      system: "sys",
      messages: [{ role: "user", content: "hi" }],
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, "AI is not available in this environment");
    assert.throws(() => getLlmProvider(), (err: unknown) => err instanceof LlmError && err.category === "unsupported_provider");
  });

  it("does not enable fallback unless a second registered provider is configured", () => {
    process.env.AI_PROVIDER = "groq";
    process.env.AI_FALLBACK_PROVIDER = "gemini";
    assert.equal(getFallbackLlmProvider(), null);
  });

  it("applies a per-user rate limit without leaking internals", async () => {
    process.env.GROQ_API_KEY = "gsk_test_not_real";
    process.env.AI_PROVIDER = "groq";
    globalThis.fetch = (async () => groqOk("ok")) as typeof fetch;
    let last: Awaited<ReturnType<typeof chatText>> | null = null;
    for (let i = 0; i < 41; i++) {
      last = await chatText({
        system: "sys",
        messages: [{ role: "user", content: "hi" }],
        userId: "same-user",
      });
    }
    assert.ok(last);
    assert.equal(last.ok, false);
    if (!last.ok) {
      assert.equal(last.error, "Too many study requests. Please wait a moment and try again.");
    }
  });
});

describe("error sanitization", () => {
  it("maps categories to user-safe copy", () => {
    assert.equal(publicLlmMessage(new LlmError("missing_key", "GROQ_API_KEY=gsk_abc")), "AI is not available in this environment");
    assert.equal(publicLlmMessage(new LlmError("auth", "Invalid API Key")), "AI is temporarily unavailable");
    assert.doesNotMatch(publicLlmMessage(new Error("Bearer gsk_abc")), /gsk_/);
  });
});
