import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CourseWorkspace, NextAction } from "@/lib/apex/types";
import { MessageContent } from "./message-content";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

export function TutorPane({
  workspace,
  topicTitle,
  busy,
  error,
  onSend,
  onAction,
}: {
  workspace: CourseWorkspace;
  topicTitle: string | null;
  busy: boolean;
  error?: string | null;
  onSend: (message: string) => void;
  onAction: (action: NextAction) => void;
}) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [workspace.messages.length, busy]);

  const rec = workspace.recommendation;
  const showRec = workspace.messages.length <= 2;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1 py-4"
      >
        {showRec ? (
          <div className="rounded-xl bg-card p-5 shadow-[var(--shadow-border)]">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Welcome back</p>
            <h2 className="mt-2 font-serif text-2xl tracking-tight">{rec.title}</h2>
            <p className="mt-2 text-pretty text-sm text-muted-foreground">{rec.body}</p>
            <Button className="mt-4" onClick={() => onAction(rec)}>
              {rec.cta}
            </Button>
          </div>
        ) : null}

        {workspace.messages.map((m) => (
          <article
            key={m.id}
            className={
              m.role === "user"
                ? "ml-4 rounded-lg bg-secondary px-4 py-3 text-sm sm:ml-8"
                : "mr-2 text-sm leading-relaxed text-foreground sm:mr-4"
            }
          >
            {m.role === "assistant" ? (
              <p className="mb-1 truncate text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Study tutor{topicTitle ? ` · ${topicTitle}` : ""}
              </p>
            ) : null}
            {m.role === "assistant" ? (
              <MessageContent content={m.content} citations={m.citations} />
            ) : (
              <p className="whitespace-pre-wrap break-words text-pretty">{m.content}</p>
            )}
          </article>
        ))}
        {busy ? (
          <div className="space-y-2" aria-live="polite" aria-label="Tutor is writing">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : null}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <div ref={endRef} />
      </div>

      <form
        className="border-t border-border bg-background py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        aria-label="Send a message to the tutor"
        onSubmit={(e) => {
          e.preventDefault();
          const text = draft.trim();
          if (!text || busy) return;
          setDraft("");
          onSend(text);
        }}
      >
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask anything about this course…"
            aria-label="Message the tutor"
            autoComplete="off"
            className="h-12 min-w-0 flex-1 rounded-lg bg-secondary px-4 text-sm shadow-[var(--shadow-border)] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" size="icon" disabled={busy || !draft.trim()} aria-label="Send">
            <ArrowUp className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
