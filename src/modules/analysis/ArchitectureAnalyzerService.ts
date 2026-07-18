import { db } from "@/infrastructure/db/client";
import { chunks, architectureReports } from "@/infrastructure/db/schema";
import type { CompletionProvider } from "@/infrastructure/ai/AIProvider";
import { eq, sql } from "drizzle-orm";

const ARCHITECTURE_SYSTEM_PROMPT = `You are DevLens AI, helping someone who is NEW to this codebase understand its
architecture — think a student or junior developer seeing this project for the first time.

Rules:
- Explain the folder structure, module relationships, and overall system organization.
- Group related files into logical components (e.g. "routes", "database models", "UI components")
  even if the folder names don't say so explicitly.
- Explain WHY the structure is likely organized this way, not just WHAT is where.
- Define any non-obvious term the first time you use it (briefly, inline).
- Ground every claim in the provided file list and code snippets — don't invent files.
- Structure your answer as: 1) a one-paragraph overview, 2) key components and what they do,
  3) how the pieces likely connect.`;

export class ArchitectureAnalyzerService {
  constructor(private completion: CompletionProvider) {}

  async analyze(repositoryId: string) {
    const rows = await db
      .select({ filePath: chunks.filePath, content: chunks.content })
      .from(chunks)
      .where(eq(chunks.repositoryId, repositoryId));

    if (rows.length === 0) {
      throw new Error(
        "This repository hasn't finished indexing yet — try again shortly.",
      );
    }

    const fileTree = [...new Set(rows.map((r) => r.filePath))].sort();

    const seenFiles = new Set<string>();
    const sampleChunks: string[] = [];
    for (const row of rows) {
      if (seenFiles.has(row.filePath)) continue;
      seenFiles.add(row.filePath);
      sampleChunks.push(`File: ${row.filePath}\n${row.content.slice(0, 400)}`);
    }

    const context = [
      `Full file list:\n${fileTree.join("\n")}`,
      ...sampleChunks,
    ];

    const summary = await this.completion.complete(
      ARCHITECTURE_SYSTEM_PROMPT,
      "Explain this codebase's architecture.",
      context,
    );

    const [report] = await db
      .insert(architectureReports)
      .values({ repositoryId, summary, fileTree })
      .returning();

    return report;
  }

  async latest(repositoryId: string) {
    const [report] = await db
      .select()
      .from(architectureReports)
      .where(eq(architectureReports.repositoryId, repositoryId))
      .orderBy(sql`created_at DESC`)
      .limit(1);
    return report ?? null;
  }
}
