"use client";

import type { ReactNode } from "react";
import { SectionBar } from "./SectionBar";
import { ScrollReveal } from "./ScrollReveal";
import { dentalSectionShell } from "@/features/portfolio/lib/dentalLayout";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  section: string;
  label: string;
  heading: string;
  intro: string;
  number: string;
  labelField?: string;
  headingField?: string;
  introField?: string;
  empty?: string | null;
  children: ReactNode;
};

export function DentalWorkSection({
  id,
  section,
  label,
  heading,
  intro,
  number,
  labelField,
  headingField,
  introField,
  empty,
  children,
}: Props) {
  return (
    <section
      className={cn("border-t border-[#e6e8ec] bg-white", dentalSectionShell)}
      id={id}
      data-customize-section={section || undefined}
    >
        <SectionBar label={label} number={number} labelField={labelField} />
        <ScrollReveal>
          <h2
            className="max-w-xl text-3xl font-semibold text-[#0f2744]"
            data-customize-field={headingField}
          >
            {heading}
          </h2>
          {intro ? (
            <p
              className="mt-4 max-w-2xl text-[#6b7280]"
              data-customize-field={introField}
            >
              {intro}
            </p>
          ) : null}
        </ScrollReveal>
        {empty ? (
          <p className="mt-10 text-sm text-[#6b7280]">{empty}</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {children}
          </div>
        )}
    </section>
  );
}
