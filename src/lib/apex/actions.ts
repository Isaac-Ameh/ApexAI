import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql, type Sql } from "@/lib/db";
import { computeReadiness, recommend, updateMastery, topicHasProgress } from "./adapt";
import { sampleAsDraft, structureFromDocument, structureFromText } from "./parse-course";
import { type NormalizedDocument } from "./inject";
import {
  formatEvidenceContext,
  formatCitationLine,
  indexCourseMaterial,
  retrieveForCourse,
  toCitation,
} from "./retrieval";
import { chatJson, chatText, extractJsonObject } from "./ai/service.server";
import { evaluateGrounding } from "./ai/grounding";
import { toMessageCitations } from "./cite-match";
import { SAMPLE_CIT102 } from "./sample-cit102";
import { routeTutorRequest } from "./tutor-request";
import { buildConversationState } from "./tutor/conversation-state";
import { decidePedagogy, formatPedagogicalInstruction } from "./tutor/pedagogy";
import type {
  ChapterRow,
  CourseCard,
  CourseWorkspace,
  Difficulty,
  MessageCitation,
  QuizKind,
  QuizQuestion,
  QuizView,
  SampleQuestion,
  SourceKind,
  TopicRow,
} from "./types";
import { speak } from "./xai.server";

function iso(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (v instanceof Date) return v.toISOString();
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? String(v) : d.toISOString();
}

