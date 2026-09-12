import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { AiChatError, aiChat } from "./chat.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { resetCooldowns } from "./cooldown.ts";

const KEYS = { GROQ_API_KEY: "k", GEMINI_API_KEY: "g" };
const THREE = { ...KEYS, AI_MODEL_CHAIN: "groq:one,groq:two,groq:three" };

const ok = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });

const rateLimited = (detail = "rate limit", retryAfter?: string) =>
  new Response(JSON.stringify({ error: { message: detail } }), {
    status: 429,
    headers: retryAfter ? { "retry-after": retryAfter } : {},
  });

const serverError = () => new Response("boom", { status: 500 });

/** Answer per model id, and record the order models were asked in. */
function router(handlers: Record<string, () => Response>) {
  const asked: string[] = [];
  const fetchImpl = async (_url: string, init: RequestInit) => {
    const model = (JSON.parse(init.body as string) as { model: string }).model;
    asked.push(model);
    const handler = handlers[model];
    if (!handler) throw new Error(`unexpected model ${model}`);
    return handler();
  };
  return { asked, fetchImpl };
}

const base = { messages: [{ role: "user" as const, content: "hi" }] };

describe("aiChat — walking the chain", () => {
  beforeEach(() => resetCooldowns());

  it("answers from the first model, naming what answered", async () => {
    const r = router({ one: () => ok("hello") });
    const out = await aiChat({ ...base, env: THREE, fetchImpl: r.fetchImpl });
    assert.equal(out.content, "hello");
    assert.equal(out.provider, "groq");
    assert.equal(out.model, "one");
    assert.deepEqual(r.asked, ["one"]);
  });

  /** The usage page can only report what the chain hands back. */
  it("reports what the answer cost, when the provider says", async () => {
    const out = await aiChat({
      ...base,
      env: THREE,
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "hi" } }],
            usage: { prompt_tokens: 80, completion_tokens: 20, total_tokens: 100 },
          }),
          { status: 200 },
        ),
    });
    assert.deepEqual(out.usage, {
      promptTokens: 80,
      completionTokens: 20,
      totalTokens: 100,
    });
  });

  it("moves to the next model when one is out of quota", async () => {
    const r = router({ one: () => rateLimited(), two: () => ok("second") });
    const out = await aiChat({ ...base, env: THREE, fetchImpl: r.fetchImpl });
    assert.equal(out.content, "second");
    assert.equal(out.model, "two");
    assert.deepEqual(r.asked, ["one", "two"]);
  });

  it("moves on from a server error, an empty answer and a retired model alike", async () => {
    const r = router({
      one: () => serverError(),
      two: () => new Response("{}", { status: 200 }),
      three: () => ok("third"),
    });
    const out = await aiChat({ ...base, env: THREE, fetchImpl: r.fetchImpl });
    assert.equal(out.content, "third");
    assert.deepEqual(r.asked, ["one", "two", "three"]);
  });

  it("passes the caller's options to the provider", async () => {
    let body: Record<string, unknown> = {};
    const out = await aiChat({
      ...base,
      env: THREE,
      temperature: 0.2,
      responseFormat: "json_object",
      maxTokens: 700,
      fetchImpl: async (_u: string, init: RequestInit) => {
        body = JSON.parse(init.body as string);
        return ok("{}");
      },
    });
    assert.equal(out.content, "{}");
    assert.equal(body.temperature, 0.2);
    assert.deepEqual(body.response_format, { type: "json_object" });
    assert.equal(body.max_tokens, 700);
  });
});

