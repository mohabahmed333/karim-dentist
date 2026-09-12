import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { AiChatError, aiChat, hasAnyAiKey, type AiMessage } from "@/services/ai_chat";
import { ADMIN_AI_ACTION_CATALOG } from "@/services/admin_ai/actionCatalog";
import { extractClinicChatPayload } from "@/services/admin_ai/extractClinicChat";
import { loadClinicAssistContext } from "@/services/admin_ai/loadClinicAssistContext";

/** Turns and characters the model sees. Longer input is trimmed, not rejected. */
const MAX_TURNS = 16;
const MAX_TURN_CHARS = 2000;
const MAX_TOKENS = 1500;

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
  const request = { temperature: 0.3, maxTokens: MAX_TOKENS, messages };
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

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  if (!hasAnyAiKey()) {
    return NextResponse.json(
      {
        error:
          "Add an AI provider key to .env.local — GEMINI_API_KEY, MISTRAL_API_KEY, CEREBRAS_API_KEY or GROQ_API_KEY",
      },
      { status: 503 },
    );
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid chat payload" }, { status: 400 });
  }
  const { locale, page, activePatient, messages } = parsed.data;

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

  const system = [prompt, "", ADMIN_AI_ACTION_CATALOG, "", context].join("\n");

  try {
    const raw = await complete([
      { role: "system", content: system },
      ...messages.slice(-MAX_TURNS).map((m) => ({
        role: m.role,
        content: clip(m.content),
      })),
    ]);
    const payload = extractClinicChatPayload(raw);
    const reply =
      payload.reply ||
      (payload.proposedActions.length
        ? FALLBACK_REPLY[locale].review
        : FALLBACK_REPLY[locale].unreadable);
    return NextResponse.json({ ...payload, reply });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 502 },
    );
  }
}
