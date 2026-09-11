import type { Sql } from "@/lib/db";
import { estimateTokens } from "./math";
import type { Chunk } from "./types";
import type { BlockType, SourceLocator } from "../inject";

type ChunkRow = {
  id: number;
  course_id: number;
  document_id: number | null;
  chapter_id: number | null;
  topic_id: number | null;
  page: number | null;
  locator_json: string | null;
  block_order: number | null;
  block_type: BlockType | null;
  heading: string | null;
  chunk_index: number | null;
  chunk_uid: string | null;
  content: string;
  token_estimate: number | null;
  topic_title: string | null;
  chapter_title: string | null;
  source_name: string | null;
  source_format: Chunk["sourceFormat"];
};

function toChunk(row: ChunkRow): Chunk {
  let locator: SourceLocator | null = null;
  if (row.locator_json) {
    try {
      const parsed = JSON.parse(row.locator_json) as SourceLocator;
      if (parsed && typeof parsed === "object" && typeof parsed.type === "string" && typeof parsed.order === "number") {
        locator = parsed;
      }
    } catch {
      // Old/malformed metadata remains readable through legacy page/heading fields.
    }
  }
  return {
    id: row.id,
    uid: row.chunk_uid || `chunk:${row.course_id}:${row.id}`,
    courseId: row.course_id,
    documentId: row.document_id,
    chapterId: row.chapter_id,
    topicId: row.topic_id,
    page: row.page,
    locator,
    blockOrder: row.block_order,
    blockType: row.block_type,
    heading: row.heading,
    chunkIndex: row.chunk_index ?? 0,
    content: row.content,
    tokenEstimate: row.token_estimate ?? estimateTokens(row.content),
    topicTitle: row.topic_title,
    chapterTitle: row.chapter_title,
    sourceName: row.source_name,
    sourceFormat: row.source_format,
  };
}

export async function loadCourseChunks(
  sql: Sql,
  userId: string,
  courseId: number,
): Promise<Chunk[]> {
  const rows = await sql<ChunkRow>`
    select
      c.id,
      c.course_id,
      c.document_id,
      coalesce(c.chapter_id, t.chapter_id) as chapter_id,
      c.topic_id,
      c.page,
      c.locator_json,
      c.block_order,
      c.block_type,
      c.heading,
      c.chunk_index,
      c.chunk_uid,
      c.content,
      c.token_estimate,
      t.title as topic_title,
      ch.title as chapter_title,
      coalesce(d.name, cr.source_name) as source_name,
      d.format as source_format
    from source_chunks c
    left join topics t on t.id = c.topic_id
    left join chapters ch on ch.id = coalesce(c.chapter_id, t.chapter_id)
    left join source_documents d on d.id = c.document_id
    left join courses cr on cr.id = c.course_id
    where c.user_id = ${userId} and c.course_id = ${courseId}
    order by c.id
  `;
  return rows.map(toChunk);
}
