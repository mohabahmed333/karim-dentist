export type RecordsPane = "history" | "clinical" | "teeth";

export type PatientView = "chairside" | RecordsPane;

export const PATIENT_VIEW_TABS: { id: PatientView; label: string }[] = [
  { id: "chairside", label: "Chairside" },
  { id: "history", label: "History" },
  { id: "clinical", label: "Clinical" },
  { id: "teeth", label: "Chart style" },
];

export function openRecords(pane: RecordsPane): RecordsPane {
  return pane;
}

export function closeRecords(): null {
  return null;
}

/** Maps a tab id to overlay pane state (`null` = chairside workspace). */
export function paneFromView(view: PatientView): RecordsPane | null {
  return view === "chairside" ? null : view;
}

export function viewFromPane(pane: RecordsPane | null): PatientView {
  return pane ?? "chairside";
}
