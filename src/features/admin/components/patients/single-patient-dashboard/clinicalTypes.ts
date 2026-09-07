export type ViewTab = "chairside" | "history" | "clinical" | "teeth";

export const VIEW_TABS: { id: ViewTab; label: string }[] = [
  { id: "chairside", label: "Chairside" },
  { id: "history", label: "History" },
  { id: "clinical", label: "Clinical" },
  { id: "teeth", label: "Chart style" },
];

export type QueueSeverity = "Critical" | "Minor";
export type QueueStatus = "open" | "scheduled" | "done";

export type QueueRow = {
  id: string;
  toothFdi: string | null;
  toothLabel: string;
  cdtCode: string | null;
  description: string;
  severity: QueueSeverity;
  status: QueueStatus;
  feeAmount: number;
  imageUrls: string[];
  source: "server" | "session";
};

export type CdtQuickAction = {
  id: string;
  label: string;
  cdtCode: string;
  severity: QueueSeverity;
  feeAmount: number;
  procedureName: string;
};

export type AiAssistChip = {
  id: string;
  label: string;
  narrative: string;
};
