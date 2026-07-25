"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { ThinkingSteps } from "@/components/chat/ThinkingSteps";
import { FadeIn } from "@/components/chat/FadeIn";

type PackageResult = {
  name: string;
  declaredRange: string;
  latestVersion: string | null;
  isOutdated: boolean;
  possiblyUnused: boolean;
  vulnerabilities: { id: string; summary: string }[];
};

export default function DependenciesPage() {
  const { id: repositoryId } = useParams<{ id: string }>();
  const [packages, setPackages] = useState<PackageResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/repos/${repositoryId}/dependencies`, {
      method: "POST",
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setPackages(data.packages);
    else setError(data.error);
  };

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
          <div
            className="flex items-center gap-2 text-sm text-[var(--color-muted)]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span className="text-[var(--color-accent)]">◆</span>
            <span>
              What's in package.json, and what it's quietly costing you.
            </span>
          </div>
        </div>
        <UserButton />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        {!packages && !loading && (
          <div className="mt-16 text-center">
            <button
              onClick={analyze}
              className="rounded-xl bg-[var(--color-accent)] px-5 py-3 font-medium text-[var(--color-bg)]"
            >
              Analyze dependencies
            </button>
          </div>
        )}

        {loading && (
          <div className="mt-16 flex justify-center">
            <ThinkingSteps
              steps={[
                "Reading package.json…",
                "Checking npm for updates…",
                "Scanning for known vulnerabilities…",
              ]}
            />
          </div>
        )}

        {error && <p className="mt-4 text-center text-red-400">{error}</p>}

        {packages && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h1
                className="text-lg font-semibold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {packages.length} dependencies
              </h1>
              <button
                onClick={analyze}
                className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                Re-analyze
              </button>
            </div>

            {packages.map((pkg, i) => (
              <FadeIn key={pkg.name} delay={i * 60}>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm">{pkg.name}</span>
                    <span className="font-mono text-xs text-[var(--color-muted)]">
                      {pkg.declaredRange}{" "}
                      {pkg.latestVersion && `→ latest ${pkg.latestVersion}`}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {pkg.isOutdated && (
                      <span className="rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/15 px-2 py-0.5 text-xs text-[var(--color-accent)]">
                        Outdated
                      </span>
                    )}
                    {pkg.possiblyUnused && (
                      <span className="rounded-full border border-[var(--color-muted)]/30 bg-[var(--color-muted)]/15 px-2 py-0.5 text-xs text-[var(--color-muted)]">
                        Possibly unused
                      </span>
                    )}
                    {pkg.vulnerabilities.length > 0 && (
                      <span className="rounded-full border border-red-500/30 bg-red-500/15 px-2 py-0.5 text-xs text-red-400">
                        {pkg.vulnerabilities.length} known vulnerability
                        {pkg.vulnerabilities.length > 1 ? "ies" : ""}
                      </span>
                    )}
                  </div>
                  {pkg.vulnerabilities.map((v) => (
                    <p key={v.id} className="mt-2 text-xs text-red-400/80">
                      {v.id}: {v.summary}
                    </p>
                  ))}
                </div>
              </FadeIn>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
