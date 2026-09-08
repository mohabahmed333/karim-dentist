"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  CalendarPlus,
  ChevronDown,
  MessagesSquare,
  NotebookPen,
  Plus,
  UserPlus,
} from "lucide-react";
import {
  AdminDropdownMenu,
  AdminDropdownMenuContent,
  AdminDropdownMenuItem,
  AdminDropdownMenuSeparator,
  AdminDropdownMenuTrigger,
} from "@/features/admin/ui";
import { useTranslations } from "@/lib/i18n";
import { canAddClinicalNote } from "@/features/admin/lib/adminPatientPath";
import {
  dispatchOpenClinicalNote,
  dispatchOpenWhatsapp,
} from "@/features/admin/lib/adminShellEvents";
import { useQuickBook } from "./quick-book/QuickBookContext";

export function AdminNewMenu() {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { openQuickBook } = useQuickBook();
  const showClinicalNote = canAddClinicalNote(pathname);
  const onSupport = pathname.startsWith("/admin/support");

  return (
    <AdminDropdownMenu>
      <AdminDropdownMenuTrigger
        className="inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-[12px] font-medium text-white hover:opacity-90"
        style={{ background: "var(--admin-primary)" }}
        aria-label={t("admin.new")}
      >
        <Plus className="size-3.5" aria-hidden />
        {t("admin.new")}
        <ChevronDown className="size-3 opacity-80" aria-hidden />
      </AdminDropdownMenuTrigger>
      <AdminDropdownMenuContent align="end" className="min-w-[15.5rem]">
        <AdminDropdownMenuItem onClick={() => openQuickBook()}>
          <CalendarPlus aria-hidden />
          {t("admin.new.menu.reservation")}
        </AdminDropdownMenuItem>
        <AdminDropdownMenuItem
          onClick={() => {
            router.push("/admin/patients");
            openQuickBook();
          }}
        >
          <UserPlus aria-hidden />
          {t("admin.new.menu.patient")}
        </AdminDropdownMenuItem>

        <AdminDropdownMenuSeparator />

        <AdminDropdownMenuItem
          onClick={() => {
            if (onSupport) {
              router.push("/admin/support");
              return;
            }
            dispatchOpenWhatsapp();
          }}
        >
          <MessagesSquare aria-hidden />
          {t("admin.new.menu.whatsapp")}
        </AdminDropdownMenuItem>
        {showClinicalNote ? (
          <AdminDropdownMenuItem onClick={() => dispatchOpenClinicalNote()}>
            <NotebookPen aria-hidden />
            {t("admin.new.menu.clinicalNote")}
          </AdminDropdownMenuItem>
        ) : null}
      </AdminDropdownMenuContent>
    </AdminDropdownMenu>
  );
}
