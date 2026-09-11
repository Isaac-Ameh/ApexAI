import { tokenize } from "./math";
import type { RetrievalCandidate, UnderstoodQuery } from "./types";

export interface Reranker {
  readonly id: string;
  rerank(candidates: RetrievalCandidate[], query: UnderstoodQuery): RetrievalCandidate[];
}

function overlapRatio(a: string, b: string): number {
  const sa = new Set(tokenize(a));
  const sb = new Set(tokenize(b));
  if (!sa.size || !sb.size) return 0;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter += 1;
  return inter / Math.min(sa.size, sb.size);
}

/**
 * Separate reranking stage. Today this is a lightweight diversity + coverage
 * reranker so we don't send five near-duplicate paragraphs to the tutor.
 * Swap in a cross-encoder later by implementing `Reranker`.
 */
export class DiversityReranker implements Reranker {
  readonly id = "diversity-coverage";

  rerank(candidates: RetrievalCandidate[], query: UnderstoodQuery): RetrievalCandidate[] {
    const remaining = [...candidates].sort((a, b) => b.scores.combined - a.scores.combined);
    const picked: RetrievalCandidate[] = [];
    const covered = new Set<string>();
    const needed = new Set(query.keywords);

    while (remaining.length) {
      let bestIdx = 0;
      let bestScore = -Infinity;
      for (let i = 0; i < remaining.length; i += 1) {
        const cand = remaining[i];
        let bonus = 0;
        const tokens = tokenize(cand.chunk.content);
        let newTerms = 0;
        for (const t of tokens) {
          if (needed.has(t) && !covered.has(t)) newTerms += 1;
        }
        bonus += Math.min(0.12, newTerms * 0.03);
        const dup = picked.reduce(
          (m, p) => Math.max(m, overlapRatio(p.chunk.content, cand.chunk.content)),
          0,
        );
        if (dup > 0.72) bonus -= 0.25;
        else if (dup > 0.5) bonus -= 0.1;
        if (cand.chunk.page != null) bonus += 0.03;
        if (cand.scores.semantic != null) bonus += cand.scores.semantic * 0.08;
        const score = cand.scores.combined + bonus;
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }
      const [chosen] = remaining.splice(bestIdx, 1);
      const next: RetrievalCandidate = {
        ...chosen,
        scores: { ...chosen.scores, rerank: Math.max(0, Math.min(1, bestScore)) },
        reasons: [...chosen.reasons, `rerank:${this.id}`],
      };
      picked.push(next);
      for (const t of tokenize(next.chunk.content)) if (needed.has(t)) covered.add(t);
    }
    return picked;
  }
}

export class IdentityReranker implements Reranker {
  readonly id = "identity";
  rerank(candidates: RetrievalCandidate[]): RetrievalCandidate[] {
    return candidates.map((c) => ({
      ...c,
      scores: { ...c.scores, rerank: c.scores.combined },
    }));
  }
}
