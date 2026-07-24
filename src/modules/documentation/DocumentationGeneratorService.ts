import { db } from "@/infrastructure/db/client";
import {
  chunks,
  documentationReports,
  architectureReports,
  repositories,
} from "@/infrastructure/db/schema";
import type { CompletionProvider } from "@/infrastructure/ai/AIProvider";
import { eq, sql } from "drizzle-orm";

export type DocType = "readme" | "api" | "setup";

const SYSTEM_PROMPTS: Record<DocType, string> = {
  readme: `You are DevLens AI, writing a README.md for a codebase, aimed at someone NEW to the project —
a student or junior developer who will onboard from this file. Include: a short project description,
key features (inferred from the code), tech stack, and a getting-started section. Ground everything in
the provided architecture summary and code — don't invent features or setup steps you can't see evidence for.
Output valid Markdown only, no commentary outside the document.`,

  api: `You are DevLens AI, writing API documentation for this codebase's routes/endpoints, aimed at someone
NEW to the project. For each route you can identify from the code, document: method, path, purpose,
request/response shape if visible. Ground everything in the provided code — don't invent endpoints.
Output valid Markdown only, no commentary outside the document.`,

  setup: `You are DevLens AI, writing a setup guide for this codebase, aimed at someone NEW to the project
who needs to get it running locally. Infer install steps, environment variables (from config/env file
references you see), and run commands from the code and package manifest shown. Ground everything in
the provided code — don't invent steps you can't see evidence for. Output valid Markdown only.`,
};

export class DocumentationGeneratorService {
  constructor(private completion: CompletionProvider) {}

  async generate(repositoryId: string, userId: string, docType: DocType) {
    const [repo] = await db
      .select()
      .from(repositories)
      .where(eq(repositories.id, repositoryId));
    if (!repo) throw new Error(`Repository ${repositoryId} not found`);

    const [archReport] = await db
      .select()
      .from(architectureReports)
      .where(eq(architectureReports.repositoryId, repositoryId))
      .orderBy(sql`created_at DESC`)
      .limit(1);

    const rows = await db
      .select({ filePath: chunks.filePath, content: chunks.content })
      .from(chunks)
      .where(eq(chunks.repositoryId, repositoryId));

    if (rows.length === 0) {
      throw new Error(
        "This repository hasn't finished indexing yet — try again shortly.",
      );
    }

    const relevanceFilter: Record<DocType, RegExp> = {
      readme: /package\.json|readme|\.env\.example/i,
      api: /route|controller|api\/|endpoint/i,
      setup: /package\.json|\.env|docker|readme|config/i,
    };
    const prioritized = rows.filter((r) =>
      relevanceFilter[docType].test(r.filePath),
    );
    const sample = (prioritized.length > 0 ? prioritized : rows).slice(0, 15);

    const context = [
      archReport ? `Architecture overview:\n${archReport.summary}` : "",
      ...sample.map((r) => `File: ${r.filePath}\n${r.content}`),
    ].filter(Boolean);

    const content = await this.completion.complete(
      SYSTEM_PROMPTS[docType],
      `Generate ${docType} documentation for this project (${repo.name}).`,
      context,
    );

    const [report] = await db
      .insert(documentationReports)
      .values({ repositoryId, userId, docType, content })
      .returning();

    return report;
  }

  async latest(repositoryId: string, docType: DocType) {
    const [report] = await db
      .select()
      .from(documentationReports)
      .where(
        sql`${documentationReports.repositoryId} = ${repositoryId} AND ${documentationReports.docType} = ${docType}`,
      )
      .orderBy(sql`created_at DESC`)
      .limit(1);
    return report ?? null;
  }
}
