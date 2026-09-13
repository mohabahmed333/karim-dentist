"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLocale, useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AdminInput } from "@/features/admin/ui";
import { AuthSplitLayout } from "@/features/admin/components/auth/AuthSplitLayout";
import { AuthBrandLockup } from "@/features/admin/components/auth/AuthBrandLockup";

export function LoginForm() {
  const router = useRouter();
  const t = useTranslations();
  const { locale } = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError(t("admin.login.error"));
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError(t("admin.login.error"));
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
      <div
        className={cn(
          "space-y-6",
          locale === "ar" && "font-[family-name:var(--font-arabic)]",
        )}
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            {t("admin.login.title")}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {t("admin.login.subtitle")}
          </p>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">{t("admin.login.email")}</Label>
            <AdminInput id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t("admin.login.password")}</Label>
              <Link
                href="/admin/forgot-password"
                className="text-xs font-medium text-[var(--admin-primary,#5e6ad2)] hover:underline"
              >
                {t("admin.login.forgotPassword")}
              </Link>
            </div>
            <AdminInput id="password" name="password" type="password" required />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t("admin.loading") : t("admin.login.submit")}
          </Button>
        </form>
      </div>
    </AuthSplitLayout>
  );
}
