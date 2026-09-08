"use client";

import { Check, ChevronDown, CircleUser, LogOut } from "lucide-react";
import {
  AdminDropdownMenu,
  AdminDropdownMenuContent,
  AdminDropdownMenuGroup,
  AdminDropdownMenuItem,
  AdminDropdownMenuLabel,
  AdminDropdownMenuSeparator,
  AdminDropdownMenuTrigger,
} from "@/features/admin/ui";
import { useAdminLogout } from "@/features/admin/hooks/useAdminLogout";
import { useLocale, useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = { compact?: boolean };

export function AdminAccountMenu({ compact = false }: Props) {
  const t = useTranslations();
  const { locale, setLocale } = useLocale();
  const { logout, pending } = useAdminLogout();

  return (
    <AdminDropdownMenu>
      <AdminDropdownMenuTrigger
        className={cn(
          compact
            ? "flex size-7 items-center justify-center rounded-md text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
            : "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]",
        )}
        aria-label={t("admin.settings.account")}
      >
        <CircleUser className="size-3.5 shrink-0" aria-hidden />
        {compact ? (
          <span className="sr-only">{t("admin.settings.account")}</span>
        ) : (
          <>
            <span className="min-w-0 flex-1 truncate text-start">
              {t("admin.settings.account")}
            </span>
            <ChevronDown className="size-3.5 shrink-0 opacity-70" aria-hidden />
          </>
        )}
      </AdminDropdownMenuTrigger>
      <AdminDropdownMenuContent
        side={compact ? "right" : "top"}
        align={compact ? "end" : "start"}
        className="min-w-44 w-auto"
      >
        <AdminDropdownMenuGroup>
          <AdminDropdownMenuLabel>{t("admin.language")}</AdminDropdownMenuLabel>
          <AdminDropdownMenuItem onClick={() => setLocale("en")}>
            <Check
              className={cn("size-4", locale === "en" ? "opacity-100" : "opacity-0")}
              aria-hidden
            />
            {t("admin.language.english")}
          </AdminDropdownMenuItem>
          <AdminDropdownMenuItem onClick={() => setLocale("ar")}>
            <Check
              className={cn("size-4", locale === "ar" ? "opacity-100" : "opacity-0")}
              aria-hidden
            />
            {t("admin.language.arabic")}
          </AdminDropdownMenuItem>
        </AdminDropdownMenuGroup>
        <AdminDropdownMenuSeparator />
        <AdminDropdownMenuItem
          variant="destructive"
          disabled={pending}
          onClick={() => void logout()}
        >
          <LogOut aria-hidden />
          {pending ? t("admin.settings.loggingOut") : t("admin.settings.logout")}
        </AdminDropdownMenuItem>
      </AdminDropdownMenuContent>
    </AdminDropdownMenu>
  );
}
