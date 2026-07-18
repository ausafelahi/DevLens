"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";

type Repo = {
  id: string;
  name: string;
  githubUrl: string;
  status: string;
};

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
  }, []);

  const handleImport = async () => {
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
    <main className="mx-auto max-w-2xl p-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your repositories</h1>
        <UserButton />
      </div>

      <div className="mb-6 flex gap-2">
        <input
          className="flex-1 rounded border px-3 py-2"
          placeholder="https://github.com/owner/repo"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          onClick={handleImport}
          disabled={loading || !url}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Importing..." : "Import"}
        </button>
      </div>

      <ul className="space-y-2">
        {repos.map((repo) => (
          <li key={repo.id} className="rounded border p-3">
            <Link href={`/repo/${repo.id}/chat`} className="block">
              <div className="font-medium">{repo.name}</div>
              <div className="text-sm text-gray-500">{repo.status}</div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
