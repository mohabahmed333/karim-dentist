import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  treatmentAiResponseSchema,
  type TreatmentAiResponse,
} from "./schemas";
import { ADMIN_AI_ACTION_CATALOG } from "@/services/admin_ai/actionCatalog";
import { parseProposedActions } from "@/services/admin_ai/parseProposedActions";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";

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
  menu: { code: string; label: string; fee: number }[];
  existing: ExistingTreatmentContext[];
  imageUrls?: string[];
  /** Open clinic appointment starts (ISO) for slot polls */
  openSlots?: string[];
  /** Booked starts — must never appear in slot polls */
  takenSlots?: string[];
};

export async function loadTreatmentAssistantPrompt(): Promise<string> {
  const file = path.join(process.cwd(), "prompts/treatment-assistant.md");
  return readFile(file, "utf8");
}

export async function runTreatmentChat(input: {
  apiKey: string;
  messages: ChatTurn[];
  context: TreatmentChatContext;
}): Promise<TreatmentAiResponse> {
  const system = await loadTreatmentAssistantPrompt();
  const menuLines = input.context.menu
    .map((row) => `${row.code} · ${row.label} · EGP ${row.fee}`)
    .join("\n");
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
  const contextBlock = [
    `Patient name: ${input.context.patientName ?? "—"}`,
    `Selected tooth: ${input.context.toothName} (#${input.context.toothFdi})`,
    "Clinic menu (only these CDT codes):",
    menuLines || "(empty menu — ask dentist to configure Clinic prices)",
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

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `${system}\n\n${ADMIN_AI_ACTION_CATALOG}\n\n${contextBlock}` },
        ...input.messages.map((row) => ({
          role: row.role,
          content: row.content,
        })),
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Groq error ${response.status}: ${detail.slice(0, 240)}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = payload.choices?.[0]?.message?.content ?? "";
  const parsed = JSON.parse(raw) as unknown;
  const result = treatmentAiResponseSchema.parse(parsed);
  const proposed = parseProposedActions(result.proposedActions);
  return {
    ...result,
    proposedActions: proposed.actions,
  };
}
