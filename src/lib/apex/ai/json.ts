/**
 * Models do not always return valid JSON. Callers must treat output as untrusted.
 * This helper never throws an uncaught parse at the application boundary —
 * `extractJsonObject` throws; `tryExtractJsonObject` returns null.
 */
export function tryExtractJsonObject(text: string): unknown | null {
  if (!text || typeof text !== "string") return null;
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const raw = fenced?.[1] ?? text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as unknown;
  } catch {
    return null;
  }
}

export function extractJsonObject(text: string): unknown {
  const parsed = tryExtractJsonObject(text);
  if (parsed == null || typeof parsed !== "object") {
    throw new Error("No JSON object in model output");
  }
  return parsed;
}
