"use client";

type Props = {
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function EhrNodeStage({ children, footer }: Props) {
  return (
    <div
      className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[28px] border border-[var(--admin-border)] sm:rounded-[32px]"
      style={{ backgroundColor: "var(--admin-canvas)" }}
    >
      <div className="@container relative min-h-0 flex-1 overflow-hidden">
        {children}
      </div>
      {footer ? (
        <div
          className="relative z-30 shrink-0 overflow-visible border-t border-[var(--admin-border)] px-3 pt-3 pb-3 sm:px-5 sm:pb-4"
          style={{ backgroundColor: "var(--admin-canvas)" }}
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}
