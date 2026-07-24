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
                  ? "border-[#E8A33D] bg-[#E8A33D]/15 text-[#E8A33D]"
                  : "border-[#262A38] text-[#8B90A3] hover:border-[#E8A33D] hover:text-[#E8A33D]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {!content && !loading && (
          <p className="text-center text-[#8B90A3]">
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
                  className="rounded-lg border border-[#262A38] px-3 py-1.5 text-sm text-[#8B90A3] hover:border-[#E8A33D] hover:text-[#E8A33D]"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={download}
                  className="rounded-lg border border-[#262A38] px-3 py-1.5 text-sm text-[#8B90A3] hover:border-[#E8A33D] hover:text-[#E8A33D]"
                >
                  Download
                </button>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl border border-[#262A38] bg-[#181B26] p-5 font-mono text-sm leading-relaxed text-[#EDEAE0]">
                {content}
              </pre>
            </div>
          </FadeIn>
        )}
      </main>
    </div>
  );
}
