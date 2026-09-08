"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "@/lib/i18n";
import { adminRailItems } from "@/features/admin/lib/adminNav";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AdminAccountMenu } from "./AdminAccountMenu";

export function AdminIconRail() {
  const pathname = usePathname();
  const t = useTranslations();
  const { locale } = useLocale();
  const tipSide = locale === "ar" ? "left" : "right";

  return (
    <TooltipProvider>
      <aside className="sticky top-0 hidden h-screen w-11 shrink-0 flex-col items-center gap-0.5 self-start border-e border-[var(--admin-border)] bg-[var(--admin-canvas)] py-3 md:flex">
        <div
          className="mb-2 flex size-6 items-center justify-center rounded-[5px] text-[9px] font-bold tracking-tight text-white"
          style={{ background: "var(--admin-primary)" }}
          title={t("admin.brand")}
        >
          DL
        </div>
        {adminRailItems.map((item) => {
          const Icon = item.icon;
          const label = t(item.labelKey);
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger
                delay={200}
                closeDelay={0}
                render={
                  <Link
                    href={item.href}
                    aria-label={label}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-md transition-colors",
                      active
                        ? "bg-[var(--admin-active)] text-[var(--admin-primary)]"
                        : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]",
                    )}
                  />
                }
              >
                <Icon className="size-3.5" aria-hidden />
                <span className="sr-only">{label}</span>
              </TooltipTrigger>
              <TooltipContent side={tipSide} sideOffset={10}>
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
        <div className="mt-auto">
          <AdminAccountMenu compact />
        </div>
      </aside>
    </TooltipProvider>
  );
}