function asInt(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseIdeas(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string");
  if (typeof raw !== "string" || !raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function sampleQuestionsByTitle(title: string): SampleQuestion[] {
  for (const ch of SAMPLE_CIT102.chapters) {
    for (const t of ch.topics) {
      if (t.title === title) return t.questions;
    }
  }
  return [];
}

async function loadChapters(sql: Sql, userId: string, courseId: number): Promise<ChapterRow[]> {
  const chapterRows = await sql<{ id: number; position: number; title: string }>`
    select id, position, title from chapters
    where user_id = ${userId} and course_id = ${courseId}
    order by position
  `;
  const topicRows = await sql<{
    id: number;
    chapter_id: number;
    position: number;
    title: string;
    summary: string;
    key_ideas_json: string;
    mastery: number | null;
    attempts: number | null;
    correct: number | null;
    last_assessed_at: unknown;
  }>`
    select t.id, t.chapter_id, t.position, t.title, t.summary, t.key_ideas_json,
           m.mastery, m.attempts, m.correct, m.last_assessed_at
    from topics t
    left join topic_mastery m on m.topic_id = t.id and m.user_id = t.user_id
    where t.user_id = ${userId} and t.course_id = ${courseId}
    order by t.position
  `;

  const byChapter = new Map<number, TopicRow[]>();
  for (const t of topicRows) {
    const row: TopicRow = {
      id: t.id,
      chapterId: t.chapter_id,
      position: t.position,
      title: t.title,
      summary: t.summary,
      keyIdeas: parseIdeas(t.key_ideas_json),
      mastery: t.mastery === null || t.mastery === undefined ? null : asInt(t.mastery),
      attempts: asInt(t.attempts),
      correct: asInt(t.correct),
      lastAssessedAt: iso(t.last_assessed_at),
    };
    const list = byChapter.get(t.chapter_id) ?? [];
    list.push(row);
    byChapter.set(t.chapter_id, list);
  }

  return chapterRows.map((ch) => ({
    id: ch.id,
    position: ch.position,
    title: ch.title,
    topics: byChapter.get(ch.id) ?? [],
  }));
}

async function buildWorkspace(sql: Sql, userId: string, courseId: number): Promise<CourseWorkspace | null> {
  const courses = await sql<{
    id: number;
    code: string;
    title: string;
    source_kind: string;
    source_name: string | null;
    last_topic_id: number | null;
    last_studied_at: unknown;
    created_at: unknown;
  }>`
    select id, code, title, source_kind, source_name, last_topic_id, last_studied_at, created_at
    from courses where id = ${courseId} and user_id = ${userId}
  `;
  const course = courses[0];
  if (!course) return null;
  const chapters = await loadChapters(sql, userId, courseId);
  const messages = await sql<{
    id: number;
    role: string;
    content: string;
    topic_id: number | null;
    created_at: unknown;
    citations_json: string | null;
  }>`
    select id, role, content, topic_id, created_at, citations_json
    from messages
    where user_id = ${userId} and course_id = ${courseId}
    order by id desc
    limit 40
  `;
  return {
    course: {
      id: course.id,
      code: course.code,
      title: course.title,
      sourceKind: course.source_kind as SourceKind,
      sourceName: course.source_name,
      lastTopicId: course.last_topic_id,
      lastStudiedAt: iso(course.last_studied_at),
      createdAt: iso(course.created_at) ?? new Date().toISOString(),
    },
    chapters,
    recommendation: recommend({
      chapters,
      lastTopicId: course.last_topic_id,
      lastStudiedAt: iso(course.last_studied_at),
    }),
    messages: messages
      .map((m) => ({
        id: m.id,
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        content: m.content,
        topicId: m.topic_id,
        createdAt: iso(m.created_at) ?? new Date().toISOString(),
        citations: toMessageCitations(m.citations_json),
      }))
      .reverse(),
    readiness: computeReadiness(chapters),
  };
}

function chapterTitleFor(chapters: ChapterRow[], topic: TopicRow | undefined): string | null {
  if (!topic) return null;
  return chapters.find((ch) => ch.id === topic.chapterId)?.title ?? null;
}

function nonGroundedTutorReply(
  kind: ReturnType<typeof routeTutorRequest>["kind"],
  workspace: CourseWorkspace,
  topic: TopicRow | undefined,
): string {
  if (kind === "greeting") {
    return `Hi. I can help you study ${workspace.course.code} — ${workspace.course.title}. Ask me a question about the course, or ask for practice.`;
  }
  if (kind === "navigation") {
    const chapters = workspace.chapters.map((chapter) => chapter.title).join(", ");
    return `You are studying ${workspace.course.code} — ${workspace.course.title}. ` +
      `Your current topic is ${topic?.title ?? "not selected"}. ` +
      (chapters ? `The course chapters are: ${chapters}.` : "No course chapters are available yet.");
  }
  if (kind === "meta") {
    return "I can organize your course material, answer course questions using retrieved source evidence with citations, generate practice and exam questions, track quiz-based mastery, and provide listen mode. I am not a replacement for a general-purpose chatbot, and I do not guarantee correctness or mastery.";
  }
  return "I can help with questions about the active course, explanations grounded in its source material, practice, and exam preparation.";
}

async function retrieveStudyContext(opts: {
  sql: Sql;
  userId: string;
  courseId: number;
  query: string;
  topic?: TopicRow;
  chapters: ChapterRow[];
  sourceName: string | null;
  courseTitle: string;
}) {
  return retrieveForCourse(
    {
      text: opts.query,
      courseId: opts.courseId,
      userId: opts.userId,
      topicId: opts.topic?.id ?? null,
      chapterId: opts.topic?.chapterId ?? null,
    },
    {
      topicId: opts.topic?.id ?? null,
      chapterId: opts.topic?.chapterId ?? null,
      topicTitle: opts.topic?.title ?? null,
      chapterTitle: chapterTitleFor(opts.chapters, opts.topic),
      keyIdeas: opts.topic?.keyIdeas ?? [],
      courseTitle: opts.courseTitle,
      sourceName: opts.sourceName,
      preferCurrentTopic: true,
      limit: 6,
    },
    { sql: opts.sql },
  );
}

async function insertDraft(
  sql: Sql,
  userId: string,
  draft: ReturnType<typeof sampleAsDraft>,
  meta: { kind: SourceKind; sourceName: string; raw?: string; document?: NormalizedDocument; format?: string },
): Promise<number> {
  const created = await sql<{ id: number }>`
    insert into courses (user_id, code, title, status, source_kind, source_name)
    values (${userId}, ${draft.code}, ${draft.title}, 'ready', ${meta.kind}, ${meta.sourceName})
    returning id
  `;
  const courseId = created[0].id;
  let chapterPos = 0;
  for (const chapter of draft.chapters) {
    chapterPos += 1;
    const ch = await sql<{ id: number }>`
      insert into chapters (user_id, course_id, position, title)
      values (${userId}, ${courseId}, ${chapterPos}, ${chapter.title})
      returning id
    `;
    let topicPos = 0;
    for (const topic of chapter.topics) {
      topicPos += 1;
      await sql`
        insert into topics (user_id, course_id, chapter_id, position, title, summary, key_ideas_json)
        values (
          ${userId}, ${courseId}, ${ch[0].id}, ${topicPos}, ${topic.title}, ${topic.summary},
          ${JSON.stringify(topic.keyIdeas)}
        )
      `;
    }
  }

  const topicIds = await sql<{ id: number; title: string; chapter_id: number }>`
    select id, title, chapter_id from topics
    where user_id = ${userId} and course_id = ${courseId}
    order by chapter_id, position
  `;
  const topics = topicIds.map((t) => ({ id: t.id, title: t.title, chapterId: t.chapter_id }));

  if (meta.kind === "sample") {
    const sampleChunks = SAMPLE_CIT102.chapters.flatMap((chapter) =>
      chapter.topics.flatMap((topic) =>
        topic.chunks.map((chunk) => ({
          topicTitle: topic.title,
          page: chunk.page,
          content: chunk.content,
          heading: topic.title,
        })),
      ),
    );
    await indexCourseMaterial({
      sql,
      userId,
      courseId,
      kind: meta.kind,
      sourceName: meta.sourceName,
      topics,
      draft,
      sampleChunks,
    });
  } else if (meta.document) {
    await indexCourseMaterial({
      sql,
      userId,
      courseId,
      kind: meta.kind,
      sourceName: meta.sourceName,
      topics,
      draft,
      document: meta.document,
      format: meta.format,
    });
  } else if (meta.raw) {
    await indexCourseMaterial({
      sql,
      userId,
      courseId,
      kind: meta.kind,
      sourceName: meta.sourceName,
      topics,
      draft,
      raw: meta.raw,
      format: meta.format,
    });
  }

  const first = topicIds[0];
  const topicCount = topicIds.length;
  const chapterCount = draft.chapters.length;
  const welcome =
    `I mapped ${draft.code} into ${chapterCount} chapter${chapterCount === 1 ? "" : "s"} and ${topicCount} topic${topicCount === 1 ? "" : "s"}. ` +
    (first
      ? `This is how I understood your course. I recommend starting with **${first.title}**.`
      : "This is how I understood your course.");
  await sql`
    insert into messages (user_id, course_id, topic_id, role, content)
    values (${userId}, ${courseId}, ${first?.id ?? null}, 'assistant', ${welcome})
  `;
  return courseId;
}

export const listCourses = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<CourseCard[]> => {
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      code: string;
      title: string;
      source_kind: string;
      source_name: string | null;
      last_topic_id: number | null;
      last_studied_at: unknown;
      topic_id: number | null;
      topic_title: string | null;
      mastery: number | null;
      attempts: number | null;
    }>`
      select c.id, c.code, c.title, c.source_kind, c.source_name, c.last_topic_id, c.last_studied_at,
             t.id as topic_id, t.title as topic_title, m.mastery, m.attempts
      from courses c
      left join topics t on t.course_id = c.id
      left join topic_mastery m on m.topic_id = t.id and m.user_id = c.user_id
      where c.user_id = ${context.userId}
      order by c.created_at desc, t.position
    `;
    const map = new Map<number, CourseCard & { masteries: number[] }>();
    for (const r of rows) {
      let card = map.get(r.id);
      if (!card) {
        card = {
          id: r.id,
          code: r.code,
          title: r.title,
          sourceKind: r.source_kind as SourceKind,
          sourceName: r.source_name,
          lastTopicTitle: null,
          lastStudiedAt: iso(r.last_studied_at),
          topicCount: 0,
          exploredCount: 0,
          openedCount: 0,
          assessedCount: 0,
          avgMastery: null,
          masteries: [],
        };
        map.set(r.id, card);
      }
      if (r.topic_id) {
        card.topicCount += 1;
        if (topicHasProgress(asInt(r.attempts), r.mastery == null ? null : asInt(r.mastery))) {
          card.exploredCount += 1;
        }
        if (r.mastery != null) {
          card.assessedCount += 1;
          card.masteries.push(asInt(r.mastery));
        }
        if (r.last_topic_id === r.topic_id) {
          card.openedCount += 1;
          card.lastTopicTitle = r.topic_title;
        }
      }
    }
    return [...map.values()].map(({ masteries, ...card }) => ({
      ...card,
      avgMastery: masteries.length
        ? Math.round(masteries.reduce((a, b) => a + b, 0) / masteries.length)
        : null,
    }));
  });

export const getWorkspace = createServerFn({ method: "GET" })
  .validator((input: { courseId: number }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    return buildWorkspace(sql, context.userId, data.courseId);
  });

export const createSampleCourse = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const existing = await sql<{ id: number }>`
      select id from courses
      where user_id = ${context.userId} and source_kind = 'sample' and code = 'CIT 102'
      order by id desc limit 1
    `;
    if (existing[0]) return { courseId: existing[0].id };
    const courseId = await insertDraft(sql, context.userId, sampleAsDraft(), {
      kind: "sample",
      sourceName: SAMPLE_CIT102.sourceName,
    });
    return { courseId };
  });

