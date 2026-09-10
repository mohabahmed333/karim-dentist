import { formatClinicHours, type ClinicHoursInput } from "./formatClinicHours";
import { wrapPatientTurn } from "./sanitize";

export type OfferedSlot = { id: string; starts_at: string };

export type ClinicFacts = {
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  mapUrl?: string | null;
};

export type PatientReservation = {
  id: string;
  service_label: string;
  starts_at: string;
  status: string;
};

export type PromptTurn = { role: "user" | "assistant"; content: string };

export type BuildPromptInput = {
  /** Contents of prompts/whatsapp-autoresponder.md. */
  basePrompt: string;
  slots: OfferedSlot[];
  clinic: ClinicFacts;
  hours: ClinicHoursInput | null;
  services: { title: string; price?: string | null }[];
  patient: { name?: string | null; known: boolean };
  reservations: PatientReservation[];
  /** Oldest first. Patient turns are sanitized and JSON-wrapped. */
  history: PromptTurn[];
};

export type BuiltPrompt = {
  system: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  /** Slot ids the model was actually shown — the allowlist for its reply. */
  offeredSlotIds: string[];
};

function slotBlock(slots: OfferedSlot[]): string {
  if (slots.length === 0) {
    return "Open clinic appointment slots: (none — do not invent times; say we are fully booked and a colleague will follow up)";
  }
  const lines = slots
    .map((s, i) => `${i + 1}. slotId=${s.id} starts_at=${s.starts_at}`)
    .join("\n");
  return `Open clinic appointment slots (ONLY offer these; copy slotId exactly):\n${lines}`;
}

function clinicBlock(clinic: ClinicFacts): string {
  const rows = [
    clinic.name ? `name: ${clinic.name}` : null,
    clinic.phone ? `phone: ${clinic.phone}` : null,
    clinic.address ? `address: ${clinic.address}` : null,
    clinic.mapUrl ? `map: ${clinic.mapUrl}` : null,
  ].filter(Boolean);
  return rows.length
    ? `Clinic facts (the only ones you may state):\n${rows.join("\n")}`
    : "Clinic facts: (none on file — do not state hours, address or phone)";
}

function reservationBlock(reservations: PatientReservation[]): string {
  if (reservations.length === 0) {
    return "This patient has no upcoming appointments.";
  }
  const lines = reservations
    .map(
      (r) =>
        `- reservationId=${r.id} ${r.service_label} at ${r.starts_at} (${r.status})`,
    )
    .join("\n");
  return `This patient's upcoming appointments (the only ones they may change):\n${lines}`;
}

/**
 * Assemble the system prompt and message list for one auto-reply turn.
 *
 * The critical invariant: **patient text never enters the system message.**
 * Everything the model is told to trust is server-generated; everything the
 * patient wrote arrives as a JSON-wrapped `user` turn. That separation is what
 * keeps an injected instruction from being read as policy.
 */
export function buildAutoReplyPrompt(input: BuildPromptInput): BuiltPrompt {
  const servicesBlock = input.services.length
    ? `Services and prices:\n${input.services
        .map((s) => `- ${s.title}${s.price ? `: ${s.price}` : ""}`)
        .join("\n")}`
    : "Services: (none on file — do not quote prices)";

  const system = [
    input.basePrompt,
    "",
    clinicBlock(input.clinic),
    formatClinicHours(input.hours),
    "",
    servicesBlock,
    "",
    slotBlock(input.slots),
    "",
    reservationBlock(input.reservations),
    "",
    input.patient.known && input.patient.name
      ? `Patient name: ${input.patient.name}`
      : "Patient name: (unknown — ask if you need it to book)",
    "",
    `Current time: ${new Date().toISOString()}`,
  ].join("\n");

  const messages = [
    { role: "system" as const, content: system },
    ...input.history.map((turn) =>
      turn.role === "user"
        ? { role: "user" as const, content: wrapPatientTurn(turn.content) }
        : { role: "assistant" as const, content: turn.content },
    ),
  ];

  return {
    system,
    messages,
    offeredSlotIds: input.slots.map((s) => s.id),
  };
}
