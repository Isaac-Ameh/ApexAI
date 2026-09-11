import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  "aria-label": ariaLabel,
}: {
  value: number;
  className?: string;
  "aria-label"?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-secondary", className)}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
