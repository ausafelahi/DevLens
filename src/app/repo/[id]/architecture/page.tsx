"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FileTree } from "@/components/dashboard/FileTree";
import { ThinkingSteps } from "@/components/chat/ThinkingSteps";
import { MessageContent } from "@/components/chat/MessageContent";
import { FadeIn } from "@/components/chat/FadeIn";

type Report = {
  id: string;
  summary: string;
  fileTree: string[];
  createdAt: string;
};

export default function ArchitecturePage() {
  const { id: repositoryId } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExisting = async () => {
    const res = await fetch(`/api/repos/${repositoryId}/architecture`);
    if (res.ok) {
      const data = await res.json();
      if (data) setReport(data);
    }
  };

  useEffect(() => {
    loadExisting();
  }, []);

  const generate = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/repos/${repositoryId}/architecture`, {
      method: "POST",
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setReport(data);
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
              A map of this codebase, for someone seeing it the first time.
            </span>
          </div>
        </div>
        <UserButton />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        {!report && !loading && (
          <div className="mt-16 text-center">
            <p className="mb-4 text-lg text-[var(--color-muted)]">
              No architecture map yet.
            </p>
            <button
              onClick={generate}
              className="rounded-xl bg-[var(--color-accent)] px-5 py-3 font-medium text-[var(--color-bg)]"
            >
              Generate architecture overview
            </button>
          </div>
        )}

        {loading && (
          <div className="mt-16 flex justify-center">
            <ThinkingSteps
              steps={[
                "Reading the file tree…",
                "Grouping related modules…",
                "Writing the overview…",
              ]}
            />
          </div>
        )}

        {error && <p className="mt-4 text-center text-red-400">{error}</p>}

        {report && (
          <FadeIn>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1
                  className="text-lg font-semibold"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Architecture overview
                </h1>
                <button
                  onClick={generate}
                  disabled={loading}
                  className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                >
                  Regenerate
                </button>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <MessageContent content={report.summary} />
              </div>

              <details
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
                open
              >
                <summary className="cursor-pointer text-sm text-[var(--color-muted)]">
                  File tree ({report.fileTree.length} files) — click folders to
                  expand
                </summary>
                <div className="mt-3">
                  <FileTree paths={report.fileTree} />
                </div>
              </details>
            </div>
          </FadeIn>
        )}
      </main>
    </div>
  );
}
