import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api/requirePermission";
import {
  getRolePermissionKeys,
  listPermissions,
  listRoles,
} from "@/services/roles/queries";
import { createRole } from "@/services/roles/mutations";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requirePermission("roles.view");
    if (auth.error) return auth.error;

    const [roles, permissions] = await Promise.all([
      listRoles(auth.supabase),
      listPermissions(auth.supabase),
    ]);

    const rolePermissions = Object.fromEntries(
      await Promise.all(
        roles.map(async (role) => [
          role.id,
          await getRolePermissionKeys(auth.supabase, role.id),
        ]),
      ),
    );

    return NextResponse.json({ roles, permissions, rolePermissions });
  } catch (error) {
    console.error("[admin/roles:GET]", error);
    return NextResponse.json({ error: "Load failed" }, { status: 500 });
  }
}

const createSchema = z.object({
  key: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, hyphens only"),
  name: z.string().min(1),
  description: z.string().optional(),
  isAdminRole: z.boolean().default(true),
});

export async function POST(request: Request) {
  try {
    const auth = await requirePermission("roles.create");
    if (auth.error) return auth.error;

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { id } = await createRole(auth.supabase, parsed.data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("[admin/roles:POST]", error);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
