import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { formatClinicSlotAvailability } from "@/services/ai_groq/formatClinicSlotAvailability";
import { ADMIN_AI_ACTION_CATALOG } from "@/services/admin_ai/actionCatalog";
import { extractClinicChatPayload } from "@/services/admin_ai/extractClinicChat";

const bodySchema = z.object({
  statsSummary: z.string().max(4000).optional().default(""),
  activePatient: z
    .object({
      patientKey: z.string().min(1).max(120),
      name: z.string().min(1).max(120),
      phone: z.string().max(40).optional().default(""),
    })
    .nullable()
    .optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(16),
});

const DEFAULT_ACTIONS = [
  { id: "start:website", label: "Website" },
  { id: "start:chart", label: "Chart" },
  { id: "start:clinical", label: "Clinical" },
  { id: "start:book", label: "Book" },
  { id: "start:today", label: "Today" },
  { id: "start:pending", label: "Pending" },
  { id: "start:patient", label: "Find patient" },
  { id: "start:noshow", label: "No-show" },
  { id: "start:note", label: "Note" },
];

async function loadPrompt(): Promise<string> {
  try {
    const file = path.join(process.cwd(), "prompts/clinic-receptionist.md");
    return await readFile(file, "utf8");
  } catch {
    return "You are Reception for The Dental Lounge. Be brief. Never invent bookings.";
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Add GROQ_API_KEY to .env.local" },
      { status: 503 },
    );
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid chat payload" }, { status: 400 });
  }

  const prompt = await loadPrompt();
  const active = parsed.data.activePatient;

  const nowIso = new Date().toISOString();
  const [{ data: openRows }, { data: takenRows }] = await Promise.all([
    auth.supabase
      .from("appointment_slots")
      .select("starts_at")
      .eq("status", "open")
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(24),
    auth.supabase
      .from("appointment_slots")
      .select("starts_at")
      .eq("status", "booked")
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(24),
  ]);
  const openSlots = (openRows ?? []).map((r) => r.starts_at as string);
  const takenSlots = (takenRows ?? []).map((r) => r.starts_at as string);
  const availabilityBlock = formatClinicSlotAvailability({
    openStartsAt: openSlots,
    takenStartsAt: takenSlots,
  });

  const system = [
    prompt,
    "",
    ADMIN_AI_ACTION_CATALOG,
    "",
    active
      ? `Active patient (already selected — do NOT ask who again):\n- name: ${active.name}\n- phone: ${active.phone || "(none)"}\n- patientKey: ${active.patientKey}`
      : "Active patient: (none — ask only if needed for clinical/CMS patient writes)",
    "",
    "Clinic stats context:",
    parsed.data.statsSummary || "(no stats provided)",
    "",
    availabilityBlock,
  ].join("\n");

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL ?? "openai/gpt-oss-120b",
          temperature: 0.3,
          messages: [
            { role: "system", content: system },
            ...parsed.data.messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          ],
        }),
      },
    );
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Groq error ${response.status}: ${detail.slice(0, 200)}`);
    }
    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw =
      payload.choices?.[0]?.message?.content?.trim() ||
      "I could not draft a reply.";
    const { reply, suggestedActions, proposedActions } =
      extractClinicChatPayload(raw, DEFAULT_ACTIONS);
    return NextResponse.json({ reply, suggestedActions, proposedActions });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 502 },
    );
  }
}
