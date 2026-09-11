/**
 * xAI helpers that are *not* the LLM generation layer.
 * Chat/JSON generation lives in `./ai/service.server` (Groq by default).
 * Embeddings remain in `./retrieval/embeddings/xai`.
 */

export function hasXai(): boolean {
  return Boolean(process.env.XAI_API_KEY);
}

export async function speak(
  text: string,
): Promise<{ ok: true; audioBase64: string; mime: string } | { ok: false; error: string }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "Voice playback is unavailable right now." };
  const clipped = text.slice(0, 900);
  const res = await fetch("https://api.x.ai/v1/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ text: clipped, voice_id: "eve" }),
  });
  if (!res.ok) return { ok: false, error: "Voice playback is unavailable right now." };
  const buf = Buffer.from(await res.arrayBuffer());
  return { ok: true, audioBase64: buf.toString("base64"), mime: res.headers.get("content-type") || "audio/mpeg" };
}
