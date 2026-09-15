"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, ChevronDown, Plus, UserPlus } from "lucide-react";
import {
  AdminDropdownMenu,
  AdminDropdownMenuContent,
  AdminDropdownMenuItem,
  AdminDropdownMenuTrigger,
} from "@/features/admin/ui";
import { useTranslations } from "@/lib/i18n";
import { patientProfilePath } from "@/services/reservations/patientHistory";
import { AddPatientDialog } from "@/features/admin/components/patients/AddPatientDialog";
import { useQuickBook } from "./quick-book/QuickBookContext";

export function AdminNewMenu() {
  const t = useTranslations();
  const router = useRouter();
  const { openQuickBook } = useQuickBook();
  const [addPatientOpen, setAddPatientOpen] = useState(false);

  return (
    <>
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
          <AdminDropdownMenuItem onClick={() => setAddPatientOpen(true)}>
            <UserPlus aria-hidden />
            {t("admin.new.menu.patient")}
          </AdminDropdownMenuItem>
        </AdminDropdownMenuContent>
      </AdminDropdownMenu>

      <AddPatientDialog
        open={addPatientOpen}
        onOpenChange={setAddPatientOpen}
        onCreated={(patient) => {
          setAddPatientOpen(false);
          router.push(patientProfilePath(patient.patient_key));
        }}
      />
    </>
  );
}
