import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";

export function AppHeader({
  compact = false,
  trailing,
}: {
  compact?: boolean;
  trailing?: ReactNode;
}) {
  const { user, isPending } = useCurrentUserState();
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div
        className={cn(
          "mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4",
          compact && "max-w-none",
        )}
      >
        <Link
          to="/"
          className="flex min-w-0 items-baseline gap-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="font-serif text-xl font-medium tracking-tight">ApexStudy</span>
          <span className="hidden truncate text-xs text-muted-foreground sm:inline">
            Study, then prove it.
          </span>
        </Link>
        <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-3">
          {trailing}
          {isPending ? (
            <Skeleton className="h-11 w-28 rounded-full" />
          ) : user ? (
            <UserButton />
          ) : (
            <Link
              to="/login"
              className="inline-flex h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
