/**
 * Ask every configured model the questions this clinic actually gets, and
 * report which ones answered.
 *
 * The unit tests prove the chain falls through correctly against a fake fetch.
 * This is the other half: that the keys in your .env.local are real, that each
 * model still exists, and — the part that matters here — that it answers a
 * patient writing Egyptian Arabic in Arabic rather than in English.
 *
 *   node --experimental-strip-types --import ./scripts/test-loader.mjs \
 *     --env-file=.env.local scripts/ai-chain-smoke.mjs
 *
 * Exits non-zero when no model answered at all. One model failing is
 * information, not a failure: that is what the rest of the chain is for.
 */
import { callProvider } from "../src/services/ai_chat/callProvider.ts";
import { resolveChain } from "../src/services/ai_chat/modelChain.ts";

const ARABIC = /[؀-ۿ]/;

const CASES = [
  {
    name: "whatsapp · ar",
    messages: [
      {
        role: "system",
        content:
          "You are the front desk of a dental clinic on WhatsApp. Mirror the patient's language: Arabic in, Arabic out. At most two sentences. Never invent times.",
      },
      { role: "user", content: "عايز احجز موعد تنظيف يوم الخميس" },
    ],
    // The failure this catches is a model that answers Egyptian Arabic in
    // English, which reads to a patient as though nobody understood them.
    check: (reply) => (ARABIC.test(reply) ? "" : "answered a non-Arabic reply"),
  },
  {
    name: "search · ar",
    messages: [
      {
        role: "system",
        content:
          'Rank clinic admin search results. Reply with only JSON: {"ids":["id"]}. Understand Arabic (حجز → reservations, مريض → patients).',
      },
      {
        role: "user",
        content:
          "Query: حجز\n\nCatalog:\nreservations | page | Reservations\npatients | page | Patients\nhero | cms | Homepage hero",
      },
    ],
    check: (reply) =>
      reply.includes("reservations") ? "" : "did not rank the Arabic keyword onto reservations",
  },
];

const chain = resolveChain();
if (chain.length === 0) {
  console.error(
    "No provider key set. Add GEMINI_API_KEY, MISTRAL_API_KEY, CEREBRAS_API_KEY or GROQ_API_KEY to .env.local.",
  );
  process.exit(1);
}

console.log(`Chain (${chain.length} models), in the order they are asked:\n`);

let answered = 0;

for (const entry of chain) {
  const label = `${entry.provider}:${entry.model}`;
  const results = [];

  for (const testCase of CASES) {
    const startedAt = Date.now();
    try {
      const reply = await callProvider({
        provider: entry.provider,
        model: entry.model,
        apiKey: process.env[`${entry.provider.toUpperCase()}_API_KEY`] ?? "",
        messages: testCase.messages,
        temperature: 0.2,
        maxTokens: 300,
        timeoutMs: 20_000,
      });
      const complaint = testCase.check(reply);
      results.push({
        name: testCase.name,
        ok: !complaint,
        ms: Date.now() - startedAt,
        note: complaint || reply.replace(/\s+/g, " ").slice(0, 60),
      });
    } catch (err) {
      results.push({
        name: testCase.name,
        ok: false,
        ms: Date.now() - startedAt,
        note: err instanceof Error ? err.message.slice(0, 120) : "failed",
      });
    }
  }

  const ok = results.every((r) => r.ok);
  if (ok) answered += 1;
  console.log(`${ok ? "✔" : "✖"} ${label}`);
  for (const r of results) {
    console.log(`    ${r.ok ? "·" : "!"} ${r.name} (${r.ms}ms) ${r.note}`);
  }
}

console.log(`\n${answered} of ${chain.length} models answered both cases.`);
if (answered === 0) {
  console.error("No model answered — the assistant would be silent right now.");
  process.exit(1);
}
