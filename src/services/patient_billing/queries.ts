import { groupReservationsByPatient } from "@/services/reservations/patientHistory";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import { listReservationsServer } from "@/services/reservations/queries";
import type {
  LedgerEntry,
  LedgerEntryWithBalance,
  PatientBalance,
  WeekPaymentRow,
} from "./types";

type ServerSupabase = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

/** Sorts by date and computes a running balance — pure, no I/O. */
export function buildLedger(entries: LedgerEntry[]): {
  entries: LedgerEntryWithBalance[];
  balance: number;
} {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  let running = 0;
  const withBalance = sorted.map((entry) => {
    running += entry.kind === "charge" ? entry.amount : -entry.amount;
    return { ...entry, balanceAfter: running };
  });
  return { entries: withBalance, balance: running };
}

type TreatmentChargeRow = { patient_key: string; fee_amount: number };
type DepositPaymentRow = { id: string; amount_egp: number; reservation_id: string };
type ManualEntryRow = {
  patient_key: string;
  kind: "charge" | "payment";
  amount_egp: number;
};

/** Nets charges against payments per patient_key — pure, no I/O. */
export function aggregatePatientBalances(
  treatments: TreatmentChargeRow[],
  deposits: DepositPaymentRow[],
  manualEntries: ManualEntryRow[],
  directory: PatientGroup[],
): PatientBalance[] {
  const reservationIdToPatientKey = new Map<string, string>();
  for (const group of directory) {
    for (const visit of group.visits) {
      reservationIdToPatientKey.set(visit.id, group.patientKey);
    }
  }

  const net = new Map<string, number>();
  const add = (patientKey: string, delta: number) => {
    net.set(patientKey, (net.get(patientKey) ?? 0) + delta);
  };

  for (const t of treatments) add(t.patient_key, t.fee_amount);
  for (const d of deposits) {
    const patientKey = reservationIdToPatientKey.get(d.reservation_id);
    if (patientKey) add(patientKey, -d.amount_egp);
  }
  for (const m of manualEntries) {
    add(m.patient_key, m.kind === "charge" ? m.amount_egp : -m.amount_egp);
  }

  const infoByKey = new Map(directory.map((g) => [g.patientKey, g]));
  return Array.from(net.entries())
    .filter(([, balance]) => balance !== 0)
    .map(([patientKey, balance]) => ({
      patientKey,
      displayName: infoByKey.get(patientKey)?.displayName ?? patientKey,
      phone: infoByKey.get(patientKey)?.phone ?? "",
      balance,
    }))
    .sort((a, b) => b.balance - a.balance);
}

/**
 * A patient's full ledger: done-treatment charges + paid-deposit credits
 * (matched via their own reservation ids) + manual entries.
 */
export async function listPatientLedger(
  supabase: ServerSupabase,
  patientKey: string,
  reservationIds: string[],
): Promise<{ entries: LedgerEntryWithBalance[]; balance: number }> {
  const [treatmentsRes, depositsRes, manualRes] = await Promise.all([
    supabase
      .from("patient_treatments")
      .select("id, fee_amount, tooth_name, cdt_code, updated_at")
      .eq("patient_key", patientKey)
      .eq("status", "done"),
    reservationIds.length > 0
      ? supabase
          .from("deposit_requests")
          .select("id, amount_egp, decided_at, created_at")
          .in("reservation_id", reservationIds)
          .eq("status", "paid")
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("patient_billing_entries")
      .select("id, kind, amount_egp, description, method, created_at")
      .eq("patient_key", patientKey),
  ]);
  if (treatmentsRes.error) throw treatmentsRes.error;
  if (depositsRes.error) throw depositsRes.error;
  if (manualRes.error) throw manualRes.error;

  const charges: LedgerEntry[] = (treatmentsRes.data ?? []).map((t) => ({
    id: `treatment:${t.id}`,
    date: t.updated_at,
    kind: "charge",
    source: "treatment",
    amount: t.fee_amount,
    description: t.cdt_code ? `${t.tooth_name} — ${t.cdt_code}` : t.tooth_name,
    method: null,
  }));

  const deposits: LedgerEntry[] = (depositsRes.data ?? []).map((d) => ({
    id: `deposit:${d.id}`,
    date: d.decided_at ?? d.created_at,
    kind: "payment",
    source: "deposit",
    amount: d.amount_egp,
    description: "Booking deposit",
    method: "deposit",
  }));

  const manual: LedgerEntry[] = (manualRes.data ?? []).map((m) => ({
    id: `manual:${m.id}`,
    date: m.created_at,
    kind: m.kind,
    source: "manual",
    amount: m.amount_egp,
    description: m.description,
    method: m.method,
  }));

  return buildLedger([...charges, ...deposits, ...manual]);
}

