"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AdminInput,
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
} from "@/features/admin/ui";
import { cn } from "@/lib/utils";
import { randomTempPassword } from "@/features/admin/components/accounts/AccountsManager";
import { DOCTOR_COLOR_PALETTE } from "@/services/profiles/colorPalette";
import type { DoctorProfile } from "@/services/profiles";
import type { Role } from "@/services/roles/queries";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  onCreated: (doctor: DoctorProfile) => void;
};

type FieldErrors = Partial<
  Record<"email" | "displayName" | "tempPassword" | "roleId", string>
>;

function emptyState(doctorRoles: Role[]) {
  return {
    email: "",
    displayName: "",
    tempPassword: randomTempPassword(),
    roleId: doctorRoles[0]?.id ?? "",
    specialty: "",
    bio: "",
    calendarColor: null as string | null,
  };
}

export function AddDoctorDialog({ open, onOpenChange, roles, onCreated }: Props) {
  const doctorRoles = roles.filter((role) => role.is_doctor);
  const [form, setForm] = useState(() => emptyState(doctorRoles));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(
    null,
  );

  function reset() {
    setForm(emptyState(doctorRoles));
    setErrors({});
    setCreated(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function patch(partial: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...partial }));
    if (Object.keys(errors).length > 0) setErrors({});
  }

  async function handleCreate() {
    const fieldErrors: FieldErrors = {};
    if (!form.email.trim()) fieldErrors.email = "Email is required";
    if (!form.displayName.trim()) fieldErrors.displayName = "Name is required";
    if (form.tempPassword.length < 8) {
      fieldErrors.tempPassword = "Password must be at least 8 characters";
    }
    if (!form.roleId) fieldErrors.roleId = "Doctor role is required";
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      toast.error("Please fill in the required fields");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/v1/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          displayName: form.displayName.trim(),
          tempPassword: form.tempPassword,
          roleId: form.roleId,
          specialty: form.specialty.trim() || null,
          bio: form.bio.trim() || null,
          calendar_color: form.calendarColor,
        }),
      });
      const body = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !body.id) throw new Error(body.error ?? "Create failed");

      setCreated({ email: form.email.trim(), password: form.tempPassword });
      onCreated({
        id: body.id,
        display_name: form.displayName.trim(),
        specialty: form.specialty.trim() || null,
        bio: form.bio.trim() || null,
        avatar_url: null,
        calendar_color: form.calendarColor,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add doctor");
    } finally {
      setBusy(false);
    }
  }

  function handleCopyPassword() {
    if (!created) return;
    void navigator.clipboard.writeText(created.password);
    toast.success("Password copied");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 space-y-1 px-4 pt-4 pe-12">
          <DialogTitle className="text-[var(--admin-text)]">Add doctor</DialogTitle>
          <DialogDescription className="text-[var(--admin-muted)]">
            Creates their login and doctor profile together.
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="space-y-3 px-4 py-4">
            <p className="text-sm text-[var(--admin-text)]">
              {created.email} was created. Share this temporary password —
              it won&apos;t be shown again:
            </p>
            <div className="flex items-center gap-2">
              <Input readOnly value={created.password} className="font-mono" />
              <Button type="button" variant="outline" size="icon" onClick={handleCopyPassword}>
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-[12px] text-[var(--admin-muted)]">
                  Email<span className="ms-0.5 text-red-500">*</span>
                </span>
                <AdminInput
                  type="email"
                  value={form.email}
                  onChange={(e) => patch({ email: e.target.value })}
                  className={cn(errors.email && "border-red-400 focus-visible:ring-red-200")}
                />
                {errors.email ? (
                  <p className="text-[11px] text-red-600">{errors.email}</p>
                ) : null}
              </label>
              <label className="grid gap-1.5">
                <span className="text-[12px] text-[var(--admin-muted)]">
                  Full name<span className="ms-0.5 text-red-500">*</span>
                </span>
                <AdminInput
                  value={form.displayName}
                  onChange={(e) => patch({ displayName: e.target.value })}
                  className={cn(
                    errors.displayName && "border-red-400 focus-visible:ring-red-200",
                  )}
                />
                {errors.displayName ? (
                  <p className="text-[11px] text-red-600">{errors.displayName}</p>
                ) : null}
              </label>
              <label className="grid gap-1.5">
                <span className="text-[12px] text-[var(--admin-muted)]">
                  Temporary password<span className="ms-0.5 text-red-500">*</span>
                </span>
                <AdminInput
                  value={form.tempPassword}
                  onChange={(e) => patch({ tempPassword: e.target.value })}
                  className={cn(
                    errors.tempPassword && "border-red-400 focus-visible:ring-red-200",
                  )}
                />
                {errors.tempPassword ? (
                  <p className="text-[11px] text-red-600">{errors.tempPassword}</p>
                ) : null}
              </label>
              <label className="grid gap-1.5">
                <span className="text-[12px] text-[var(--admin-muted)]">
                  Role<span className="ms-0.5 text-red-500">*</span>
                </span>
                <AdminSelect
                  value={form.roleId}
                  onValueChange={(value) => patch({ roleId: value ?? "" })}
                >
                  <AdminSelectTrigger
                    className={cn(
                      errors.roleId && "border-red-400 focus-visible:ring-red-200",
                    )}
                  >
                    <AdminSelectValue placeholder="Select a doctor role" />
                  </AdminSelectTrigger>
                  <AdminSelectContent>
                    {doctorRoles.map((role) => (
                      <AdminSelectItem key={role.id} value={role.id}>
                        {role.name}
                      </AdminSelectItem>
                    ))}
                  </AdminSelectContent>
                </AdminSelect>
                {errors.roleId ? (
                  <p className="text-[11px] text-red-600">{errors.roleId}</p>
                ) : null}
                {doctorRoles.length === 0 ? (
                  <p className="text-[11px] text-amber-600">
                    No role is flagged as a doctor role yet — create one in Roles
                    first.
                  </p>
                ) : null}
              </label>
            </div>

            <label className="grid gap-1.5">
              <span className="text-[12px] text-[var(--admin-muted)]">Specialty</span>
              <AdminInput
                value={form.specialty}
                onChange={(e) => patch({ specialty: e.target.value })}
                placeholder="e.g. Orthodontics"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-[12px] text-[var(--admin-muted)]">Bio</span>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => patch({ bio: e.target.value })}
                className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 py-2 text-sm text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted)] focus-visible:border-[var(--admin-muted)] focus-visible:ring-2 focus-visible:ring-[var(--admin-border)]"
              />
            </label>

            <div className="grid gap-1.5">
              <span className="text-[12px] text-[var(--admin-muted)]">Calendar color</span>
              <div className="flex flex-wrap gap-2">
                {DOCTOR_COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={color}
                    onClick={() => patch({ calendarColor: color })}
                    className={cn(
                      "size-7 rounded-full ring-offset-2",
                      form.calendarColor === color
                        ? "ring-2 ring-[var(--admin-primary)]"
                        : "ring-1 ring-black/10",
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="m-0 shrink-0 rounded-none border-[var(--admin-border)] bg-[var(--admin-hover)]/40 px-4 py-3">
          {created ? (
            <Button type="button" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          ) : (
            <Button type="button" disabled={busy} onClick={() => void handleCreate()}>
              {busy ? "Adding…" : "Add doctor"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
