export type DraftTopic = {
  title: string;
  summary: string;
  keyIdeas: string[];
};

export type DraftChapter = {
  title: string;
  topics: DraftTopic[];
};

export type DraftCourse = {
  code: string;
  title: string;
  chapters: DraftChapter[];
};

function windows(text: string, size = 1800, overlap = 0): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= size) return [clean];
  const out: string[] = [];
  let i = 0;
  while (i < clean.length) {
    out.push(clean.slice(i, i + size));
    i += size - overlap;
  }
  return out;
}

const HEADING =
  /^(?:chapter\s+\d+\b|[0-9]{1,2}(?:\.[0-9]{1,2}){0,2}\s+\S.{2,80}|[A-Z][A-Z0-9 ,/\-]{8,72})$/;

export function fallbackStructure(raw: string, hint?: { code?: string; title?: string }): DraftCourse {
  const lines = raw.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const heads = lines.filter((l) => HEADING.test(l)).slice(0, 20);
  const title = hint?.title || heads[0] || "Untitled course";
  const code = hint?.code || (title.match(/\b[A-Z]{2,4}\s?\d{2,3}\b/)?.[0] ?? "COURSE");

  if (heads.length >= 3) {
    const chapters: DraftChapter[] = [];
    let current: DraftChapter = { title: "Introduction", topics: [] };
    for (const h of heads) {
      if (/^chapter\s+\d+/i.test(h) || /^[0-9]+\s/.test(h)) {
        if (current.topics.length) chapters.push(current);
        current = { title: h, topics: [] };
      } else {
        current.topics.push({
          title: h,
          summary: `Material covering ${h}, taken from the uploaded source.`,
          keyIdeas: [h],
        });
      }
    }
    if (current.topics.length) chapters.push(current);
    if (!chapters.length) {
      chapters.push({
        title: "Course material",
        topics: heads.map((h) => ({
          title: h,
          summary: `Material covering ${h}.`,
          keyIdeas: [h],
        })),
      });
    }
    return { code, title, chapters: chapters.slice(0, 12) };
  }

  const slices = windows(raw.replace(/\s+/g, " "), 1800, 0).slice(0, 8);
  return {
    code,
    title,
    chapters: [
      {
        title: "Course material",
        topics: slices.map((s, i) => ({
          title: `Section ${i + 1}`,
          summary: s.slice(0, 240),
          keyIdeas: [],
        })),
      },
    ],
  };
}
