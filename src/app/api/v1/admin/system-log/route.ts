import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api/requirePermission";
import { listSystemActions, type SystemActionOperation } from "@/services/system_log/listActions";

const OPERATIONS: SystemActionOperation[] = ["insert", "update", "delete"];

export async function GET(request: Request) {
  const auth = await requirePermission("system-log.view");
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const table = url.searchParams.get("table") ?? undefined;
  const operationParam = url.searchParams.get("operation");
  const operation = OPERATIONS.includes(operationParam as SystemActionOperation)
    ? (operationParam as SystemActionOperation)
    : undefined;
  const cursor = url.searchParams.get("cursor") ?? undefined;

  try {
    const { rows, nextCursor } = await listSystemActions(auth.supabase, {
      table,
      operation,
      cursor,
    });
    return NextResponse.json({ rows, nextCursor });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load the system log" },
      { status: 400 },
    );
  }
}
