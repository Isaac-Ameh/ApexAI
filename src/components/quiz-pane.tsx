import { useEffect, useState } from "react";
import type { QuizView } from "@/lib/apex/types";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Skeleton } from "./ui/skeleton";

export function QuizSkeleton({ label = "Writing questions from the source…" }: { label?: string }) {
  return (
    <div className="mx-auto max-w-xl py-4" aria-busy="true" aria-live="polite">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
      <div className="mt-6 flex gap-2">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-16 w-full" />
      <div className="mt-5 space-y-2">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function QuizPane({
  quiz,
  revealEach,
  onAnswer,
  onFinish,
  onRetry,
}: {
  quiz: QuizView;
  revealEach: boolean;
  onAnswer: (questionId: number, selectedIndex: number) => Promise<{
    correctIndex: number;
    explanation: string;
    isCorrect: boolean;
  }>;
  onFinish: () => void;
  onRetry: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [local, setLocal] = useState(quiz);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setLocal(quiz);
    if (quiz.status === "active") setIndex(0);
  }, [quiz]);

  const q = local.questions[index];
  const answeredCount = local.questions.filter((item) => item.selectedIndex != null).length;
  const done = local.status === "complete";

  if (!q) {
    return <p className="p-6 text-sm text-muted-foreground">No questions in this set.</p>;
  }

  if (done) {
    const right = local.questions.filter((item) => item.isCorrect).length;
    return (
      <div className="mx-auto max-w-xl py-6 pb-10">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          {local.kind === "exam" ? "Practice exam" : "Practice"}
        </p>
        <h2 className="mt-2 font-serif text-3xl tracking-tight">
          {local.score ?? 0}% · {right}/{local.questions.length}
        </h2>
        <Progress value={local.score ?? 0} className="mt-4" aria-label="Score" />
        <ul className="mt-6 space-y-3">
          {local.questions.map((item, i) => (
            <li key={item.id} className="rounded-lg bg-card p-4 shadow-[var(--shadow-border)]">
              <p className="truncate text-xs text-muted-foreground">
                {i + 1}. {item.topicTitle}
              </p>
              <p className="mt-1 text-pretty break-words text-sm">{item.stem}</p>
              <p
                className={cn(
                  "mt-2 text-pretty break-words text-sm",
                  item.isCorrect ? "text-ok" : "text-destructive",
                )}
              >
                {item.isCorrect ? "Correct" : "Missed"} — {item.explanation}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
          <Button className="w-full sm:w-auto" variant="secondary" onClick={onRetry}>
            Try another set
          </Button>
          <Button className="w-full sm:w-auto" onClick={onFinish}>
            Back to study
          </Button>
        </div>
      </div>
    );
  }

  const revealed = q.selectedIndex != null && (revealEach || false);

  return (
    <div className="mx-auto flex max-w-xl flex-col py-4 pb-10">
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="uppercase tracking-[0.16em]">
          {local.kind === "exam" ? "Practice exam" : local.kind === "check" ? "Check" : "Practice"}
        </span>
        <span className="tabular-nums">
          {index + 1} / {local.questions.length}
        </span>
      </div>
      <Progress
        value={(answeredCount / local.questions.length) * 100}
        className="mt-3"
        aria-label="Questions answered"
      />
      <div className="mt-6 flex min-w-0 flex-wrap gap-2">
        <Badge className="max-w-full truncate">{q.topicTitle}</Badge>
        <Badge variant="default">{q.difficulty}</Badge>
        {q.sourcePage != null ? <Badge>p.{q.sourcePage}</Badge> : null}
      </div>
      <h2 className="mt-4 font-serif text-2xl tracking-tight text-pretty break-words">{q.stem}</h2>
      <ul
        role="radiogroup"
        aria-label="Answer choices"
        className="mt-5 space-y-2"
      >
        {q.choices.map((choice, i) => {
          const selected = q.selectedIndex === i;
          const isAnswer = revealed && q.correctIndex === i;
          const isWrong = revealed && selected && !q.isCorrect;
          return (
            <li key={`${q.id}-${i}`}>
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={q.selectedIndex != null || pending}
                onKeyDown={(e) => {
                  if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "ArrowRight" && e.key !== "ArrowLeft") {
                    return;
                  }
                  e.preventDefault();
                  const delta = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1;
                  const next = (i + delta + q.choices.length) % q.choices.length;
                  const el = e.currentTarget
                    .closest("[role='radiogroup']")
                    ?.querySelectorAll<HTMLButtonElement>("[role='radio']")[next];
                  el?.focus();
                }}
                onClick={async () => {
                  setPending(true);
                  try {
                    const result = await onAnswer(q.id, i);
                    setLocal((prev) => ({
                      ...prev,
                      questions: prev.questions.map((item) =>
                        item.id === q.id
                          ? {
                              ...item,
                              selectedIndex: i,
                              correctIndex: result.correctIndex,
                              explanation: result.explanation,
                              isCorrect: result.isCorrect,
                            }
                          : item,
                      ),
                    }));
                  } finally {
                    setPending(false);
                  }
                }}
                className={cn(
                  "flex min-h-12 w-full items-start gap-3 rounded-lg px-4 py-3 text-left text-sm shadow-[var(--shadow-border)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected && !revealed && "bg-accent",
                  isAnswer && "bg-ok/15 text-foreground",
                  isWrong && "bg-destructive/15",
                  q.selectedIndex == null && "hover:bg-accent",
                )}
              >
                <span className="mt-0.5 w-4 shrink-0 font-medium text-muted-foreground">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="min-w-0 flex-1 text-pretty break-words">{choice}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {revealed && q.explanation ? (
        <p className="mt-4 text-pretty break-words text-sm text-muted-foreground">{q.explanation}</p>
      ) : null}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        {index > 0 ? (
          <Button variant="ghost" onClick={() => setIndex((n) => n - 1)}>
            Back
          </Button>
        ) : null}
        <Button
          className="min-w-28"
          disabled={q.selectedIndex == null}
          onClick={() => {
            if (index < local.questions.length - 1) setIndex((n) => n + 1);
            else onFinish();
          }}
        >
          {index < local.questions.length - 1 ? "Next" : "See results"}
        </Button>
      </div>
    </div>
  );
}
