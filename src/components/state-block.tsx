import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared empty / error card — matches the existing course empty state. */
export function StateBlock({
  kicker,
  title,
  body,
  action,
  tone = "default",
  className,
}: {
  kicker?: string;
  title: string;
  body?: string;
  action?: ReactNode;
  tone?: "default" | "danger";
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl bg-card p-6 shadow-[var(--shadow-border)] sm:p-8", className)}>
      {kicker ? (
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{kicker}</p>
      ) : null}
      <h2
        className={cn(
          "font-serif text-2xl tracking-tight text-balance",
          kicker && "mt-2",
          tone === "danger" && "text-destructive",
        )}
      >
        {title}
      </h2>
      {body ? <p className="mt-2 max-w-xl text-pretty text-sm text-muted-foreground">{body}</p> : null}
      {action ? <div className="mt-6 flex flex-wrap gap-3">{action}</div> : null}
    </div>
  );
}
