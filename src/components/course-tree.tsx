import { Check } from "lucide-react";
import type { ChapterRow } from "@/lib/apex/types";
import { cn } from "@/lib/utils";

export function CourseTree({
  chapters,
  activeTopicId,
  onSelect,
}: {
  chapters: ChapterRow[];
  activeTopicId: number | null;
  onSelect: (topicId: number) => void;
}) {
  return (
    <nav aria-label="Course" className="space-y-5">
      {chapters.map((ch) => {
        const done = ch.topics.length > 0 && ch.topics.every((t) => (t.mastery ?? 0) >= 75);
        return (
          <div key={ch.id}>
            <p className="flex items-start gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {done ? <Check className="mt-0.5 size-3.5 shrink-0 text-ok" /> : null}
              <span className="min-w-0 text-pretty">{ch.title}</span>
            </p>
            <ul className="mt-2 space-y-0.5">
              {ch.topics.map((t) => {
                const active = t.id === activeTopicId;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(t.id)}
                      aria-current={active ? "page" : undefined}
                      title={t.title}
                      className={cn(
                        "flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{t.title}</span>
                      <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                        {t.mastery == null ? "—" : `${t.mastery}%`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
