import { inngest } from "@/infrastructure/queue/InngestClient";
import { GitHubClient } from "@/infrastructure/github/GitHubClient";
import { getUserGitHubToken } from "@/infrastructure/github/getUserGitHubToken";
import { GeminiEmbeddingProvider } from "@/infrastructure/ai/GeminiEmbeddingProvider";
import { FileIndexingService } from "@/modules/repository/FileIndexingService";
import { db } from "@/infrastructure/db/client";
import { repositories } from "@/infrastructure/db/schema";
import { eq } from "drizzle-orm";

export const indexRepositoryJob = inngest.createFunction(
  { id: "index-repository", retries: 2 },
  { event: "repository/import.requested" },
  async ({ event, step }) => {
    const { repositoryId } = event.data as { repositoryId: string };

    const result = await step.run("index-repository", async () => {
      const [repo] = await db
        .select()
        .from(repositories)
        .where(eq(repositories.id, repositoryId));
      if (!repo) throw new Error(`Repository ${repositoryId} not found`);

      const token =
        (await getUserGitHubToken(repo.userId)) ?? process.env.GITHUB_TOKEN!;
      const github = new GitHubClient(token);
      const embeddings = new GeminiEmbeddingProvider(
        process.env.GEMINI_API_KEY!,
      );
      const service = new FileIndexingService(github, embeddings);
      return service.indexRepository(repositoryId);
    });

    return result;
  },
);
