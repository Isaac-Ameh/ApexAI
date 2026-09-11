import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ListTree, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { CourseTree } from "@/components/course-tree";
import { ListenPane } from "@/components/listen-pane";
import { QuizPane, QuizSkeleton } from "@/components/quiz-pane";
import { ReadinessPane } from "@/components/readiness-pane";
import { StateBlock } from "@/components/state-block";
import { TutorPane } from "@/components/tutor-pane";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  completeQuiz,
  deleteCourse,
  getWorkspace,
  selectTopic,
  startQuiz,
  submitAnswer,
  tutorChat,
} from "@/lib/apex/actions";
import type { NextAction, QuizKind, QuizView } from "@/lib/apex/types";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";

type Mode = "study" | "practice" | "exam" | "listen";

export const Route = createFileRoute("/courses/$courseId")({
  validateSearch: (search: { [key: string]: unknown }) => {
    const mode = search.mode;
    return {
      mode: (mode === "practice" || mode === "exam" || mode === "listen" ? mode : "study") as Mode,
      topic: typeof search.topic === "number" ? search.topic : Number(search.topic) || undefined,
    };
  },
  component: CoursePage,
});

function CoursePage() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <WorkspaceSkeleton />;
  }
  if (!user) return <RedirectToSignIn />;
  return <CourseWorkspaceView />;
}

function WorkspaceSkeleton() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <AppHeader compact />
      <div className="border-b border-border px-4 py-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-3 h-1.5 max-w-xs rounded-full" />
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-11 w-20 rounded-full" />
          <Skeleton className="h-11 w-24 rounded-full" />
          <Skeleton className="h-11 w-16 rounded-full" />
          <Skeleton className="h-11 w-20 rounded-full" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="hidden w-72 shrink-0 border-r border-border p-4 lg:block">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-3 h-11 w-full rounded-md" />
          <Skeleton className="mt-1 h-11 w-full rounded-md" />
          <Skeleton className="mt-1 h-11 w-full rounded-md" />
          <Skeleton className="mt-6 h-3 w-28" />
          <Skeleton className="mt-3 h-11 w-full rounded-md" />
          <Skeleton className="mt-1 h-11 w-full rounded-md" />
        </div>
        <div className="min-w-0 flex-1 p-4">
          <Skeleton className="h-36 w-full max-w-2xl rounded-xl" />
          <Skeleton className="mt-4 h-16 w-2/3 max-w-2xl" />
        </div>
      </div>
    </div>
  );
}

