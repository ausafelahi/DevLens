"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FileTree } from "@/components/dashboard/FileTree";
import { ThinkingSteps } from "@/components/chat/ThinkingSteps";

type Finding = {
  category: string;
  severity: string;
  comment: string;
  suggestion: string;
};
type Report = { id: string; filePath: string; findings: Finding[] };

const SEVERITY_STYLES: Record<string, string> = {
  info: "bg-[#8B90A3]/15 text-[#8B90A3] border-[#8B90A3]/30",
  minor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  major: "bg-[#E8A33D]/15 text-[#E8A33D] border-[#E8A33D]/30",
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function CodeReviewPage() {
  const { id: repositoryId } = useParams<{ id: string }>();
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/repos/${repositoryId}/files`)
      .then((res) => res.json())
      .then(setFiles);
  }, [repositoryId]);

  const runReview = async (filePath: string) => {
    setSelectedFile(filePath);
    setReport(null);
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/repos/${repositoryId}/code-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setReport(data);
    else setError(data.error);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#12141C] text-[#EDEAE0]">
      <header className="flex items-center justify-between border-b border-[#262A38] px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/repo/${repositoryId}/chat`}
            className="text-sm text-[#8B90A3] hover:text-[#E8A33D]"
          >
            ← Back to chat
          </Link>
          <div className="flex items-center gap-2 text-sm text-[#8B90A3]">
            <span className="text-[#E8A33D]">◆</span>
            <span>
              Pick a file — get a review that explains the why, not just the
              what.
            </span>
          </div>
        </div>
        <UserButton />
      </header>

      <main className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-[280px_1fr] gap-6 px-6 py-8">
        <aside>
          <h2 className="mb-2 text-sm font-medium text-[#8B90A3]">
            Files ({files.length})
          </h2>
          <FileTree
            paths={files}
            onSelectFile={runReview}
            selectedPath={selectedFile ?? undefined}
          />
        </aside>

        <section>
          {!selectedFile && (
            <p className="mt-16 text-center text-[#8B90A3]">
              Select a file to review it.
            </p>
          )}

          {loading && (
            <ThinkingSteps
              steps={[
                "Reading the file…",
                "Checking readability & security…",
                "Writing up findings…",
              ]}
            />
          )}

          {error && <p className="text-red-400">{error}</p>}

          {report && !loading && (
            <div className="space-y-4">
              <h2 className="font-mono text-sm text-[#8B90A3]">
                {report.filePath}
              </h2>

              {report.findings.length === 0 && (
                <p className="text-[#8B90A3]">
                  No notable findings — looks solid.
                </p>
              )}

              {report.findings.map((f, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[#262A38] bg-[#181B26] p-4"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${
                        SEVERITY_STYLES[f.severity] ?? SEVERITY_STYLES.info
                      }`}
                    >
                      {f.severity}
                    </span>
                    <span className="text-xs text-[#8B90A3]">{f.category}</span>
                  </div>
                  <p className="text-[15px] leading-relaxed">{f.comment}</p>
                  {f.suggestion && (
                    <p className="mt-2 border-l-2 border-[#E8A33D]/40 pl-3 text-sm text-[#8B90A3]">
                      {f.suggestion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
