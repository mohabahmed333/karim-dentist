import type {
  ApplianceType,
  Arch,
  ConditionStatus,
  ConditionType,
  EncounterType,
  GraphAnchor,
  LabStatus,
  MediaType,
  RxFrequency,
  RxStatus,
  Severity,
} from "./enums";

export type PatientProfile = {
  id: string;
  name: string;
  dob: string | null;
  assignedProviderIds: string[];
};

export type ConditionNode = {
  id: string;
  toothNumber: number;
  type: ConditionType;
  severity: Severity;
  status: ConditionStatus;
  vitalityIndex: number | null;
  streamVisible: boolean;
};

export type ToothData = {
  toothNumber: number;
  fdi: string;
  arch: Arch;
  conditions: ConditionNode[];
  activeAlertCount: number;
  glowing: boolean;
};

export type Encounter = {
  id: string;
  patientId: string;
  timestamp: string;
  type: EncounterType;
  toothNumbers: number[];
  providerId: string;
  notes: string;
  conditionIds: string[];
  graphAnchor: GraphAnchor;
};

export type DiagnosticMedia = {
  id: string;
  encounterId: string;
  mediaType: MediaType;
  quadrantUrls: string[];
  findings: string;
};

export type LabOrder = {
  id: string;
  patientId: string;
  toothNumber: number;
  applianceType: ApplianceType;
  progressPercent: number;
  status: LabStatus;
  updatedAt: string;
};

export type Prescription = {
  id: string;
  patientId: string;
  drugName: string;
  dosage: string;
  frequency: RxFrequency;
  startDate: string;
  endDate: string;
  status: RxStatus;
};

export type TimelineRange = { startYear: number; endYear: number };

export type TimelineTick = {
  key: string;
  pct: number;
  size: number;
  label: string | null;
  count: number;
};

export type NodeGraph = {
  conditionId: string;
  toothNumber: number;
  anchors: GraphAnchor[];
  encounters: Encounter[];
  media: DiagnosticMedia[];
  notes: string[];
  vitalityIndex: number | null;
};

export type DentalChart = {
  patient: PatientProfile;
  teeth: ToothData[];
  conditions: ConditionNode[];
  encounters: Encounter[];
  media: DiagnosticMedia[];
  labs: LabOrder[];
  prescriptions: Prescription[];
};
