import { DEFAULT_SCORE_WEIGHTS, LEXICAL_FALLBACK_WEIGHTS } from "./config";
import { clamp01, normalizeWeights } from "./math";
import type { RetrievalMode, ScoreParts, ScoreWeights } from "./types";

export function weightsFor(mode: RetrievalMode): ScoreWeights {
  if (mode === "lexical-fallback") return normalizeWeights(LEXICAL_FALLBACK_WEIGHTS);
  if (mode === "semantic") {
    return normalizeWeights({ semantic: 0.86, lexical: 0.04, hierarchy: 0.08, citation: 0.02 });
  }
  return normalizeWeights(DEFAULT_SCORE_WEIGHTS);
}

export function combineScores(input: {
  semantic: number | null;
  lexical: number;
  hierarchy: number;
  citation: number;
  weights: ScoreWeights;
}): ScoreParts {
  const weights =
    input.semantic == null
      ? normalizeWeights({ ...input.weights, semantic: 0 })
      : input.weights;
  const semantic = input.semantic;
  const combined = clamp01(
    (semantic ?? 0) * weights.semantic +
      input.lexical * weights.lexical +
      input.hierarchy * weights.hierarchy +
      input.citation * weights.citation,
  );
  return {
    semantic,
    lexical: clamp01(input.lexical),
    hierarchy: clamp01(input.hierarchy),
    citation: clamp01(input.citation),
    combined,
    rerank: combined,
  };
}

export function citationSignal(page: number | null, heading: string | null): number {
  let n = 0;
  if (page != null) n += 0.7;
  if (heading) n += 0.3;
  return n;
}
