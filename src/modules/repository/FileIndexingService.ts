import { db } from "@/infrastructure/db/client";
import {
  chunks as chunksTable,
  repositories,
} from "@/infrastructure/db/schema";
import { GitHubClient } from "@/infrastructure/github/GitHubClient";
import type { EmbeddingProvider } from "@/infrastructure/ai/AIProvider";
import { chunkFile } from "./chunker";
import { eq } from "drizzle-orm";

export class FileIndexingService {
  constructor(
    private github: GitHubClient,
    private embeddings: EmbeddingProvider,
  ) {}

  async indexRepository(repositoryId: string) {
    const [repo] = await db
      .select()
      .from(repositories)
      .where(eq(repositories.id, repositoryId));
    if (!repo) throw new Error(`Repository ${repositoryId} not found`);

    await db
      .update(repositories)
      .set({ status: "indexing" })
      .where(eq(repositories.id, repositoryId));

    try {
      const { owner, repo: repoName } = GitHubClient.parseUrl(repo.githubUrl);
      const files = await this.github.fetchIndexableFiles(
        owner,
        repoName,
        repo.defaultBranch ?? "main",
      );

      const allChunks = files.flatMap(chunkFile);

      for (const chunk of allChunks) {
        const embedding = await this.embeddings.embed(chunk.content);
        await db.insert(chunksTable).values({
          repositoryId,
          filePath: chunk.filePath,
          content: chunk.content,
          embedding,
          metadata: {
            startLine: chunk.startLine,
            endLine: chunk.endLine,
            language: chunk.language,
          },
        });
      }

      await db
        .update(repositories)
        .set({ status: "ready" })
        .where(eq(repositories.id, repositoryId));
      return { chunksIndexed: allChunks.length };
    } catch (err) {
      await db
        .update(repositories)
        .set({ status: "failed" })
        .where(eq(repositories.id, repositoryId));
      throw err;
    }
  }
}
