"use client";

import { Check, ChevronDown, KeyRound, LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { useCurrentProfile } from "@/features/admin/hooks/useCurrentProfile";
import { useLocale, useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AdminUserAvatar } from "./AdminUserAvatar";

type Props = { compact?: boolean };

export function AdminAccountMenu({ compact = false }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const { locale, setLocale } = useLocale();
  const { logout, pending } = useAdminLogout();
  const profile = useCurrentProfile();
  const label = profile?.name || profile?.email || t("admin.settings.account");

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
        <AdminUserAvatar
          name={profile?.name}
          email={profile?.email}
          avatarUrl={profile?.avatarUrl}
          size={compact ? "sm" : "xs"}
        />
        {compact ? (
          <span className="sr-only">{label}</span>
        ) : (
          <>
            <span className="min-w-0 flex-1 truncate text-start">{label}</span>
            <ChevronDown className="size-3.5 shrink-0 opacity-70" aria-hidden />
          </>
        )}
      </AdminDropdownMenuTrigger>
      <AdminDropdownMenuContent
        side={compact ? "right" : "top"}
        align={compact ? "end" : "start"}
        className="min-w-52 w-auto"
      >
        {profile ? (
          <>
            <div className="flex items-center gap-2.5 px-3 py-2">
              <AdminUserAvatar
                name={profile.name}
                email={profile.email}
                avatarUrl={profile.avatarUrl}
                size="md"
              />
              <div className="min-w-0">
                {profile.name ? (
                  <p className="truncate text-[13px] font-medium text-[var(--admin-text)]">
                    {profile.name}
                  </p>
                ) : null}
                {profile.email ? (
                  <p className="truncate text-xs text-[var(--admin-muted)]">
                    {profile.email}
                  </p>
                ) : null}
              </div>
            </div>
            <AdminDropdownMenuSeparator />
          </>
        ) : null}
        <AdminDropdownMenuItem
          onClick={() => router.push("/admin/account/profile")}
        >
          <UserRound aria-hidden />
          {t("admin.nav.profile")}
        </AdminDropdownMenuItem>
        <AdminDropdownMenuItem
          onClick={() => router.push("/admin/account/password")}
        >
          <KeyRound aria-hidden />
          {t("admin.nav.changePassword")}
        </AdminDropdownMenuItem>
        <AdminDropdownMenuSeparator />
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
