"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AdminInput } from "@/features/admin/ui";
import { AuthSplitLayout } from "@/features/admin/components/auth/AuthSplitLayout";
import { AuthBrandLockup } from "@/features/admin/components/auth/AuthBrandLockup";

export function ForgotPasswordForm() {
  const t = useTranslations();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const email = String(new FormData(event.currentTarget).get("email") ?? "");

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/api/v1/admin/auth/callback?next=/admin/reset-password`,
        },
      );
      if (authError) {
        setError(t("admin.forgotPassword.error"));
        return;
      }
      setSent(true);
    } catch {
      setError(t("admin.forgotPassword.error"));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthSplitLayout
      brandName={t("admin.brand")}
      headline={t("admin.clinicWorkspace")}
      brand={<AuthBrandLockup name={t("admin.brand")} />}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            {t("admin.forgotPassword.title")}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {t("admin.forgotPassword.subtitle")}
          </p>
        </div>

        {sent ? (
          <p className="text-sm text-neutral-700">
            {t("admin.forgotPassword.success")}
          </p>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">{t("admin.forgotPassword.email")}</Label>
              <AdminInput id="email" name="email" type="email" required />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? t("admin.loading") : t("admin.forgotPassword.submit")}
            </Button>
          </form>
        )}

        <Link
          href="/admin/login"
          className="block text-sm font-medium text-[var(--admin-primary,#5e6ad2)] hover:underline"
        >
          {t("admin.forgotPassword.backToLogin")}
        </Link>
      </div>
    </AuthSplitLayout>
  );
}
