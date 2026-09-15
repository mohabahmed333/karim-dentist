import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api/requirePermission";
import { createServiceClient } from "@/lib/supabase/service";
import { listAccounts } from "@/services/accounts/queries";
import { createAccount } from "@/services/accounts/mutations";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requirePermission("accounts.view");
    if (auth.error) return auth.error;

    const accounts = await listAccounts(auth.supabase);

    const service = createServiceClient();
    const emailById = new Map<string, string | null>();
    await Promise.all(
      accounts.map(async (account) => {
        const { data } = await service.auth.admin.getUserById(account.id);
        emailById.set(account.id, data.user?.email ?? null);
      }),
    );

    return NextResponse.json({
      accounts: accounts.map((account) => ({
        ...account,
        email: emailById.get(account.id) ?? null,
      })),
    });
  } catch (error) {
    console.error("[admin/accounts:GET]", error);
    return NextResponse.json({ error: "Load failed" }, { status: 500 });
  }
}

const createSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  tempPassword: z.string().min(8),
  roleId: z.string().uuid(),
  specialty: z.string().trim().max(120).nullable().optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  calendar_color: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const auth = await requirePermission("accounts.create");
    if (auth.error) return auth.error;

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const service = createServiceClient();
    const { id } = await createAccount(service, parsed.data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("[admin/accounts:POST]", error);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
