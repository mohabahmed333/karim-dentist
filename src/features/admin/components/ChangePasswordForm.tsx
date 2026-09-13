"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AdminInput } from "@/features/admin/ui";

type Props = { email: string };

export function ChangePasswordForm({ email }: Props) {
  const t = useTranslations();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("currentPassword") ?? "");
    const newPassword = String(data.get("newPassword") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setError(t("admin.changePassword.mismatch"));
      return;
    }
    if (newPassword === currentPassword) {
      setError(t("admin.changePassword.sameAsCurrent"));
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      // Supabase's updateUser only needs a session, so re-authenticate first —
      // otherwise anyone who found an unattended signed-in screen could change
      // the password without knowing the current one.
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (reauthError) {
        setError(t("admin.changePassword.wrongCurrent"));
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        setError(t("admin.changePassword.error"));
        return;
      }

      toast.success(t("admin.changePassword.success"));
      form.reset();
    } catch {
      setError(t("admin.changePassword.error"));
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="max-w-sm space-y-4 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4"
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="currentPassword">
          {t("admin.changePassword.current")}
        </Label>
        <AdminInput
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">{t("admin.changePassword.new")}</Label>
        <AdminInput
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">
          {t("admin.changePassword.confirm")}
        </Label>
        <AdminInput
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? t("admin.loading") : t("admin.changePassword.submit")}
      </Button>
    </form>
  );
}
