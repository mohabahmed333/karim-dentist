import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { buildHistoryTurns } from "./historyTurns.ts";

type Row = {
  id: string;
  body: string;
  direction: "inbound" | "outbound";
  status: string;
  sender_kind: string;
  wa_timestamp: string;
};

const at = (s: number) => new Date(Date.UTC(2026, 8, 10, 22, 0, s)).toISOString();
const row = (p: Partial<Row> & { id: string }): Row => ({
  body: "x",
  direction: "inbound",
  status: "received",
  sender_kind: "human",
  wa_timestamp: at(0),
  ...p,
});

describe("buildHistoryTurns", () => {
  /**
   * A draft is a reply the patient never received. Replaying it as something
   * the assistant said gives the model a false transcript to build on.
   */
  it("excludes drafts and failed sends — only what the patient actually saw", () => {
    const turns = buildHistoryTurns([
      row({ id: "1", body: "hi", wa_timestamp: at(1) }),
      row({ id: "2", direction: "outbound", sender_kind: "ai", status: "draft", body: "unsent draft", wa_timestamp: at(2) }),
      row({ id: "3", direction: "outbound", sender_kind: "ai", status: "failed", body: "failed send", wa_timestamp: at(3) }),
      row({ id: "4", direction: "outbound", sender_kind: "ai", status: "delivered", body: "delivered reply", wa_timestamp: at(4) }),
    ]);
    assert.deepEqual(turns.map((t: { content: string }) => t.content), ["hi", "delivered reply"]);
  });

  it("keeps sent, delivered and read outbound messages", () => {
    const turns = buildHistoryTurns(
      ["sent", "delivered", "read"].map((status, i) =>
        row({ id: String(i), direction: "outbound", sender_kind: "ai", status, body: status, wa_timestamp: at(i) }),
      ),
    );
    assert.equal(turns.length, 3);
  });

  /** The model must be able to tell its own words from a receptionist's. */
  it("labels a human staff reply so it is not mistaken for the assistant", () => {
    const [turn] = buildHistoryTurns([
      row({ id: "1", direction: "outbound", sender_kind: "human", status: "read", body: "See you at 4" }),
    ]);
    assert.equal(turn.role, "assistant");
    assert.match(turn.content, /clinic staff/i);
    assert.match(turn.content, /See you at 4/);
  });

  it("leaves the assistant's own turns unlabelled", () => {
    const [turn] = buildHistoryTurns([
      row({ id: "1", direction: "outbound", sender_kind: "ai", status: "sent", body: "We open at 10." }),
    ]);
    assert.equal(turn.content, "We open at 10.");
  });

  /**
   * Meta timestamps are second-resolution, so a question and its answer can
   * share one. Without an id tiebreaker they can come back inverted.
   */
  it("orders oldest-first, breaking timestamp ties by id", () => {
    const turns = buildHistoryTurns([
      row({ id: "b", body: "second", wa_timestamp: at(5) }),
      row({ id: "a", body: "first", wa_timestamp: at(5) }),
      row({ id: "c", body: "third", wa_timestamp: at(6) }),
    ]);
    assert.deepEqual(turns.map((t: { content: string }) => t.content), ["first", "second", "third"]);
  });

  /** Filtering after the cap silently shrank the window to a few real turns. */
  it("drops empty bodies before applying the cap, then keeps the newest", () => {
    const rows: Row[] = [];
    for (let i = 0; i < 30; i++) {
      rows.push(row({ id: `m${String(i).padStart(2, "0")}`, body: i % 2 ? `msg ${i}` : "   ", wa_timestamp: at(i) }));
    }
    const turns = buildHistoryTurns(rows, 10);
    assert.equal(turns.length, 10, "ten real turns, not ten rows");
    assert.equal(turns[turns.length - 1].content, "msg 29", "newest kept");
    assert.ok(turns.every((t: { content: string }) => t.content.trim()));
  });

  it("maps inbound to user and outbound to assistant", () => {
    const turns = buildHistoryTurns([
      row({ id: "1", body: "patient", wa_timestamp: at(1) }),
      row({ id: "2", direction: "outbound", sender_kind: "ai", status: "sent", body: "bot", wa_timestamp: at(2) }),
    ]);
    assert.deepEqual(turns.map((t: { role: string }) => t.role), ["user", "assistant"]);
  });
});