export const createCourseFromText = createServerFn({ method: "POST" })
  .validator((input: { text: string; sourceName: string; kind: "upload" | "paste"; code?: string; title?: string; format?: string }) => {
    const text = input.text.trim().slice(0, 100_000);
    if (text.length < 80) throw new Error("That document is too short to map into a course.");
    return {
      text,
      sourceName: input.sourceName.slice(0, 180) || "Uploaded material",
      kind: input.kind,
      code: input.code?.trim().slice(0, 32),
      title: input.title?.trim().slice(0, 120),
      format: input.format?.trim().slice(0, 16) || undefined,
    };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const draft = await structureFromText({
      text: data.text,
      hintCode: data.code,
      hintTitle: data.title,
    });
    const courseId = await insertDraft(sql, context.userId, draft, {
      kind: data.kind,
      sourceName: data.sourceName,
      raw: data.text,
      format: data.format,
    });
    const workspace = await buildWorkspace(sql, context.userId, courseId);
    return { courseId, workspace };
  });

export const createCourseFromDocument = createServerFn({ method: "POST" })
  .validator((input: {
    document: NormalizedDocument;
    kind: "upload" | "paste";
    code?: string;
    title?: string;
  }) => {
    const document = input.document;
    if (!document?.source || !Array.isArray(document.blocks)) throw new Error("That document could not be read.");
    const readableChars = document.blocks.reduce((total, block) => total + (typeof block.text === "string" ? block.text.trim().length : 0), 0);
    if (readableChars < 80) throw new Error("That document is too short to map into a course.");
    return {
      document,
      kind: input.kind,
      code: input.code?.trim().slice(0, 32),
      title: input.title?.trim().slice(0, 120),
    };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const draft = await structureFromDocument({
      document: data.document,
      hintCode: data.code,
      hintTitle: data.title,
    });
    const courseId = await insertDraft(sql, context.userId, draft, {
      kind: data.kind,
      sourceName: data.document.source.name.slice(0, 180) || "Uploaded material",
      document: data.document,
      format: data.document.source.format,
    });
    const workspace = await buildWorkspace(sql, context.userId, courseId);
    return { courseId, workspace };
  });

