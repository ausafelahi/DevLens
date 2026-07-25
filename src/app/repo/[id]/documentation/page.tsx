"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { ThinkingSteps } from "@/components/chat/ThinkingSteps";
import { FadeIn } from "@/components/chat/FadeIn";

type DocType = "readme" | "api" | "setup";
const TABS: { key: DocType; label: string }[] = [
  { key: "readme", label: "README" },
  { key: "api", label: "API docs" },
  { key: "setup", label: "Setup guide" },
];

export default function DocumentationPage() {
  const { id: repositoryId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<DocType>("readme");
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async (docType: DocType) => {
    setActiveTab(docType);
    setContent(null);
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/repos/${repositoryId}/documentation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docType }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) setContent(data.content);
    else setError(data.error);
  };

  const copyToClipboard = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    if (!content) return;
    const filenames: Record<DocType, string> = {
      readme: "README.md",
      api: "API.md",
      setup: "SETUP.md",
    };
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filenames[activeTab];
    a.click();
    URL.revokeObjectURL(url);
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
              Docs, written for someone who's never seen this project.
            </span>
          </div>
        </div>
        <UserButton />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <div className="mb-6 flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => generate(tab.key)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                activeTab === tab.key
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
                  : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {!content && !loading && (
          <p className="text-center text-[var(--color-muted)]">
            Pick a doc type above to generate it.
          </p>
        )}

        {loading && (
          <div className="mt-16 flex justify-center">
            <ThinkingSteps
              steps={[
                "Reading the codebase…",
                "Structuring the document…",
                "Writing it up…",
              ]}
            />
          </div>
        )}

        {error && <p className="text-center text-red-400">{error}</p>}

        {content && !loading && (
          <FadeIn>
            <div>
              <div className="mb-3 flex justify-end gap-2">
                <button
                  onClick={copyToClipboard}
                  className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={download}
                  className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                >
                  Download
                </button>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 font-mono text-sm leading-relaxed text-[var(--color-fg)]">
                {content}
              </pre>
            </div>
          </FadeIn>
        )}
      </main>
    </div>
  );
}
