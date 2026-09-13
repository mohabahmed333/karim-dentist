/** Shared AI chat surfaces — gray canvas, flush header/footer. */
export const CHAT_BORDER = "border-[var(--admin-border)]";
export const CHAT_BG = "bg-[var(--admin-canvas)]";
export const CHAT_SHELL = `${CHAT_BG}`;
export const CHAT_CARD =
  "rounded-2xl border border-[var(--admin-border)]/80 bg-[var(--admin-panel)] shadow-[0_4px_20px_rgba(0,0,0,0.05)]";
export const CHAT_HEADER =
  "shrink-0 w-full border-b border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 py-2 sm:px-4 sm:py-3";
export const CHAT_BODY = "bg-transparent";
export const CHAT_BUBBLE =
  "w-full max-w-full min-w-0 rounded-2xl border border-[var(--admin-border)]/80 bg-[var(--admin-panel)] px-3 py-2 text-[13px] leading-5 text-[var(--admin-text)] shadow-[0_4px_16px_rgba(0,0,0,0.04)] sm:px-3.5 sm:py-2.5";
export const CHAT_META = "text-[var(--admin-muted)]";
export const CHAT_FOOTER =
  "shrink-0 w-full overflow-hidden border-t border-[var(--admin-border)] bg-[var(--admin-panel)]";
