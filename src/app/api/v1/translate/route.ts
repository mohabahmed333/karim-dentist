import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/requireAdmin";

const GOOGLE_GTX_URL = "https://translate.googleapis.com/translate_a/single";
const MYMEMORY_URL = "https://api.mymemory.translated.net/get";
const TIMEOUT_MS = 8_000;

type TranslateBody = {
  text?: unknown;
  source?: unknown;
};

type MyMemoryMatch = {
  translation?: unknown;
  match?: unknown;
  quality?: unknown;
  "created-by"?: unknown;
};

/**
 * Proxies Arabic↔English translation for Customize bilingual fields.
 * Order: LIBRETRANSLATE_URL → Google gtx → MyMemory.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let body: TranslateBody;
  try {
    body = (await request.json()) as TranslateBody;
  } catch {
    return NextResponse.json(
      { translatedText: "", error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ translatedText: "" });
  }

  const source = body.source === "en" ? "en" : "ar";
  const target = source === "ar" ? "en" : "ar";
  const libreUrl = process.env.LIBRETRANSLATE_URL?.trim();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let translatedText = "";

    if (libreUrl) {
      try {
        translatedText = await translateViaLibre(
          libreUrl,
          text,
          source,
          target,
          controller.signal,
        );
      } catch {
        translatedText = "";
      }
    }

    if (!translatedText) {
      try {
        translatedText = await translateViaGoogleGtx(
          text,
          source,
          target,
          controller.signal,
        );
      } catch {
        translatedText = "";
      }
    }

    if (!translatedText) {
      translatedText = await translateViaMyMemory(
        text,
        source,
        target,
        controller.signal,
      );
    }

    return NextResponse.json({ translatedText: translatedText.trim() });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Translation request timed out"
        : error instanceof Error
          ? error.message
          : "Translation provider unavailable";
    return NextResponse.json(
      { translatedText: "", error: message },
      { status: 502 },
    );
  } finally {
    clearTimeout(timer);
  }
}

async function translateViaGoogleGtx(
  text: string,
  source: string,
  target: string,
  signal: AbortSignal,
): Promise<string> {
  const url = new URL(GOOGLE_GTX_URL);
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", source);
  url.searchParams.set("tl", target);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "DentalLoungeCustomize/1.0",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Translation provider returned ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("json") && !contentType.includes("javascript")) {
    throw new Error("Translation provider returned non-JSON body");
  }

  const payload = (await response.json()) as unknown;
  const translated = extractGoogleGtxText(payload);
  if (!translated) {
    throw new Error("Translation provider returned empty result");
  }
  return translated;
}

function extractGoogleGtxText(payload: unknown): string {
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) return "";
  const chunks: string[] = [];
  for (const part of payload[0]) {
    if (Array.isArray(part) && typeof part[0] === "string") {
      chunks.push(part[0]);
    }
  }
  return chunks.join("").trim();
}

async function translateViaMyMemory(
  text: string,
  source: string,
  target: string,
  signal: AbortSignal,
): Promise<string> {
  const url = new URL(MYMEMORY_URL);
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", `${source}|${target}`);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Translation provider returned ${response.status}`);
  }

  const payload = (await response.json()) as {
    responseStatus?: number | string;
    responseData?: { translatedText?: unknown };
    matches?: MyMemoryMatch[];
  };

  const status = Number(payload.responseStatus);
  if (status && status !== 200) {
    throw new Error(`Translation provider returned ${status}`);
  }

  const primary =
    typeof payload.responseData?.translatedText === "string"
      ? payload.responseData.translatedText
      : "";

  const candidates: Array<{ translation: string; match: MyMemoryMatch }> = [];
  if (primary) {
    candidates.push({ translation: primary, match: { translation: primary } });
  }

  for (const match of payload.matches ?? []) {
    if (typeof match.translation === "string" && match.translation.trim()) {
      candidates.push({ translation: match.translation.trim(), match });
    }
  }

  if (candidates.length === 0) return "";

  candidates.sort(
    (a, b) => scoreMyMemoryCandidate(text, b) - scoreMyMemoryCandidate(text, a),
  );
  return candidates[0]?.translation ?? "";
}

export function scoreMyMemoryCandidate(
  source: string,
  candidate: { translation: string; match: MyMemoryMatch },
): number {
  const sourceWords = countWords(source);
  const translation = candidate.translation.trim();
  const enWords = countWords(translation);
  const matchScore = Number(candidate.match.match ?? 0);
  const quality = Number(candidate.match.quality ?? 0);
  const createdBy = String(candidate.match["created-by"] ?? "");

  let score = matchScore * 40 + quality / 5;
  if (createdBy === "MT!") score += 60;
  if (enWords > sourceWords * 2 + 1) score -= 90;
  if (enWords > sourceWords + 2) score -= 45;
  score -= Math.max(0, enWords - sourceWords) * 8;

  const lettersOnly = translation.replace(/[^A-Za-z]/g, "");
  const isMostlyUpper =
    lettersOnly.length >= 4 && lettersOnly === lettersOnly.toUpperCase();
  if (isMostlyUpper && enWords >= 3) score -= 120;

  score -= enWords * 2;
  return score;
}

function countWords(value: string): number {
  return value
    .trim()
    .split(/\s+/u)
    .filter(Boolean).length;
}

async function translateViaLibre(
  url: string,
  text: string,
  source: string,
  target: string,
  signal: AbortSignal,
): Promise<string> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      q: text,
      source,
      target,
      format: "text",
    }),
    signal,
    redirect: "error",
  });

  if (!response.ok) {
    throw new Error(`Translation provider returned ${response.status}`);
  }

  const payload = (await response.json()) as { translatedText?: unknown };
  return typeof payload.translatedText === "string"
    ? payload.translatedText
    : "";
}
