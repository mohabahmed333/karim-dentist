import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api/requirePermission";
import { revertSystemAction } from "@/services/system_log/revert";

const bodySchema = z.object({ logId: z.string().uuid() });

export async function POST(request: Request) {
  const auth = await requirePermission("system-log.revert");
  if (auth.error) return auth.error;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    await revertSystemAction(auth.supabase, parsed.data.logId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Revert failed" },
      { status: 409 },
    );
  }
}
