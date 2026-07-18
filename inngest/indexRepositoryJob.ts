import { inngest } from "@/infrastructure/queue/InngestClient";
import { GitHubClient } from "@/infrastructure/github/GitHubClient";
import { GeminiEmbeddingProvider } from "@/infrastructure/ai/GeminiEmbeddingProvider";
import { FileIndexingService } from "@/modules/repository/FileIndexingService";

export const indexRepositoryJob = inngest.createFunction(
  { id: "index-repository", retries: 2 },
  { event: "repository/import.requested" },
  async ({ event, step }) => {
    const { repositoryId } = event.data as { repositoryId: string };

    const result = await step.run("index-repository", async () => {
      const github = new GitHubClient(process.env.GITHUB_TOKEN!);
      const embeddings = new GeminiEmbeddingProvider(
        process.env.GEMINI_API_KEY!,
      );
      const service = new FileIndexingService(github, embeddings);
      return service.indexRepository(repositoryId);
    });

    return result;
  },
);
