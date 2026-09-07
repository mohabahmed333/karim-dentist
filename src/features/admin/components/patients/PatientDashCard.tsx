"use client";

import type { ReactNode } from "react";

type Tone = "default" | "dark" | "accent";

type Props = {
  children: ReactNode;
  className?: string;
  tone?: Tone;
  title?: string;
  action?: ReactNode;
};

const TONE: Record<Tone, string> = {
  default: "pdash-card",
  dark: "pdash-card pdash-card-dark",
  accent: "pdash-card pdash-card-accent",
};

export function PatientDashCard({
  children,
  className = "",
  tone = "default",
  title,
  action,
}: Props) {
  return (
    <section className={`${TONE[tone]} p-4 md:p-5 ${className}`}>
      {title || action ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title ? (
            <h3
              className={`text-[13px] font-semibold ${
                tone === "dark" ? "text-white/80" : "text-[#6b7280]"
              }`}
            >
              {title}
            </h3>
          ) : (
            <span />
          )}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
