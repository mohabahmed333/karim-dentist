import { requirePagePermission } from "@/lib/auth/pageGuard";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { listAccounts } from "@/services/accounts/queries";
import { listRoles } from "@/services/roles/queries";
import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { AccountsManager } from "@/features/admin/components/accounts/AccountsManager";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";

export const dynamic = "force-dynamic";

export default async function AdminAccountsPage() {
  await requirePagePermission("accounts.view");

  const supabase = await createClient();
  const [accounts, roles] = await Promise.all([
    listAccounts(supabase),
    listRoles(supabase),
  ]);

  const service = createServiceClient();
  const emailById = new Map<string, string | null>();
  await Promise.all(
    accounts.map(async (account) => {
      const { data } = await service.auth.admin.getUserById(account.id);
      emailById.set(account.id, data.user?.email ?? null);
    }),
  );

  return (
    <AdminPageMotion className="space-y-6">
      <LocalizedAdminPageHeader
        titleKey="admin.nav.accounts"
        descriptionKey="admin.accounts.description"
      />
      <AccountsManager
        initialAccounts={accounts.map((account) => ({
          ...account,
          email: emailById.get(account.id) ?? null,
        }))}
        roles={roles}
      />
    </AdminPageMotion>
  );
}
