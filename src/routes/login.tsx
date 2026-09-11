import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient, authEnabled, GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [mode, setMode] = useState("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null as string | null);
  const [busy, setBusy] = useState(false);

  if (!isPending && user) {
    return <Navigate to="/" />;
  }

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "up") {
        const res = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0],
        });
        if (res.error) throw new Error(res.error.message || "Could not create account");
      } else {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) throw new Error(res.error.message || "Could not sign in");
      }
      await navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12 pb-[max(3rem,env(safe-area-inset-bottom))]">
      <Link
        to="/"
        className="font-serif text-2xl font-medium tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        ApexStudy
      </Link>
      <h1 className="mt-8 font-serif text-3xl leading-tight tracking-tight">Give me your course.</h1>
      <p className="mt-2 text-pretty text-sm text-muted-foreground">
        Sign in to map a course, study it, and keep a learner model that actually remembers you.
      </p>

      <div className="mt-8 space-y-2">
        {authEnabled ? (
          GROK_PROVIDERS.map((p) => (
            <Button
              key={p.providerId}
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => signIn(p.providerId, { callbackURL: "/" })}
            >
              Continue with {p.label}
            </Button>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Sign-in is disabled.</p>
        )}
      </div>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onEmail} className="space-y-3">
        {mode === "up" ? (
          <Input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            aria-label="Your name"
          />
        ) : null}
        <Input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          aria-label="Email"
        />
        <Input
          type="password"
          required
          minLength={8}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "up" ? "new-password" : "current-password"}
          aria-label="Password"
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Working…" : mode === "up" ? "Create account" : "Sign in with email"}
        </Button>
      </form>

      <button
        type="button"
        className="mt-4 inline-flex min-h-11 items-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setMode(mode === "up" ? "in" : "up")}
      >
        {mode === "up" ? "Already have an account? Sign in" : "New here? Create an account"}
      </button>
    </main>
  );
}
