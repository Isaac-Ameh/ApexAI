import type { Sql } from "@/lib/db";
import { RETRIEVAL_DEFAULTS } from "./config";
import { formatEvidenceContext, toCitation, toEvidence } from "./citations";
import { selectContext } from "./context";
import { resolveEmbeddingProvider } from "./embeddings/resolve";
import { hierarchyScore, passesMetadataFilter } from "./hierarchy";
import { citationSignal, combineScores, weightsFor } from "./hybrid";
import { ensureCourseEmbeddings } from "./indexer";
import { lexicalRetrieve } from "./lexical";
import { understandQuery } from "./query-understanding";
import { DiversityReranker, type Reranker } from "./rerank";
import { loadCourseChunks } from "./repository";
import { semanticRetrieve } from "./semantic";
import { PostgresVectorStore } from "./store/postgres";
import type { VectorStore } from "./store/vector-store";
import { EmbeddingProviderError } from "./types";
import type {
  Chunk,
  RetrievalCandidate,
  RetrievalMode,
  RetrievalOptions,
  RetrievalQuery,
  RetrievalResult,
} from "./types";

export type PipelineDeps = {
  sql: Sql;
  provider?: ReturnType<typeof resolveEmbeddingProvider>;
  store?: VectorStore;
  reranker?: Reranker;
};

/**
 * Full retrieval pipeline:
 *   Query → understand → candidate pool → semantic (primary)
 *         → lexical (secondary / fallback) → hierarchy filter
 *         → hybrid score → rerank → context select → citations
 *
 * Semantic retrieval is used only when real embeddings exist. Otherwise the
 * pipeline records `lexical-fallback` and uses the lexical retriever explicitly.
 */
export async function retrieveForCourse(
  query: RetrievalQuery,
  options: RetrievalOptions = {},
  deps: PipelineDeps,
): Promise<RetrievalResult> {
  const understood = understandQuery(query, options);
  const chunks = await loadCourseChunks(deps.sql, query.userId, query.courseId);
  const strictTopic = Boolean(options.strictTopic);
  const pool = chunks.filter((c) => passesMetadataFilter(c, understood, strictTopic));
  const byId = new Map(pool.map((c) => [c.id, c]));

  const candidateLimit = options.candidateLimit ?? RETRIEVAL_DEFAULTS.candidateLimit;
  const limit = options.limit ?? RETRIEVAL_DEFAULTS.limit;
  const forceLexical = options.mode === "lexical";

  const provider = deps.provider ?? resolveEmbeddingProvider();
  const store = deps.store ?? new PostgresVectorStore(deps.sql);
  const reranker = deps.reranker ?? new DiversityReranker();

  let mode: RetrievalMode = "lexical-fallback";
  let fallbackReason: string | undefined = forceLexical ? "mode_lexical" : "embeddings_not_ready";
  const semanticScores = new Map<number, number>();
  let embeddedChunkCount = 0;
  let providerId: string | null = provider.id === "unavailable" ? null : provider.id;
  let modelId: string | null = provider.id === "unavailable" ? null : provider.model;

  if (!forceLexical) {
    const ensured = await ensureCourseEmbeddings({
      sql: deps.sql,
      userId: query.userId,
      courseId: query.courseId,
    });
    embeddedChunkCount = ensured.embeddedCount;
    if (ensured.status === "indexed" && embeddedChunkCount > 0) {
      try {
        const semantic = await semanticRetrieve({
          provider,
          store,
          userId: query.userId,
          courseId: query.courseId,
          queryText: understood.rewritten,
          limit: candidateLimit,
        });
        for (const hit of semantic.hits) semanticScores.set(hit.chunkId, hit.score);
        mode = options.mode === "semantic" ? "semantic" : "hybrid";
        fallbackReason = undefined;
        modelId = semantic.queryEmbedding.model;
        providerId = semantic.queryEmbedding.provider;
      } catch (err) {
        fallbackReason =
          err instanceof EmbeddingProviderError
            ? `embedding_${err.code}`
            : "semantic_retrieve_failed";
        mode = "lexical-fallback";
      }
    } else {
      fallbackReason = ensured.reason ?? "no_stored_embeddings";
      mode = "lexical-fallback";
    }
  }

  const lexicalHits = lexicalRetrieve(pool, understood.rewritten, candidateLimit);
  const lexicalScores = new Map(lexicalHits.map((h) => [h.chunkId, h.score]));

  const ids = new Set<number>([...semanticScores.keys(), ...lexicalScores.keys()]);
  if (!ids.size) {
    for (const chunk of pool.slice(0, candidateLimit)) ids.add(chunk.id);
  }

  const weights = weightsFor(mode);
  const candidates: RetrievalCandidate[] = [];
  for (const id of ids) {
    const chunk = byId.get(id);
    if (!chunk) continue;
    const hier = hierarchyScore(chunk, understood, strictTopic);
    if (strictTopic && hier.reason === "outside-strict-topic") continue;
    const semantic = semanticScores.has(id) ? semanticScores.get(id)! : mode === "lexical-fallback" ? null : 0;
    const scores = combineScores({
      semantic,
      lexical: lexicalScores.get(id) ?? 0,
      hierarchy: hier.score,
      citation: citationSignal(chunk.page, chunk.heading),
      weights,
    });
    const reasons: string[] = [];
    if (semantic != null && semantic > 0) reasons.push("semantic");
    if ((lexicalScores.get(id) ?? 0) > 0) reasons.push("lexical");
    if (hier.reason) reasons.push(hier.reason);
    candidates.push({ chunk, scores, reasons });
  }

  candidates.sort((a, b) => b.scores.combined - a.scores.combined);
  const reranked = reranker.rerank(candidates, understood);
  const selected = selectContext(reranked, {
    limit,
    tokenBudget: options.tokenBudget ?? RETRIEVAL_DEFAULTS.tokenBudget,
  });

  return {
    mode,
    query: understood,
    candidates: reranked,
    selected,
    evidenceCandidates: reranked.map((candidate) => toEvidence(candidate, "candidate")),
    evidence: selected.map((candidate) => toEvidence(candidate, "used")),
    citations: selected.map((c) => toCitation(toEvidence(c, "used"))),
    context: formatEvidenceContext(selected.map((c) => toEvidence(c, "used"))),
    diagnostics: {
      embeddingProvider: providerId,
      embeddingModel: modelId,
      vectorStore: store.id,
      totalChunkCount: chunks.length,
      embeddedChunkCount,
      candidateCount: candidates.length,
      fallbackReason,
    },
  };
}

/** Convenience for callers that still want just the selected chunks. */
export function selectedChunks(result: RetrievalResult): Chunk[] {
  return result.selected.map((c) => c.chunk);
}
