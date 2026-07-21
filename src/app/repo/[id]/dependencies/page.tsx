"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { ThinkingSteps } from "@/components/chat/ThinkingSteps";

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
              className="rounded-xl bg-[#E8A33D] px-5 py-3 font-medium text-[#12141C]"
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
              <h1 className="text-lg font-semibold">
                {packages.length} dependencies
              </h1>
              <button
                onClick={analyze}
                className="rounded-lg border border-[#262A38] px-3 py-1.5 text-sm text-[#8B90A3] hover:border-[#E8A33D] hover:text-[#E8A33D]"
              >
                Re-analyze
              </button>
            </div>

            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className="rounded-xl border border-[#262A38] bg-[#181B26] p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">{pkg.name}</span>
                  <span className="font-mono text-xs text-[#8B90A3]">
                    {pkg.declaredRange}{" "}
                    {pkg.latestVersion && `→ latest ${pkg.latestVersion}`}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {pkg.isOutdated && (
                    <span className="rounded-full border border-[#E8A33D]/30 bg-[#E8A33D]/15 px-2 py-0.5 text-xs text-[#E8A33D]">
                      Outdated
                    </span>
                  )}
                  {pkg.possiblyUnused && (
                    <span className="rounded-full border border-[#8B90A3]/30 bg-[#8B90A3]/15 px-2 py-0.5 text-xs text-[#8B90A3]">
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
