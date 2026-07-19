import { db } from "@/infrastructure/db/client";
import { chunks, rootCauseReports } from "@/infrastructure/db/schema";
import type {
  EmbeddingProvider,
  CompletionProvider,
} from "@/infrastructure/ai/AIProvider";
import { sql, eq } from "drizzle-orm";

const TOP_K = 8;

const ROOT_CAUSE_SYSTEM_PROMPT = `You are DevLens AI, helping someone who is NEW to this codebase debug an error —
think a student or junior developer who doesn't yet have an intuition for where bugs usually hide.

Given an error message, log, or stack trace plus relevant code context, respond with ONLY a JSON object
(no markdown fences, no prose outside the JSON) matching this shape:
{
  "explanation": "plain-language root cause explanation, jargon defined inline",
  "affectedFiles": ["file/path.ts", "..."],
  "suggestedFixes": "concrete, actionable fix suggestions as plain text",
  "riskLevel": "low" | "medium" | "high"
}

Ground every claim in the provided code context. If the context doesn't contain enough information
to be confident, say so in "explanation" and set riskLevel to "medium" rather than guessing.`;

export class RootCauseAnalyzerService {
  constructor(
    private embeddings: EmbeddingProvider,
    private completion: CompletionProvider,
  ) {}

  async analyze(repositoryId: string, userId: string, errorInput: string) {
    const queryEmbedding = await this.embeddings.embed(errorInput);

    const results = await db
      .select({
        filePath: chunks.filePath,
        content: chunks.content,
        metadata: chunks.metadata,
      })
      .from(chunks)
      .where(eq(chunks.repositoryId, repositoryId))
      .orderBy(sql`embedding <=> ${JSON.stringify(queryEmbedding)}::vector`)
      .limit(TOP_K);

    const context = results.map(
      (r) =>
        `File: ${r.filePath} (lines ${r.metadata?.startLine}-${r.metadata?.endLine})\n${r.content}`,
    );

    const raw = await this.completion.complete(
      ROOT_CAUSE_SYSTEM_PROMPT,
      errorInput,
      context,
    );

    let parsed: {
      explanation: string;
      affectedFiles: string[];
      suggestedFixes: string;
      riskLevel: string;
    };
    try {
      const cleaned = raw
        .trim()
        .replace(/^```json\n?/, "")
        .replace(/```$/, "");
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        explanation: raw,
        affectedFiles: [],
        suggestedFixes: "",
        riskLevel: "medium",
      };
    }

    const [report] = await db
      .insert(rootCauseReports)
      .values({
        repositoryId,
        userId,
        input: errorInput,
        explanation: parsed.explanation,
        affectedFiles: parsed.affectedFiles,
        suggestedFixes: parsed.suggestedFixes,
        riskLevel: parsed.riskLevel,
      })
      .returning();

    return report;
  }

  async history(repositoryId: string) {
    return db
      .select()
      .from(rootCauseReports)
      .where(eq(rootCauseReports.repositoryId, repositoryId))
      .orderBy(sql`created_at DESC`)
      .limit(20);
  }
}
