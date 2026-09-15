export type ProposalStatus = "sent" | "accepted" | "declined";

export type ProposalItem = {
  id: string;
  serviceId: string;
  description: string;
  amountEgp: number;
};

export type PendingProposal = {
  id: string;
  patientKey: string;
  doctorId: string;
  status: ProposalStatus;
  createdAt: string;
  items: ProposalItem[];
  total: number;
  reservationId: string | null;
  /** The doctor's message to whoever settles this — "" when they left it blank. */
  note: string;
};
