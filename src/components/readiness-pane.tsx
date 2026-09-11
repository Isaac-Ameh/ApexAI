import type { CourseWorkspace } from "@/lib/apex/types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

export function ReadinessPane({
  workspace,
  onExam,
  onPractice,
}: {
  workspace: CourseWorkspace;
  onExam: () => void;
  onPractice: (topicId: number) => void;
}) {
  const r = workspace.readiness;
  return (
    <div className="mx-auto max-w-xl py-6 pb-10">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Exam readiness</p>
      <h2 className="mt-2 font-serif text-4xl tracking-tight">{r.label}</h2>
      <p className="mt-2 text-pretty text-sm text-muted-foreground">
        Overall mastery among assessed topics is {r.overall}%. {r.assessedPct}% of the course has
        evidence; {r.exploredPct}% has study evidence from attempts or a mastery score.
      </p>
      <Progress value={r.overall} className="mt-5" aria-label="Overall mastery" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl bg-card p-5 shadow-[var(--shadow-border)]">
          <h3 className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Strong</h3>
          {r.strong.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nothing is solid yet. That is expected.</p>
          ) : (
            <ul className="mt-3 space-y-1">
              {r.strong.map((t) => (
                <li key={t.id} className="flex min-h-11 items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate" title={t.title}>
                    {t.title}
                  </span>
                  <Badge variant="ok" className="shrink-0">
                    {t.mastery}%
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-xl bg-card p-5 shadow-[var(--shadow-border)]">
          <h3 className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Needs attention</h3>
          {r.needsAttention.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No weak topics on record.</p>
          ) : (
            <ul className="mt-3 space-y-1">
              {r.needsAttention.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                  <button
                    type="button"
                    className="min-h-11 min-w-0 flex-1 truncate rounded-md px-1 text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    title={t.title}
                    onClick={() => onPractice(t.id)}
                  >
                    {t.title}
                  </button>
                  <Badge variant={t.mastery == null ? "default" : "warn"} className="shrink-0">
                    {t.mastery == null ? "unassessed" : `${t.mastery}%`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {r.weakest ? (
        <p className="mt-6 text-pretty text-sm">
          Most important weakness: <span className="font-medium">{r.weakest.title}</span>
        </p>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap">
        <Button className="w-full sm:w-auto" onClick={onExam}>
          Start practice exam
        </Button>
        {r.weakest ? (
          <Button className="w-full sm:w-auto" variant="secondary" onClick={() => onPractice(r.weakest!.id)}>
            Targeted practice
          </Button>
        ) : null}
      </div>
    </div>
  );
}
