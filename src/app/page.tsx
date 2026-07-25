"use client";

import { SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  // Signed-in users are redirected — avoid flashing the signed-out hero.
  if (!isLoaded || isSignedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-[var(--color-fg)]">
        <span
          className="text-sm text-[var(--color-muted)]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Loading…
        </span>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-fg)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-fg) 1px, transparent 1px), linear-gradient(to bottom, var(--color-fg) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 sm:px-10">
        <header className="flex items-center justify-between">
          <span
            className="text-sm tracking-wide text-[var(--color-muted)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            DEVLENS<span className="text-[var(--color-accent)]">_AI</span>
          </span>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center gap-16 py-16 lg:flex-row lg:items-center lg:gap-14">
          <div className="max-w-xl animate-fade-up text-left lg:flex-1">
            <p
              className="mb-4 text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              For codebases nobody documented
            </p>
            <h1
              className="text-4xl font-medium leading-[1.1] sm:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Understand any codebase,
              <br />
              explained like{" "}
              <span className="text-[var(--color-accent)]">
                you&apos;re new here
              </span>
              .
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--color-muted)]">
              Point DevLens at a repository and get a plain-language walkthrough
              of how it actually works — no wiki, no onboarding doc, no tribal
              knowledge required.
            </p>

            <div className="mt-8">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="rounded-md bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-[var(--color-accent-fg)] transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30">
                    Connect a repo
                  </button>
                </SignInButton>
              </SignedOut>
            </div>

            <p
              className="mt-4 text-xs text-[var(--color-muted)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              No setup beyond a repo URL<span className="animate-caret">_</span>
            </p>
          </div>

          <div className="w-full max-w-md animate-fade-up [animation-delay:120ms] lg:flex-1">
            <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl shadow-black/40">
              <div className="flex items-center gap-1.5 border-b border-[var(--color-border)] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border)]" />
                <span
                  className="ml-3 text-xs text-[var(--color-muted)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  auth/session.ts
                </span>
              </div>

              <div
                className="space-y-1 px-4 py-4 text-[13px] leading-relaxed"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <div className="text-[var(--color-muted)]">
                  1&nbsp;&nbsp;import {"{"} createSession {"}"} from
                  &quot;./lib&quot;;
                </div>
                <div className="text-[var(--color-muted)]">2</div>
                <div className="relative pl-4 text-[var(--color-fg)]">
                  <span className="absolute left-0 top-0 h-full w-0.5 animate-scan bg-[var(--color-accent)]" />
                  3&nbsp;&nbsp;export async function signIn(user) {"{"}
                </div>
                <div className="pl-8 text-[var(--color-fg)]">
                  4&nbsp;&nbsp;&nbsp;&nbsp;return createSession(user, {"{"} ttl:
                  86400 {"}"});
                </div>
                <div className="pl-4 text-[var(--color-fg)]">
                  5&nbsp;&nbsp;{"}"}
                </div>
              </div>

              <div className="border-t border-[var(--color-border)] bg-black/20 px-4 py-3">
                <p
                  className="text-xs leading-relaxed text-[var(--color-accent)]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  → Starts a 24-hour session the moment someone signs in.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