function CourseWorkspaceView() {
  const { courseId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const id = Number(courseId);
  const [treeOpen, setTreeOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tutorError, setTutorError] = useState(null as string | null);
  const [quiz, setQuiz] = useState(null as QuizView | null);
  const [quizError, setQuizError] = useState(null as string | null);
  const [startingQuiz, setStartingQuiz] = useState(false);

  const query = useQuery({
    queryKey: ["workspace", id],
    queryFn: () => getWorkspace({ data: { courseId: id } }),
    enabled: Number.isFinite(id),
  });

  const workspace = query.data ?? null;
  const topics = useMemo(
    () => workspace?.chapters.flatMap((ch) => ch.topics) ?? [],
    [workspace],
  );
  const activeTopicId = search.topic ?? workspace?.course.lastTopicId ?? topics[0]?.id ?? null;
  const activeTopic = topics.find((t) => t.id === activeTopicId) ?? null;

  function setMode(mode: Mode, topic?: number) {
    void navigate({
      to: "/courses/$courseId",
      params: { courseId },
      search: { mode, topic: topic ?? activeTopicId ?? undefined },
    });
  }

  async function onSelectTopic(topicId: number) {
    setTreeOpen(false);
    setMode(search.mode, topicId);
    try {
      const next = await selectTopic({ data: { courseId: id, topicId } });
      queryClient.setQueryData(["workspace", id], next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open topic");
    }
  }

  async function launchQuiz(kind: QuizKind, topicIds?: number[], count?: number) {
    setStartingQuiz(true);
    setQuizError(null);
    try {
      const view = await startQuiz({
        data: { courseId: id, kind, topicIds, count },
      });
      setQuiz(view);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start questions";
      setQuizError(message);
      toast.error(message);
    } finally {
      setStartingQuiz(false);
    }
  }

  async function onSend(message: string) {
    setBusy(true);
    setTutorError(null);
    try {
      const result = await tutorChat({
        data: { courseId: id, topicId: activeTopicId, message },
      });
      queryClient.setQueryData(["workspace", id], result.workspace);
      if (result.action) {
        if (result.action.kind === "exam") setMode("exam");
        else {
          setMode("practice", result.action.topicId);
          await launchQuiz(
            "practice",
            result.action.topicId ? [result.action.topicId] : undefined,
            result.action.count,
          );
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "The tutor could not reply";
      setTutorError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function onAction(action: NextAction) {
    if (action.kind === "exam") {
      setMode("exam", action.topicId);
      await launchQuiz("exam", undefined, action.count);
      return;
    }
    if (action.kind === "practice" || action.kind === "check") {
      setMode("practice", action.topicId);
      await launchQuiz(action.kind, action.topicId ? [action.topicId] : undefined, action.count);
      return;
    }
    if (action.topicId) await onSelectTopic(action.topicId);
    setMode("study", action.topicId);
  }

  async function finishQuiz() {
    if (!quiz) return;
    try {
      const view = await completeQuiz({ data: { sessionId: quiz.sessionId } });
      setQuiz(view);
      await query.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not finish the set");
    }
  }

  if (query.isLoading) {
    return <WorkspaceSkeleton />;
  }

  if (query.isError) {
    return (
      <div className="flex min-h-dvh flex-col">
        <AppHeader compact />
        <main className="mx-auto w-full max-w-lg px-4 py-16">
          <StateBlock
            tone="danger"
            title="Could not load this course"
            body={query.error instanceof Error ? query.error.message : "Something went wrong while opening the workspace."}
            action={
              <>
                <Button onClick={() => void query.refetch()}>Try again</Button>
                <Button asChild variant="secondary">
                  <Link to="/">My courses</Link>
                </Button>
              </>
            }
          />
        </main>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex min-h-dvh flex-col">
        <AppHeader compact />
        <main className="mx-auto w-full max-w-lg px-4 py-16">
          <StateBlock
            title="Course not found"
            body="It may have been removed, or the link is no longer valid."
            action={
              <Button asChild>
                <Link to="/">My courses</Link>
              </Button>
            }
          />
        </main>
      </div>
    );
  }

  const modes = [
    { id: "study" as const, label: "Study" },
    { id: "practice" as const, label: "Practice" },
    { id: "exam" as const, label: "Exam" },
    { id: "listen" as const, label: "Listen" },
  ];

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <AppHeader
        compact
        trailing={
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center text-sm text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={async () => {
              if (!window.confirm("Remove this course and its study history?")) return;
              await deleteCourse({ data: { courseId: id } });
              await queryClient.invalidateQueries({ queryKey: ["courses"] });
              await navigate({ to: "/" });
            }}
            aria-label="Delete course"
          >
            <Trash2 className="size-4" />
          </button>
        }
      />

      <div className="border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            onClick={() => setTreeOpen(true)}
            aria-expanded={treeOpen}
            aria-controls="course-map-drawer"
          >
            <ListTree className="size-4" />
            Course
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-baseline gap-2">
              <h1 className="shrink-0 font-serif text-xl tracking-tight sm:text-2xl">
                {workspace.course.code}
              </h1>
              <span className="min-w-0 truncate text-sm text-muted-foreground">{workspace.course.title}</span>
            </div>
            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
              <Progress
                value={workspace.readiness.exploredPct}
                className="min-w-0 max-w-xs flex-1"
                aria-label="Course explored"
              />
              <span className="text-xs tabular-nums text-muted-foreground">
                {workspace.readiness.exploredPct}% explored
              </span>
              <Badge variant={workspace.readiness.label === "Exam ready" ? "ok" : "default"}>
                {workspace.readiness.label}
              </Badge>
            </div>
          </div>
        </div>
        <div role="tablist" aria-label="Study mode" className="flex gap-1 overflow-x-auto px-4 pb-3">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={search.mode === m.id}
              onClick={() => {
                if (m.id !== search.mode) {
                  setQuiz(null);
                  setQuizError(null);
                }
                setMode(m.id);
              }}
              className={cn(
                "h-11 shrink-0 rounded-full px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                search.mode === m.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden w-72 shrink-0 overflow-y-auto overscroll-contain border-r border-border p-4 lg:block">
          <CourseTree
            chapters={workspace.chapters}
            activeTopicId={activeTopicId}
            onSelect={(tid) => void onSelectTopic(tid)}
          />
        </aside>

        {treeOpen ? (
          <div
            id="course-map-drawer"
            className="fixed inset-0 z-40 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Course map"
          >
            <button
              type="button"
              className="absolute inset-0 bg-ink/70"
              aria-label="Close course map"
              onClick={() => setTreeOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-[min(20rem,88vw)] overflow-y-auto overscroll-contain bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-border)]">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-serif text-lg">Course</p>
                <button
                  type="button"
                  className="grid size-11 place-items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => setTreeOpen(false)}
                  aria-label="Close course map"
                >
                  <X className="size-4" />
                </button>
              </div>
              <CourseTree
                chapters={workspace.chapters}
                activeTopicId={activeTopicId}
                onSelect={(tid) => void onSelectTopic(tid)}
              />
            </div>
          </div>
        ) : null}

        <main
          className={cn(
            "min-h-0 min-w-0 flex-1 px-4 lg:px-8",
            search.mode === "study" ? "overflow-hidden" : "overflow-y-auto overscroll-contain",
          )}
        >
          {search.mode === "study" ? (
            <div className="mx-auto flex h-full max-w-2xl flex-col">
              <TutorPane
                workspace={workspace}
                topicTitle={activeTopic?.title ?? null}
                busy={busy}
                error={tutorError}
                onSend={(m) => void onSend(m)}
                onAction={(a) => void onAction(a)}
              />
            </div>
          ) : null}

          {search.mode === "practice" ? (
            startingQuiz ? (
              <QuizSkeleton />
            ) : quiz ? (
              <QuizPane
                key={`${quiz.sessionId}-${quiz.status}`}
                quiz={quiz}
                revealEach
                onAnswer={(questionId, selectedIndex) =>
                  submitAnswer({ data: { questionId, selectedIndex } })
                }
                onFinish={() => {
                  if (quiz.status === "complete") {
                    setQuiz(null);
                    setMode("study");
                  } else {
                    void finishQuiz();
                  }
                }}
                onRetry={() =>
                  void launchQuiz("practice", activeTopicId ? [activeTopicId] : undefined, 5)
                }
              />
            ) : (
              <div className="mx-auto max-w-xl py-16">
                {quizError ? (
                  <StateBlock
                    tone="danger"
                    title="Could not start practice"
                    body={quizError}
                    action={
                      <Button
                        onClick={() =>
                          void launchQuiz("practice", activeTopicId ? [activeTopicId] : undefined, 5)
                        }
                      >
                        Try again
                      </Button>
                    }
                  />
                ) : (
                  <>
                    <h2 className="font-serif text-2xl">Practice</h2>
                    <p className="mt-2 text-pretty text-sm text-muted-foreground">
                      A short set grounded in {activeTopic?.title ?? "the current topic"}.
                    </p>
                    <Button
                      className="mt-6"
                      onClick={() =>
                        void launchQuiz("practice", activeTopicId ? [activeTopicId] : undefined, 5)
                      }
                    >
                      Start 5-question set
                    </Button>
                  </>
                )}
              </div>
            )
          ) : null}

          {search.mode === "exam" ? (
            startingQuiz ? (
              <QuizSkeleton label="Assembling a diagnostic from the source…" />
            ) : quiz ? (
              <QuizPane
                key={`${quiz.sessionId}-${quiz.status}`}
                quiz={quiz}
                revealEach={false}
                onAnswer={(questionId, selectedIndex) =>
                  submitAnswer({ data: { questionId, selectedIndex } })
                }
                onFinish={() => {
                  if (quiz.status === "complete") {
                    setQuiz(null);
                    setMode("exam");
                  } else {
                    void finishQuiz();
                  }
                }}
                onRetry={() => void launchQuiz("exam", undefined, 12)}
              />
            ) : quizError ? (
              <div className="mx-auto max-w-xl py-16">
                <StateBlock
                  tone="danger"
                  title="Could not start the exam"
                  body={quizError}
                  action={<Button onClick={() => void launchQuiz("exam", undefined, 12)}>Try again</Button>}
                />
              </div>
            ) : (
              <ReadinessPane
                workspace={workspace}
                onExam={() => void launchQuiz("exam", undefined, 12)}
                onPractice={(topicId) => {
                  setMode("practice", topicId);
                  void launchQuiz("practice", [topicId], 8);
                }}
              />
            )
          ) : null}

          {search.mode === "listen" ? <ListenPane courseId={id} topic={activeTopic} /> : null}
        </main>
      </div>
    </div>
  );
}