describe("aiChat — skipping models we know are spent", () => {
  beforeEach(() => resetCooldowns());

  /** The whole point of the cooldown: stop paying to learn the same thing. */
  it("does not ask a model again while it is cooling down", async () => {
    const first = router({ one: () => rateLimited("tokens per day (TPD)"), two: () => ok("2") });
    await aiChat({ ...base, env: THREE, fetchImpl: first.fetchImpl });
    assert.deepEqual(first.asked, ["one", "two"]);

    const second = router({ two: () => ok("2 again") });
    const out = await aiChat({ ...base, env: THREE, fetchImpl: second.fetchImpl });
    assert.equal(out.content, "2 again");
    assert.deepEqual(second.asked, ["two"], "the spent model must be skipped entirely");
  });

  /** A 5xx says nothing about quota, so the model keeps its place. */
  it("asks a model that merely broke again next time", async () => {
    const first = router({ one: () => serverError(), two: () => ok("2") });
    await aiChat({ ...base, env: THREE, fetchImpl: first.fetchImpl });

    const second = router({ one: () => ok("1") });
    const out = await aiChat({ ...base, env: THREE, fetchImpl: second.fetchImpl });
    assert.equal(out.model, "one");
  });

  it("tries a cooling model anyway rather than giving up with nothing left", async () => {
    const env = { ...KEYS, AI_MODEL_CHAIN: "groq:one" };
    const first = router({ one: () => rateLimited("tokens per day (TPD)") });
    await assert.rejects(() => aiChat({ ...base, env, fetchImpl: first.fetchImpl }));

    const second = router({ one: () => ok("back") });
    const out = await aiChat({ ...base, env, fetchImpl: second.fetchImpl });
    assert.equal(out.content, "back");
  });
});

describe("aiChat — giving up", () => {
  beforeEach(() => resetCooldowns());

  it("reports every model it tried when the whole chain fails", async () => {
    const r = router({
      one: () => rateLimited(),
      two: () => serverError(),
      three: () => rateLimited(),
    });
    await assert.rejects(
      () => aiChat({ ...base, env: THREE, fetchImpl: r.fetchImpl }),
      (err: unknown) => {
        assert.ok(err instanceof AiChatError);
        const e = err as AiChatError;
        assert.equal(e.attempts.length, 3);
        assert.deepEqual(
          e.attempts.map((a) => a.model),
          ["one", "two", "three"],
        );
        assert.match(e.message, /groq:one/);
        assert.match(e.message, /groq:three/);
        return true;
      },
    );
  });

  it("says plainly when no provider key is set at all", async () => {
    await assert.rejects(
      () => aiChat({ ...base, env: {}, fetchImpl: async () => ok("never") }),
      (err: unknown) => err instanceof AiChatError && /no ai provider key/i.test((err as Error).message),
    );
  });

  /** The caller walking away must stop the chain, not advance it. */
  it("stops immediately when the caller aborts", async () => {
    const controller = new AbortController();
    controller.abort();
    const r = router({ one: () => ok("never") });
    await assert.rejects(
      () => aiChat({ ...base, env: THREE, signal: controller.signal, fetchImpl: r.fetchImpl }),
      (err: unknown) => /cancelled/i.test((err as Error).message),
    );
    assert.deepEqual(r.asked, [], "no model should have been called");
  });

  /**
   * The WhatsApp webhook has a hard ceiling. Nine models at eight seconds each
   * would blow through it, so the chain stops starting new ones near the end.
   */
  it("stops starting models once the deadline is close", async () => {
    let clock = 0;
    const r = router({
      one: () => rateLimited(),
      two: () => rateLimited(),
      three: () => ok("too late"),
    });
    await assert.rejects(
      () =>
        aiChat({
          ...base,
          env: THREE,
          deadlineMs: 40_000,
          fetchImpl: async (u: string, init: RequestInit) => {
            clock += 20_000;
            return r.fetchImpl(u, init);
          },
          now: () => clock,
        }),
      (err: unknown) => {
        assert.match((err as Error).message, /deadline/i);
        return true;
      },
    );
    assert.deepEqual(r.asked, ["one", "two"], "the third start would overrun the budget");
  });
});

describe("aiChat — Arabic", () => {
  beforeEach(() => resetCooldowns());

  /**
   * A patient's reply is the thing this chain exists to protect, and it is
   * usually Egyptian Arabic. It must survive a fallback byte for byte.
   */
  it("carries Arabic through a fallback unchanged", async () => {
    const reply = '{"language":"ar","reply":"تمام، حجزتلك الخميس ١٠:٣٠ صباحاً."}';
    const r = router({ one: () => rateLimited(), two: () => ok(reply) });
    const out = await aiChat({
      ...base,
      messages: [{ role: "user", content: "عايز احجز موعد تنظيف يوم الخميس" }],
      env: THREE,
      fetchImpl: r.fetchImpl,
    });
    assert.equal(out.content, reply);
    assert.equal(JSON.parse(out.content).reply, "تمام، حجزتلك الخميس ١٠:٣٠ صباحاً.");
  });
});

