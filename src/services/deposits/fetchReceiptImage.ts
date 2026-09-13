/**
 * Fetching the bytes of a receipt screenshot, safely.
 *
 * The URL comes from a WhatsApp vendor and is publicly reachable, so this is a
 * server fetching an attacker-influenceable address: everything here is about
 * not trusting what comes back. Size is capped while streaming rather than by
 * reading `content-length`, which a server is free to lie about, and the type is
 * decided by the first bytes rather than the `content-type` header, which is
 * just as much a claim as the rest of the response.
 *
 * We hash the bytes ourselves. The vendor reports a sha256 of its own, but the
 * unique index that stops a screenshot being spent twice is only as trustworthy
 * as what it was computed over, and that has to be bytes we actually saw.
 */

import { createHash } from "node:crypto";

const TIMEOUT_MS = 8_000;
/** A phone screenshot is a few hundred KB. Five MB is already generous. */
const MAX_BYTES = 5 * 1024 * 1024;

export type ReceiptImage = {
  bytes: Uint8Array;
  sha256: string;
  mime: "image/jpeg" | "image/png" | "image/webp";
  /** Ready to hand to a model as `image_url.url`. */
  dataUri: string;
};

export class ReceiptImageError extends Error {
  readonly reason: string;
  constructor(reason: string, message?: string) {
    super(message ?? reason);
    this.name = "ReceiptImageError";
    this.reason = reason;
  }
}

const startsWith = (bytes: Uint8Array, signature: number[]) =>
  bytes.length >= signature.length && signature.every((b, i) => bytes[i] === b);

/** The image type according to the bytes, not according to the sender. */
export function sniffImageMime(bytes: Uint8Array): ReceiptImage["mime"] | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (
    bytes.length >= 12 &&
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

/** Reads at most `MAX_BYTES + 1`, so an endless response cannot exhaust memory. */
async function readCapped(response: Response): Promise<Uint8Array> {
  const body = response.body;
  if (!body) {
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) throw new ReceiptImageError("too_large");
    return new Uint8Array(buffer);
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > MAX_BYTES) throw new ReceiptImageError("too_large");
      chunks.push(value);
    }
  } finally {
    // Releasing matters on the error paths: an abandoned reader keeps the
    // socket open for the whole of the webhook's remaining budget.
    reader.releaseLock();
    if (!body.locked) await body.cancel().catch(() => {});
  }

  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

export async function fetchReceiptImage(
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ReceiptImage> {
  if (!/^https?:\/\//i.test(url)) throw new ReceiptImageError("bad_url");

  let response: Response;
  try {
    response = await fetchImpl(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "follow",
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new ReceiptImageError("timeout");
    }
    throw new ReceiptImageError("unreachable", err instanceof Error ? err.message : undefined);
  }

  if (!response.ok) {
    throw new ReceiptImageError("http_error", `HTTP ${response.status}`);
  }

  const bytes = await readCapped(response);
  if (bytes.byteLength === 0) throw new ReceiptImageError("empty");

  const mime = sniffImageMime(bytes);
  if (!mime) throw new ReceiptImageError("not_an_image");

  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const base64 = Buffer.from(bytes).toString("base64");

  return { bytes, sha256, mime, dataUri: `data:${mime};base64,${base64}` };
}
