import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { sumBucketsBytes } from "./sumBuckets.ts";

test("sums every bucket total from the list helper", async () => {
  const calls: string[] = [];
  const supabase = {
    storage: {
      from(bucket: string) {
        return {
          async list(prefix: string) {
            calls.push(`${bucket}:${prefix}`);
            if (prefix === "") {
              return {
                data: [
                  { id: null, name: "folder", metadata: null },
                  { id: "a", name: "root.bin", metadata: { size: 10 } },
                ],
                error: null,
              };
            }
            return {
              data: [{ id: "b", name: "nested.bin", metadata: { size: 25 } }],
              error: null,
            };
          },
        };
      },
    },
  };
  const total = await sumBucketsBytes(supabase as never, ["hero", "about"]);
  assert.equal(total, 70);
  assert.deepEqual(calls, ["hero:", "hero:folder", "about:", "about:folder"]);
});
