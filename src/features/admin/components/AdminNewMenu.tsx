"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarPlus,
  ChevronDown,
  NotebookPen,
  Plus,
  Stethoscope,
  UserPlus,
  Wrench,
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
import { dispatchOpenClinicalNote } from "@/features/admin/lib/adminShellEvents";
import { patientProfilePath } from "@/services/reservations/patientHistory";
import { AddPatientDialog } from "@/features/admin/components/patients/AddPatientDialog";
import { AddDoctorDialog } from "@/features/admin/components/doctors/AddDoctorDialog";
import { ServicesFormDialog } from "@/features/admin/components/ServicesFormDialog";
import { ConfirmDeleteDialog } from "@/features/admin/components/ConfirmDeleteDialog";
import { useBoardCrud } from "@/features/admin/hooks/useBoardCrud";
import {
  createService,
  softDeleteService,
  updateService,
  type Service,
} from "@/services/services";
import { listRolesAction } from "@/services/roles/actions";
import type { Role } from "@/services/roles/queries";
import { useQuickBook } from "./quick-book/QuickBookContext";

export function AdminNewMenu() {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { openQuickBook } = useQuickBook();
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [addDoctorOpen, setAddDoctorOpen] = useState(false);
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [serviceDeleteOpen, setServiceDeleteOpen] = useState(false);
  const showClinicalNote = canAddClinicalNote(pathname);

  const servicesBoard = useBoardCrud<Service>({
    initial: [],
    create: (sort_order) =>
      createService({
        title: t("admin.untitled"),
        title_ar: "",
        tags: [],
        description: "",
        description_ar: "",
        kind: "our_services",
        sort_order,
        is_published: true,
      }),
    update: async (id, payload) => {
      const row = await updateService(id, payload);
      toast.success(t("admin.cms.saveSuccess"));
      return row;
    },
    remove: softDeleteService,
  });

  async function handleAddDoctorClick() {
    if (!roles) {
      setRolesLoading(true);
      try {
        setRoles(await listRolesAction());
      } catch {
        toast.error(t("admin.doctors.addDoctorLoadRolesFail"));
        return;
      } finally {
        setRolesLoading(false);
      }
    }
    setAddDoctorOpen(true);
  }

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
          <AdminDropdownMenuItem
            disabled={rolesLoading}
            onClick={() => void handleAddDoctorClick()}
          >
            <Stethoscope aria-hidden />
            {t("admin.new.menu.doctor")}
          </AdminDropdownMenuItem>
          <AdminDropdownMenuItem onClick={() => void servicesBoard.addItem()}>
            <Wrench aria-hidden />
            {t("admin.new.menu.service")}
          </AdminDropdownMenuItem>

          {showClinicalNote ? (
            <>
              <AdminDropdownMenuSeparator />
              <AdminDropdownMenuItem onClick={() => dispatchOpenClinicalNote()}>
                <NotebookPen aria-hidden />
                {t("admin.new.menu.clinicalNote")}
              </AdminDropdownMenuItem>
            </>
          ) : null}
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

      <AddDoctorDialog
        open={addDoctorOpen}
        onOpenChange={setAddDoctorOpen}
        roles={roles ?? []}
        onCreated={() => {
          router.refresh();
        }}
      />

      <ServicesFormDialog
        open={Boolean(servicesBoard.selected)}
        item={servicesBoard.selected}
        pending={servicesBoard.pending}
        message={servicesBoard.message}
        onOpenChange={(open) => {
          if (!open) servicesBoard.close();
        }}
        onSubmit={servicesBoard.onSave}
        onDeleteClick={() => setServiceDeleteOpen(true)}
      />
      <ConfirmDeleteDialog
        open={serviceDeleteOpen}
        onOpenChange={setServiceDeleteOpen}
        onConfirm={async () => {
          await servicesBoard.onDelete();
          setServiceDeleteOpen(false);
        }}
      />
    </>
  );
}
