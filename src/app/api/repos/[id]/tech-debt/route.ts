import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { TechDebtScannerService } from "@/modules/analysis/TechDebtScannerService";
import { OpenRouterProvider } from "@/infrastructure/ai/OpenRouterProvider";

function buildService() {
  const completion = new OpenRouterProvider(process.env.OPENROUTER_API_KEY!);
  return new TechDebtScannerService(completion);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: repositoryId } = await params;
  try {
    const service = buildService();
    const report = await service.scan(repositoryId, userId);
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
  const report = await service.latest(repositoryId);
  return NextResponse.json(report);
}
