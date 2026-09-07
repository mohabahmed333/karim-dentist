import { createClient } from "@/lib/supabase/client";
import type { StorageBucket } from "@/lib/supabase/upload";
import { STORAGE_BUCKETS } from "./usage";
import { isPublicImageName } from "./listPublicMediaFilter";
import {
  initialMediaCursor,
  type PublicMediaCursor,
  type PublicMediaItem,
} from "./publicMediaTypes";

export type { PublicMediaCursor, PublicMediaItem } from "./publicMediaTypes";
export {
  decodeMediaCursor,
  encodeMediaCursor,
  initialMediaCursor,
} from "./publicMediaTypes";
export { isPublicImageName } from "./listPublicMediaFilter";

const LIST_PAGE = 50;
const DEFAULT_PAGE_SIZE = 24;
const DEFAULT_CAP = 200;

type Listed = {
  id: string | null;
  name: string;
  updated_at?: string | null;
};

export type PublicMediaPage = {
  items: PublicMediaItem[];
  nextCursor: PublicMediaCursor | null;
};

/**
 * Cursor-paginated walk of public image objects across storage buckets.
 * Each call resumes from `cursor` and returns up to `limit` images.
 */
export async function listPublicMediaPage(opts?: {
  cursor?: PublicMediaCursor | null;
  limit?: number;
  buckets?: readonly StorageBucket[];
}): Promise<PublicMediaPage> {
  const buckets = opts?.buckets ?? STORAGE_BUCKETS;
  const limit = opts?.limit ?? DEFAULT_PAGE_SIZE;
  const supabase = createClient();
  const items: PublicMediaItem[] = [];
  let cursor = opts?.cursor ?? initialMediaCursor();

  while (items.length < limit && cursor.bucketIndex < buckets.length) {
    const bucket = buckets[cursor.bucketIndex]!;
    if (!cursor.stack.length) {
      cursor = {
        bucketIndex: cursor.bucketIndex + 1,
        stack: [{ prefix: "", offset: 0 }],
      };
      continue;
    }

    const frame = cursor.stack[cursor.stack.length - 1]!;
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(frame.prefix, {
        limit: LIST_PAGE,
        offset: frame.offset,
        sortBy: { column: "updated_at", order: "desc" },
      });
    if (error) throw error;
    const rows = (data ?? []) as Listed[];

    if (!rows.length) {
      cursor = {
        ...cursor,
        stack: cursor.stack.slice(0, -1),
      };
      if (!cursor.stack.length) {
        cursor = {
          bucketIndex: cursor.bucketIndex + 1,
          stack: [{ prefix: "", offset: 0 }],
        };
      }
      continue;
    }

    frame.offset += rows.length;
    for (const item of rows) {
      const path = frame.prefix ? `${frame.prefix}/${item.name}` : item.name;
      if (item.id == null) {
        cursor.stack.push({ prefix: path, offset: 0 });
        continue;
      }
      if (!isPublicImageName(item.name)) continue;
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      items.push({
        url: pub.publicUrl,
        name: item.name,
        bucket,
        path,
        updatedAt: item.updated_at ?? null,
      });
      if (items.length >= limit) {
        return { items, nextCursor: cursor };
      }
    }

    if (rows.length < LIST_PAGE) {
      cursor = {
        ...cursor,
        stack: cursor.stack.slice(0, -1),
      };
      if (!cursor.stack.length) {
        cursor = {
          bucketIndex: cursor.bucketIndex + 1,
          stack: [{ prefix: "", offset: 0 }],
        };
      }
    }
  }

  const done =
    cursor.bucketIndex >= buckets.length ||
    (cursor.bucketIndex === buckets.length - 1 && cursor.stack.length === 0);
  return {
    items,
    nextCursor: done || cursor.bucketIndex >= buckets.length ? null : cursor,
  };
}

/** Load up to `cap` images (legacy helper for one-shot lists). */
export async function listPublicMedia(
  cap = DEFAULT_CAP,
  buckets: readonly StorageBucket[] = STORAGE_BUCKETS,
): Promise<PublicMediaItem[]> {
  const out: PublicMediaItem[] = [];
  let cursor: PublicMediaCursor | null = initialMediaCursor();
  while (cursor && out.length < cap) {
    const page = await listPublicMediaPage({
      cursor,
      limit: Math.min(DEFAULT_PAGE_SIZE, cap - out.length),
      buckets,
    });
    out.push(...page.items);
    cursor = page.nextCursor;
  }
  return out.slice(0, cap);
}
