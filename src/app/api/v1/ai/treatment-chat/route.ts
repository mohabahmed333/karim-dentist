import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { hasAnyAiKey } from "@/services/ai_chat";
import { runTreatmentChat } from "@/services/ai_groq";

const bodySchema = z.object({
  toothFdi: z.string().min(1),
  toothName: z.string().min(1),
  patientName: z.string().optional().default(""),
  patientChart: z.string().max(24000).optional().default(""),
  imageUrls: z.array(z.string().min(1)).max(6).optional().default([]),
  existing: z
    .array(
      z.object({
        cdtCode: z.string().nullable(),
        feeAmount: z.number().int().min(0),
        severity: z.string(),
        title: z.string(),
        status: z.string(),
        toothFdi: z.string().nullable().optional(),
      }),
    )
    .max(40)
    .optional()
    .default([]),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(24),
});

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

  try {
    const nowIso = new Date().toISOString();
    const [{ data: openSlotRows }, { data: takenSlotRows }, { data: serviceRows }] =
      await Promise.all([
        auth.supabase
          .from("appointment_slots")
          .select("starts_at")
          .eq("status", "open")
          .gte("starts_at", nowIso)
          .order("starts_at", { ascending: true })
          .limit(12),
        auth.supabase
          .from("appointment_slots")
          .select("starts_at")
          .eq("status", "booked")
          .gte("starts_at", nowIso)
          .order("starts_at", { ascending: true })
          .limit(12),
        auth.supabase
          .from("services")
          .select("id, title, price_min_egp, price_max_egp")
          .eq("is_published", true)
          .is("deleted_at", null)
          .order("sort_order", { ascending: true })
          .limit(60),
      ]);
    const openSlots = (openSlotRows ?? []).map((row) => row.starts_at);
    const takenSlots = (takenSlotRows ?? []).map((row) => row.starts_at);
    const services = (serviceRows ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      priceMin: row.price_min_egp,
      priceMax: row.price_max_egp,
    }));

    const result = await runTreatmentChat({
      messages: parsed.data.messages,
      context: {
        toothFdi: parsed.data.toothFdi,
        toothName: parsed.data.toothName,
        patientName: parsed.data.patientName,
        patientChart: parsed.data.patientChart,
        imageUrls: parsed.data.imageUrls,
        existing: parsed.data.existing,
        openSlots,
        takenSlots,
        services,
      },
    });

    if (result.poll?.kind === "slot") {
      if (openSlots.length === 0) {
        result.poll = {
          ...result.poll,
          options: [
            {
              id: "slot-custom",
              label: "Other date / time…",
              value: "custom",
            },
          ],
        };
      } else {
        const allowed = new Set(openSlots);
        const kept = result.poll.options.filter(
          (opt) => opt.value === "custom" || allowed.has(opt.value),
        );
        if (kept.length <= 1) {
          result.poll = {
            ...result.poll,
            options: [
              ...openSlots.slice(0, 6).map((iso, i) => ({
                id: `slot-${i}`,
                label: new Date(iso).toLocaleString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                value: iso,
              })),
              {
                id: "slot-custom",
                label: "Other date / time…",
                value: "custom",
              },
            ],
          };
        } else {
          result.poll = { ...result.poll, options: kept.slice(0, 8) };
        }
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "AI request failed",
      },
      { status: 502 },
    );
  }
}
