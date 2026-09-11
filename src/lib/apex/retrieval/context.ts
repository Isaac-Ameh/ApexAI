import { RETRIEVAL_DEFAULTS } from "./config";
import type { RetrievalCandidate } from "./types";

/**
 * Context selection: take reranked candidates until the token budget fills,
 * keeping at least one current-topic chunk when present.
 */
export function selectContext(
  ranked: RetrievalCandidate[],
  opts?: { limit?: number; tokenBudget?: number },
): RetrievalCandidate[] {
  const limit = opts?.limit ?? RETRIEVAL_DEFAULTS.limit;
  const budget = opts?.tokenBudget ?? RETRIEVAL_DEFAULTS.tokenBudget;
  const selected: RetrievalCandidate[] = [];
  let tokens = 0;

  for (const cand of ranked) {
    if (selected.length >= limit) break;
    const cost = cand.chunk.tokenEstimate;
    if (selected.length > 0 && tokens + cost > budget) continue;
    selected.push(cand);
    tokens += cost;
  }

  if (!selected.length && ranked[0]) selected.push(ranked[0]);
  return selected;
}
