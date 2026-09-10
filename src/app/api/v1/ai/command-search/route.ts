import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { extractCommandSearchIds } from "@/features/admin/lib/commandSearchExtract";
import { groqChat } from "@/services/ai_groq/callGroq";

const bodySchema = z.object({
  query: z.string().trim().min(2).max(160),
  candidates: z
    .array(
      z.object({
        id: z.string().min(1).max(180),
        kind: z.string().min(1).max(40),
        title: z.string().min(1).max(160),
        subtitle: z.string().max(160).optional(),
      }),
    )
    .min(1)
    .max(80),
});

async function loadPrompt(): Promise<string> {
  try {
    return await readFile(
      path.join(process.cwd(), "prompts/command-search.md"),
      "utf8",
    );
  } catch {
    return "Return JSON { ids: string[] } ranking catalog ids for the search query.";
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ ids: [] });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid search payload" }, { status: 400 });
  }

  const prompt = await loadPrompt();
  const allowed = new Set(parsed.data.candidates.map((item) => item.id));
  const catalog = parsed.data.candidates
    .map((item) => `${item.id} | ${item.kind} | ${item.title}${item.subtitle ? ` | ${item.subtitle}` : ""}`)
    .join("\n");

  try {
    // Ranking is a nicety on top of local search: keep it snappy and let any
    // failure fall through to the empty-ids degradation below.
    const raw = await groqChat({
      apiKey,
      temperature: 0,
      attempts: 1,
      timeoutMs: 6000,
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: `Query: ${parsed.data.query}\n\nCatalog:\n${catalog}`,
        },
      ],
    });
    const ids = extractCommandSearchIds(raw).filter((id) => allowed.has(id));
    return NextResponse.json({ ids });
  } catch {
    return NextResponse.json({ ids: [] });
  }
}
