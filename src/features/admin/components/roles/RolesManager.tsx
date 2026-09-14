"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { Permission, Role } from "@/services/roles/queries";

type Props = {
  initialRoles: Role[];
  permissions: Permission[];
  initialRolePermissions: Record<string, string[]>;
};

export function RolesManager({
  initialRoles,
  permissions,
  initialRolePermissions,
}: Props) {
  const [roles, setRoles] = useState(initialRoles);
  const [rolePermissions, setRolePermissions] = useState(
    initialRolePermissions,
  );
  const [selectedRoleId, setSelectedRoleId] = useState(
    initialRoles[0]?.id ?? "",
  );
  const [newRoleKey, setNewRoleKey] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [busy, setBusy] = useState(false);

  const grouped = useMemo(() => {
    const byCategory = new Map<string, Permission[]>();
    for (const permission of permissions) {
      const list = byCategory.get(permission.category) ?? [];
      list.push(permission);
      byCategory.set(permission.category, list);
    }
    return Array.from(byCategory.entries());
  }, [permissions]);

  const selectedRole = roles.find((role) => role.id === selectedRoleId);
  const selectedKeys = new Set(rolePermissions[selectedRoleId] ?? []);

  async function refresh() {
    const res = await fetch("/api/v1/admin/roles");
    if (!res.ok) return;
    const data = (await res.json()) as {
      roles: Role[];
      rolePermissions: Record<string, string[]>;
    };
    setRoles(data.roles);
    setRolePermissions(data.rolePermissions);
  }

  async function handleCreateRole() {
    if (!newRoleKey || !newRoleName) {
      toast.error("Key and name are required");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/v1/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: newRoleKey,
          name: newRoleName,
          isAdminRole: true,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Create failed");
      }
      const { id } = (await res.json()) as { id: string };
      setNewRoleKey("");
      setNewRoleName("");
      await refresh();
      setSelectedRoleId(id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function togglePermission(key: string, checked: boolean) {
    if (!selectedRoleId) return;
    const nextKeys = new Set(selectedKeys);
    if (checked) nextKeys.add(key);
    else nextKeys.delete(key);

    // Optimistic UI update.
    setRolePermissions((prev) => ({
      ...prev,
      [selectedRoleId]: Array.from(nextKeys),
    }));

    setBusy(true);
    try {
      const res = await fetch(`/api/v1/admin/roles/${selectedRoleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionKeys: Array.from(nextKeys) }),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function toggleIsDoctor(checked: boolean) {
    if (!selectedRoleId) return;
    setRoles((prev) =>
      prev.map((role) =>
        role.id === selectedRoleId ? { ...role, is_doctor: checked } : role,
      ),
    );
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/admin/roles/${selectedRoleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDoctor: checked }),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function setDashboardScope(scope: "clinic" | "own") {
    if (!selectedRoleId) return;
    setRoles((prev) =>
      prev.map((role) =>
        role.id === selectedRoleId
          ? { ...role, dashboard_scope: scope }
          : role,
      ),
    );
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/admin/roles/${selectedRoleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboardScope: scope }),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteRole() {
    if (!selectedRoleId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/admin/roles/${selectedRoleId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Delete failed");
      }
      setSelectedRoleId(roles[0]?.id ?? "");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
      <div className="space-y-3">
        <div className="space-y-1">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedRoleId(role.id)}
              className={`block w-full rounded-md px-3 py-2 text-left text-sm ${
                role.id === selectedRoleId
                  ? "bg-muted font-medium"
                  : "hover:bg-muted/50"
              }`}
            >
              {role.name}
              {role.is_system ? (
                <span className="ml-2 text-xs text-muted-foreground">
                  system
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="space-y-2 rounded-lg border p-3">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">
            New role
          </h3>
          <Input
            placeholder="key (e.g. front-desk)"
            value={newRoleKey}
            onChange={(e) => setNewRoleKey(e.target.value)}
          />
          <Input
            placeholder="Name"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
          />
          <Button size="sm" onClick={handleCreateRole} disabled={busy}>
            Create role
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {selectedRole ? (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">{selectedRole.name}</h2>
              {selectedRole.description ? (
                <p className="text-xs text-muted-foreground">
                  {selectedRole.description}
                </p>
              ) : null}
              <label className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={selectedRole.is_doctor}
                  disabled={busy}
                  onCheckedChange={(checked) =>
                    void toggleIsDoctor(checked === true)
                  }
                />
                Doctor role — grants a doctor picker + own hours
              </label>
              {selectedRole.is_doctor ? (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  Dashboard:
                  <div className="inline-flex overflow-hidden rounded-md border">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void setDashboardScope("clinic")}
                      className={`px-2 py-1 ${
                        selectedRole.dashboard_scope === "clinic"
                          ? "bg-muted font-medium text-foreground"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      Clinic-wide
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void setDashboardScope("own")}
                      className={`border-l px-2 py-1 ${
                        selectedRole.dashboard_scope === "own"
                          ? "bg-muted font-medium text-foreground"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      Own patients only
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            {!selectedRole.is_system && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteRole}
                disabled={busy}
              >
                Delete role
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Select or create a role.
          </p>
        )}

        {selectedRole && (
          <div className="space-y-4">
            {grouped.map(([category, items]) => (
              <div key={category} className="rounded-lg p-3">
                <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                  {category}
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {items.map((permission) => (
                    <label
                      key={permission.key}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={selectedKeys.has(permission.key)}
                        disabled={busy || selectedRole.is_system}
                        onCheckedChange={(checked) =>
                          togglePermission(permission.key, checked === true)
                        }
                      />
                      {permission.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
