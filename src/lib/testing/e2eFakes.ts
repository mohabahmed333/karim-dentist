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
type FakeContentPart = { type?: string; text?: string; image_url?: { url?: string } };
type FakeMessage = { role: string; content: string | FakeContentPart[] };

/** The text of a message, whether it arrived as a string or as content parts. */
function flattenContent(content: string | FakeContentPart[] | undefined): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((part) => part?.type === "text")
    .map((part) => part.text ?? "")
    .join(" ");
}

/** The first image in a message, or "" when it is a text-only call. */
function imageUrlOf(content: string | FakeContentPart[] | undefined): string {
  if (!Array.isArray(content)) return "";
  return content.find((part) => part?.type === "image_url")?.image_url?.url ?? "";
}

/**
 * The scenario a fixture asks for, read out of the image itself.
 *
 * Not from the URL: by the time an image reaches a model it is a base64 data
 * URI, and a filename-based switch silently returns the same answer for every
 * fixture. So a fixture declares itself in its own bytes — append
 * `E2E-SCENARIO:short` to the file and it is a short payment.
 */
function decodeImage(image: string): string {
  const base64 = image.startsWith("data:") ? image.slice(image.indexOf(",") + 1) : "";
  return base64 ? Buffer.from(base64, "base64").toString("latin1") : image;
}

function scenarioOf(decoded: string): string {
  return /E2E-SCENARIO:([a-z-]+)/.exec(decoded)?.[1] ?? "good";
}

/**
 * A short tag unique to these exact bytes, used for the reference number.
 *
 * It has to vary between runs: a transaction reference is single-use for real,
 * enforced by a unique index, so a fixed one makes the suite pass once and fail
 * for ever after. Hashing the bytes gets that for free, because a fixture with a
 * per-run nonce in it hashes differently each time. No node:crypto here — this
 * module is reachable from code that also bundles for the browser.
 */
function bytesTag(decoded: string): string {
  let hash = 5381;
  for (let i = 0; i < decoded.length; i += 1) {
    hash = ((hash << 5) + hash + decoded.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36).toUpperCase();
}

/**
 * Canned receipt extractions, chosen by the fixture the spec sent.
 *
 * The fake cannot know what the clinic is asking for, so the amounts here are
 * fixed and the spec sets the clinic's deposit to match.
 */
export function fakeReceiptExtraction(imageUrl: string): string {
  const decoded = decodeImage(imageUrl);
  const scenario = scenarioOf(decoded);
  const tag = bytesTag(decoded);

  if (scenario === "not-a-receipt") {
    return JSON.stringify({ isReceipt: false, confidence: 0.9 });
  }
  if (scenario === "short") {
    return JSON.stringify({
      isReceipt: true,
      amount: 50,
      currency: "EGP",
      reference: `E2ESHORT${tag}`,
      senderName: "E2E Patient",
      recipientHandle: "clinic@instapay",
      transferredAt: new Date().toISOString(),
      channel: "instapay",
      confidence: 0.95,
    });
  }
  if (scenario === "unreadable") {
    return JSON.stringify({ isReceipt: true, amount: null, reference: null, confidence: 0.2 });
  }
  return JSON.stringify({
    isReceipt: true,
    amount: 200,
    currency: "EGP",
    reference: `E2EGOOD${tag}`,
    senderName: "E2E Patient",
    recipientHandle: "clinic@instapay",
    transferredAt: new Date().toISOString(),
    channel: "instapay",
    confidence: 0.96,
  });
}

export function fakeGroqReply(messages: FakeMessage[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");

  // An image in the call means the receipt reader, not the autoresponder.
  const imageUrl = imageUrlOf(lastUser?.content);
  if (imageUrl) return fakeReceiptExtraction(imageUrl);

  const raw = flattenContent(lastUser?.content);
  let text = "";
  try {
    text = String(JSON.parse(raw || "{}").text ?? "");
  } catch {
    text = raw;
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
