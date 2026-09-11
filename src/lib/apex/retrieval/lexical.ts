import { tokenize } from "./math";
import type { Chunk } from "./types";

export type LexicalHit = {
  chunkId: number;
  score: number;
  overlap: number;
};

/**
 * Lexical retriever — keyword overlap, substring, and density.
 * This is the FALLBACK path (and a secondary hybrid signal), never the
 * primary semantic system.
 */
export function lexicalRetrieve(
  chunks: Chunk[],
  query: string,
  limit: number,
): LexicalHit[] {
  const qTokens = tokenize(query);
  const qSet = new Set(qTokens);
  const qLower = query.toLowerCase();
  if (!qSet.size) {
    return chunks.slice(0, limit).map((c, i) => ({
      chunkId: c.id,
      score: Math.max(0.05, 1 - i * 0.02),
      overlap: 0,
    }));
  }

  const hits: LexicalHit[] = [];
  for (const chunk of chunks) {
    const tokens = tokenize(chunk.content);
    let overlap = 0;
    for (const t of tokens) if (qSet.has(t)) overlap += 1;
    const uniqueHits = tokens.filter((t) => qSet.has(t)).length
      ? new Set(tokens.filter((t) => qSet.has(t))).size
      : 0;
    const density = tokens.length ? overlap / Math.sqrt(tokens.length) : 0;
    const phrase = qLower.length > 8 && chunk.content.toLowerCase().includes(qLower.slice(0, 80)) ? 0.35 : 0;
    const headingHit =
      chunk.heading && qTokens.some((t) => chunk.heading!.toLowerCase().includes(t)) ? 0.2 : 0;
    const raw = density * 0.55 + uniqueHits * 0.12 + phrase + headingHit;
    if (raw <= 0) continue;
    hits.push({
      chunkId: chunk.id,
      score: Math.min(1, raw / 6),
      overlap,
    });
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}
