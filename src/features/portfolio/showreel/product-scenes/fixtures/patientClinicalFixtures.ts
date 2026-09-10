export const CLINICAL_AI_FIXTURE = {
  patientName: "Nour El-Sayed",
  toothFdi: "16",
  toothName: "Upper right first molar",
  xrayUrl: "/dental/771997664_18085564919253727_2931628136836544374_n.jpg",
  notes: [
    "Pain on biting for 4 days",
    "Cold sensitivity lasting >10s",
    "No swelling reported",
  ],
  caseSummary: {
    findings: [
      "Occlusal caries with possible pulp involvement on #16",
      "Percussion positive; mobility WNL",
    ],
    proposedTreatment: {
      title: "Deep caries excavation + pulp assessment",
      cdtHint: "D2391 / possible D3110",
      feeHint: "EGP 2,800–4,200",
    },
  },
  reviewGateLabel: "Review and apply",
} as const;

export type ClinicalAiFixture = typeof CLINICAL_AI_FIXTURE;
