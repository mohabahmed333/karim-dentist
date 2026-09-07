export const EHR = {
  canvas: "var(--admin-canvas)",
  ink: "var(--admin-primary)",
  yellow: "var(--admin-primary)",
  muted: "var(--admin-muted)",
  border: "var(--admin-border)",
  soft: "var(--admin-hover)",
  card: "var(--admin-panel)",
  white: "var(--admin-panel)",
} as const;

export type EhrCondition = {
  id: string;
  index: number;
  title: string;
  toothName: string;
  fdi: string | null;
  toothUniversal: number | null;
  toothLabel: string;
  counts: { labs: number; scans: number; meds: number; notes: number };
};

export type EhrVisit = {
  id: string;
  dateLabel: string;
  timeLabel: string;
  startsAt: string;
  year: number;
  doctor: string;
  serviceLabel: string;
  status: string;
  mediaIds: string[];
};

export type EhrMediaPanel = {
  id: string;
  visitId: string;
  label: string;
  dateLabel: string;
  index: number;
  variant: "dark" | "light";
  urls: string[];
};

export const FDI_TO_UNIVERSAL: Record<string, number> = {
  "18": 1, "17": 2, "16": 3, "15": 4, "14": 5, "13": 6, "12": 7, "11": 8,
  "21": 9, "22": 10, "23": 11, "24": 12, "25": 13, "26": 14, "27": 15, "28": 16,
  "38": 17, "37": 18, "36": 19, "35": 20, "34": 21, "33": 22, "32": 23, "31": 24,
  "41": 25, "42": 26, "43": 27, "44": 28, "45": 29, "46": 30, "47": 31, "48": 32,
};

export const UNIVERSAL_TO_FDI: Record<number, string> = Object.fromEntries(
  Object.entries(FDI_TO_UNIVERSAL).map(([fdi, universal]) => [universal, fdi]),
) as Record<number, string>;
