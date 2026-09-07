"use client";

import { ConfirmDeleteDialog } from "@/features/admin/components/ConfirmDeleteDialog";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import type { Service } from "@/services/services/types";
import { TreatmentBookDrawer } from "../treatments/TreatmentBookDrawer";
import type { usePatientTreatments } from "../usePatientTreatments";
import { ChartingTourCard } from "./ChartingTourCard";
import type { useChartingTour } from "./useChartingTour";

type Props = {
  tour: ReturnType<typeof useChartingTour>;
  group: PatientGroup;
  services: Service[];
  treatmentsChart: ReturnType<typeof usePatientTreatments>;
};

export function ChartingOverlays({
  tour,
  group,
  services,
  treatmentsChart,
}: Props) {
  return (
    <>
      {tour.open ? (
        <div className="sticky bottom-3 z-20 mx-auto max-w-md">
          <ChartingTourCard
            step={tour.step}
            stepIndex={tour.stepIndex}
            onBack={tour.back}
            onNext={tour.next}
            onSkip={tour.dismiss}
          />
        </div>
      ) : null}
      <TreatmentBookDrawer
        open={Boolean(treatmentsChart.booking)}
        mode={treatmentsChart.bookMode}
        group={group}
        services={services}
        treatment={treatmentsChart.booking}
        onClose={() => treatmentsChart.setBookId(null)}
        onBooked={treatmentsChart.afterBooked}
      />
      <ConfirmDeleteDialog
        open={Boolean(treatmentsChart.deleteId)}
        onOpenChange={(open) => {
          if (!open) treatmentsChart.setDeleteId(null);
        }}
        pending={treatmentsChart.pending}
        title="Remove this treatment?"
        description="This deletes the required treatment record."
        onConfirm={treatmentsChart.confirmDelete}
      />
    </>
  );
}
