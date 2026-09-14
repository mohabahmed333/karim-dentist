export type LedgerSource = "treatment" | "deposit" | "manual";

export type LedgerEntry = {
  id: string;
  date: string;
  kind: "charge" | "payment";
  source: LedgerSource;
  amount: number;
  description: string;
  method: string | null;
};

export type LedgerEntryWithBalance = LedgerEntry & { balanceAfter: number };

export type PatientBalance = {
  patientKey: string;
  displayName: string;
  phone: string;
  balance: number;
};
