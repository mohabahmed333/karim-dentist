/**
 * Deterministic stand-ins for the two external vendors, used only by the E2E
 * suite.
 *
 * Both are gated on an explicit env var that is never set in any real
 * environment — deliberately not on NODE_ENV, because `yarn build && yarn
 * start` runs the E2E server in production mode. If either flag were ever set
 * outside CI the app would stop talking to the real vendor, which fails loudly
 * and immediately rather than silently.
 */
export const fakeGroqEnabled = () => process.env.E2E_FAKE_GROQ === "1";
export const fakeKapsoEnabled = () => process.env.E2E_FAKE_KAPSO === "1";

/**
 * Canned auto-responder envelopes, keyed off what the patient said, so specs
 * can drive send-vs-draft without a model.
 */
export function fakeGroqReply(
  messages: { role: string; content: string }[],
): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  let text = "";
  try {
    text = String(JSON.parse(lastUser?.content ?? "{}").text ?? "");
  } catch {
    text = lastUser?.content ?? "";
  }
  const lower = text.toLowerCase();

  // Clinical → must draft, whatever the stated confidence.
  if (/hurt|pain|swollen|bleed|infect|ache/.test(lower)) {
    return JSON.stringify({
      language: "en",
      intent: "clinical_question",
      confidence: 0.99,
      reply: "That sounds uncomfortable - a dentist should look at it.",
    });
  }
  if (/open|hours|close/.test(lower)) {
    return JSON.stringify({
      language: "en",
      intent: "hours",
      confidence: 0.95,
      reply: "We are open 10am to 6pm, Sunday to Thursday.",
    });
  }
  if (/where|address|location/.test(lower)) {
    return JSON.stringify({
      language: "en",
      intent: "location",
      confidence: 0.93,
      reply: "We are on Road 90, New Cairo.",
    });
  }
  return JSON.stringify({
    language: "en",
    intent: "other",
    confidence: 0.4,
    handoff: true,
    handoffReason: "e2e_default",
    reply: "A team member will reply shortly.",
  });
}
