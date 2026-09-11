import type { Sql } from "@/lib/db";
import type { DraftCourse } from "../chunk";
import type { BlockType, NormalizedDocument, SourceLocator } from "../inject";
import type { SourceKind } from "../types";
import { CHUNKING } from "./config";
import { assignChunksToTopics, assignNormalizedChunksToTopics } from "./chunking";
import { resolveEmbeddingProvider } from "./embeddings/resolve";
import { estimateTokens } from "./math";
import { PostgresVectorStore } from "./store/postgres";
import { EmbeddingProviderError, type ChunkEmbedding } from "./types";

export type TopicRef = {
  id: number;
  title: string;
  chapterId: number;
};

export type SampleSourceChunk = {
  topicTitle: string;
  page: number | null;
  content: string;
  heading?: string | null;
};

export type IndexResult = {
  documentId: number;
  chunkCount: number;
  embeddedCount: number;
  embeddingStatus: "indexed" | "unavailable";
  fallbackReason?: string;
};

async function insertChunk(
  sql: Sql,
  opts: {
    userId: string;
    courseId: number;
    documentId: number;
    topic: TopicRef | null;
    page: number | null;
    locator?: SourceLocator | null;
    blockOrder?: number | null;
    blockType?: BlockType | null;
    heading: string | null;
    content: string;
    chunkIndex: number;
  },
): Promise<number> {
  const uid = `${opts.courseId}:${opts.documentId}:${opts.chunkIndex}`;
  const rows = await sql<{ id: number }>`
    insert into source_chunks (
      user_id, course_id, document_id, chapter_id, topic_id,
      page, locator_json, block_order, block_type, heading, chunk_index, chunk_uid, content, token_estimate
    ) values (
      ${opts.userId}, ${opts.courseId}, ${opts.documentId},
      ${opts.topic?.chapterId ?? null}, ${opts.topic?.id ?? null},
      ${opts.page}, ${opts.locator ? JSON.stringify(opts.locator) : null}, ${opts.blockOrder ?? null}, ${opts.blockType ?? null},
      ${opts.heading}, ${opts.chunkIndex}, ${uid},
      ${opts.content}, ${estimateTokens(opts.content)}
    )
    returning id
  `;
  return rows[0].id;
}

async function embedInserted(
  sql: Sql,
  userId: string,
  courseId: number,
  records: Array<{ id: number; content: string }>,
): Promise<{ embeddedCount: number; status: "indexed" | "unavailable"; reason?: string }> {
  const provider = resolveEmbeddingProvider();
  if (!(await provider.available()) || !records.length) {
    return {
      embeddedCount: 0,
      status: "unavailable",
      reason: records.length ? "embedding_provider_unavailable" : "no_chunks",
    };
  }
  try {
    const result = await provider.embed({
      texts: records.map((r) => r.content.slice(0, 8000)),
      purpose: "document",
    });
    const store = new PostgresVectorStore(sql);
    const embeddings: ChunkEmbedding[] = records.map((r, i) => ({
      chunkId: r.id,
      embedding: {
        provider: result.provider,
        model: result.model,
        dimensions: result.dimensions,
        values: result.vectors[i] ?? [],
      },
    }));
    await store.upsert(
      { userId, courseId },
      embeddings.filter((e) => e.embedding.values.length),
    );
    return {
      embeddedCount: embeddings.filter((e) => e.embedding.values.length).length,
      status: "indexed",
    };
  } catch (err) {
    const reason = err instanceof EmbeddingProviderError ? err.code : "embed_failed";
    return { embeddedCount: 0, status: "unavailable", reason };
  }
}