describe("aiChat — end-to-end fake", () => {
  beforeEach(() => resetCooldowns());

  it("short-circuits to the canned reply when the E2E fake is on", async () => {
    process.env.E2E_FAKE_GROQ = "1";
    try {
      const out = await aiChat({
        messages: [{ role: "user", content: '{"text":"what time do you open?"}' }],
        env: {},
        fetchImpl: async () => {
          throw new Error("must not reach a provider");
        },
      });
      assert.equal(out.provider, "fake");
      assert.match(out.content, /open/i);
    } finally {
      delete process.env.E2E_FAKE_GROQ;
    }
  });
});

type Write = {
  provider: string;
  model: string;
  usage?: { totalTokens: number } | null;
  rateLimited?: boolean;
};

describe("aiChat — recording what it spent", () => {
  beforeEach(() => resetCooldowns());

  it("records the model that answered and what it cost", async () => {
    const writes: Write[] = [];
    await aiChat({
      ...base,
      env: THREE,
      recordUsage: (write: Write) => writes.push(write),
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "hi" } }],
            usage: { prompt_tokens: 70, completion_tokens: 30, total_tokens: 100 },
          }),
          { status: 200 },
        ),
    });
    assert.equal(writes.length, 1);
    assert.equal(writes[0].provider, "groq");
    assert.equal(writes[0].model, "one");
    assert.equal(writes[0].usage?.totalTokens, 100);
  });

  /** Seeing which model ran out, and when, is the point of the usage page. */
  it("records the model that ran out as well as the one that answered", async () => {
    const writes: Write[] = [];
    const r = router({ one: () => rateLimited("tokens per day (TPD)"), two: () => ok("2") });
    await aiChat({
      ...base,
      env: THREE,
      recordUsage: (write: Write) => writes.push(write),
      fetchImpl: r.fetchImpl,
    });
    assert.deepEqual(
      writes.map((w) => `${w.model}:${w.rateLimited ? "limited" : "answered"}`),
      ["one:limited", "two:answered"],
    );
  });

  /**
   * A 5xx spends no quota and produces nothing. Recording it would overstate
   * the day and make a provider outage look like heavy use.
   */
  it("records nothing for a model that merely broke", async () => {
    const writes: Write[] = [];
    const r = router({ one: () => serverError(), two: () => ok("2") });
    await aiChat({
      ...base,
      env: THREE,
      recordUsage: (write: Write) => writes.push(write),
      fetchImpl: r.fetchImpl,
    });
    assert.deepEqual(writes.map((w) => w.model), ["two"]);
  });

  /** Bookkeeping must never cost a patient their reply. */
  it("still answers when recording throws", async () => {
    const r = router({ one: () => ok("hello") });
    const out = await aiChat({
      ...base,
      env: THREE,
      recordUsage: () => {
        throw new Error("usage table is gone");
      },
      fetchImpl: r.fetchImpl,
    });
    assert.equal(out.content, "hello");
  });
});

describe("aiChat — a chain that would not answer in JSON", () => {
  beforeEach(() => resetCooldowns());

  const jsonRefused = (generation: string) => () =>
    new Response(
      JSON.stringify({
        error: { code: "json_validate_failed", failed_generation: generation },
      }),
      { status: 400 },
    );

  it("reports it, with what the first such model wrote instead", async () => {
    const r = router({
      one: jsonRefused("Sure, Sunday 10:30 works"),
      two: jsonRefused("second"),
      three: jsonRefused("third"),
    });
    await assert.rejects(
      () =>
        aiChat({
          ...base,
          env: THREE,
          responseFormat: "json_object",
          fetchImpl: r.fetchImpl,
        }),
      (err: unknown) =>
        err instanceof AiChatError &&
        err.jsonValidateFailed &&
        err.failedGeneration === "Sure, Sunday 10:30 works",
    );
  });

  it("stays false when the models failed for ordinary reasons", async () => {
    const r = router({
      one: () => rateLimited(),
      two: () => serverError(),
      three: () => serverError(),
    });
    await assert.rejects(
      () => aiChat({ ...base, env: THREE, fetchImpl: r.fetchImpl }),
      (err: unknown) =>
        err instanceof AiChatError &&
        err.jsonValidateFailed === false &&
        err.failedGeneration === null,
    );
  });
});
