import { db } from "@/infrastructure/db/client";
import {
  chunks,
  dependencyReports,
  repositories,
} from "@/infrastructure/db/schema";
import { GitHubClient } from "@/infrastructure/github/GitHubClient";
import { eq, and, ilike } from "drizzle-orm";

type PackageResult = {
  name: string;
  declaredRange: string;
  latestVersion: string | null;
  isOutdated: boolean;
  possiblyUnused: boolean;
  vulnerabilities: { id: string; summary: string }[];
};

async function fetchLatestVersion(pkgName: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(pkgName)}/latest`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.version ?? null;
  } catch {
    return null;
  }
}

async function fetchVulnerabilities(
  packages: { name: string; version: string }[],
): Promise<Record<string, { id: string; summary: string }[]>> {
  try {
    const res = await fetch("https://api.osv.dev/v1/querybatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        queries: packages.map((p) => ({
          package: { name: p.name, ecosystem: "npm" },
          version: p.version,
        })),
      }),
    });
    if (!res.ok) return {};

    const data = await res.json();
    const result: Record<string, { id: string; summary: string }[]> = {};
    (data.results ?? []).forEach(
      (r: { vulns?: { id: string; summary?: string }[] }, i: number) => {
        result[packages[i].name] = (r.vulns ?? []).map((v) => ({
          id: v.id,
          summary: v.summary ?? "No summary available",
        }));
      },
    );
    return result;
  } catch {
    return {};
  }
}

function stripRangePrefix(range: string): string {
  return range.replace(/^[\^~>=<\s]+/, "");
}

export class DependencyAnalyzerService {
  constructor(private github: GitHubClient) {}

  async analyze(repositoryId: string, userId: string) {
    const [repo] = await db
      .select()
      .from(repositories)
      .where(eq(repositories.id, repositoryId));
    if (!repo) throw new Error(`Repository ${repositoryId} not found`);

    const { owner, repo: repoName } = GitHubClient.parseUrl(repo.githubUrl);
    const raw = await this.github.getFileContent(
      owner,
      repoName,
      "package.json",
      repo.defaultBranch ?? "main",
    );
    if (!raw)
      throw new Error("No package.json found in this repository's root.");

    const pkgJson = JSON.parse(raw);
    const allDeps: Record<string, string> = {
      ...(pkgJson.dependencies ?? {}),
      ...(pkgJson.devDependencies ?? {}),
    };
    const entries = Object.entries(allDeps);

    if (entries.length === 0) {
      throw new Error("No dependencies declared in package.json.");
    }

    const vulnQueries = entries.map(([name, range]) => ({
      name,
      version: stripRangePrefix(range),
    }));
    const vulnMap = await fetchVulnerabilities(vulnQueries);

    const packages: PackageResult[] = [];
    for (const [name, declaredRange] of entries) {
      const latestVersion = await fetchLatestVersion(name);
      const declared = stripRangePrefix(declaredRange);
      const isOutdated = !!latestVersion && latestVersion !== declared;

      const usageRows = await db
        .select({ filePath: chunks.filePath })
        .from(chunks)
        .where(ilike(chunks.content, `%${name}%`))
        .limit(1);

      packages.push({
        name,
        declaredRange,
        latestVersion,
        isOutdated,
        possiblyUnused: usageRows.length === 0,
        vulnerabilities: vulnMap[name] ?? [],
      });
    }

    const [report] = await db
      .insert(dependencyReports)
      .values({ repositoryId, userId, packages })
      .returning();
    return report;
  }
}
