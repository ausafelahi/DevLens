import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/infrastructure/db/client";
import { chunks } from "@/infrastructure/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: repositoryId } = await params;
  const rows = await db
    .selectDistinct({ filePath: chunks.filePath })
    .from(chunks)
    .where(eq(chunks.repositoryId, repositoryId))
    .orderBy(sql`${chunks.filePath}`);

  return NextResponse.json(rows.map((r) => r.filePath));
}
