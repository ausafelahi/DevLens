import { db } from "@/infrastructure/db/client";
import { chunks, codeReviewReports } from "@/infrastructure/db/schema";
import type { CompletionProvider } from "@/infrastructure/ai/AIProvider";
import { eq, and, sql } from "drizzle-orm";

const CODE_REVIEW_SYSTEM_PROMPT = `You are DevLens AI, reviewing code the way a thoughtful senior engineer would for
someone NEW to this codebase — think a student or junior developer who wants to learn, not just get a verdict.

Review across these categories: Readability, Maintainability, Performance, Security, Best Practices, Code Smells.

Respond with ONLY a JSON array (no markdown fences, no prose outside the JSON) of finding objects:
[{
  "category": "Readability" | "Maintainability" | "Performance" | "Security" | "Best Practices" | "Code Smells",
  "severity": "info" | "minor" | "major" | "critical",
  "comment": "what you noticed and WHY it matters — teach, don't just flag",
  "suggestion": "a concrete fix, or empty string if the comment is purely informational"
}]

Only include real findings grounded in the code shown — don't invent issues to pad the list.
If the code is genuinely solid, return a short array with positive/informational findings instead of forcing criticism.`;

export class CodeReviewService {
  constructor(private completion: CompletionProvider) {}

  async review(repositoryId: string, userId: string, filePath: string) {
    const rows = await db
      .select({ content: chunks.content, metadata: chunks.metadata })
      .from(chunks)
      .where(
        and(
          eq(chunks.repositoryId, repositoryId),
          eq(chunks.filePath, filePath),
        ),
      )
      .orderBy(sql`(${chunks.metadata}->>'startLine')::int`);

    if (rows.length === 0) {
      throw new Error(`No indexed content found for ${filePath}`);
    }

    const fullFileContent = rows.map((r) => r.content).join("\n");

    const raw = await this.completion.complete(
      CODE_REVIEW_SYSTEM_PROMPT,
      `Review this file:\n\nFile: ${filePath}\n${fullFileContent}`,
      [],
    );

    let findings: {
      category: string;
      severity: string;
      comment: string;
      suggestion: string;
    }[];
    try {
      const cleaned = raw
        .trim()
        .replace(/^```json\n?/, "")
        .replace(/```$/, "");
      findings = JSON.parse(cleaned);
    } catch {
      findings = [
        {
          category: "Best Practices",
          severity: "info",
          comment: raw,
          suggestion: "",
        },
      ];
    }

    const [report] = await db
      .insert(codeReviewReports)
      .values({ repositoryId, userId, filePath, findings })
      .returning();

    return report;
  }

  async history(repositoryId: string, filePath?: string) {
    const conditions = filePath
      ? and(
          eq(codeReviewReports.repositoryId, repositoryId),
          eq(codeReviewReports.filePath, filePath),
        )
      : eq(codeReviewReports.repositoryId, repositoryId);

    return db
      .select()
      .from(codeReviewReports)
      .where(conditions)
      .orderBy(sql`created_at DESC`)
      .limit(20);
  }
}