export async function indexCourseMaterial(opts: {
  sql: Sql;
  userId: string;
  courseId: number;
  kind: SourceKind;
  sourceName: string;
  topics: TopicRef[];
  draft?: DraftCourse;
  raw?: string;
  document?: NormalizedDocument;
  sampleChunks?: SampleSourceChunk[];
  format?: string;
}): Promise<IndexResult> {
  const pageCount = opts.document?.source.pageCount ?? (opts.raw
    ? (opts.raw.match(/\[\[page\s+\d+\]\]/gi) ?? []).length || null
    : null);
  const format = opts.document?.source.format ?? opts.format ?? null;
  const doc = await opts.sql<{ id: number }>`
    insert into source_documents (user_id, course_id, kind, name, page_count, format)
    values (${opts.userId}, ${opts.courseId}, ${opts.kind}, ${opts.sourceName}, ${pageCount}, ${format})
    returning id
  `;
  const documentId = doc[0].id;
  const inserted: Array<{ id: number; content: string }> = [];

  if (opts.sampleChunks?.length) {
    const byTitle = new Map(opts.topics.map((t) => [t.title, t]));
    let i = 0;
    for (const chunk of opts.sampleChunks) {
      const topic = byTitle.get(chunk.topicTitle) ?? opts.topics[0] ?? null;
      const id = await insertChunk(opts.sql, {
        userId: opts.userId,
        courseId: opts.courseId,
        documentId,
        topic,
        page: chunk.page,
        heading: chunk.heading ?? chunk.topicTitle,
        content: chunk.content,
        chunkIndex: i,
      });
      inserted.push({ id, content: chunk.content });
      i += 1;
      if (i >= CHUNKING.maxChunksPerDocument) break;
    }
  } else if (opts.document) {
    const draft =
      opts.draft ??
      ({
        code: "",
        title: "",
        chapters: [{ title: "", topics: opts.topics.map((topic) => ({ title: topic.title, summary: "", keyIdeas: [] })) }],
      } satisfies DraftCourse);
    const assigned = assignNormalizedChunksToTopics(draft, opts.document);
    for (const chunk of assigned) {
      const topic = chunk.topicIndex == null ? null : opts.topics[chunk.topicIndex] ?? null;
      const id = await insertChunk(opts.sql, {
        userId: opts.userId,
        courseId: opts.courseId,
        documentId,
        topic,
        page: chunk.locator.type === "page" ? chunk.locator.page ?? null : null,
        locator: chunk.locator,
        blockOrder: chunk.blockOrder,
        blockType: chunk.blockType,
        heading: chunk.heading,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
      });
      inserted.push({ id, content: chunk.content });
    }
  } else if (opts.raw) {
    const draft =
      opts.draft ??
      ({
        code: "",
        title: "",
        chapters: [
          {
            title: "",
            topics: opts.topics.map((t) => ({ title: t.title, summary: "", keyIdeas: [] })),
          },
        ],
      } satisfies DraftCourse);
    const assigned = assignChunksToTopics(draft, opts.raw);
    for (const chunk of assigned) {
      const topic = opts.topics[chunk.topicIndex] ?? opts.topics[0] ?? null;
      const id = await insertChunk(opts.sql, {
        userId: opts.userId,
        courseId: opts.courseId,
        documentId,
        topic,
        page: chunk.page,
        heading: chunk.heading,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
      });
      inserted.push({ id, content: chunk.content });
    }
  }

  const embed = await embedInserted(opts.sql, opts.userId, opts.courseId, inserted);
  return {
    documentId,
    chunkCount: inserted.length,
    embeddedCount: embed.embeddedCount,
    embeddingStatus: embed.status,
    fallbackReason: embed.reason,
  };
}

export async function ensureCourseEmbeddings(opts: {
  sql: Sql;
  userId: string;
  courseId: number;
}): Promise<{ embeddedCount: number; status: "indexed" | "unavailable"; reason?: string }> {
  const missing = await opts.sql<{ id: number; content: string }>`
    select c.id, c.content
    from source_chunks c
    left join chunk_embeddings e on e.chunk_id = c.id
    where c.user_id = ${opts.userId} and c.course_id = ${opts.courseId}
      and e.chunk_id is null
    order by c.id
    limit 128
  `;
  if (!missing.length) {
    const have = await opts.sql<{ n: number }>`
      select count(*)::int as n from chunk_embeddings
      where user_id = ${opts.userId} and course_id = ${opts.courseId}
    `;
    const n = have[0]?.n ?? 0;
    return { embeddedCount: n, status: n ? "indexed" : "unavailable" };
  }
  return embedInserted(opts.sql, opts.userId, opts.courseId, missing);
}
