"use client";

type Props = {
  children: React.ReactNode;
};

export function CustomizeSidebar({ children }: Props) {
  return (
    <aside
      data-tour="editor"
      className="customize-sidebar flex h-full min-h-0 w-[280px] shrink-0 flex-col overflow-hidden self-stretch border-e border-[var(--admin-border)] bg-[var(--admin-panel)] xl:w-[320px] 2xl:w-[360px]"
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[var(--admin-panel)]">
        <div className="customize-editor flex flex-col px-3 py-3">
          {children}
        </div>
      </div>
    </aside>
  );
}
