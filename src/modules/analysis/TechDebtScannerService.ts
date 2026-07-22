import { db } from "@/infrastructure/db/client";
import { chunks, techDebtReports } from "@/infrastructure/db/schema";
import type { CompletionProvider } from "@/infrastructure/ai/AIProvider";
import { eq, sql } from "drizzle-orm";

type Issue = {
  filePath: string;
  type: string;
  severity: string;
  description: string;
  recommendation: string;
};

const OVERSIZED_THRESHOLD = 300;

const TECH_DEBT_SYSTEM_PROMPT = `You are DevLens AI, scanning a codebase for maintainability issues — think a
senior engineer doing a codebase health check, explaining findings to someone NEW to the project.

Look across the provided files for: dead code (unreachable or clearly unused code), duplicate code
(near-identical logic repeated across files), and complexity issues (deeply nested logic, functions doing
too many things).

Respond with ONLY a JSON array (no markdown fences, no prose outside the JSON):
[{
  "filePath": "path/to/file.ts",
  "type": "dead_code" | "duplicate_code" | "complexity",
  "severity": "low" | "medium" | "high",
  "description": "what you found and why it hurts maintainability",
  "recommendation": "a concrete refactor suggestion"
}]

Only report real findings grounded in the code shown. An empty array is a valid answer if the code is clean.`;

export class TechDebtScannerService {
  constructor(private completion: CompletionProvider) {}

  async scan(repositoryId: string, userId: string) {
    const rows = await db
      .select({ filePath: chunks.filePath, content: chunks.content })
      .from(chunks)
      .where(eq(chunks.repositoryId, repositoryId));

    if (rows.length === 0) {
      throw new Error(
        "This repository hasn't finished indexing yet — try again shortly.",
      );
    }

    const linesByFile = new Map<string, number>();
    const contentByFile = new Map<string, string[]>();
    for (const row of rows) {
      const lineCount = row.content.split("\n").length;
      linesByFile.set(
        row.filePath,
        (linesByFile.get(row.filePath) ?? 0) + lineCount,
      );
      contentByFile.set(row.filePath, [
        ...(contentByFile.get(row.filePath) ?? []),
        row.content,
      ]);
    }

    const issues: Issue[] = [];
    for (const [filePath, lines] of linesByFile) {
      if (lines > OVERSIZED_THRESHOLD) {
        issues.push({
          filePath,
          type: "oversized_file",
          severity: lines > OVERSIZED_THRESHOLD * 2 ? "high" : "medium",
          description: `This file is ~${lines} lines, over the ${OVERSIZED_THRESHOLD}-line guideline for maintainable modules.`,
          recommendation:
            "Split into smaller, single-responsibility files/modules.",
        });
      }
    }

    const sampleEntries = [...contentByFile.entries()].slice(0, 15);
    const context = sampleEntries.map(
      ([filePath, chunks]) => `File: ${filePath}\n${chunks.join("\n")}`,
    );

    const raw = await this.completion.complete(
      TECH_DEBT_SYSTEM_PROMPT,
      "Scan these files for dead code, duplicate code, and complexity issues.",
      context,
    );

    try {
      const cleaned = raw
        .trim()
        .replace(/^```json\n?/, "")
        .replace(/```$/, "");
      const llmIssues: Issue[] = JSON.parse(cleaned);
      issues.push(...llmIssues);
    } catch (error) {
      console.error("Failed to parse tech debt scan response:", error);
    }

    const deduction: Record<string, number> = { low: 3, medium: 7, high: 15 };
    const score = Math.max(
      0,
      100 - issues.reduce((sum, i) => sum + (deduction[i.severity] ?? 5), 0),
    );

    const [report] = await db
      .insert(techDebtReports)
      .values({ repositoryId, userId, maintainabilityScore: score, issues })
      .returning();

    return report;
  }

  async latest(repositoryId: string) {
    const [report] = await db
      .select()
      .from(techDebtReports)
      .where(eq(techDebtReports.repositoryId, repositoryId))
      .orderBy(sql`created_at DESC`)
      .limit(1);
    return report ?? null;
  }
}
