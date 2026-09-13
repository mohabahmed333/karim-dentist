import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api/requirePermission";
import {
  deleteRole,
  updateRoleDetails,
  updateRolePermissions,
} from "@/services/roles/mutations";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  permissionKeys: z.array(z.string()).optional(),
});

export async function PATCH(request: Request, context: Params) {
  try {
    const auth = await requirePermission("roles.edit");
    if (auth.error) return auth.error;

    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    if (parsed.data.name) {
      await updateRoleDetails(auth.supabase, id, {
        name: parsed.data.name,
        description: parsed.data.description,
      });
    }

    if (parsed.data.permissionKeys) {
      await updateRolePermissions(auth.supabase, id, parsed.data.permissionKeys);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/roles/:id:PATCH]", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: Params) {
  try {
    const auth = await requirePermission("roles.delete");
    if (auth.error) return auth.error;

    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await deleteRole(auth.supabase, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    console.error("[admin/roles/:id:DELETE]", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
