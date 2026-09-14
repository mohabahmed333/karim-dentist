"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Role } from "@/services/roles/queries";
import { AdminUserAvatar } from "@/features/admin/components/AdminUserAvatar";
import { useTranslations } from "@/lib/i18n";

type Account = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role_id: string | null;
  role_key: string | null;
  role_name: string | null;
  deleted_at: string | null;
};

type Props = {
  initialAccounts: Account[];
  roles: Role[];
};

function randomTempPassword() {
  return `Dl-${Math.random().toString(36).slice(2, 8)}${Math.floor(Math.random() * 100)}!`;
}

export function AccountsManager({ initialAccounts, roles }: Props) {
  const t = useTranslations();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [tempPassword, setTempPassword] = useState(randomTempPassword());
  const [busy, setBusy] = useState(false);
  const [createdAccount, setCreatedAccount] = useState<
    { email: string; password: string } | null
  >(null);

  async function refresh() {
    const res = await fetch("/api/v1/admin/accounts");
    if (!res.ok) return;
    const data = (await res.json()) as { accounts: Account[] };
    setAccounts(data.accounts);
  }

  async function handleCreate() {
    if (!email || !displayName || !roleId) {
      toast.error(t("admin.accounts.keyNameRoleRequired"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/v1/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, displayName, roleId, tempPassword }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? t("admin.accounts.createFailed"));
      }
      setCreatedAccount({ email, password: tempPassword });
      setEmail("");
      setDisplayName("");
      setTempPassword(randomTempPassword());
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("admin.accounts.createFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function handleCopyPassword() {
    if (!createdAccount) return;
    try {
      await navigator.clipboard.writeText(createdAccount.password);
      toast.success(t("admin.accounts.passwordCopied"));
    } catch {
      toast.error(t("admin.accounts.copyFailed"));
    }
  }

  async function handleRoleChange(accountId: string, newRoleId: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/admin/accounts/${accountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: newRoleId }),
      });
      if (!res.ok) throw new Error(t("admin.accounts.updateFailed"));
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("admin.accounts.updateFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleDeactivated(accountId: string, deleted: boolean) {
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/admin/accounts/${accountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleted }),
      });
      if (!res.ok) throw new Error(t("admin.accounts.updateFailed"));
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("admin.accounts.updateFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="text-sm font-semibold">{t("admin.accounts.createAccount")}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder={t("admin.accounts.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder={t("admin.accounts.displayNamePlaceholder")}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <select
            className="h-8 rounded-md border bg-transparent px-2 text-sm"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <Input
            value={tempPassword}
            onChange={(e) => setTempPassword(e.target.value)}
          />
        </div>
        <Button onClick={handleCreate} disabled={busy}>
          {t("admin.accounts.createAccount")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("admin.name")}</TableHead>
            <TableHead>{t("admin.accounts.email")}</TableHead>
            <TableHead>{t("admin.accounts.role")}</TableHead>
            <TableHead>{t("admin.status")}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell>
                <span className="flex items-center gap-2">
                  <AdminUserAvatar
                    name={account.display_name}
                    email={account.email}
                    avatarUrl={account.avatar_url}
                    size="sm"
                  />
                  <span className="truncate">
                    {account.display_name ?? "—"}
                  </span>
                </span>
              </TableCell>
              <TableCell>{account.email ?? "—"}</TableCell>
              <TableCell>
                <select
                  className="h-8 rounded-md border bg-transparent px-2 text-sm"
                  value={account.role_id ?? ""}
                  onChange={(e) => handleRoleChange(account.id, e.target.value)}
                  disabled={busy}
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </TableCell>
              <TableCell>
                {account.deleted_at ? t("admin.accounts.deactivated") : t("admin.accounts.active")}
              </TableCell>
              <TableCell>
                <Button
                  variant={account.deleted_at ? "outline" : "destructive"}
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    handleToggleDeactivated(account.id, !account.deleted_at)
                  }
                >
                  {account.deleted_at ? t("admin.accounts.reactivate") : t("admin.accounts.deactivate")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={createdAccount !== null}
        onOpenChange={(open) => {
          if (!open) setCreatedAccount(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.accounts.accountCreated")}</DialogTitle>
            <DialogDescription>
              {t("admin.accounts.sharePasswordPrefix").replace(
                "{email}",
                createdAccount?.email ?? "",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={createdAccount?.password ?? ""}
              onFocus={(e) => e.currentTarget.select()}
              className="font-mono"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCopyPassword}
              aria-label={t("admin.accounts.copyPasswordAria")}
              className="shrink-0 border border-border"
            >
              <Copy className="size-4" />
            </Button>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setCreatedAccount(null)}>{t("admin.accounts.done")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
