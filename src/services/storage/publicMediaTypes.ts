import type { StorageBucket } from "@/lib/supabase/upload";

export type PublicMediaItem = {
  url: string;
  name: string;
  bucket: StorageBucket;
  path: string;
  updatedAt: string | null;
};

/** Cursor for Supabase Storage walk pagination (DFS across buckets/folders). */
export type PublicMediaCursor = {
  bucketIndex: number;
  stack: Array<{ prefix: string; offset: number }>;
};

export function initialMediaCursor(): PublicMediaCursor {
  return { bucketIndex: 0, stack: [{ prefix: "", offset: 0 }] };
}

export function encodeMediaCursor(cursor: PublicMediaCursor): string {
  const json = JSON.stringify(cursor);
  if (typeof btoa === "function") {
    return btoa(json)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodeMediaCursor(
  raw: string | null | undefined,
): PublicMediaCursor | null {
  if (!raw) return null;
  try {
    const json =
      typeof atob === "function"
        ? atob(raw.replace(/-/g, "+").replace(/_/g, "/"))
        : Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as PublicMediaCursor;
    if (
      typeof parsed.bucketIndex !== "number" ||
      !Array.isArray(parsed.stack)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
