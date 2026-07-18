import { db } from "@/infrastructure/db/client";
import { chunks, chatMessages } from "@/infrastructure/db/schema";
import type {
  EmbeddingProvider,
  CompletionProvider,
} from "@/infrastructure/ai/AIProvider";
import { sql, eq, desc } from "drizzle-orm";

const TOP_K = 8;

const ONBOARDING_SYSTEM_PROMPT = `You are DevLens AI, helping someone who is NEW to this codebase understand it —
think a student or junior developer seeing this project for the first time.

Rules:
- Explain like you're onboarding someone, not briefing a senior engineer.
- Define any non-obvious term the first time you use it (briefly, inline).
- Prefer plain language over jargon. If jargon is unavoidable, explain it in one clause.
- Ground every claim in the provided code context — don't invent file names or behavior.
- If the context doesn't contain the answer, say so plainly instead of guessing.
- Keep answers focused — a short, correct answer beats an exhaustive one.`;

export class ChatWithCodebaseService {
  constructor(
    private embeddings: EmbeddingProvider,
    private completion: CompletionProvider,
  ) {}

  async ask(repositoryId: string, userId: string, question: string) {
    const queryEmbedding = await this.embeddings.embed(question);

    // Cosine similarity search via pgvector's <=> operator (distance — lower is closer).
    const results = await db
      .select({
        filePath: chunks.filePath,
        content: chunks.content,
        metadata: chunks.metadata,
        distance: sql<number>`embedding <=> ${JSON.stringify(queryEmbedding)}::vector`,
      })
      .from(chunks)
      .where(eq(chunks.repositoryId, repositoryId))
      .orderBy(sql`embedding <=> ${JSON.stringify(queryEmbedding)}::vector`)
      .limit(TOP_K);

    const context = results.map(
      (r) =>
        `File: ${r.filePath} (lines ${r.metadata?.startLine}-${r.metadata?.endLine})\n${r.content}`,
    );

    const answer = await this.completion.complete(
      ONBOARDING_SYSTEM_PROMPT,
      question,
      context,
    );
    const relatedFiles = [...new Set(results.map((r) => r.filePath))];

    await db.insert(chatMessages).values([
      {
        repositoryId,
        userId,
        role: "user",
        content: question,
        relatedFiles: [],
      },
      {
        repositoryId,
        userId,
        role: "assistant",
        content: answer,
        relatedFiles,
      },
    ]);

    return { answer, relatedFiles };
  }

  async history(repositoryId: string, userId: string) {
    return db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.repositoryId, repositoryId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(50);
  }
}
