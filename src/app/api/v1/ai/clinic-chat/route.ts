import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { AiChatError, aiChat, hasAnyAiKey, type AiMessage } from "@/services/ai_chat";
import { ADMIN_AI_ACTION_CATALOG } from "@/services/admin_ai/actionCatalog";
import { runClinicAssistTurn } from "@/services/admin_ai/clinicAssistTurn";
import { CLINIC_ASSIST_TOOL_CATALOG } from "@/services/admin_ai/tools/toolCatalog";
import { loadClinicAssistContext } from "@/services/admin_ai/loadClinicAssistContext";

/** Turns and characters the model sees. Longer input is trimmed, not rejected. */
const MAX_TURNS = 16;
const MAX_TURN_CHARS = 2000;
const MAX_TOKENS = 1500;
/** Tool round-trips before the model must answer from what it already has. */
const MAX_TOOL_STEPS = 2;
/** Per model call, tight enough that MAX_TOOL_STEPS+1 calls fit under maxDuration. */
const CHAIN_DEADLINE_MS = 10_000;

// Up to MAX_TOOL_STEPS+1 sequential model calls, each walking the provider
// chain — the Next.js default would cut this off mid-turn.
export const maxDuration = 60;

const bodySchema = z.object({
  locale: z.enum(["en", "ar"]).optional().default("en"),
  page: z.string().max(300).nullable().optional().default(null),
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
        content: z.string().min(1).max(50_000),
      }),
    )
    .min(1)
    .max(200),
});

const FALLBACK_REPLY = {
  en: {
    review: "Review the changes below before saving.",
    unreadable: "I couldn't put that answer together. Please try again.",
  },
  ar: {
    review: "راجع التغييرات أدناه قبل الحفظ.",
    unreadable: "تعذر تكوين الرد. حاول مرة أخرى.",
  },
} as const;

/** Shown while a tool call is running — friendlier than its raw name. */
const TOOL_STATUS: Record<string, { en: string; ar: string }> = {
  search_patients: { en: "Looking up the patient…", ar: "جارٍ البحث عن المريض…" },
  get_patient_summary: { en: "Pulling up their visit history…", ar: "جارٍ فتح سجل الزيارات…" },
  list_reservations: { en: "Checking the schedule…", ar: "جارٍ مراجعة الجدول…" },
  find_open_slots: { en: "Checking open slots…", ar: "جارٍ التحقق من المواعيد المتاحة…" },
  search_clinic_knowledge: { en: "Checking clinic policies…", ar: "جارٍ مراجعة سياسات العيادة…" },
};

async function loadPrompt(): Promise<string> {
  try {
    const file = path.join(process.cwd(), "prompts/clinic-receptionist.md");
    return await readFile(file, "utf8");
  } catch {
    return "You are Reception for The Dental Lounge. Be brief. Never invent bookings. Respond with one JSON object: {\"reply\": string}.";
  }
}

function clip(text: string): string {
  return text.length > MAX_TURN_CHARS ? `${text.slice(0, MAX_TURN_CHARS)}…` : text;
}

async function complete(messages: AiMessage[]): Promise<string> {
  const request = {
    temperature: 0.3,
    maxTokens: MAX_TOKENS,
    messages,
    deadlineMs: CHAIN_DEADLINE_MS,
  };
  try {
    const { content } = await aiChat({ ...request, responseFormat: "json_object" });
    return content;
  } catch (err) {
    // JSON mode answers output that fails validation with a 400, and not every
    // provider honours it at all. The parser copes with prose, so one plain
    // retry across the chain beats an error bubble.
    if (err instanceof AiChatError) return (await aiChat(request)).content;
    throw err;
  }
}

const encoder = new TextEncoder();
function sseEvent(event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  if (!hasAnyAiKey()) {
    return NextResponse.json(
      {
        error:
          "Add an AI provider key to .env.local — GEMINI_API_KEY, MISTRAL_API_KEY or GROQ_API_KEY",
      },
      { status: 503 },
    );
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid chat payload" }, { status: 400 });
  }
  const { locale, page, activePatient, messages } = parsed.data;

  // A tool round-trip can take several seconds; streamed status events (one
  // per tool call) are why this returns a stream instead of one JSON body —
  // early failures above still return a plain error response with a real
  // status code, before any of this starts.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(sseEvent(event, data));
      try {
        const [prompt, context] = await Promise.all([
          loadPrompt(),
          loadClinicAssistContext(auth.supabase, {
            locale,
            page,
            activePatient: activePatient ?? null,
          }).catch(
            () =>
              "## Clinic context\n(unavailable — the schedule could not be loaded; say so and do not guess times or ids)",
          ),
        ]);

        const system = [
          prompt,
          "",
          ADMIN_AI_ACTION_CATALOG,
          "",
          CLINIC_ASSIST_TOOL_CATALOG,
          "",
          context,
        ].join("\n");

        const turn = await runClinicAssistTurn({
          db: auth.supabase,
          system,
          messages: messages.slice(-MAX_TURNS).map((m) => ({
            role: m.role,
            content: clip(m.content),
          })),
          complete,
          maxSteps: MAX_TOOL_STEPS,
          onToolCall: (name) => {
            const label = TOOL_STATUS[name]?.[locale] ?? TOOL_STATUS[name]?.en ?? `${name}…`;
            send("status", { text: label });
          },
        });
        const reply =
          turn.reply ||
          (turn.proposedActions.length
            ? FALLBACK_REPLY[locale].review
            : FALLBACK_REPLY[locale].unreadable);
        send("done", { ...turn, reply });
      } catch (err) {
        send("error", { error: err instanceof Error ? err.message : "AI request failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
