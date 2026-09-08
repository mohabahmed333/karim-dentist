"use client";

import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { AdminInput, AdminTextarea } from "@/features/admin/ui";
import type {
  PatientGender,
  PatientProfileUpsertValues,
} from "@/services/patient_profiles";
import { ClientProfileChips } from "./ClientProfileChips";
import { ClientProfileSummary } from "./ClientProfileSummary";
import {
  AGE_CHIPS,
  ALLERGY_CHIPS,
  GENDER_CHIPS,
  MEDICAL_HISTORY_CHIPS,
} from "./profileIntakeChips";

type Props = {
  value: PatientProfileUpsertValues;
  onChange: (next: PatientProfileUpsertValues) => void;
  readOnly?: boolean;
};

export function ClientProfileForm({ value, onChange, readOnly }: Props) {
  if (readOnly) return <ClientProfileSummary value={value} />;

  function set<K extends keyof PatientProfileUpsertValues>(
    key: K,
    next: PatientProfileUpsertValues[K],
  ) {
    onChange({ ...value, [key]: next });
  }

  function toggleList(key: "medical_history" | "allergies", chip: string) {
    const list = value[key];
    const has = list.includes(chip);
    const next = has ? list.filter((item) => item !== chip) : [...list, chip];
    set(key, next);
  }

  return (
    <div className="space-y-5 px-5 pb-6 pt-1">
      <Section title="Identity">
        <Field label="Full name">
          <AdminInput
            value={value.display_name}
            onChange={(e) => set("display_name", e.target.value)}
          />
        </Field>
        <Field label="Phone">
          <AdminInput
            value={value.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </Field>
        <Field label="Email">
          <AdminInput
            type="email"
            value={value.email ?? ""}
            onChange={(e) => set("email", e.target.value || null)}
          />
        </Field>
      </Section>

      <Section title="Demographics">
        <Field label="Age (years)">
          <AdminInput
            type="number"
            min={0}
            max={130}
            value={value.age_years ?? ""}
            onChange={(e) =>
              set(
                "age_years",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
          />
        </Field>
        <ClientProfileChips
          options={[...AGE_CHIPS]}
          selected={value.age_years != null ? String(value.age_years) : ""}
          onToggle={(chip) => set("age_years", Number(chip))}
        />
        <Field label="Date of birth">
          <AdminInput
            type="date"
            value={value.date_of_birth ?? ""}
            onChange={(e) => set("date_of_birth", e.target.value || null)}
          />
        </Field>
        <Field label="Gender">
          <ClientProfileChips
            options={GENDER_CHIPS}
            selected={value.gender}
            onToggle={(chip) =>
              set(
                "gender",
                chip === value.gender ? "" : (chip as PatientGender),
              )
            }
          />
        </Field>
      </Section>

      <Section title="Medical history">
        <ClientProfileChips
          options={[...MEDICAL_HISTORY_CHIPS]}
          selected={value.medical_history}
          onToggle={(chip) => toggleList("medical_history", chip)}
        />
      </Section>

      <Section title="Allergies">
        <ClientProfileChips
          options={[...ALLERGY_CHIPS]}
          selected={value.allergies}
          onToggle={(chip) => toggleList("allergies", chip)}
        />
      </Section>

      <Section title="Medications">
        <AdminTextarea
          rows={3}
          placeholder="Current medications…"
          value={value.medications}
          onChange={(e) => set("medications", e.target.value)}
        />
      </Section>

      <Section title="Reception notes">
        <AdminTextarea
          rows={4}
          placeholder="Intake notes for the clinician…"
          value={value.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <h4 className="text-[11px] font-semibold tracking-wide text-[#70758A] uppercase">
        {title}
      </h4>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <Label className="text-[12px] text-[#70758A]">{label}</Label>
      {children}
    </label>
  );
}
