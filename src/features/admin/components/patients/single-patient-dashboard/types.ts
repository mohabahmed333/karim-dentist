export type TreatmentSeverity = "Critical" | "Minor";

export type QuickAction = "Fill" | "Crown" | "Extract";

export type Treatment = {
  id: string;
  tooth: number;
  cdtCode: string;
  procedureName: string;
  severity: TreatmentSeverity;
  fee: number;
};

export type MockPatient = {
  name: string;
  age: number;
  balance: number;
  hasMedicalAlert: boolean;
};
