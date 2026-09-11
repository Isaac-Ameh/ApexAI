const STOP = new Set([
  "the", "and", "for", "that", "with", "this", "from", "are", "was", "were",
  "have", "has", "had", "not", "but", "you", "your", "our", "its", "into",
  "about", "what", "when", "which", "their", "them", "then", "than", "also",
  "can", "how", "why", "does", "did", "will", "would", "could", "should",
  "a", "an", "of", "to", "in", "on", "or", "is", "be", "as", "at", "by",
  "it", "we", "if", "so", "do",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.round(text.trim().length / 4));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i];
    const y = b[i];
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function normalizeWeights<T extends Record<string, number>>(weights: T): T {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  if (sum <= 0) return weights;
  const out = { ...weights };
  (Object.keys(out) as Array<keyof T>).forEach((k) => {
    out[k] = (out[k] as number) / sum as T[keyof T];
  });
  return out;
}
