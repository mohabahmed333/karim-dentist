import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  ReceiptImageError,
  fetchReceiptImage,
  sniffImageMime,
} from "./fetchReceiptImage.ts";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 9, 9]);
const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 1,
]);

/** A Response whose body arrives in several chunks, as a real one would. */
function reply(bytes: Uint8Array, init: ResponseInit = {}): Response {
  // Chunk relative to the payload so a multi-megabyte case stays a handful of
  // chunks: a fixed tiny size would enqueue millions of them and hang the test.
  const size = Math.max(4, Math.ceil(bytes.length / 8));
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let i = 0; i < bytes.length; i += size) {
        controller.enqueue(bytes.slice(i, i + size));
      }
      controller.close();
    },
  });
  return new Response(stream, { status: 200, ...init });
}

const fetching = (response: Response | (() => never)) =>
  (async () => (typeof response === "function" ? response() : response)) as unknown as typeof fetch;

describe("sniffImageMime", () => {
  it("reads the type from the bytes", () => {
    assert.equal(sniffImageMime(JPEG), "image/jpeg");
    assert.equal(sniffImageMime(PNG), "image/png");
    assert.equal(sniffImageMime(WEBP), "image/webp");
  });

  it("refuses anything that is not one of the three", () => {
    assert.equal(sniffImageMime(new Uint8Array([0x25, 0x50, 0x44, 0x46])), null); // a PDF
    assert.equal(sniffImageMime(new Uint8Array([])), null);
    assert.equal(sniffImageMime(new Uint8Array([0xff])), null); // truncated JPEG
  });
});

describe("fetchReceiptImage", () => {
  it("returns the bytes, our own hash, and a data URI", async () => {
    const image = await fetchReceiptImage("https://x.test/r.jpg", fetching(reply(JPEG)));
    assert.equal(image.mime, "image/jpeg");
    assert.deepEqual(image.bytes, JPEG);
    assert.equal(image.sha256, createHash("sha256").update(JPEG).digest("hex"));
    assert.match(image.dataUri, /^data:image\/jpeg;base64,/);
  });

  it("believes the bytes, not the content-type header", async () => {
    // The header is as much a claim as the rest of the response.
    const image = await fetchReceiptImage(
      "https://x.test/r",
      fetching(reply(PNG, { headers: { "content-type": "image/jpeg" } })),
    );
    assert.equal(image.mime, "image/png");
  });

  it("rejects a non-image even when the header says otherwise", async () => {
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 1, 2]);
    await assert.rejects(
      () =>
        fetchReceiptImage(
          "https://x.test/r",
          fetching(reply(pdf, { headers: { "content-type": "image/png" } })),
        ),
      (err: ReceiptImageError) => err.reason === "not_an_image",
    );
  });

  it("caps the download while streaming, not by trusting content-length", async () => {
    const huge = new Uint8Array(6 * 1024 * 1024);
    huge.set(JPEG, 0);
    await assert.rejects(
      () =>
        fetchReceiptImage(
          "https://x.test/big.jpg",
          fetching(reply(huge, { headers: { "content-length": "10" } })),
        ),
      (err: ReceiptImageError) => err.reason === "too_large",
    );
  });

  it("reports an HTTP error rather than treating it as an unreadable receipt", async () => {
    await assert.rejects(
      () => fetchReceiptImage("https://x.test/gone", fetching(new Response("", { status: 404 }))),
      (err: ReceiptImageError) => err.reason === "http_error",
    );
  });

  it("reports an empty body", async () => {
    await assert.rejects(
      () => fetchReceiptImage("https://x.test/e", fetching(reply(new Uint8Array([])))),
      (err: ReceiptImageError) => err.reason === "empty",
    );
  });

  it("separates a timeout from an unreachable host", async () => {
    const timeout = () => {
      const err = new Error("timed out");
      err.name = "TimeoutError";
      throw err;
    };
    await assert.rejects(
      () => fetchReceiptImage("https://x.test/slow", fetching(timeout)),
      (err: ReceiptImageError) => err.reason === "timeout",
    );

    const refused = () => {
      throw new Error("ECONNREFUSED");
    };
    await assert.rejects(
      () => fetchReceiptImage("https://x.test/down", fetching(refused)),
      (err: ReceiptImageError) => err.reason === "unreachable",
    );
  });

  it("refuses a URL that is not http(s), so no file:// or data:// is fetched", async () => {
    for (const url of ["file:///etc/passwd", "data:image/png;base64,AAA", "ftp://x/y"]) {
      await assert.rejects(
        () => fetchReceiptImage(url, fetching(reply(JPEG))),
        (err: ReceiptImageError) => err.reason === "bad_url",
      );
    }
  });
});
