import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { CodeReviewService } from "@/modules/analysis/CodeReviewService";
import { OpenRouterProvider } from "@/infrastructure/ai/OpenRouterProvider";

const reviewSchema = z.object({ filePath: z.string().min(1) });

function buildService() {
  const completion = new OpenRouterProvider(process.env.OPENROUTER_API_KEY!);
  return new CodeReviewService(completion);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: repositoryId } = await params;
  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );

  try {
    const service = buildService();
    const report = await service.review(
      repositoryId,
      userId,
      parsed.data.filePath,
    );
    return NextResponse.json(report, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
