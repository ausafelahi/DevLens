import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { RootCauseAnalyzerService } from "@/modules/analysis/RootCauseAnalyzerService";
import { GeminiEmbeddingProvider } from "@/infrastructure/ai/GeminiEmbeddingProvider";
import { OpenRouterProvider } from "@/infrastructure/ai/OpenRouterProvider";

const analyzeSchema = z.object({ errorInput: z.string().min(1).max(4000) });

function buildService() {
  const embeddings = new GeminiEmbeddingProvider(process.env.GEMINI_API_KEY!);
  const completion = new OpenRouterProvider(process.env.OPENROUTER_API_KEY!);
  return new RootCauseAnalyzerService(embeddings, completion);
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
  const parsed = analyzeSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );

  try {
    const service = buildService();
    const report = await service.analyze(
      repositoryId,
      userId,
      parsed.data.errorInput,
    );
    return NextResponse.json(report, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: repositoryId } = await params;
  const service = buildService();
  const history = await service.history(repositoryId);
  return NextResponse.json(history);
}
