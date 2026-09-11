import { tokenize } from "../retrieval/math";
import type { Evidence, UnderstoodQuery } from "../retrieval/types";

export type GroundingStatus =
  | "grounded"
  | "insufficient_evidence"
  | "no_relevant_evidence";

export type GroundingDecision = {
  status: GroundingStatus;
  evidence: Evidence[];
  reason: string;
};

const MAX_GROUNDING_EVIDENCE = 3;
const MIN_TERM_COVERAGE = 0.75;
const MIN_RELATIVE_QUALITY = 0.75;

function evidenceTokens(evidence: Evidence): Set<string> {
  return new Set(tokenize(evidence.text));
}

function termCoverage(query: UnderstoodQuery, evidence: Evidence): number {
  const terms = new Set(query.keywords);
  if (!terms.size) return 0;
  const tokens = evidenceTokens(evidence);
  let matched = 0;
  for (const term of terms) if (tokens.has(term)) matched += 1;
  return matched / terms.size;
}

function quality(evidence: Evidence): number {
  return Math.max(evidence.scores.combined, evidence.scores.rerank);
}

function hasRetrievalSignal(evidence: Evidence): boolean {
  return evidence.reasons.some((reason) => reason === "semantic" || reason === "lexical");
}

function hasRelatedSignal(query: UnderstoodQuery, evidence: Evidence): boolean {
  return (
    termCoverage(query, evidence) > 0 ||
    evidence.reasons.some((reason) => ["semantic", "lexical"].includes(reason))
  );
}

/**
 * Selects grounding-worthy Evidence after retrieval without invoking another model.
 * Retrieval ranking remains responsible for finding candidates; this policy only
 * decides whether a small, directly relevant subset is safe to ground on.
 */
export function evaluateGrounding(
  query: UnderstoodQuery,
  candidates: Evidence[],
): GroundingDecision {
  if (!candidates.length) {
    return {
      status: "no_relevant_evidence",
      evidence: [],
      reason: "Retrieval returned no Evidence candidates.",
    };
  }

  const ranked = [...candidates].sort((a, b) => quality(b) - quality(a));
  const bestQuality = quality(ranked[0]);
  const related = ranked.filter((evidence) => hasRelatedSignal(query, evidence));
  const strong = ranked.filter((evidence) => {
    const coverage = termCoverage(query, evidence);
    const relativeQuality = bestQuality > 0 ? quality(evidence) / bestQuality : 0;
    return (
      coverage >= MIN_TERM_COVERAGE &&
      relativeQuality >= MIN_RELATIVE_QUALITY &&
      hasRetrievalSignal(evidence)
    );
  });

  if (!strong.length) {
    return {
      status: related.length ? "insufficient_evidence" : "no_relevant_evidence",
      evidence: [],
      reason: related.length
        ? "Retrieved material is related but does not directly cover enough of the question."
        : "Retrieved material has no meaningful overlap with the question.",
    };
  }

  return {
    status: "grounded",
    evidence: strong.slice(0, MAX_GROUNDING_EVIDENCE),
    reason: `Selected ${Math.min(strong.length, MAX_GROUNDING_EVIDENCE)} directly relevant Evidence item(s) from ${candidates.length} candidate(s).`,
  };
}
