/**
 * Reading a receipt with Tesseract, as a second opinion only.
 *
 * Loaded lazily and never allowed to fail loudly: the deposit flow works
 * perfectly well without it, and a missing WASM binary or a slow cold start must
 * not cost a patient their appointment. Every failure returns null, which the
 * corroboration step treats as "no opinion".
 *
 * The worker costs roughly 3 seconds to start and a fraction of a second to
 * recognise, so callers should run it only when it can change the outcome —
 * which in practice means only when a receipt is about to be confirmed
 * automatically.
 */

/** Generous enough for a cold WASM start, short enough to stay inside the job. */
const TIMEOUT_MS = 20_000;

type TesseractWorker = {
  recognize: (image: Buffer) => Promise<{ data: { text?: string } }>;
  terminate: () => Promise<unknown>;
};

/**
 * The OCR text of an image, or null when we could not read it at all.
 *
 * `tesseract.js` is imported at call time so that a deployment without it — or
 * one where the WASM core fails to load — degrades to "no second opinion"
 * rather than breaking the receipt path.
 */
export async function readImageText(bytes: Uint8Array): Promise<string | null> {
  let worker: TesseractWorker | null = null;
  try {
    const { createWorker } = (await import("tesseract.js")) as unknown as {
      createWorker: (lang: string) => Promise<TesseractWorker>;
    };

    const started = await Promise.race([
      createWorker("eng"),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS)),
    ]);
    if (!started) return null;
    worker = started;

    const { data } = await worker.recognize(Buffer.from(bytes));
    const text = data.text?.trim() ?? "";
    return text === "" ? null : text;
  } catch {
    // Not installed, WASM unavailable, out of memory, language data unreachable.
    // All of them mean the same thing here: no second opinion.
    return null;
  } finally {
    await worker?.terminate().catch(() => undefined);
  }
}
