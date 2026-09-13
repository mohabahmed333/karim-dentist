"use client";

import { useState } from "react";
import { toast } from "sonner";
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
import type { Role } from "@/services/roles/queries";

type Account = {
  id: string;
  email: string | null;
  display_name: string | null;
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
  const [accounts, setAccounts] = useState(initialAccounts);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [tempPassword, setTempPassword] = useState(randomTempPassword());
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/v1/admin/accounts");
    if (!res.ok) return;
    const data = (await res.json()) as { accounts: Account[] };
    setAccounts(data.accounts);
  }

  async function handleCreate() {
    if (!email || !displayName || !roleId) {
      toast.error("Email, name, and role are required");
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
        throw new Error(body.error ?? "Create failed");
      }
      toast.success(`Account created. Temp password: ${tempPassword}`);
      setEmail("");
      setDisplayName("");
      setTempPassword(randomTempPassword());
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create failed");
    } finally {
      setBusy(false);
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
      if (!res.ok) throw new Error("Update failed");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
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
      if (!res.ok) throw new Error("Update failed");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="text-sm font-semibold">Create account</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder="Display name"
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
          Create account
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell>{account.display_name ?? "—"}</TableCell>
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
                {account.deleted_at ? "Deactivated" : "Active"}
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
                  {account.deleted_at ? "Reactivate" : "Deactivate"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
