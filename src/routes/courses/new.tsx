import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, FileText, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { StateBlock } from "@/components/state-block";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { createCourseFromDocument, createSampleCourse, getWorkspace, renameCourse } from "@/lib/apex/actions";
import { InjectionError, injectFile, injectText, type NormalizedDocument } from "@/lib/apex/inject";
import type { CourseWorkspace } from "@/lib/apex/types";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/courses/new")({
  validateSearch: (search: { [key: string]: unknown }) => ({
    sample: search.sample === 1 || search.sample === "1" ? 1 : undefined,
  }),
  component: NewCoursePage,
});

const STEPS = [
  "Document processed",
  "Chapters detected",
  "Topics identified",
  "Concepts mapped",
  "Sources indexed",
  "Structure checked",
];

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function NewCoursePage() {
  const { user, isPending } = useCurrentUserState();
  const search = Route.useSearch();
  if (isPending) {
    return (
      <div className="min-h-dvh">
        <AppHeader />
        <div className="mx-auto max-w-xl px-4 py-16">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-10 w-72" />
          <Skeleton className="mt-8 h-44 w-full rounded-xl" />
          <Skeleton className="mt-4 h-32 w-full rounded-lg" />
        </div>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  return <NewCourseForm autoSample={search.sample === 1} />;
}

function NewCourseForm({ autoSample }: { autoSample: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [paste, setPaste] = useState("");
  const [fileName, setFileName] = useState(null as string | null);
  const [stagedFile, setStagedFile] = useState(null as File | null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(-1);
  const [formError, setFormError] = useState(null as string | null);
  const [workspace, setWorkspace] = useState(null as CourseWorkspace | null);
  const [editCode, setEditCode] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const autoStarted = useRef(false);

  async function runSample() {
    setBusy(true);
    setFormError(null);
    setStep(0);
    const timer = window.setInterval(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 280);
    try {
      const { courseId } = await createSampleCourse();
      const ws = await getWorkspace({ data: { courseId } });
      if (!ws) throw new Error("Could not open the sample course");
      setWorkspace(ws);
      setEditCode(ws.course.code);
      setEditTitle(ws.course.title);
      setStep(STEPS.length - 1);
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not create sample course";
      setFormError(message);
      toast.error(message);
      setStep(-1);
    } finally {
      window.clearInterval(timer);
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!autoSample || autoStarted.current) return;
    autoStarted.current = true;
    void runSample();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSample]);

  async function runFromDocument(document: NormalizedDocument, kind: "upload" | "paste") {
    setBusy(true);
    setFormError(null);
    setStep(0);
    const timer = window.setInterval(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 420);
    try {
      const result = await createCourseFromDocument({
        data: { document, kind, code: code || undefined, title: title || undefined },
      });
      if (!result.workspace) throw new Error("Could not map that course");
      setWorkspace(result.workspace);
      setEditCode(result.workspace.course.code);
      setEditTitle(result.workspace.course.title);
      setStep(STEPS.length - 1);
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not process that material";
      setFormError(message);
      toast.error(message);
      setStep(-1);
    } finally {
      window.clearInterval(timer);
      setBusy(false);
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    setStagedFile(file);
    setFormError(null);
  }

  async function processStagedFile() {
    const file = stagedFile;
    if (!file || busy) return;
    try {
      const doc = await injectFile(file, { kind: "upload", title: title || undefined });
      const readableChars = doc.blocks.reduce((total, block) => total + block.text.length, 0);
      if (readableChars < 80) {
        const message = "I could not read enough text from that file.";
        setFormError(message);
        toast.error(message);
        return;
      }
      await runFromDocument(doc, "upload");
    } catch (err) {
      const message =
        err instanceof InjectionError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not read that file";
      setFormError(message);
      toast.error(message);
    }
  }

  if (workspace) {
    const topicCount = workspace.chapters.reduce((n, ch) => n + ch.topics.length, 0);
    return (
      <div className="min-h-dvh">
        <AppHeader />
        <main className="mx-auto max-w-xl px-4 py-10 pb-16">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Course map</p>
          <h1 className="mt-2 font-serif text-3xl tracking-tight">This is how I understood your course.</h1>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Input value={editCode} onChange={(e) => setEditCode(e.target.value)} aria-label="Course code" />
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} aria-label="Course title" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {workspace.chapters.length} chapters · {topicCount} topics
          </p>
          <ol className="mt-5 space-y-4">
            {workspace.chapters.map((ch) => (
              <li key={ch.id}>
                <p className="text-pretty text-sm font-medium">{ch.title}</p>
                <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                  {ch.topics.map((t) => (
                    <li key={t.id} className="break-words">
                      {t.title}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap">
            <Button
              className="w-full sm:w-auto"
              onClick={async () => {
                if (editCode !== workspace.course.code || editTitle !== workspace.course.title) {
                  await renameCourse({
                    data: { courseId: workspace.course.id, code: editCode, title: editTitle },
                  });
                }
                await navigate({
                  to: "/courses/$courseId",
                  params: { courseId: String(workspace.course.id) },
                  search: { mode: "study", topic: undefined },
                });
              }}
            >
              Looks right
            </Button>
            <Button className="w-full sm:w-auto" variant="secondary" onClick={() => setWorkspace(null)}>
              Start over
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <AppHeader />
      <main className="mx-auto max-w-xl px-4 py-10 pb-16">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">New course</p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl">
          Give me your course. I will help you master it.
        </h1>
        <p className="mt-3 text-pretty text-sm text-muted-foreground">
          Upload a PDF, Word, PowerPoint, text, or markdown file — or paste notes. I will extract
          structure, index sources, and open a study space.
        </p>

        {formError && step < 0 ? (
          <div className="mt-8">
            <StateBlock
              tone="danger"
              title="Could not map that course"
              body={formError}
              action={
                <Button variant="secondary" onClick={() => setFormError(null)}>
                  Dismiss
                </Button>
              }
            />
          </div>
        ) : null}

        {busy || step >= 0 ? (
          <ol className="mt-10 space-y-3" aria-live="polite">
            {STEPS.map((label, i) => {
              const done = i <= step;
              return (
                <li key={label} className="flex min-h-11 items-center gap-3 text-sm">
                  {done ? (
                    <Check className="size-4 shrink-0 text-ok" />
                  ) : (
                    <Skeleton className="size-4 shrink-0 rounded-full" />
                  )}
                  <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Course code (CIT 102)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                aria-label="Course code"
              />
              <Input
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-label="Course title"
              />
            </div>
            <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl bg-card px-6 py-10 text-center shadow-[var(--shadow-border)] focus-within:ring-2 focus-within:ring-ring">
              <Upload className="size-6 text-muted-foreground" />
              <span className="mt-3 text-sm font-medium">
                {stagedFile ? "Replace file" : "Upload a course file"}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                {stagedFile
                  ? `${stagedFile.name} · ${formatBytes(stagedFile.size)}`
                  : (fileName ?? "PDF, Word, PowerPoint, text, or markdown. Read in your browser.")}
              </span>
              <input
                type="file"
                accept=".pdf,.txt,.md,.markdown,.docx,.pptx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                className="sr-only"
                onChange={(e) => {
                  void onFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            {stagedFile ? (
              <div
                data-staged-file={stagedFile.name}
                className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
              >
                <p className="min-w-0 flex-1 text-sm text-muted-foreground">
                  Ready to process <span className="font-medium text-foreground">{stagedFile.name}</span>{" "}
                  ({formatBytes(stagedFile.size)}). Nothing has been indexed yet.
                </p>
                <Button className="w-full sm:w-auto" onClick={() => void processStagedFile()}>
                  Process course
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  variant="secondary"
                  onClick={() => {
                    setStagedFile(null);
                    setFileName(null);
                  }}
                >
                  Clear
                </Button>
              </div>
            ) : null}
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">Or paste notes</p>
              <Textarea
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                placeholder="Paste lecture notes, a handbook chapter, or a course outline…"
                aria-label="Paste notes"
              />
              <Button
                className="mt-3 w-full sm:w-auto"
                variant="secondary"
                disabled={paste.trim().length < 80}
                onClick={() => {
                  try {
                    const doc = injectText(paste, { name: title || "Pasted notes", kind: "paste", title: title || undefined });
                    void runFromDocument(doc, "paste");
                  } catch (err) {
                    const message = err instanceof InjectionError ? err.message : "Could not read those notes";
                    setFormError(message);
                    toast.error(message);
                  }
                }}
              >
                <FileText className="size-4" />
                Map pasted notes
              </Button>
            </div>
            <Button className="w-full" onClick={() => void runSample()}>
              Use the sample CIT 102 course
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
