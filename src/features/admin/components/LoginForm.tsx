"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LanguageSwitcher } from "@/features/portfolio/components/dental/LanguageSwitcher";
import { useLocale, useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AdminInput } from "@/features/admin/ui";

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
    <Card
      className={cn(
        "w-full max-w-sm space-y-4 p-6",
        locale === "ar" && "font-[family-name:var(--font-arabic)]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">
          {t("admin.login.title")}
        </h1>
        <LanguageSwitcher />
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">{t("admin.login.email")}</Label>
          <AdminInput id="email" name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("admin.login.password")}</Label>
          <AdminInput id="password" name="password" type="password" required />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t("admin.loading") : t("admin.login.submit")}
        </Button>
      </form>
    </Card>
  );
}
