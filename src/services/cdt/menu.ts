import { CDT_CATALOG, cdtByCode } from "./catalog";
import { GROUP_ORDER } from "./groups";
import type { CdtEntry, CdtGroup } from "./types";
import type { ClinicFeeRow, ClinicPresetRow } from "../clinic_fees/resolvePresets";

export type ClinicMenuItem = {
  code: string;
  shortLabel: string;
  title: string;
  group: CdtGroup;
  fee: number;
};

function groupRank(group: CdtGroup): number {
  const index = GROUP_ORDER.indexOf(group);
  return index === -1 ? GROUP_ORDER.length : index;
}

export function resolveClinicMenu(
  fees: readonly ClinicFeeRow[],
): ClinicMenuItem[] {
  const items: ClinicMenuItem[] = [];
  for (const row of fees) {
    const entry = cdtByCode(row.code);
    if (!entry) continue;
    items.push({
      code: entry.code,
      shortLabel: entry.shortLabel,
      title: entry.title,
      group: entry.group,
      fee: row.fee_egp,
    });
  }
  return items.sort((a, b) => {
    const groupDiff = groupRank(a.group) - groupRank(b.group);
    if (groupDiff !== 0) return groupDiff;
    return a.shortLabel.localeCompare(b.shortLabel);
  });
}

export function addableCatalog(
  menuCodes: ReadonlySet<string>,
): readonly CdtEntry[] {
  return CDT_CATALOG.filter((row) => !menuCodes.has(row.code));
}

export function canRemoveFromMenu(
  code: string,
  presets: readonly ClinicPresetRow[],
): boolean {
  return !presets.some((row) => row.code === code);
}

export function moreMenuItems(
  menu: readonly ClinicMenuItem[],
  presets: readonly ClinicPresetRow[],
): ClinicMenuItem[] {
  const favorite = new Set(presets.map((row) => row.code));
  return menu.filter((row) => !favorite.has(row.code));
}
