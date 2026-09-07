"use client";

import type { ReservationFormValues } from "@/services/reservations/schemas";
import type { Reservation } from "@/services/reservations/types";
import type { Service } from "@/services/services/types";
import { PatientHistorySnippet } from "./PatientHistorySnippet";
import { ReservationFormFields } from "./ReservationFormFields";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  mode: "create" | "edit";
  values: ReservationFormValues;
  services: Service[];
  reservations: Reservation[];
  selectedId: string | "new" | null;
  pending: boolean;
  onChange: (values: ReservationFormValues) => void;
  onSave: () => void;
  onDeleteClick?: () => void;
  onStatus: (status: Reservation["status"]) => void;
};

export function ReservationEditCard({
  mode,
  values,
  services,
  reservations,
  selectedId,
  pending,
  onChange,
  onSave,
  onDeleteClick,
  onStatus,
}: Props) {
  return (
    <Card className="gap-0 rounded-3xl p-5 ring-1 ring-[#e6e8ec]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium text-[#0f2744]">
          {mode === "create" ? "New reservation" : "Edit reservation"}
        </h2>
        {mode === "edit" && onDeleteClick ? (
          <Button variant="destructive" size="sm" onClick={onDeleteClick}>
            Delete
          </Button>
        ) : null}
      </div>
      <ReservationFormFields
        values={values}
        services={services}
        pending={pending}
        onChange={onChange}
      />
      <PatientHistorySnippet
        reservations={reservations}
        patientName={values.patient_name}
        phone={values.phone}
        excludeId={selectedId === "new" ? undefined : selectedId ?? undefined}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={onSave} disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Create" : "Save"}
        </Button>
        {mode === "edit" ? (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={pending || values.status === "confirmed"}
              onClick={() => onStatus("confirmed")}
            >
              Confirm
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending || values.status === "completed"}
              onClick={() => onStatus("completed")}
            >
              Complete
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending || values.status === "cancelled"}
              onClick={() => onStatus("cancelled")}
            >
              Cancel
            </Button>
          </>
        ) : null}
      </div>
    </Card>
  );
}
