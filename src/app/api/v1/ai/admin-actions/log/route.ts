import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api/requirePermission";
import { listAiActionProposals } from "@/services/admin_ai";
import { proposalStatusSchema } from "@/services/admin_ai/schemas";

export async function GET(request: Request) {
  const auth = await requirePermission("ai-actions.view");
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const status = statusParam
    ? proposalStatusSchema.safeParse(statusParam).data
    : undefined;
  const cursor = url.searchParams.get("cursor") ?? undefined;

  try {
    const { rows, nextCursor } = await listAiActionProposals(auth.supabase, {
      status,
      cursor,
    });
    return NextResponse.json({ rows, nextCursor });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load actions" },
      { status: 400 },
    );
  }
}