export const renameCourse = createServerFn({ method: "POST" })
  .validator((input: { courseId: number; code: string; title: string }) => ({
    courseId: input.courseId,
    code: input.code.trim().slice(0, 32) || "COURSE",
    title: input.title.trim().slice(0, 120) || "Untitled course",
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      update courses set code = ${data.code}, title = ${data.title}
      where id = ${data.courseId} and user_id = ${context.userId}
    `;
    return buildWorkspace(sql, context.userId, data.courseId);
  });

export const deleteCourse = createServerFn({ method: "POST" })
  .validator((input: { courseId: number }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`delete from courses where id = ${data.courseId} and user_id = ${context.userId}`;
    return { ok: true as const };
  });

export const selectTopic = createServerFn({ method: "POST" })
  .validator((input: { courseId: number; topicId: number }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      update courses
      set last_topic_id = ${data.topicId}, last_studied_at = now()
      where id = ${data.courseId} and user_id = ${context.userId}
    `;
    return buildWorkspace(sql, context.userId, data.courseId);
  });

export const tutorChat = createServerFn({ method: "POST" })
  .validator((input: { courseId: number; topicId?: number | null; message: string }) => {
    const message = input.message.trim().slice(0, 4000);
    if (!message) throw new Error("Type a question first.");
    return { courseId: input.courseId, topicId: input.topicId ?? null, message };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const workspace = await buildWorkspace(sql, context.userId, data.courseId);
    if (!workspace) throw new Error("Course not found");

    const topicId = data.topicId ?? workspace.course.lastTopicId;
    const topics = workspace.chapters.flatMap((ch) => ch.topics);
    const topic = topics.find((t) => t.id === topicId) ?? topics[0];

    await sql`
      insert into messages (user_id, course_id, topic_id, role, content)
      values (${context.userId}, ${data.courseId}, ${topic?.id ?? null}, 'user', ${data.message})
    `;
    await sql`
      update courses
      set last_topic_id = ${topic?.id ?? null}, last_studied_at = now()
      where id = ${data.courseId} and user_id = ${context.userId}
    `;

    const route = routeTutorRequest(data.message);
    const conversation = buildConversationState({ workspace, message: data.message, request: route, topic });
    const pedagogy = decidePedagogy({ conversation });
    if (route.kind === "practice" || route.kind === "exam") {
      const count = route.count ?? (route.kind === "exam" ? 12 : 5);
      const reply =
        route.kind === "exam"
          ? `I'll run a ${count}-question diagnostic across the course rather than dumping questions into chat. Open Exam Readiness when you're ready.`
          : `I won't dump ${count} questions into chat. I'll start a grounded ${count}-question set on ${topic?.title ?? "this topic"} from the source material.`;
      await sql`
        insert into messages (user_id, course_id, topic_id, role, content)
        values (${context.userId}, ${data.courseId}, ${topic?.id ?? null}, 'assistant', ${reply})
      `;
      return {
        workspace: await buildWorkspace(sql, context.userId, data.courseId),
        action: {
          kind: route.kind === "exam" ? ("exam" as const) : ("practice" as const),
          count,
          topicId: route.kind === "exam" ? undefined : topic?.id,
        },
      };
    }

    if (!route.shouldRetrieve) {
      const reply = nonGroundedTutorReply(route.kind, workspace, topic);
      await sql`
        insert into messages (user_id, course_id, topic_id, role, content)
        values (${context.userId}, ${data.courseId}, ${topic?.id ?? null}, 'assistant', ${reply})
      `;
      return {
        workspace: await buildWorkspace(sql, context.userId, data.courseId),
        action: null,
      };
    }

    const retrieved = await retrieveStudyContext({
      sql,
      userId: context.userId,
      courseId: data.courseId,
      query: data.message,
      topic,
      chapters: workspace.chapters,
      sourceName: workspace.course.sourceName,
      courseTitle: workspace.course.title,
    });
    const grounding = evaluateGrounding(retrieved.query, retrieved.evidenceCandidates);
    const groundingCitations = grounding.evidence.map(toCitation);
    const groundingInstruction =
      grounding.status === "grounded"
        ? "Use only the GROUNDING EVIDENCE below for course-specific claims."
        : "The uploaded course material does not provide sufficient evidence to answer this question confidently. Do not invent course-specific facts.";
    const map = workspace.chapters
      .map((ch) => {
        const lines = ch.topics
          .map((t) => `  - ${t.title}${t.mastery == null ? "" : ` (${t.mastery}% mastery)`}`)
          .join("\n");
        return `${ch.title}\n${lines}`;
      })
      .join("\n");
    const history = workspace.messages.slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const system = `You are ApexStudy, an adaptive tutor inside a study system — not a generic chatbot.
Teach ONLY from the retrieved source excerpts. If the source does not cover something, say so.
When you use a fact, cite it with the provided labels such as [Source — p. 17]. Prefer 2–4 short paragraphs, then one check question.
Do not invent a curriculum. Do not dump long quizzes; the app has a Practice action for that.
Only state that the student has mastered a topic if the COURSE MAP above shows that topic's mastery percentage at 75 or above. Never claim mastery from conversation context, navigation, or assumption.
${formatPedagogicalInstruction(pedagogy)}
  ${groundingInstruction}
Current course: ${workspace.course.code} — ${workspace.course.title}
Current topic: ${topic?.title ?? "unspecified"}
Learner note: ${workspace.recommendation.body}

COURSE MAP:
${map}

GROUNDING STATUS: ${grounding.status}
GROUNDING REASON: ${grounding.reason}
GROUNDING EVIDENCE (${retrieved.mode}):
${formatEvidenceContext(grounding.evidence)}`;

    const ai = await chatText({
      system,
      maxTokens: 700,
      feature: "tutor",
      userId: context.userId,
      messages: [...history, { role: "user", content: data.message }],
    });
    let text = ai.ok
      ? ai.text
      : grounding.status !== "grounded"
        ? "I couldn't find enough support for that in the uploaded course material. Try asking about a specific course concept or provide more detail."
        : topic
          ? `${topic.summary}\n\n${topic.keyIdeas.length ? `Hold onto these ideas: ${topic.keyIdeas.join("; ")}.` : ""}\n\nAI tutoring is unavailable right now, so I'm teaching from the indexed source only. Ask me to start a check when you want questions.`
          : ai.error;

    const cites = formatCitationLine(groundingCitations);
    if (cites && !text.includes("[Source") && !text.includes("p.")) {
      text = `${text.trim()}\n\n${cites}`;
    }

    const storedCitations: MessageCitation[] = groundingCitations.map((c) => ({
      chunkId: c.chunkId,
      chunkUid: c.chunkUid,
      documentId: c.documentId,
      sourceName: c.sourceName,
      sourceFormat: c.sourceFormat,
      page: c.page,
      heading: c.heading,
      locatorType: c.locatorType,
      locator: c.locator,
      label: c.label,
      excerpt: c.excerpt,
    }));
    const citationsJson = storedCitations.length ? JSON.stringify(storedCitations) : null;

    await sql`
      insert into messages (user_id, course_id, topic_id, role, content, citations_json)
      values (${context.userId}, ${data.courseId}, ${topic?.id ?? null}, 'assistant', ${text}, ${citationsJson})
    `;
    return {
      workspace: await buildWorkspace(sql, context.userId, data.courseId),
      action: null,
    };
  });

async function generateQuestions(opts: {
  sql: Sql;
  userId: string;
  courseId: number;
  topics: TopicRow[];
  chapters: ChapterRow[];
  sourceName: string | null;
  courseTitle: string;
  count: number;
}): Promise<Array<SampleQuestion & { topicId: number; topicTitle: string; sourcePage: number | null }>> {
  const out: Array<SampleQuestion & { topicId: number; topicTitle: string; sourcePage: number | null }> = [];
  for (const topic of opts.topics) {
    for (const q of sampleQuestionsByTitle(topic.title)) {
      out.push({ ...q, topicId: topic.id, topicTitle: topic.title, sourcePage: null });
    }
  }
  if (out.length >= opts.count) return out.slice(0, opts.count);

  const query = opts.topics.map((t) => `${t.title} ${t.keyIdeas.join(" ")}`).join("\n");
  const retrieved = await retrieveStudyContext({
    sql: opts.sql,
    userId: opts.userId,
    courseId: opts.courseId,
    query,
    topic: opts.topics[0],
    chapters: opts.chapters,
    sourceName: opts.sourceName,
    courseTitle: opts.courseTitle,
  });
  const needed = opts.count - out.length;
  const ai = await chatJson({
    maxTokens: 1800,
    feature: "quiz",
    userId: opts.userId,
    system: `Generate multiple-choice questions grounded ONLY in the source excerpts.
JSON: {"questions":[{"topicTitle":"string","difficulty":"recall"|"application"|"analysis","stem":"string","choices":["a","b","c","d"],"correctIndex":0,"explanation":"string","sourcePage":null}]}
Rules: exactly 4 choices, one correct, no "all of the above", plausible distractors from the material, short explanations that cite the idea and page when present. correctIndex is 0-3.`,
    user: `Need ${needed} questions for topics: ${opts.topics.map((t) => t.title).join("; ")}

SOURCE:
${retrieved.context}`,
  });
  if (ai.ok) {
    try {
      const parsed = extractJsonObject(ai.text) as {
        questions?: Array<{
          topicTitle?: unknown;
          difficulty?: unknown;
          stem?: unknown;
          choices?: unknown;
          correctIndex?: unknown;
          explanation?: unknown;
          sourcePage?: unknown;
        }>;
      };
      for (const q of parsed.questions ?? []) {
        const choices = Array.isArray(q.choices) ? q.choices.map(String).slice(0, 4) : [];
        if (choices.length !== 4 || typeof q.stem !== "string") continue;
        const correctIndex = asInt(q.correctIndex, 0);
        if (correctIndex < 0 || correctIndex > 3) continue;
        const topic =
          opts.topics.find((t) => t.title === q.topicTitle) ??
          opts.topics.find((t) =>
            typeof q.topicTitle === "string"
              ? t.title.toLowerCase().includes(String(q.topicTitle).toLowerCase())
              : false,
          ) ??
          opts.topics[0];
        const difficulty: Difficulty =
          q.difficulty === "application" || q.difficulty === "analysis" || q.difficulty === "recall"
            ? q.difficulty
            : "recall";
        out.push({
          stem: q.stem,
          choices: [choices[0], choices[1], choices[2], choices[3]],
          correctIndex: correctIndex as 0 | 1 | 2 | 3,
          explanation: String(q.explanation ?? "See the source material."),
          difficulty,
          topicId: topic.id,
          topicTitle: topic.title,
          sourcePage: q.sourcePage == null ? null : asInt(q.sourcePage),
        });
      }
    } catch {
      // keep whatever we have
    }
  }
  return out.slice(0, opts.count);
}

function pickTopics(chapters: ChapterRow[], requested: number[] | undefined, kind: QuizKind): TopicRow[] {
  const all = chapters.flatMap((ch) => ch.topics);
  if (requested?.length) {
    const set = new Set(requested);
    const picked = all.filter((t) => set.has(t.id));
    if (picked.length) return picked;
  }
  if (kind === "exam") {
    const weak = [...all].sort((a, b) => (a.mastery ?? -1) - (b.mastery ?? -1));
    return weak.slice(0, Math.min(8, weak.length));
  }
  const last = all.find((t) => t.attempts === 0) ?? all.find((t) => (t.mastery ?? 0) < 70) ?? all[0];
  return last ? [last] : all.slice(0, 1);
}

export const startQuiz = createServerFn({ method: "POST" })
  .validator((input: { courseId: number; kind: QuizKind; topicIds?: number[]; count?: number }) => ({
    courseId: input.courseId,
    kind: input.kind,
    topicIds: input.topicIds,
    count: Math.max(3, Math.min(20, input.count ?? (input.kind === "exam" ? 12 : 5))),
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<QuizView> => {
    const sql = await getSql();
    const workspace = await buildWorkspace(sql, context.userId, data.courseId);
    if (!workspace) throw new Error("Course not found");
    const topics = pickTopics(workspace.chapters, data.topicIds, data.kind);
    if (!topics.length) throw new Error("No topics to assess");
    const generated = await generateQuestions({
      sql,
      userId: context.userId,
      courseId: data.courseId,
      topics,
      chapters: workspace.chapters,
      sourceName: workspace.course.sourceName,
      courseTitle: workspace.course.title,
      count: data.count,
    });
    if (!generated.length) throw new Error("Could not generate questions from this material.");

    const session = await sql<{ id: number }>`
      insert into quiz_sessions (user_id, course_id, kind, topic_ids_json, status)
      values (
        ${context.userId}, ${data.courseId}, ${data.kind},
        ${JSON.stringify(topics.map((t) => t.id))}, 'active'
      )
      returning id
    `;
    const sessionId = session[0].id;
    const questions: QuizQuestion[] = [];
    for (const q of generated) {
      const row = await sql<{ id: number }>`
        insert into questions (
          user_id, course_id, topic_id, session_id, stem, choices_json, correct_index,
          explanation, difficulty, source_page
        ) values (
          ${context.userId}, ${data.courseId}, ${q.topicId}, ${sessionId}, ${q.stem},
          ${JSON.stringify(q.choices)}, ${q.correctIndex}, ${q.explanation}, ${q.difficulty},
          ${q.sourcePage}
        )
        returning id
      `;
      questions.push({
        id: row[0].id,
        topicId: q.topicId,
        topicTitle: q.topicTitle,
        stem: q.stem,
        choices: q.choices,
        difficulty: q.difficulty,
        sourcePage: q.sourcePage,
        selectedIndex: null,
      });
    }
    return { sessionId, kind: data.kind, status: "active", questions, score: null };
  });

export const submitAnswer = createServerFn({ method: "POST" })
  .validator((input: { questionId: number; selectedIndex: number }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      course_id: number;
      topic_id: number;
      session_id: number | null;
      correct_index: number;
      explanation: string;
      stem: string;
      choices_json: string;
      difficulty: string;
      source_page: number | null;
    }>`
      select id, course_id, topic_id, session_id, correct_index, explanation, stem, choices_json, difficulty, source_page
      from questions
      where id = ${data.questionId} and user_id = ${context.userId}
    `;
    const q = rows[0];
    if (!q) throw new Error("Question not found");
    const already = await sql<{ id: number }>`
      select id from answers where question_id = ${q.id} and user_id = ${context.userId} limit 1
    `;
    const isCorrect = data.selectedIndex === q.correct_index;
    if (!already[0]) {
      await sql`
        insert into answers (user_id, question_id, course_id, topic_id, selected_index, is_correct)
        values (${context.userId}, ${q.id}, ${q.course_id}, ${q.topic_id}, ${data.selectedIndex}, ${isCorrect})
      `;
      const masteryRows = await sql<{ mastery: number | null; attempts: number; correct: number }>`
        select mastery, attempts, correct from topic_mastery
        where user_id = ${context.userId} and topic_id = ${q.topic_id}
      `;
      const prev = masteryRows[0];
      const nextMastery = updateMastery(prev?.mastery ?? null, isCorrect);
      const attempts = (prev?.attempts ?? 0) + 1;
      const correct = (prev?.correct ?? 0) + (isCorrect ? 1 : 0);
      if (prev) {
        await sql`
          update topic_mastery
          set mastery = ${nextMastery}, attempts = ${attempts}, correct = ${correct}, last_assessed_at = now()
          where user_id = ${context.userId} and topic_id = ${q.topic_id}
        `;
      } else {
        await sql`
          insert into topic_mastery (user_id, course_id, topic_id, mastery, attempts, correct, last_assessed_at)
          values (${context.userId}, ${q.course_id}, ${q.topic_id}, ${nextMastery}, ${attempts}, ${correct}, now())
        `;
      }
    }
    return {
      correctIndex: q.correct_index,
      explanation: q.explanation,
      isCorrect,
    };
  });

export const completeQuiz = createServerFn({ method: "POST" })
  .validator((input: { sessionId: number }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<QuizView> => {
    const sql = await getSql();
    await sql`
      update quiz_sessions set status = 'complete'
      where id = ${data.sessionId} and user_id = ${context.userId}
    `;
    const session = await sql<{ id: number; course_id: number; kind: string; status: string }>`
      select id, course_id, kind, status from quiz_sessions
      where id = ${data.sessionId} and user_id = ${context.userId}
    `;
    const s = session[0];
    if (!s) throw new Error("Session not found");
    const qs = await sql<{
      id: number;
      topic_id: number;
      stem: string;
      choices_json: string;
      correct_index: number;
      explanation: string;
      difficulty: string;
      source_page: number | null;
      selected_index: number | null;
      is_correct: boolean | null;
      topic_title: string;
    }>`
      select q.id, q.topic_id, q.stem, q.choices_json, q.correct_index, q.explanation, q.difficulty, q.source_page,
             a.selected_index, a.is_correct, t.title as topic_title
      from questions q
      join topics t on t.id = q.topic_id
      left join answers a on a.question_id = q.id and a.user_id = q.user_id
      where q.session_id = ${data.sessionId} and q.user_id = ${context.userId}
      order by q.id
    `;
    const questions: QuizQuestion[] = qs.map((q) => ({
      id: q.id,
      topicId: q.topic_id,
      topicTitle: q.topic_title,
      stem: q.stem,
      choices: parseIdeas(q.choices_json).length ? parseIdeas(q.choices_json) : (JSON.parse(q.choices_json) as string[]),
      difficulty: q.difficulty as Difficulty,
      sourcePage: q.source_page,
      selectedIndex: q.selected_index,
      correctIndex: q.correct_index,
      explanation: q.explanation,
      isCorrect: q.is_correct ?? undefined,
    }));
    const answered = questions.filter((q) => q.selectedIndex != null);
    const right = questions.filter((q) => q.isCorrect).length;
    const score = answered.length ? Math.round((right / questions.length) * 100) : 0;
    return {
      sessionId: s.id,
      kind: s.kind as QuizKind,
      status: "complete",
      questions,
      score,
    };
  });

export const listenToTopic = createServerFn({ method: "POST" })
  .validator((input: { courseId: number; topicId: number }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const workspace = await buildWorkspace(sql, context.userId, data.courseId);
    if (!workspace) throw new Error("Course not found");
    const topics = workspace.chapters.flatMap((ch) => ch.topics);
    const topic = topics.find((t) => t.id === data.topicId);
    if (!topic) throw new Error("Topic not found");

    const retrieved = await retrieveStudyContext({
      sql,
      userId: context.userId,
      courseId: data.courseId,
      query: `${topic.title}. ${topic.summary}`,
      topic,
      chapters: workspace.chapters,
      sourceName: workspace.course.sourceName,
      courseTitle: workspace.course.title,
    });
    const ideas = topic.keyIdeas;
    const sourceBit = retrieved.selected[0]?.chunk.content ?? "";
    const script = [
      `${topic.title}.`,
      topic.summary,
      ideas.length ? `The ideas to hold onto are: ${ideas.join("; ")}.` : "",
      sourceBit,
    ]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .slice(0, 880);

    await sql`
      update courses set last_topic_id = ${topic.id}, last_studied_at = now()
      where id = ${data.courseId} and user_id = ${context.userId}
    `;

    const spoken = await speak(script);
    const storedCitations: MessageCitation[] = retrieved.citations.map((c) => ({
      chunkId: c.chunkId,
      chunkUid: c.chunkUid,
      documentId: c.documentId,
      sourceName: c.sourceName,
      sourceFormat: c.sourceFormat,
      page: c.page,
      heading: c.heading,
      locatorType: c.locatorType,
      locator: c.locator,
      label: c.label,
      excerpt: c.excerpt,
    }));
    const citeLine = formatCitationLine(retrieved.citations);
    const transcript = citeLine ? `${script}\n\n${citeLine}` : script;
    if (!spoken.ok) {
      return {
        transcript,
        citations: storedCitations,
        audioBase64: null as string | null,
        mime: null as string | null,
        error: spoken.error,
      };
    }
    return {
      transcript,
      citations: storedCitations,
      audioBase64: spoken.audioBase64,
      mime: spoken.mime,
      error: null as string | null,
    };
  });
