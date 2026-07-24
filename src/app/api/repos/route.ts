import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { RepositoryImportService } from "@/modules/repository/RepositoryImportService";
import { GitHubClient } from "@/infrastructure/github/GitHubClient";
import { getUserGitHubToken } from "@/infrastructure/github/getUserGitHubToken";

const importSchema = z.object({
  githubUrl: z.string().url(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const token = (await getUserGitHubToken(userId)) ?? process.env.GITHUB_TOKEN!;
  const github = new GitHubClient(token);
  const service = new RepositoryImportService(github);

  try {
    const repo = await service.importRepo(parsed.data.githubUrl, userId);
    return NextResponse.json(repo, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = (await getUserGitHubToken(userId)) ?? process.env.GITHUB_TOKEN!;
  const github = new GitHubClient(token);
  const service = new RepositoryImportService(github);
  const repos = await service.listReposForUser(userId);
  return NextResponse.json(repos);
}
