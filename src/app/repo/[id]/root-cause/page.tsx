"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { ThinkingSteps } from "@/components/chat/ThinkingSteps";
import { FadeIn } from "@/components/chat/FadeIn";

type Report = {
  id: string;
  explanation: string;
  affectedFiles: string[];
  suggestedFixes: string;
  riskLevel: string;
};

const RISK_STYLES: Record<string, string> = {
  low: "bg-green-500/15 text-green-400 border-green-500/30",
  medium:
    "bg-[var(--color-accent)]/15 text-[var(--color-accent)] border-[var(--color-accent)]/30",
  high: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function RootCausePage() {
  const { id: repositoryId } = useParams<{ id: string }>();
  const [errorInput, setErrorInput] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    if (!errorInput.trim()) return;
    setLoading(true);
    setError(null);
    setReport(null);

    const res = await fetch(`/api/repos/${repositoryId}/root-cause`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ errorInput }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setReport(data);
    else setError(data.error);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)] text-[var(--color-fg)]">
      <header className="flex flex-col gap-3 border-b border-[var(--color-border)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/repo/${repositoryId}/chat`}
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]"
          >
            ← Back to chat
          </Link>
          <div
            className="flex items-center gap-2 text-sm text-[var(--color-muted)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span className="text-[var(--color-accent)]">◆</span>
            <span>
              Paste an error, log, or stack trace — let's find what's really
              going on.
            </span>
          </div>
        </div>
        <UserButton />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <textarea
          className="h-40 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 font-mono text-sm text-[var(--color-fg)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none"
          placeholder={`TypeError: Cannot read properties of undefined (reading 'id')\n    at queueService.dequeueNextPatient (queueService.js:42)\n    ...`}
          value={errorInput}
          onChange={(e) => setErrorInput(e.target.value)}
        />

        <button
          onClick={analyze}
          disabled={loading || !errorInput.trim()}
          className="mt-3 rounded-xl bg-[var(--color-accent)] px-5 py-3 font-medium text-[var(--color-bg)] disabled:opacity-40"
        >
          Analyze
        </button>

        {loading && (
          <div className="mt-6">
            <ThinkingSteps
              steps={[
                "Searching for related code…",
                "Tracing the failure path…",
                "Weighing the risk…",
              ]}
            />
          </div>
        )}

        {error && <p className="mt-4 text-red-400">{error}</p>}

        {report && (
          <FadeIn>
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide ${
                    RISK_STYLES[report.riskLevel] ?? RISK_STYLES.medium
                  }`}
                >
                  {report.riskLevel} risk
                </span>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <h2 className="mb-2 text-sm font-medium text-[var(--color-muted)]">
                  What's likely happening
                </h2>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                  {report.explanation}
                </p>
              </div>

              {report.affectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {report.affectedFiles.map((f) => (
                    <span
                      key={f}
                      className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 font-mono text-xs text-[var(--color-muted)]"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}

              {report.suggestedFixes && (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                  <h2 className="mb-2 text-sm font-medium text-[var(--color-muted)]">
                    Suggested fix
                  </h2>
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                    {report.suggestedFixes}
                  </p>
                </div>
              )}
            </div>
          </FadeIn>
        )}
      </main>
    </div>
  );
}
