import { db } from "@/infrastructure/db/client";
import { repositories } from "@/infrastructure/db/schema";
import { GitHubClient } from "@/infrastructure/github/GitHubClient";
import { inngest } from "@/infrastructure/queue/InngestClient";
import { eq } from "drizzle-orm";

export class RepositoryImportService {
  constructor(private github: GitHubClient) {}

  async importRepo(githubUrl: string, userId: string) {
    const { owner, repo } = GitHubClient.parseUrl(githubUrl);
    const defaultBranch = await this.github.getDefaultBranch(owner, repo);

    const [row] = await db
      .insert(repositories)
      .values({
        userId,
        githubUrl,
        name: `${owner}/${repo}`,
        defaultBranch,
        status: "pending",
      })
      .returning();

    await inngest.send({
      name: "repository/import.requested",
      data: { repositoryId: row.id },
    });

    return row;
  }

  async getRepo(id: string) {
    const [row] = await db
      .select()
      .from(repositories)
      .where(eq(repositories.id, id));
    return row ?? null;
  }

  async listReposForUser(userId: string) {
    return db
      .select()
      .from(repositories)
      .where(eq(repositories.userId, userId));
  }
}
