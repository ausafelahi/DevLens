"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ThinkingSteps } from "@/components/chat/ThinkingSteps";
import { FadeIn } from "@/components/chat/FadeIn";

type Issue = {
  filePath: string;
  type: string;
  severity: string;
  description: string;
  recommendation: string;
};
type Report = { maintainabilityScore: number; issues: Issue[] };

const SEVERITY_STYLES: Record<string, string> = {
  low: "bg-[var(--color-muted)]/15 text-[var(--color-muted)] border-[var(--color-muted)]/30",
  medium:
    "bg-[var(--color-accent)]/15 text-[var(--color-accent)] border-[var(--color-accent)]/30",
  high: "bg-red-500/15 text-red-400 border-red-500/30",
};

const SEVERITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function scoreColor(score: number) {
  if (score >= 80) return "text-green-400";
  if (score >= 50) return "text-[var(--color-accent)]";
  return "text-red-400";
}

export default function TechDebtPage() {
  const { id: repositoryId } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/repos/${repositoryId}/tech-debt`)
      .then((res) => res.json())
      .then((data) => data && setReport(data));
  }, [repositoryId]);

  const scan = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/repos/${repositoryId}/tech-debt`, {
      method: "POST",
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setReport(data);
    else setError(data.error);
  };

  const sortedIssues = report?.issues
    .slice()
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)] text-[var(--color-fg)]">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/repo/${repositoryId}/chat`}
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]"
          >
            ← Back to chat
          </Link>
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <span className="text-[var(--color-accent)]">◆</span>
            <span>A maintainability check — what to clean up first.</span>
          </div>
        </div>
        <UserButton />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        {!report && !loading && (
          <div className="mt-16 text-center">
            <button
              onClick={scan}
              className="rounded-xl bg-[var(--color-accent)] px-5 py-3 font-medium text-[var(--color-bg)]"
            >
              Scan for tech debt
            </button>
          </div>
        )}

        {loading && (
          <div className="mt-16 flex justify-center">
            <ThinkingSteps
              steps={[
                "Measuring file sizes…",
                "Looking for duplicate logic…",
                "Scoring maintainability…",
              ]}
            />
          </div>
        )}

        {error && <p className="mt-4 text-center text-red-400">{error}</p>}

        {report && !loading && (
          <div className="space-y-6">
            <FadeIn>
              <div className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                <div>
                  <p className="text-sm text-[var(--color-muted)]">
                    Maintainability score
                  </p>
                  <p
                    className={`text-4xl font-semibold ${scoreColor(report.maintainabilityScore)}`}
                  >
                    {report.maintainabilityScore}
                    <span className="text-lg text-[var(--color-muted)]">
                      /100
                    </span>
                  </p>
                </div>
                <button
                  onClick={scan}
                  className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                >
                  Re-scan
                </button>
              </div>
            </FadeIn>

            {sortedIssues?.length === 0 && (
              <p className="text-center text-[var(--color-muted)]">
                No significant issues found — clean codebase.
              </p>
            )}

            {sortedIssues?.map((issue, i) => (
              <FadeIn key={i} delay={100 + i * 80}>
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${
                        SEVERITY_STYLES[issue.severity] ?? SEVERITY_STYLES.low
                      }`}
                    >
                      {issue.severity}
                    </span>
                    <span className="font-mono text-xs text-[var(--color-muted)]">
                      {issue.filePath}
                    </span>
                    <span className="text-xs text-[var(--color-muted)]">
                      · {issue.type.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-[15px] leading-relaxed">
                    {issue.description}
                  </p>
                  <p className="mt-2 border-l-2 border-[var(--color-accent)]/40 pl-3 text-sm text-[var(--color-muted)]">
                    {issue.recommendation}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
