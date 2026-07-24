"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FadeIn } from "@/components/chat/FadeIn";

type Repo = {
  id: string;
  name: string;
  githubUrl: string;
  status: string;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-[#8B90A3]/15 text-[#8B90A3] border-[#8B90A3]/30",
  indexing: "bg-[#E8A33D]/15 text-[#E8A33D] border-[#E8A33D]/30",
  ready: "bg-green-500/15 text-green-400 border-green-500/30",
  failed: "bg-red-500/15 text-red-400 border-red-500/30",
};

const QUICK_LINKS = [
  { path: "chat", label: "Chat" },
  { path: "architecture", label: "Architecture" },
  { path: "root-cause", label: "Debug" },
  { path: "code-review", label: "Review" },
  { path: "dependencies", label: "Dependencies" },
  { path: "tech-debt", label: "Tech debt" },
  { path: "documentation", label: "Docs" },
];

export default function Dashboard() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const loadRepos = async () => {
    const res = await fetch("/api/repos");
    if (res.ok) setRepos(await res.json());
  };

  useEffect(() => {
    loadRepos();
    const interval = setInterval(loadRepos, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleImport = async () => {
    if (!url.trim()) return;
    setLoading(true);
    const res = await fetch("/api/repos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ githubUrl: url }),
    });
    setLoading(false);
    if (res.ok) {
      setUrl("");
      loadRepos();
    }
  };

  return (
    <div className="min-h-screen bg-[#12141C] text-[#EDEAE0]">
      <header className="flex items-center justify-between border-b border-[#262A38] px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-[#8B90A3]">
          <span className="text-[#E8A33D]">◆</span>
          <span>DevLens AI</span>
        </div>
        <UserButton />
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-4 text-xl font-semibold">Your repositories</h1>

        <div className="mb-8 flex gap-2">
          <input
            className="flex-1 rounded-xl border border-[#262A38] bg-[#181B26] px-4 py-3 text-[15px] text-[#EDEAE0] placeholder:text-[#8B90A3] focus:border-[#E8A33D] focus:outline-none"
            placeholder="https://github.com/owner/repo"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleImport()}
          />
          <button
            onClick={handleImport}
            disabled={loading || !url.trim()}
            className="rounded-xl bg-[#E8A33D] px-5 py-3 font-medium text-[#12141C] disabled:opacity-40"
          >
            {loading ? "Importing…" : "Import"}
          </button>
        </div>

        {repos.length === 0 && (
          <p className="text-center text-[#8B90A3]">
            No repositories yet — import one above to get started.
          </p>
        )}

        <div className="space-y-3">
          {repos.map((repo, i) => (
            <FadeIn key={repo.id} delay={i * 60}>
              <div className="rounded-2xl border border-[#262A38] bg-[#181B26] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-medium">{repo.name}</span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${
                      STATUS_STYLES[repo.status] ?? STATUS_STYLES.pending
                    }`}
                  >
                    {repo.status}
                  </span>
                </div>

                {repo.status === "ready" ? (
                  <div className="flex flex-wrap gap-2">
                    {QUICK_LINKS.map((link) => (
                      <Link
                        key={link.path}
                        href={`/repo/${repo.id}/${link.path}`}
                        className="rounded-lg border border-[#262A38] px-3 py-1 text-xs text-[#8B90A3] transition-colors hover:border-[#E8A33D] hover:text-[#E8A33D]"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#8B90A3]">
                    {repo.status === "failed"
                      ? "Indexing failed — try re-importing."
                      : "Indexing in progress…"}
                  </p>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </main>
    </div>
  );
}