/** Every patient with a non-zero balance, clinic-wide, sorted by amount owed. */
export async function listPatientBalances(
  supabase: ServerSupabase,
): Promise<PatientBalance[]> {
  const [reservations, treatmentsRes, depositsRes, manualRes] = await Promise.all([
    listReservationsServer(supabase).catch(() => []),
    supabase.from("patient_treatments").select("patient_key, fee_amount").eq("status", "done"),
    supabase
      .from("deposit_requests")
      .select("id, amount_egp, reservation_id")
      .eq("status", "paid"),
    supabase.from("patient_billing_entries").select("patient_key, kind, amount_egp"),
  ]);
  if (treatmentsRes.error) throw treatmentsRes.error;
  if (depositsRes.error) throw depositsRes.error;
  if (manualRes.error) throw manualRes.error;

  const directory = groupReservationsByPatient(reservations);
  return aggregatePatientBalances(
    treatmentsRes.data ?? [],
    depositsRes.data ?? [],
    manualRes.data ?? [],
    directory,
  );
}

type WeekEntryRow = { amount_egp: number; method: string | null; created_at: string };
type WeekDepositRow = { amount_egp: number; decided_at: string | null; created_at: string };

/** Merges this-week billing-entry payments and paid deposits into one list — pure, no I/O. */
export function mergeWeekPayments(
  entries: WeekEntryRow[],
  deposits: WeekDepositRow[],
): WeekPaymentRow[] {
  const fromEntries: WeekPaymentRow[] = entries.map((e) => ({
    date: e.created_at,
    amount: e.amount_egp,
    method: e.method,
  }));
  const fromDeposits: WeekPaymentRow[] = deposits.map((d) => ({
    date: d.decided_at ?? d.created_at,
    amount: d.amount_egp,
    method: "deposit",
  }));
  return [...fromEntries, ...fromDeposits];
}

/** This week's payments (manual/WhatsApp billing entries + paid deposits), from/to inclusive ISO bounds. */
export async function listWeekPayments(
  supabase: ServerSupabase,
  from: string,
  to: string,
): Promise<WeekPaymentRow[]> {
  const [entriesRes, depositsRes] = await Promise.all([
    supabase
      .from("patient_billing_entries")
      .select("amount_egp, method, created_at")
      .eq("kind", "payment")
      .gte("created_at", from)
      .lte("created_at", to),
    supabase
      .from("deposit_requests")
      .select("amount_egp, decided_at, created_at")
      .eq("status", "paid")
      .gte("decided_at", from)
      .lte("decided_at", to),
  ]);
  if (entriesRes.error) throw entriesRes.error;
  if (depositsRes.error) throw depositsRes.error;
  return mergeWeekPayments(entriesRes.data ?? [], depositsRes.data ?? []);
}

/** Sum of every patient's positive balance — total EGP currently owed, clinic-wide. */
export function sumOutstandingBalance(balances: PatientBalance[]): number {
  return balances.reduce((sum, b) => sum + Math.max(0, b.balance), 0);
}
