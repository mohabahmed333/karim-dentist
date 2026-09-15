"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { listPatientImaging } from "@/services/patient_imaging";
import type { PatientImaging } from "@/services/patient_imaging";
import { listToothNotes } from "@/services/patient_tooth_notes/queries";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import {
  listPatientTreatments,
  toTreatmentItem,
  type PatientTreatmentRow,
  type TreatmentItem,
} from "@/services/patient_treatments";
import {
  getPatientGroup,
  groupReservationsByPatient,
  patientKeyFromReservation,
} from "@/services/reservations/patientHistory";
import type { Reservation } from "@/services/reservations/types";
import { PatientEhrView } from "@/features/admin/components/patients/ehr-view/PatientEhrView";
import { HomePatientClinicDrawerSkeleton } from "./HomePatientClinicDrawerSkeleton";
import {
  demoClinicalForPatient,
  type AdminDemoClinical,
} from "@/features/admin/lib/adminDemoClinical";
import { useAdminDrawerSide } from "@/features/admin/hooks/useAdminDrawerSide";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { BillPatientDialog } from "@/features/admin/components/billing/BillPatientDialog";
import { useTranslations } from "@/lib/i18n";

type Props = {
  open: boolean;
  reservation: Reservation | null;
  reservations: Reservation[];
  onClose: () => void;
  /** Showreel/offline: skip Supabase clinical loads and render empty EHR shell. */
  skipRemoteLoad?: boolean;
  /** Showreel: seed imaging/notes for the schedule patient with real fixtures. */
  demoClinical?: AdminDemoClinical | null;
  /** Billing this visit straight from the drawer. Fails closed. */
  canPropose?: boolean;
  currentDoctorId?: string | null;
  canPickDoctor?: boolean;
};

export function HomePatientClinicDrawer({
  open,
  reservation,
  reservations,
  onClose,
  skipRemoteLoad = false,
  demoClinical = null,
  canPropose = false,
  currentDoctorId = null,
  canPickDoctor = true,
}: Props) {
  const t = useTranslations();
  const [billOpen, setBillOpen] = useState(false);
  const directory = useMemo(
    () => groupReservationsByPatient(reservations),
    [reservations],
  );
  const patientKey = reservation
    ? patientKeyFromReservation(reservation)
    : null;
  const group = patientKey ? getPatientGroup(directory, patientKey) : null;

  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [notes, setNotes] = useState<PatientToothNote[]>([]);
  const [imaging, setImaging] = useState<PatientImaging[]>([]);
  const [treatments, setTreatments] = useState<TreatmentItem[]>([]);
  const drawer = useAdminDrawerSide();
  const loading = Boolean(open && patientKey && loadedKey !== patientKey);

  useEffect(() => {
    if (!open) {
      setLoadedKey(null);
      return;
    }
    if (!patientKey) return;
    if (skipRemoteLoad) {
      const seeded = demoClinicalForPatient(demoClinical, patientKey);
      setNotes(seeded?.notes ?? []);
      setImaging(seeded?.imaging ?? []);
      setTreatments(seeded?.treatments ?? []);
      setLoadedKey(patientKey);
      return;
    }
    let alive = true;
    setNotes([]);
    setImaging([]);
    setTreatments([]);
    void Promise.all([
      listToothNotes(patientKey),
      listPatientImaging(patientKey),
      listPatientTreatments(patientKey),
    ])
      .then(([n, i, rows]) => {
        if (!alive) return;
        setNotes(n);
        setImaging(i);
        setTreatments(
          (rows as PatientTreatmentRow[]).map((row) => toTreatmentItem(row)),
        );
        setLoadedKey(patientKey);
      })
      .catch((err) => {
        if (!alive) return;
        toast.error(
          err instanceof Error ? err.message : "Could not load Clinical",
        );
        setLoadedKey(patientKey);
      });
    return () => {
      alive = false;
    };
  }, [open, patientKey, skipRemoteLoad, demoClinical]);

  useEffect(() => {
    function onShowreelClose() {
      onClose();
    }
    window.addEventListener("showreel-clinic-drawer-close", onShowreelClose);
    return () =>
      window.removeEventListener("showreel-clinic-drawer-close", onShowreelClose);
  }, [onClose]);

  if (!group) return null;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent
        side={drawer.rtl ? "right" : "left"}
        dir={drawer.contentDir}
        showCloseButton={false}
        data-showreel-action="clinic-drawer"
        className="w-[min(100%,68vw)] min-w-[22rem] max-w-none"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 bg-[var(--admin-panel)] px-4 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-[var(--admin-primary)]">
              {group.displayName}
            </p>
            <p className="truncate text-[12px] text-[var(--admin-muted)]">
              {[
                group.phone || null,
                group.email || null,
                `${group.visits.length} visit${group.visits.length === 1 ? "" : "s"}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          {canPropose && !skipRemoteLoad && reservation ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setBillOpen(true);
              }}
              className="shrink-0 rounded-md bg-[var(--admin-primary)] px-2.5 py-1.5 text-[12px] font-semibold text-white hover:opacity-90"
            >
              {t("admin.billing.billVisit")}
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Close"
            data-showreel-action="clinic-drawer-close"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="shrink-0 rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--admin-canvas)] p-2 sm:p-3">
          {loading ? (
            <HomePatientClinicDrawerSkeleton />
          ) : (
            <PatientEhrView
              key={group.patientKey}
              group={group}
              treatments={treatments}
              imaging={imaging}
              notes={notes}
              layout="stacked"
            />
          )}
        </div>
        {reservation ? (
          <BillPatientDialog
            open={billOpen}
            onOpenChange={setBillOpen}
            patientKey={group.patientKey}
            patientPhone={group.phone}
            patientName={group.displayName}
            reservations={group.visits}
            visit={{
              id: reservation.id,
              serviceId: reservation.service_id,
              serviceLabel: reservation.service_label,
              startsAt: reservation.starts_at,
              doctorId: reservation.doctor_id,
            }}
            currentDoctorId={currentDoctorId}
            canPickDoctor={canPickDoctor}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
