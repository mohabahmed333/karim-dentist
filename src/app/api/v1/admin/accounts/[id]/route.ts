import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api/requirePermission";
import {
  deactivateAccount,
  reactivateAccount,
  updateAccountRole,
} from "@/services/accounts/mutations";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  roleId: z.string().uuid().optional(),
  deleted: z.boolean().optional(),
});

export async function PATCH(request: Request, context: Params) {
  try {
    const auth = await requirePermission("accounts.edit");
    if (auth.error) return auth.error;

    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    if (parsed.data.roleId) {
      await updateAccountRole(auth.supabase, id, parsed.data.roleId);
    }

    if (parsed.data.deleted === true) {
      const deactivateAuth = await requirePermission("accounts.deactivate");
      if (deactivateAuth.error) return deactivateAuth.error;
      await deactivateAccount(deactivateAuth.supabase, id);
    } else if (parsed.data.deleted === false) {
      await reactivateAccount(auth.supabase, id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/accounts/:id:PATCH]", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
