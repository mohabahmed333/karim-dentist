import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SupportMessage } from "../supportDummyData.ts";
import {
  findMessageMatches,
  messageSearchHaystack,
} from "./messageSearch.ts";

function msg(
  partial: Partial<SupportMessage> & Pick<SupportMessage, "id" | "body">,
): SupportMessage {
  return {
    author: "customer",
    authorName: "Pat",
    time: "10:00",
    ...partial,
  };
}

describe("messageSearchHaystack", () => {
  it("includes body, media names, and location address", () => {
    const hay = messageSearchHaystack(
      msg({
        id: "1",
        body: "Hello clinic",
        media: [{ url: "https://x", name: "xray.pdf" }],
        flow: {
          kind: "location",
          address: "12 Nile St",
        },
      }),
    );
    assert.match(hay, /hello clinic/i);
    assert.match(hay, /xray\.pdf/i);
    assert.match(hay, /12 nile st/i);
  });
});

describe("findMessageMatches", () => {
  const messages = [
    msg({ id: "a", body: "Appointment tomorrow", authorName: "Pat" }),
    msg({ id: "b", body: "Thanks", author: "agent", authorName: "Desk" }),
    msg({
      id: "c",
      body: "",
      media: [{ url: "u", name: "appointment-card.png" }],
    }),
  ];

  it("returns empty for blank query", () => {
    assert.deepEqual(findMessageMatches(messages, "  "), []);
  });

  it("matches case-insensitively and preserves chronological order", () => {
    const hits = findMessageMatches(messages, "APPOINT");
    assert.deepEqual(
      hits.map((h) => h.id),
      ["a", "c"],
    );
  });

  it("builds a short snippet from the body or media name", () => {
    const [hit] = findMessageMatches(messages, "thanks");
    assert.equal(hit?.id, "b");
    assert.match(hit?.snippet ?? "", /Thanks/);
  });
});
