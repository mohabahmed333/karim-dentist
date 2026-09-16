"use client";

import { useCallback, useEffect, useState } from "react";
import { HeartPulse, UserPlus } from "lucide-react";
import { AdminSkeleton } from "@/features/admin/components/AdminSkeleton";
import { buttonVariants } from "@/components/ui/button";
import {
  getPatientProfile,
  type PatientGender,
  type PatientProfile,
} from "@/services/patient_profiles";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import { useTranslations, type AdminMessageKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ClientProfileDrawer } from "./workspace/ClientProfileDrawer";

const GENDER_LABEL_KEYS: Record<Exclude<PatientGender, "">, AdminMessageKey> = {
  female: "admin.patients.profile.genderFemale",
  male: "admin.patients.profile.genderMale",
  other: "admin.patients.profile.genderOther",
  prefer_not: "admin.patients.profile.genderPreferNot",
};

type Props = { group: PatientGroup };

/**
 * The patient's own record — demographics, conditions, allergies, medications.
 *
 * Read-only here on purpose: the drawer the directory and the calendar already
 * use is the one place this is edited, and it is what the empty state opens.
 * The profile is fetched client-side rather than threaded down from the two
 * server pages that render this tab, so My Day and the patient record both get
 * it without either having to know the tab needs it.
 */
export function PatientMedicalProfile({ group }: Props) {
  const t = useTranslations();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Only ever sets state from a callback: setting it synchronously in the
  // effect body below would cascade a render before the first paint.
  const fetchProfile = useCallback(
    (signal: { cancelled: boolean }) =>
      getPatientProfile(group.patientKey)
        .then((row) => {
          if (signal.cancelled) return;
          setProfile(row);
          setFailed(false);
        })
        .catch(() => {
          if (signal.cancelled) return;
          setFailed(true);
        })
        .finally(() => {
          if (signal.cancelled) return;
          setLoading(false);
        }),
    [group.patientKey],
  );

  useEffect(() => {
    const signal = { cancelled: false };
    void fetchProfile(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [fetchProfile]);

  if (loading) {
    return <AdminSkeleton className="h-40 w-full rounded-2xl" />;
  }

  if (failed) {
    return (
      <p className="rounded-2xl border border-dashed border-[var(--admin-border)] px-4 py-8 text-center text-sm text-[var(--admin-muted)]">
        {t("admin.patientInfo.profileFailed")}
      </p>
    );
  }

  return (
    <>
      {profile ? (
        <section className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-[var(--admin-text)]">
            <HeartPulse className="size-4 text-[var(--admin-muted)]" />
            {t("admin.patientInfo.medicalProfile")}
          </h3>

          <dl className="grid gap-4 sm:grid-cols-3">
            <Field
              label={t("admin.patients.profile.age")}
              value={profile.age_years != null ? String(profile.age_years) : null}
            />
            <Field
              label={t("admin.patients.profile.dob")}
              value={profile.date_of_birth}
            />
            <Field
              label={t("admin.patients.profile.gender")}
              value={profile.gender ? t(GENDER_LABEL_KEYS[profile.gender]) : null}
            />
          </dl>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Chips
              label={t("admin.patients.profile.sectionMedicalHistory")}
              items={profile.medical_history ?? []}
            />
            <Chips
              label={t("admin.patients.profile.sectionAllergies")}
              items={profile.allergies ?? []}
              tone="warn"
            />
            <Prose
              label={t("admin.patients.profile.sectionMedications")}
              text={profile.medications}
            />
            <Prose
              label={t("admin.patients.profile.sectionNotes")}
              text={profile.notes}
            />
          </div>
        </section>
      ) : (
        <section className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--admin-border)] px-4 py-8 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-[var(--admin-hover)] text-[var(--admin-muted)]">
            <HeartPulse className="size-5" />
          </span>
          <p className="mt-3 text-sm font-semibold text-[var(--admin-text)]">
            {t("admin.patientInfo.profileEmpty")}
          </p>
          <p className="mt-1 max-w-sm text-sm text-[var(--admin-muted)]">
            {t("admin.patientInfo.profileEmptyHint")}
          </p>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}
          >
            <UserPlus className="size-3.5" />
            {t("admin.patientInfo.addProfile")}
          </button>
        </section>
      )}

      <ClientProfileDrawer
        open={drawerOpen}
        patientKey={group.patientKey}
        displayName={group.displayName}
        phone={group.phone}
        email={group.email}
        onClose={() => {
          setDrawerOpen(false);
          // The drawer owns the write, so re-read rather than guess at what it
          // saved — this is also what turns the empty state into the record.
          setLoading(true);
          void fetchProfile({ cancelled: false });
        }}
      />
    </>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-[var(--admin-muted)]">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium text-[var(--admin-text)]">
        {value?.trim() ? value : "—"}
      </dd>
    </div>
  );
}

function Chips({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone?: "warn";
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-[var(--admin-muted)]">{label}</p>
      {items.length === 0 ? (
        <p className="mt-1 text-sm text-[var(--admin-muted)]">—</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span
              key={item}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs font-medium",
                tone === "warn"
                  ? "border-[#EA580C]/30 bg-[#EA580C]/10 text-[#C2410C]"
                  : "border-[var(--admin-border)] bg-[var(--admin-hover)] text-[var(--admin-text)]",
              )}
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Prose({ label, text }: { label: string; text: string | null }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-[var(--admin-muted)]">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--admin-text)]">
        {text?.trim() ? text : "—"}
      </p>
    </div>
  );
}
