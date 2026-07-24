import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DependencyAnalyzerService } from "@/modules/analysis/DependencyAnalyzerService";
import { GitHubClient } from "@/infrastructure/github/GitHubClient";
import { getUserGitHubToken } from "@/infrastructure/github/getUserGitHubToken";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: repositoryId } = await params;

  try {
    const token =
      (await getUserGitHubToken(userId)) ?? process.env.GITHUB_TOKEN!;
    const github = new GitHubClient(token);
    const service = new DependencyAnalyzerService(github);
    const report = await service.analyze(repositoryId, userId);
    return NextResponse.json(report, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
