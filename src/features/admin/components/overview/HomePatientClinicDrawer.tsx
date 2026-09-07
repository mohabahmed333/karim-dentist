"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
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
import { ADMIN_THEME_EVENT } from "@/features/admin/lib/adminThemeEvent";
import { useAdminDrawerSide } from "@/features/admin/hooks/useAdminDrawerSide";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  reservation: Reservation | null;
  reservations: Reservation[];
  onClose: () => void;
};

const ADMIN_VAR_KEYS = [
  "--admin-primary",
  "--admin-secondary",
  "--admin-canvas",
  "--admin-panel",
  "--admin-border",
  "--admin-text",
  "--admin-muted",
  "--admin-hover",
  "--admin-active",
] as const;

type AdminThemeVars = Record<(typeof ADMIN_VAR_KEYS)[number], string>;

const FALLBACK_THEME: AdminThemeVars = {
  "--admin-primary": "#5e6ad2",
  "--admin-secondary": "#3b82f6",
  "--admin-canvas": "#f7f8f8",
  "--admin-panel": "#ffffff",
  "--admin-border": "#e6e6e6",
  "--admin-text": "#1a1a1a",
  "--admin-muted": "#6b6f76",
  "--admin-hover": "#eeeff1",
  "--admin-active": "#eceef9",
};

function readAdminThemeVars(): AdminThemeVars {
  const shell = document.querySelector(".admin-shell");
  if (!shell) return FALLBACK_THEME;
  const cs = getComputedStyle(shell);
  const next = { ...FALLBACK_THEME };
  for (const key of ADMIN_VAR_KEYS) {
    const value = cs.getPropertyValue(key).trim();
    if (value) next[key] = value;
  }
  return next;
}

export function HomePatientClinicDrawer({
  open,
  reservation,
  reservations,
  onClose,
}: Props) {
  const directory = useMemo(
    () => groupReservationsByPatient(reservations),
    [reservations],
  );
  const patientKey = reservation
    ? patientKeyFromReservation(reservation)
    : null;
  const group = patientKey ? getPatientGroup(directory, patientKey) : null;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [themeVars, setThemeVars] = useState<AdminThemeVars>(FALLBACK_THEME);
  const [notes, setNotes] = useState<PatientToothNote[]>([]);
  const [imaging, setImaging] = useState<PatientImaging[]>([]);
  const [treatments, setTreatments] = useState<TreatmentItem[]>([]);
  const drawer = useAdminDrawerSide();

  useEffect(() => {
    setMounted(true);
    setThemeVars(readAdminThemeVars());
    function syncTheme() {
      setThemeVars(readAdminThemeVars());
    }
    window.addEventListener(ADMIN_THEME_EVENT, syncTheme);
    return () => window.removeEventListener(ADMIN_THEME_EVENT, syncTheme);
  }, []);

  useEffect(() => {
    if (open) setThemeVars(readAdminThemeVars());
  }, [open]);

  useEffect(() => {
    if (!open || !patientKey) return;
    let alive = true;
    setLoading(true);
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
      })
      .catch((err) => {
        toast.error(
          err instanceof Error ? err.message : "Could not load Clinical",
        );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open, patientKey]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && group ? (
        <div
          className={cn("fixed inset-0 z-[200] flex", drawer.shellClass)}
          dir={drawer.shellDir}
          style={themeVars as CSSProperties}
        >
          <motion.button
            type="button"
            aria-label="Close Clinical"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            dir={drawer.contentDir}
            initial={{ x: drawer.offscreenX }}
            animate={{ x: 0 }}
            exit={{ x: drawer.offscreenX }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className={cn(
              "relative flex h-full w-[min(100%,68vw)] min-w-[22rem] max-w-none flex-col",
              drawer.panelClass,
            )}
            style={{
              backgroundColor: themeVars["--admin-panel"] || "#ffffff",
              color: themeVars["--admin-text"] || "#1a1a1a",
            }}
          >
            <div
              className="flex shrink-0 items-center justify-between gap-3 px-4 py-2.5"
              style={{
                backgroundColor: themeVars["--admin-panel"] || "#ffffff",
              }}
            >
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
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="shrink-0 rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
              >
                <X className="size-4" />
              </button>
            </div>
            <div
              className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 sm:p-3"
              style={{
                backgroundColor: themeVars["--admin-canvas"] || "#f7f8f8",
              }}
            >
              {loading ? (
                <p className="p-6 text-sm text-[var(--admin-muted)]">
                  Loading Clinical…
                </p>
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
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
