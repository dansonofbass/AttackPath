"use client";
import { useState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button, Logo } from "@/components/shared/ui";
export function LoginScreen({
  onLogin,
}: {
  onLogin: (username: string) => void;
}) {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  return (
    <main className="workflow-bg flex min-h-dvh flex-col">
      <header className="p-6 sm:px-10">
        <Logo compact />
      </header>
      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <section className="enter w-full max-w-[430px] rounded-xl border border-border bg-surface p-8 shadow-[0_24px_80px_#0005] sm:p-9">
          <div className="mb-7 flex size-12 items-center justify-center rounded-lg border border-blue/30 bg-blue/10 text-blue">
            <ShieldCheck size={27} strokeWidth={1.5} />
          </div>
          <p className="eyebrow mb-3">ANALYST WORKSPACE</p>
          <h1 className="font-display text-xl font-semibold">
            Welcome to AttackPath AI
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Sign in to your security exposure workspace.
          </p>
          <form
            className="mt-8 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (user.trim() === "admin" && password === "admin") {
                setPassword("");
                onLogin("admin");
              } else
                setError("Invalid prototype credentials. Use admin / admin.");
            }}
          >
            <label className="block text-xs">
              Username
              <input
                autoFocus
                autoComplete="username"
                required
                className="field mt-2"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="Enter username"
              />
            </label>
            <label className="block text-xs">
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                className="field mt-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </label>
            {error && (
              <p role="alert" className="text-xs text-critical">
                {error}
              </p>
            )}
            <Button type="submit" variant="primary" className="w-full py-3">
              Sign In
              <ArrowRight size={15} />
            </Button>
          </form>
          <p className="mt-4 text-center text-[11px] text-muted">
            Demo credentials:{" "}
            <span className="font-mono text-ink">admin / admin</span>
          </p>
          <div className="mt-7 flex gap-2 border-t border-border pt-5 text-[11px] leading-5 text-muted">
            <LockKeyhole size={14} className="mt-1 shrink-0" />
            <p>
              Prototype authentication only.
              <br />
              No credentials are transmitted or persisted.
            </p>
          </div>
        </section>
      </div>
      <footer className="pb-7 text-center text-[10px] uppercase tracking-[.18em] text-muted">
        AttackPath AI · Frontend prototype v1.0
      </footer>
    </main>
  );
}
