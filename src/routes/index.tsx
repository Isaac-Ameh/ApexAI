import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { StateBlock } from "@/components/state-block";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { listCourses } from "@/lib/apex/actions";
import type { CourseCard } from "@/lib/apex/types";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/")({ component: Home });

const LOOP = [
  "Upload",
  "Understand",
  "Verify",
  "Study",
  "Practice",
  "Assess",
  "Diagnose",
  "Adapt",
];

function Home() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <div className="min-h-dvh">
        <AppHeader />
        <div className="mx-auto max-w-6xl px-4 py-10">
          <Skeleton className="h-10 w-48" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }
  if (!user) return <Landing />;
  return <CourseHome />;
}

function Landing() {
  return (
    <div className="min-h-dvh">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-5 pb-20 pt-16 sm:pt-24">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">ApexStudy</p>
        <h1 className="mt-4 font-serif text-4xl leading-[1.12] tracking-tight sm:text-5xl">
          Turn the course you already have into a study system that knows you.
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted-foreground">
          Not a chatbot. Not a quiz generator. ApexStudy maps your material, estimates what
          you understand, and decides what should happen next.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/login">
              Give me your course
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
        <ol className="mt-14 flex flex-wrap gap-2">
          {LOOP.map((step, i) => (
            <li
              key={step}
              className="flex h-9 items-center rounded-full bg-secondary px-3 text-xs text-muted-foreground"
            >
              <span className="mr-2 tabular-nums text-foreground/50">{String(i + 1).padStart(2, "0")}</span>
              {step}
            </li>
          ))}
        </ol>
        <section className="mt-16 grid gap-px overflow-hidden rounded-xl bg-border shadow-[var(--shadow-border)] sm:grid-cols-3">
          {[
            {
              k: "Course model",
              v: "Chapters, topics, sources, and the pages they came from.",
            },
            {
              k: "Learner model",
              v: "An evolving estimate from quizzes, mistakes, and study history.",
            },
            {
              k: "Adaptation",
              v: "Given those two, the system answers: what next?",
            },
          ].map((item) => (
            <div key={item.k} className="bg-card p-5">
              <h2 className="font-serif text-lg tracking-tight">{item.k}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.v}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

function CourseHome() {
  const query = useQuery({
    queryKey: ["courses"],
    queryFn: () => listCourses(),
  });

  return (
    <div className="min-h-dvh">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">My courses</p>
            <h1 className="mt-2 font-serif text-4xl tracking-tight">Continue studying</h1>
          </div>
          <Button asChild>
            <Link to="/courses/new" search={{ sample: undefined }}>
              <Plus className="size-4" />
              Add course
            </Link>
          </Button>
        </div>

        {query.isLoading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-44 rounded-xl" />
            <Skeleton className="h-44 rounded-xl" />
          </div>
        ) : query.isError ? (
          <div className="mt-10">
            <StateBlock
              tone="danger"
              title="Could not load courses"
              body="Sign in again if this persists, then retry."
              action={<Button onClick={() => void query.refetch()}>Try again</Button>}
            />
          </div>
        ) : query.data && query.data.length === 0 ? (
          <EmptyCourses />
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {query.data?.map((course) => (
              <li key={course.id} className="min-w-0">
                <CourseCardView course={course} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function EmptyCourses() {
  return (
    <div className="mt-10">
      <StateBlock
        title="Give me your course. I will help you master it."
        body="Upload a PDF or start with the sample CIT 102 pack — a 100-level Computer Fundamentals course mapped into chapters, topics, and source pages."
        action={
          <>
            <Button asChild>
              <Link to="/courses/new" search={{ sample: undefined }}>
                Add course
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/courses/new" search={{ sample: 1 }}>
                Use CIT 102 sample
              </Link>
            </Button>
          </>
        }
      />
    </div>
  );
}

function CourseCardView({ course }: { course: CourseCard }) {
  const explored = course.topicCount ? Math.round((course.exploredCount / course.topicCount) * 100) : 0;
  return (
    <Link
      to="/courses/$courseId"
      params={{ courseId: String(course.id) }}
      search={{ mode: "study", topic: undefined }}
      className="block min-w-0 rounded-xl bg-card p-5 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs uppercase tracking-[0.16em] text-muted-foreground">{course.code}</p>
          <h2 className="mt-1 font-serif text-2xl tracking-tight text-balance break-words">{course.title}</h2>
        </div>
        <Badge className="shrink-0">{explored}% explored</Badge>
      </div>
      <Progress value={explored} className="mt-5" aria-label={`${course.title} explored`} />
      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span className="min-w-0 truncate">
          {course.lastTopicTitle ? `Last studied: ${course.lastTopicTitle}` : "Not started"}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-foreground">
          Continue <ArrowRight className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}
