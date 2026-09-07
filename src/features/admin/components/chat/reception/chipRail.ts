export const CHIP_RAIL_CLASS =
  "flex w-full min-w-0 gap-1.5 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export const CHIP_PILL_CLASS =
  "shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-40";

export function isComposerStartSet(actions: { id: string }[]): boolean {
  if (actions.length === 0) return false;
  return actions.every((action) => action.id.startsWith("start:"));
}
