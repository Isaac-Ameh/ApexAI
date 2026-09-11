# ApexStudy

A course-centric personal learning environment. Upload a handbook or notes; ApexStudy maps them into chapters and topics, estimates what you understand, and decides what to study next.

This repository is the ApexStudy application (TanStack Start, Postgres, Groq for generation).

## Retrieval architecture

The first retrieval implementation scored chunks with token overlap, substring matches, and a hand-tuned topic boost inside a single `retrieveChunks()` function. That is a useful **fallback**, not a semantic RAG system.

Retrieval is now a staged pipeline:

```
Query
  → query understanding
  → candidate retrieval
  → semantic / vector retrieval     ← primary
  → optional lexical retrieval      ← hybrid signal, or explicit fallback
  → metadata / course-context filter
  → reranking
  → context selection
  → source formatting
  → LLM (provider-agnostic generation layer; default: Groq)
```

Details live in [`src/lib/apex/retrieval/README.md`](src/lib/apex/retrieval/README.md).

### LLM provider

Generation (tutor, quizzes, course mapping) goes through `src/lib/apex/ai/`. Features never import Groq.

```
React
  → ApexStudy server functions (auth, validation, RAG)
  → chatText / chatJson
  → LLMProvider
  → GroqProvider  (swap later: GeminiProvider, OpenAIProvider)
```

| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | Server-only Groq key. Never `VITE_`-prefix this. |
| `AI_PROVIDER` | `groq` (only implemented provider today) |
| `AI_FREE_MODEL` | Default / free-tier model (currently `openai/gpt-oss-20b`) |
| `AI_PAID_MODEL` | Future paid-tier model (currently `openai/gpt-oss-120b`) |
| `AI_FALLBACK_PROVIDER` | Optional second *implemented* provider |

See `.env.example`. Embeddings and listen/TTS still use xAI when `XAI_API_KEY` is present.

To add Gemini or OpenAI later: implement `LLMProvider` under `src/lib/apex/ai/providers/`, register it in `resolve.server.ts`, set `AI_PROVIDER`. Do not change tutor/quiz code.

### What is production-oriented

- Strong TypeScript contracts: `Document`, `Chunk`, `Embedding`, `RetrievalQuery`, `RetrievalCandidate`, `RetrievalResult`, `SourceCitation`, `RetrievalOptions`
- Provider-agnostic `EmbeddingProvider` (production: xAI `POST /v1/embeddings`)
- Provider-agnostic `VectorStore` (production: Postgres-backed cosine search)
- Hierarchical metadata on every chunk: course, chapter, topic, page, document, heading
- Source grounding of the form `[Source — p. 17]`
- Hybrid scoring with configurable weights, semantic-primary
- Separate rerank stage
- Semantic boundary chunking (pages, headings, paragraphs, sentences)

### What is intentionally simplified

- Vector search is brute-force cosine over a course's embeddings (fine for one handbook; replace with pgvector / ANN later)
- Embeddings are stored as JSON so preview (PGLite) and production (Neon) share a schema
- Query understanding is heuristic, not an extra LLM rewrite
- Reranking is diversity/coverage, not a cross-encoder
- If the embedding API is unavailable, the pipeline **falls back to lexical retrieval and says so** — it does not invent vectors

## App loop

Upload → understand the course → verify the map → study → practice → assess → diagnose → adapt.
