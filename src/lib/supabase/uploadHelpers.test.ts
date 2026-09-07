import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node's strip-types runner requires the explicit extension.
import {
  IMAGE_FILE_ACCEPT,
  VIDEO_FILE_ACCEPT,
  inferMediaContentType,
  mapStorageUploadError,
  prepareMediaFile,
} from "./uploadHelpers.ts";

test("image accept lists Finder extensions instead of image/*", () => {
  assert.equal(IMAGE_FILE_ACCEPT.includes("image/*"), false);
  assert.ok(IMAGE_FILE_ACCEPT.includes(".png"));
  assert.ok(IMAGE_FILE_ACCEPT.includes(".jpg"));
  assert.ok(IMAGE_FILE_ACCEPT.includes("image/png"));
});

test("video accept lists Finder extensions instead of video/* only", () => {
  assert.ok(VIDEO_FILE_ACCEPT.includes(".mp4"));
  assert.ok(VIDEO_FILE_ACCEPT.includes("video/mp4"));
});

test("infers jpeg content type when the browser leaves type empty", () => {
  const file = new File([new Uint8Array([1, 2, 3])], "shot.JPEG", { type: "" });
  assert.equal(inferMediaContentType(file), "image/jpeg");
});

test("rejects Mac Photos HEIC files with a clear export message", () => {
  const file = new File([new Uint8Array([1])], "IMG_0001.HEIC", {
    type: "image/heic",
  });
  assert.throws(
    () => prepareMediaFile(file, "image"),
    /Export as JPEG or PNG/,
  );
});

test("maps storage RLS failures to an admin-login message", () => {
  const mapped = mapStorageUploadError({
    message: "new row violates row-level security policy",
  });
  assert.match(mapped.message, /admin login/i);
});
