import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { ChatWithCodebaseService } from "@/modules/chat/ChatWithCodebaseService";
import { GeminiEmbeddingProvider } from "@/infrastructure/ai/GeminiEmbeddingProvider";
import { OpenRouterProvider } from "@/infrastructure/ai/OpenRouterProvider";

const askSchema = z.object({
  repositoryId: z.string().uuid(),
  question: z.string().min(1).max(1000),
});

function buildService() {
  const embeddings = new GeminiEmbeddingProvider(process.env.GEMINI_API_KEY!);
  const completion = new OpenRouterProvider(process.env.OPENROUTER_API_KEY!);
  return new ChatWithCodebaseService(embeddings, completion);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = askSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const service = buildService();
    const result = await service.ask(
      parsed.data.repositoryId,
      userId,
      parsed.data.question,
    );
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const repositoryId = req.nextUrl.searchParams.get("repositoryId");
  if (!repositoryId)
    return NextResponse.json(
      { error: "repositoryId is required" },
      { status: 400 },
    );

  const service = buildService();
  const messages = await service.history(repositoryId, userId);
  return NextResponse.json(messages);
}
