"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";
import { adminRailItems } from "@/features/admin/lib/adminNav";
import { AdminAccountMenu } from "./AdminAccountMenu";

export function AdminIconRail() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <aside className="sticky top-0 hidden h-screen w-11 shrink-0 flex-col items-center gap-0.5 self-start border-e border-[var(--admin-border)] bg-[var(--admin-canvas)] py-3 md:flex">
      <div
        className="mb-2 flex size-6 items-center justify-center rounded-[5px] text-[9px] font-bold tracking-tight text-white"
        style={{ background: "var(--admin-primary)" }}
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
          <Link
            key={item.id}
            href={item.href}
            title={label}
            className={cn(
              "flex size-7 items-center justify-center rounded-md transition-colors",
              active
                ? "bg-[var(--admin-active)] text-[var(--admin-primary)]"
                : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            <span className="sr-only">{label}</span>
          </Link>
        );
      })}
      <div className="mt-auto">
        <AdminAccountMenu compact />
      </div>
    </aside>
  );
}
