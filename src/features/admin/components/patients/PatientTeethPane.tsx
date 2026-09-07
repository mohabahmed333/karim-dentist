"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import type { Service } from "@/services/services/types";
import { ToothRecordPanel } from "./ToothRecordPanel";
import type { chartTabProps } from "./history-dashboard/chartTabProps";
import { TeethChartCanvas } from "./teeth-charts/TeethChartCanvas";
import { TeethChartPicker } from "./teeth-charts/TeethChartPicker";
import type { TeethChartStyle } from "./teeth-charts/chartStyles";
import { RequiredTreatmentsSection } from "./treatments/RequiredTreatmentsSection";
import type { usePatientTreatments } from "./usePatientTreatments";
import { PATIENT_PANEL_PAD } from "./patientSkin";

type Props = ReturnType<typeof chartTabProps> & {
  group: PatientGroup;
  treatmentsChart: ReturnType<typeof usePatientTreatments>;
  services: Service[];
};

export function PatientTeethPane(props: Props) {
  const [hoveredFdi, setHoveredFdi] = useState<string | null>(null);
  const [chartStyle, setChartStyle] = useState<TeethChartStyle>("anatomic");

  const chartProps = {
    selectedFdi: props.selectedFdi,
    hoveredFdi,
    commented: props.commented,
    onSelect: props.onSelect,
    onHover: setHoveredFdi,
    onDeselect: props.onDeselect,
  };

  return (
    <motion.div
      className="mt-5 space-y-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <div className={PATIENT_PANEL_PAD}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[15px] font-medium text-[#111111]">
              Dental chart & notes
            </h2>
            <p className="mt-0.5 text-[12px] text-[#6b7280]">
              Pick a chart style, select a tooth for notes, then Add a treatment.
            </p>
          </div>
          <TeethChartPicker value={chartStyle} onChange={setChartStyle} />
        </div>

        <div className="grid gap-5 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={chartStyle}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <TeethChartCanvas style={chartStyle} {...chartProps} />
              </motion.div>
            </AnimatePresence>
          </div>
          <motion.div
            className="xl:col-span-3"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05, duration: 0.25 }}
          >
            <ToothRecordPanel
              selectedFdi={props.selectedFdi}
              notes={props.selectedNotes}
              draftBody={props.draftBody}
              pendingFiles={props.pendingFiles}
              editingNoteId={props.editingNoteId}
              editBody={props.editBody}
              editPendingFiles={props.editPendingFiles}
              pending={props.pending}
              onClose={props.onDeselect}
              onDraftChange={props.onDraftChange}
              onAddFiles={props.onAddFiles}
              onRemovePendingFile={props.onRemovePendingFile}
              onSave={props.onSave}
              onStartEdit={props.onStartEdit}
              onCancelEdit={props.onCancelEdit}
              onEditBodyChange={props.onEditBodyChange}
              onAddEditFiles={props.onAddEditFiles}
              onRemoveEditPendingFile={props.onRemoveEditPendingFile}
              onRemoveAttachment={props.onRemoveAttachment}
              onSaveEdit={props.onSaveEdit}
              onDeleteNote={props.onDeleteNote}
            />
          </motion.div>
          <motion.div
            className="xl:col-span-4"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.25 }}
          >
            <RequiredTreatmentsSection
              group={props.group}
              services={props.services}
              selectedFdi={props.selectedFdi}
              chart={props.treatmentsChart}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
