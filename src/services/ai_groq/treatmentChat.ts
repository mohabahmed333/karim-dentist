import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  treatmentAiResponseSchema,
  type TreatmentAiResponse,
} from "./schemas";
import { ADMIN_AI_ACTION_CATALOG } from "@/services/admin_ai/actionCatalog";
import { firstJsonObject } from "@/lib/json/firstJsonObject";
import { aiChat } from "@/services/ai_chat";
import { parseProposedActions } from "@/services/admin_ai/parseProposedActions";


export type ChatTurn = { role: "user" | "assistant"; content: string };

export type ExistingTreatmentContext = {
  cdtCode: string | null;
  feeAmount: number;
  severity: string;
  title: string;
  status: string;
  toothFdi?: string | null;
};

export type TreatmentChatContext = {
  toothFdi: string;
  toothName: string;
  patientName?: string;
  patientChart?: string;
  existing: ExistingTreatmentContext[];
  imageUrls?: string[];
  /** Open clinic appointment starts (ISO) for slot polls */
  openSlots?: string[];
  /** Booked starts — must never appear in slot polls */
  takenSlots?: string[];
  /**
   * The bookable services catalog — the only source of pricing for a draft
   * now (there is no clinic-configured CDT fee list). A draft should point
   * at a real service (draft.service_id) and price from its range.
   */
  services?: { id: string; title: string; priceMin: number | null; priceMax: number | null }[];
};

export async function loadTreatmentAssistantPrompt(): Promise<string> {
  const file = path.join(process.cwd(), "prompts/treatment-assistant.md");
  return readFile(file, "utf8");
}

export async function runTreatmentChat(input: {
  messages: ChatTurn[];
  context: TreatmentChatContext;
}): Promise<TreatmentAiResponse> {
  const system = await loadTreatmentAssistantPrompt();
  const existingLines = input.context.existing
    .map(
      (row) =>
        `#${row.toothFdi ?? "—"} · ${row.cdtCode ?? "—"} · ${row.title || "untitled"} · ${row.severity} · EGP ${row.feeAmount} · ${row.status}`,
    )
    .join("\n");
  const openSlotLines = (input.context.openSlots ?? [])
    .slice(0, 12)
    .map((iso, i) => `${i + 1}. ${iso}`)
    .join("\n");
  const takenSlotLines = (input.context.takenSlots ?? [])
    .slice(0, 12)
    .map((iso, i) => `${i + 1}. ${iso}`)
    .join("\n");
  const serviceLines = (input.context.services ?? [])
    .map((row) => {
      const range =
        row.priceMin == null && row.priceMax == null
          ? "no price on file"
          : row.priceMin === row.priceMax
            ? `EGP ${row.priceMin}`
            : `EGP ${row.priceMin ?? "?"}-${row.priceMax ?? "?"}`;
      return `${row.id} · ${row.title} · ${range}`;
    })
    .join("\n");
  const contextBlock = [
    `Patient name: ${input.context.patientName ?? "—"}`,
    `Selected tooth: ${input.context.toothName} (#${input.context.toothFdi})`,
    "Bookable services (only these; if the treatment clearly matches one, set draft.service_id to its id exactly — leave it unset rather than guess):",
    serviceLines || "(none on file)",
    "Existing required treatments (patient-wide summary):",
    existingLines || "(none)",
    input.context.patientChart
      ? `Full patient chart:\n${input.context.patientChart}`
      : "",
    input.context.imageUrls?.length
      ? `Chat image URLs:\n${input.context.imageUrls.join("\n")}`
      : "",
    openSlotLines
      ? `Open clinic appointment slots (use ONLY these ISO values for slot polls — never invent or reuse taken times):\n${openSlotLines}`
      : 'Open clinic appointment slots: (none — for reschedule, only offer value "custom"; never invent times)',
    takenSlotLines
      ? `Taken (booked) slots — never suggest these:\n${takenSlotLines}`
      : "Taken (booked) slots: (none listed)",
  ]
    .filter(Boolean)
    .join("\n");

  const { content } = await aiChat({
    temperature: 0.2,
    responseFormat: "json_object",
    messages: [
      {
        role: "system",
        content: `${system}\n\n${ADMIN_AI_ACTION_CATALOG}\n\n${contextBlock}`,
      },
      ...input.messages.map((row) => ({
        role: row.role,
        content: row.content,
      })),
    ],
  });
  // Not every provider honours JSON mode, so read the object out of whatever
  // came back rather than trusting the whole string to parse.
  const json = firstJsonObject(content);
  if (!json) throw new Error("The assistant returned no readable JSON");
  const parsed = JSON.parse(json) as unknown;
  const result = treatmentAiResponseSchema.parse(parsed);
  const proposed = parseProposedActions(result.proposedActions);

  // A service_id the model invented (or paraphrased from an id it wasn't
  // actually shown) must not survive — same "server offered it or it
  // doesn't count" rule slot/doctor ids already get on the WhatsApp side.
  const offeredServices = new Map(
    (input.context.services ?? []).map((s) => [s.id, s]),
  );
  const dropUnofferedService = <T extends { service_id?: string }>(draft: T): T =>
    draft.service_id && !offeredServices.has(draft.service_id)
      ? { ...draft, service_id: undefined }
      : draft;

  // The model is unreliable at arithmetic — don't trust it to have copied
  // the service's price into fee_amount. Once a real service_id survives
  // validation, its minimum price always wins (same "doctor price falls
  // back to the clinic minimum" rule the Services pricing already applies).
  const priceFromMatchedService = <T extends { service_id?: string; fee_amount: number }>(
    draft: T,
  ): T => {
    const service = draft.service_id ? offeredServices.get(draft.service_id) : undefined;
    return service?.priceMin != null ? { ...draft, fee_amount: service.priceMin } : draft;
  };

  return {
    ...result,
    draft: result.draft
      ? priceFromMatchedService(dropUnofferedService(result.draft))
      : result.draft,
    choices: result.choices.map((draft) =>
      priceFromMatchedService(dropUnofferedService(draft)),
    ),
    proposedActions: proposed.actions,
  };
}
