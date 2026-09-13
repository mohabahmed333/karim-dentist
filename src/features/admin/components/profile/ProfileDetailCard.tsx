import type { ReactNode } from "react";

export function ProfileDetailCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)]">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--admin-border)] px-4 py-3">
        <h2 className="text-[15px] font-semibold text-[var(--admin-text)]">
          {title}
        </h2>
        {action}
      </header>
      <dl className="px-4">{children}</dl>
    </section>
  );
}

/** One label/value row, dotted-separated like the reference layout. */
export function ProfileDetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-dashed border-[var(--admin-border)] py-3 last:border-b-0">
      <dt className="shrink-0 text-[13px] text-[var(--admin-muted)]">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-end text-[13px] text-[var(--admin-text)]">
        {children}
      </dd>
    </div>
  );
}

export function ProfileBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "positive" | "accent";
}) {
  const tones = {
    neutral: "bg-[var(--admin-hover)] text-[var(--admin-muted)]",
    positive: "bg-[#DCFCE7] text-[#15803D]",
    accent: "bg-[#EEF2FF] text-[#4F46E5]",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
