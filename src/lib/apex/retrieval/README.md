# ApexStudy retrieval

Course-aware RAG for the tutor, quizzes, and listen mode.

## Pipeline

```
Query
  → query understanding
  → candidate pool (course-scoped chunks + metadata)
  → semantic / vector retrieval     [PRIMARY — real embeddings only]
  → lexical retrieval               [secondary hybrid signal, or FALLBACK]
  → metadata / hierarchy filter     [course → chapter → topic boosts]
  → hybrid scoring                  [configurable weights]
  → reranking                       [separate stage]
  → context selection
  → source formatting / citations
  → LLM
```

Semantic retrieval is never faked. If the embedding provider is missing, rate-limited, or out of quota, the pipeline records `mode: "lexical-fallback"` and uses keyword retrieval explicitly.

## Where things happen

| Concern | Module |
|---|---|
| Types | `types.ts` |
| Semantic chunking | `chunking.ts` |
| Query understanding | `query-understanding.ts` |
| Embedding provider interface | `embeddings/provider.ts` |
| xAI embeddings | `embeddings/xai.ts` |
| Vector store interface | `store/vector-store.ts` |
| Postgres JSON cosine store | `store/postgres.ts` |
| Lexical fallback | `lexical.ts` |
| Semantic search | `semantic.ts` |
| Hybrid weights | `hybrid.ts` |
| Hierarchy | `hierarchy.ts` |
| Rerank | `rerank.ts` |
| Context + citations | `context.ts`, `citations.ts` |
| Orchestration | `pipeline.ts` |
| Indexing | `indexer.ts` |
| LLM generation (after context is built) | `src/lib/apex/ai/` — Groq today, interface is provider-agnostic |

## Swapping providers later

Implement `EmbeddingProvider` and/or `VectorStore`. `resolveEmbeddingProvider()` and `PostgresVectorStore` are the only production wiring points. A pgvector / Pinecone / Collections store can replace the JSON cosine search without changing the pipeline.
