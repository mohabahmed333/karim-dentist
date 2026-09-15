"use client";

import type { PatientGroup } from "@/services/reservations/patientHistory";
import type { PatientImaging } from "@/services/patient_imaging";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import type { PatientTreatmentRow } from "@/services/patient_treatments";
import type { Service } from "@/services/services/types";
import type { PriceableDoctor } from "@/services/service_doctors/pricing";
import type { ServiceDoctorMapping } from "@/services/service_doctors/queries";
import { PatientWorkspaceView } from "./workspace/PatientWorkspaceView";

type Props = {
  group: PatientGroup;
  notes: PatientToothNote[];
  imaging: PatientImaging[];
  treatments: PatientTreatmentRow[];
  services: Service[];
  directory: PatientGroup[];
  doctors: PriceableDoctor[];
  serviceDoctorMappings: Record<string, ServiceDoctorMapping[]>;
  canPropose: boolean;
  canEditBilling: boolean;
  billingBalance: number;
  currentDoctorId: string | null;
  canPickDoctor: boolean;
};

export function PatientProfileView({
  group,
  notes,
  imaging,
  treatments,
  services,
  directory,
  doctors,
  serviceDoctorMappings,
  canPropose,
  canEditBilling,
  billingBalance,
  currentDoctorId,
  canPickDoctor,
}: Props) {
  return (
    <PatientWorkspaceView
      group={group}
      notes={notes}
      imaging={imaging}
      treatments={treatments}
      services={services}
      directory={directory}
      doctors={doctors}
      serviceDoctorMappings={serviceDoctorMappings}
      canPropose={canPropose}
      canEditBilling={canEditBilling}
      billingBalance={billingBalance}
      currentDoctorId={currentDoctorId}
      canPickDoctor={canPickDoctor}
    />
  );
}
