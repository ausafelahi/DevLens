import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  DocumentationGeneratorService,
  type DocType,
} from "@/modules/documentation/DocumentationGeneratorService";
import { OpenRouterProvider } from "@/infrastructure/ai/OpenRouterProvider";

const genSchema = z.object({ docType: z.enum(["readme", "api", "setup"]) });

function buildService() {
  const completion = new OpenRouterProvider(process.env.OPENROUTER_API_KEY!);
  return new DocumentationGeneratorService(completion);
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
  const parsed = genSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );

  try {
    const service = buildService();
    const report = await service.generate(
      repositoryId,
      userId,
      parsed.data.docType as DocType,
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
  const docType = (req.nextUrl.searchParams.get("docType") ??
    "readme") as DocType;

  const service = buildService();
  const report = await service.latest(repositoryId, docType);
  return NextResponse.json(report);
}
