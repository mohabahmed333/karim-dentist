"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AdminInput } from "@/features/admin/ui";
import { AuthSplitLayout } from "@/features/admin/components/auth/AuthSplitLayout";

export function ResetPasswordForm() {
  const router = useRouter();
  const t = useTranslations();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(Boolean(data.user));
    });
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError(t("admin.resetPassword.mismatch"));
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) {
        setError(t("admin.resetPassword.error"));
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError(t("admin.resetPassword.error"));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthSplitLayout
      headline={t("admin.brand")}
      tagline={t("admin.clinicWorkspace")}
      brand={
        <p className="text-sm font-semibold tracking-tight text-neutral-900">
          {t("admin.brand")}
        </p>
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            {t("admin.resetPassword.title")}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {t("admin.resetPassword.subtitle")}
          </p>
        </div>

        {hasSession === false ? (
          <div className="space-y-4">
            <p className="text-sm text-destructive">
              {t("admin.resetPassword.invalidLink")}
            </p>
            <Link
              href="/admin/forgot-password"
              className="block text-sm font-medium text-[var(--admin-primary,#5e6ad2)] hover:underline"
            >
              {t("admin.resetPassword.requestNewLink")}
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="password">
                {t("admin.resetPassword.newPassword")}
              </Label>
              <AdminInput
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t("admin.resetPassword.confirmPassword")}
              </Label>
              <AdminInput
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button
              type="submit"
              className="w-full"
              disabled={pending || hasSession !== true}
            >
              {pending ? t("admin.loading") : t("admin.resetPassword.submit")}
            </Button>
          </form>
        )}
      </div>
    </AuthSplitLayout>
  );
}
