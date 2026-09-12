import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { runClinicAssistTurn } from "./clinicAssistTurn.ts";

const REPLY = (text: string) => JSON.stringify({ reply: text });
const TOOL_CALL = (name: string, args: unknown) => JSON.stringify({ toolCall: { name, args } });

function scripted(...responses: string[]) {
  const calls: { role: string; content: string }[][] = [];
  let i = 0;
  return {
    calls,
    complete: async (messages: { role: string; content: string }[]) => {
      calls.push(messages);
      const next = responses[Math.min(i, responses.length - 1)];
      i += 1;
      return next!;
    },
  };
}

describe("runClinicAssistTurn", () => {
  it("returns the reply directly when the model needs no tool", async () => {
    const { complete, calls } = scripted(REPLY("Hello!"));
    const out = await runClinicAssistTurn({
      db: {} as never,
      system: "sys",
      messages: [{ role: "user", content: "hi" }],
      complete,
    });
    assert.equal(out.reply, "Hello!");
    assert.deepEqual(out.toolCalls, []);
    assert.equal(calls.length, 1);
  });

  it("runs a tool call and feeds the result back for a final answer", async () => {
    const { complete, calls } = scripted(
      TOOL_CALL("search_patients", { query: "Ali" }),
      REPLY("Ali has an appointment tomorrow at 10."),
    );
    let seenName = "";
    let seenArgs: unknown;
    const runTool = async (_db: unknown, name: string, args: unknown) => {
      seenName = name;
      seenArgs = args;
      return { ok: true as const, data: { patientKey: "phone:201", name: "Ali" } };
    };
    const out = await runClinicAssistTurn({
      db: {} as never,
      system: "sys",
      messages: [{ role: "user", content: "when is Ali's next visit?" }],
      complete,
      runTool,
    });
    assert.equal(seenName, "search_patients");
    assert.deepEqual(seenArgs, { query: "Ali" });
    assert.equal(out.reply, "Ali has an appointment tomorrow at 10.");
    assert.deepEqual(out.toolCalls, [{ name: "search_patients", args: { query: "Ali" }, ok: true }]);

    // The second call must carry the tool's own turn plus its result as data.
    const secondCallMessages = calls[1]!;
    const assistantTurn = secondCallMessages.find((m) => m.role === "assistant");
    const resultTurn = secondCallMessages.at(-1)!;
    assert.equal(assistantTurn?.content, TOOL_CALL("search_patients", { query: "Ali" }));
    const parsed = JSON.parse(resultTurn.content);
    assert.deepEqual(parsed, { toolResult: { name: "search_patients", data: { patientKey: "phone:201", name: "Ali" } } });
  });

  it("feeds a tool error back to the model rather than failing the turn", async () => {
    const { complete } = scripted(
      TOOL_CALL("search_patients", {}),
      REPLY("I need a name or phone number to search."),
    );
    const runTool = async () => ({ ok: false as const, error: "Bad arguments for search_patients: query required" });
    const out = await runClinicAssistTurn({
      db: {} as never,
      system: "sys",
      messages: [{ role: "user", content: "find the patient" }],
      complete,
      runTool,
    });
    assert.equal(out.toolCalls[0]?.ok, false);
    assert.equal(out.reply, "I need a name or phone number to search.");
  });

  it("stops requesting tools after maxSteps and forces a final answer", async () => {
    const { complete, calls } = scripted(
      TOOL_CALL("search_patients", { query: "a" }),
      TOOL_CALL("search_patients", { query: "b" }),
      REPLY("Here's what I found."),
    );
    const runTool = async () => ({ ok: true as const, data: [] });
    const out = await runClinicAssistTurn({
      db: {} as never,
      system: "sys",
      messages: [{ role: "user", content: "find someone" }],
      complete,
      runTool,
      maxSteps: 2,
    });
    // 2 tool steps + 1 forced final = 3 completions.
    assert.equal(calls.length, 3);
    assert.equal(out.reply, "Here's what I found.");
    assert.equal(out.toolCalls.length, 2);
    // The final call's system turn must tell the model to stop calling tools.
    assert.match(calls[2]![0]!.content, /do not request another tool/i);
  });

  it("falls back gracefully if the model still asks for a tool on the forced final turn", async () => {
    const { complete } = scripted(
      TOOL_CALL("search_patients", { query: "a" }),
      TOOL_CALL("search_patients", { query: "b" }),
    );
    const runTool = async () => ({ ok: true as const, data: [] });
    const out = await runClinicAssistTurn({
      db: {} as never,
      system: "sys",
      messages: [{ role: "user", content: "find someone" }],
      complete,
      runTool,
      maxSteps: 1,
    });
    // Not a valid reply envelope — extractClinicChatPayload's fallback applies.
    assert.equal(out.reply, "");
    assert.deepEqual(out.proposedActions, []);
  });

  it("treats a malformed toolCall shape as a normal (if odd) reply, not a crash", async () => {
    const { complete } = scripted(JSON.stringify({ toolCall: { args: { query: "x" } } }));
    const out = await runClinicAssistTurn({
      db: {} as never,
      system: "sys",
      messages: [{ role: "user", content: "hi" }],
      complete,
    });
    assert.deepEqual(out.toolCalls, []);
  });
});
