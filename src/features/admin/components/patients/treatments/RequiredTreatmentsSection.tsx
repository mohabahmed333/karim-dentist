"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { ConfirmDeleteDialog } from "@/features/admin/components/ConfirmDeleteDialog";
import { toothName } from "@/services/patient_tooth_findings/fdi";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import type { Service } from "@/services/services/types";
import type { usePatientTreatments } from "../usePatientTreatments";
import { TreatmentAccordionItem } from "./TreatmentAccordionItem";
import { TreatmentBookDrawer } from "./TreatmentBookDrawer";
import { TreatmentContextMenu } from "./TreatmentContextMenu";
import { TreatmentEditorDrawer } from "./TreatmentEditorDrawer";
import { TreatmentsToolbar } from "./TreatmentsToolbar";

type Chart = ReturnType<typeof usePatientTreatments>;

type Props = {
  group: PatientGroup;
  services: Service[];
  selectedFdi: string | null;
  chart: Chart;
};

export function RequiredTreatmentsSection({
  group,
  services,
  selectedFdi,
  chart,
}: Props) {
  const [menu, setMenu] = useState<{ x: number; y: number; id: string } | null>(
    null,
  );

  function openAdd() {
    const seed = selectedFdi
      ? { tooth_fdi: selectedFdi, tooth_name: toothName(selectedFdi) }
      : null;
    chart.openEditor("new", seed);
  }

  return (
    <section className="relative flex min-h-[320px] flex-col rounded-2xl border border-[#E2E8F0] bg-[#EEF2F6] p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="flex items-center gap-2 text-[15px] font-medium text-[#111111]">
          <ClipboardList className="size-4 text-[#6b7280]" />
          Required treatments
        </h2>
        <TreatmentsToolbar
          query={chart.query}
          onQueryChange={chart.setQuery}
          severityFilter={chart.severityFilter}
          onSeverityFilter={chart.setSeverityFilter}
          onAdd={openAdd}
        />
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pb-2">
        {chart.visible.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#9ca3af]">
            No treatments yet. Select a tooth, then Add — or search in the form.
          </p>
        ) : (
          chart.visible.map((item) => (
            <TreatmentAccordionItem
              key={item.id}
              item={item}
              expanded={chart.expandedId === item.id}
              onToggle={() =>
                chart.setExpandedId((prev) =>
                  prev === item.id ? null : item.id,
                )
              }
              onBook={() => chart.openBook(item.id, "book")}
              onReplace={() => chart.openBook(item.id, "replace")}
              onContext={(rect) =>
                setMenu({
                  id: item.id,
                  x: Math.min(rect.left, window.innerWidth - 220),
                  y: rect.bottom + 6,
                })
              }
            />
          ))
        )}
      </div>

      <TreatmentContextMenu
        open={Boolean(menu)}
        x={menu?.x ?? 0}
        y={menu?.y ?? 0}
        scheduleLabel={
          menu &&
          chart.visible.find((row) => row.id === menu.id)?.appointment
            ? "Replace appointment"
            : "Schedule appointment"
        }
        onClose={() => setMenu(null)}
        onEdit={() => {
          if (menu) chart.openEditor(menu.id);
        }}
        onSchedule={() => {
          if (!menu) return;
          const item = chart.visible.find((row) => row.id === menu.id);
          chart.openBook(
            menu.id,
            item?.appointment ? "replace" : "book",
          );
        }}
        onDelete={() => {
          if (menu) chart.setDeleteId(menu.id);
        }}
      />

      <TreatmentEditorDrawer
        open={chart.editorId !== null}
        isNew={chart.editorId === "new"}
        editing={chart.editing}
        seed={chart.editorSeed}
        pending={chart.pending}
        onClose={chart.closeEditor}
        onSave={(raw, files) => void chart.saveTreatment(raw, files)}
        onRemoveSavedAttachment={(id) => void chart.removeAttachment(id)}
      />

      <TreatmentBookDrawer
        open={Boolean(chart.bookId)}
        mode={chart.bookMode}
        group={group}
        services={services}
        treatment={chart.booking}
        onClose={() => chart.setBookId(null)}
        onBooked={(id, reservation) => void chart.afterBooked(id, reservation)}
      />

      <ConfirmDeleteDialog
        open={Boolean(chart.deleteId)}
        onOpenChange={(open) => {
          if (!open) chart.setDeleteId(null);
        }}
        pending={chart.pending}
        title="Remove this treatment?"
        description="This deletes the required treatment record."
        onConfirm={chart.confirmDelete}
      />
    </section>
  );
}
