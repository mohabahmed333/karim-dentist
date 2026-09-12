# Quick Reply Button Taps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use haac-core:subagent-driven-development (recommended) or haac-core:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a patient taps a WhatsApp reply button or list item, the tap is saved (its id, title, and whether it was a button or list tap) and shown in the chat as a distinct chip, instead of an indistinguishable plain-text bubble.

**Architecture:** The tap is captured server-side by `extractFlowFromKapso`, which already runs on every inbound message and already has a (currently `null`-returning) branch for button/list replies. It is stored in the `flow` jsonb column that `whatsapp_messages` already has — no migration. The client's existing `flow` parsing and typing gain the two new fields, and `ChatMessageBubble` renders a new small chip component instead of the plain body paragraph when a row carries this shape.

**Tech Stack:** Next.js 16.3 (App Router), React 19, Supabase (Postgres jsonb, no schema change), `node:test` unit tests (`scripts/test.sh`), Playwright e2e with a local-only `.env.e2e`.

**Spec:** [docs/superpowers/specs/2026-09-12-quick-reply-button-taps-design.md](../specs/2026-09-12-quick-reply-button-taps-design.md)

## Global Constraints

**Git**
- Work directly on `main`. Before every commit, `git branch --show-current` must print `main`.
- No feature branch, no Jira key.
- Other sessions commit to `main` at the same time:
  - Stage explicit paths only. Never run `git add -A` or `git add .`.
  - Never stash, reset, rebase or amend.
  - Never stage files you didn't change.
- Never push to GitHub.
- End every commit message with `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

**Environments**
- `.env.local` points at PRODUCTION Supabase and real WhatsApp. Any build, app run or e2e run must load the local-only env in the same shell:
  `bash -c 'set -a; . ./.env.e2e; set +a; GITHUB_TOKEN=x yarn …'`
- Before e2e, confirm nothing listens on port 3100: `lsof -nP -iTCP:3100 -sTCP:LISTEN`.
- **No production step for this feature.** `flow` is already a jsonb column on `whatsapp_messages`; nothing here touches the database schema. Never run `supabase db push`, `supabase link`, `supabase db reset`, or `supabase migration up --local` — there is no migration in this plan.

**Tooling**
- yarn needs the prefix `GITHUB_TOKEN=x`.
- Unit tests live next to the source as `*.test.ts`. They import the module under test with a `.ts` extension, preceded by `// @ts-expect-error -- Node strip-types needs the extension.`
- Run a single test file with:
  `node --experimental-strip-types --import ./scripts/test-loader.mjs --test <file>`

**Lint**
- A task must add NO new lint problems compared with its base commit, and must never add eslint-disable comments. Repo-wide `yarn lint` already fails on unrelated pre-existing files across the repo; ignore that.
- Compare per file with `eslint -f json`, by (file, severity, ruleId), using a bash array of file paths. zsh does not word-split, and ESLint 9 has no `unix` formatter.
- Every file this plan touches or creates has 0 pre-existing problems (verified at the plan's base commit `fedb51d`).

**Shape**
- `MessageFlowPayload.kind` gains `"button_reply"`.
- New fields on that type: `buttonId?: string`, `replyKind?: "button" | "list"`.
- For this kind, `title` holds the tapped label (the field the type already has).
- `kapsoMessageBody` is UNCHANGED. `body` still holds the plain title, exactly as today — nothing that reads `.body` (the AI bot, `reply_to` previews) is affected.

**Unit test count on `main` at `fedb51d`:** 1331 passing, across 238 tracked test files. Each task below says how many tests it adds. If other sessions add tests to `main` concurrently, only the delta and "0 failures" matter — use the tracked-files-only run (`git ls-files -- 'src/**/*.test.ts' 'src/*.test.ts'`) as the authoritative count, since `yarn test` alone also picks up any other session's in-progress, uncommitted test files.

---

### Task 1: Capture the tap on the server

**Files:**
- Modify: `src/services/whatsapp/messageMedia.ts`
- Create: `src/services/whatsapp/messageMedia.test.ts`

**Interfaces:**
- Consumes: nothing new (the existing `KapsoMessagePayload` type, `asRecord` helper, both already in this file)
- Produces:
  - `MessageFlowPayload.kind` includes `"button_reply"`
  - `MessageFlowPayload.buttonId?: string`
  - `MessageFlowPayload.replyKind?: "button" | "list"`
  - `extractFlowFromKapso(message)` returns `{ kind: "button_reply", title, buttonId, replyKind }` for a button or list tap with a usable title and id, and `null` when either is missing or blank

- [ ] **Step 1: Write the failing tests**

Create `src/services/whatsapp/messageMedia.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { extractFlowFromKapso } from "./messageMedia.ts";

describe("extractFlowFromKapso button and list taps", () => {
  it("captures a reply-button tap: id, title and kind", () => {
    const flow = extractFlowFromKapso({
      type: "interactive",
      interactive: { type: "button_reply", button_reply: { id: "qr_visit_1", title: "Confirm" } },
    });
    assert.deepEqual(flow, { kind: "button_reply", title: "Confirm", buttonId: "qr_visit_1", replyKind: "button" });
  });

  it("captures a list-item tap the same way, with replyKind list", () => {
    const flow = extractFlowFromKapso({
      type: "interactive",
      interactive: { type: "list_reply", list_reply: { id: "row-3", title: "Cleaning" } },
    });
    assert.deepEqual(flow, { kind: "button_reply", title: "Cleaning", buttonId: "row-3", replyKind: "list" });
  });

  it("returns null when the title is missing or blank", () => {
    assert.equal(
      extractFlowFromKapso({
        type: "interactive",
        interactive: { type: "button_reply", button_reply: { id: "btn_1", title: "  " } },
      }),
      null,
    );
    assert.equal(
      extractFlowFromKapso({
        type: "interactive",
        interactive: { type: "button_reply", button_reply: { id: "btn_1" } },
      }),
      null,
    );
  });

  it("returns null when the id is missing", () => {
    assert.equal(
      extractFlowFromKapso({
        type: "interactive",
        interactive: { type: "button_reply", button_reply: { title: "Confirm" } },
      }),
      null,
    );
  });
});

describe("extractFlowFromKapso unrelated cases still work", () => {
  it("still reads a location message", () => {
    const flow = extractFlowFromKapso({
      type: "location",
      location: { latitude: "30.0074", longitude: "31.4913", name: "Clinic", address: "New Cairo" },
    });
    assert.deepEqual(flow, {
      kind: "location",
      title: "Clinic",
      address: "New Cairo",
      latitude: 30.0074,
      longitude: 31.4913,
    });
  });

  it("still returns null for plain text", () => {
    assert.equal(extractFlowFromKapso({ type: "text", text: { body: "hi" } }), null);
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/whatsapp/messageMedia.test.ts`
Expected: FAIL. The button/list branch currently returns `null` unconditionally, so the first two tests fail (`AssertionError`, expected object, got `null`).

- [ ] **Step 3: Implement**

In `src/services/whatsapp/messageMedia.ts`, replace the `MessageFlowPayload` type:

```ts
export type MessageFlowPayload = {
  kind?: "flow" | "buttons" | "cta" | "location" | "contacts" | "template";
  title?: string;
  subtitle?: string;
  cta?: string;
  fields?: string[];
  buttons?: { id: string; title: string }[];
  ctaUrl?: string;
  ctaLabel?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  phone?: string;
};
```

with:

```ts
export type MessageFlowPayload = {
  kind?: "flow" | "buttons" | "cta" | "location" | "contacts" | "template" | "button_reply";
  title?: string;
  subtitle?: string;
  cta?: string;
  fields?: string[];
  buttons?: { id: string; title: string }[];
  ctaUrl?: string;
  ctaLabel?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  phone?: string;
  /** The tapped button or list item's id, for a `kind: "button_reply"` row. */
  buttonId?: string;
  /** Whether the tap was a reply button or a list item, for a `kind: "button_reply"` row. */
  replyKind?: "button" | "list";
};
```

Then replace this block inside `extractFlowFromKapso`:

```ts
  // Button / list taps are plain replies — not Flow cards.
  if (
    interactiveType === "button_reply" ||
    interactiveType === "list_reply"
  ) {
    return null;
  }
```

with:

```ts
  // A patient tapping one of our reply buttons or list items. Kept distinct
  // from a real WhatsApp Flow response (nfm_reply, below) — this is what they
  // chose, not a form they filled in.
  if (interactiveType === "button_reply" || interactiveType === "list_reply") {
    const replyKind = interactiveType === "button_reply" ? "button" : "list";
    const tapped = asRecord(interactive?.[`${replyKind}_reply`]);
    const title = typeof tapped?.title === "string" ? tapped.title.trim() : "";
    const buttonId = typeof tapped?.id === "string" ? tapped.id.trim() : "";
    if (!title || !buttonId) return null;
    return { kind: "button_reply", title, buttonId, replyKind };
  }
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/whatsapp/messageMedia.test.ts`
Expected: PASS, 6 tests

- [ ] **Step 5: Typecheck and lint**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: passes

Run: `GITHUB_TOKEN=x yarn eslint src/services/whatsapp/messageMedia.ts src/services/whatsapp/messageMedia.test.ts`
Expected: no problems

- [ ] **Step 6: Commit on main**

```bash
git branch --show-current   # must print: main
git add src/services/whatsapp/messageMedia.ts src/services/whatsapp/messageMedia.test.ts
git commit -m "$(cat <<'EOF'
feat(whatsapp): capture the button or list item a patient tapped

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Pass the tap through to the client

**Files:**
- Modify: `src/features/admin/components/support/supportDummyData.ts`
- Modify: `src/features/admin/components/support/supportWhatsappMap.ts`
- Create: `src/features/admin/components/support/supportWhatsappMap.test.ts`

**Interfaces:**
- Consumes: Task 1's `MessageFlowPayload` shape (server-side; this task only affects client-side parsing of the jsonb value already stored)
- Produces:
  - `SupportMessage["flow"]` gains `buttonId?: string` and `replyKind?: "button" | "list"`
  - `parseFlow(flow: unknown): SupportMessage["flow"]` passes both through when present and correctly typed, and omits them otherwise (same pattern as every other field in this function)

- [ ] **Step 1: Write the failing test**

Create `src/features/admin/components/support/supportWhatsappMap.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { parseFlow } from "./supportWhatsappMap.ts";

describe("parseFlow button taps", () => {
  it("passes buttonId and replyKind through for a button_reply flow", () => {
    const flow = parseFlow({ kind: "button_reply", title: "Confirm", buttonId: "qr_visit_1", replyKind: "button" });
    assert.deepEqual(flow, { kind: "button_reply", title: "Confirm", buttonId: "qr_visit_1", replyKind: "button" });
  });

  it("passes them through for a list tap too", () => {
    const flow = parseFlow({ kind: "button_reply", title: "Cleaning", buttonId: "row-3", replyKind: "list" });
    assert.equal(flow?.replyKind, "list");
    assert.equal(flow?.buttonId, "row-3");
  });

  it("omits buttonId and replyKind when they are absent", () => {
    const flow = parseFlow({ kind: "location", title: "Clinic" });
    assert.equal(flow?.buttonId, undefined);
    assert.equal(flow?.replyKind, undefined);
  });

  it("omits them when they are the wrong type", () => {
    const flow = parseFlow({ kind: "button_reply", title: "Confirm", buttonId: 5, replyKind: "phone" });
    assert.equal(flow?.buttonId, undefined);
    assert.equal(flow?.replyKind, undefined);
  });

  it("still returns null for a non-object value", () => {
    assert.equal(parseFlow(null), null);
    assert.equal(parseFlow("x"), null);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/components/support/supportWhatsappMap.test.ts`
Expected: FAIL. `parseFlow` is not exported, and once exported the first three tests fail because `buttonId`/`replyKind` are dropped.

- [ ] **Step 3: Implement**

In `src/features/admin/components/support/supportDummyData.ts`, find the `flow?:` block (the one with `kind?: string; title?: string; …`) and replace:

```ts
  flow?: {
    kind?: string;
    title?: string;
    subtitle?: string;
    cta?: string;
    fields?: string[];
    buttons?: { id: string; title: string }[];
    ctaUrl?: string;
    ctaLabel?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    phone?: string;
  } | null;
```

with:

```ts
  flow?: {
    kind?: string;
    title?: string;
    subtitle?: string;
    cta?: string;
    fields?: string[];
    buttons?: { id: string; title: string }[];
    ctaUrl?: string;
    ctaLabel?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    phone?: string;
    /** The tapped button or list item's id, for a "button_reply" flow. */
    buttonId?: string;
    /** Whether a "button_reply" flow was a reply button or a list item. */
    replyKind?: "button" | "list";
  } | null;
```

In `src/features/admin/components/support/supportWhatsappMap.ts`, add `export` to the function (it is currently private to the module) and pass the two new fields through. Replace:

```ts
function parseFlow(flow: unknown): SupportMessage["flow"] {
  if (!flow || typeof flow !== "object" || Array.isArray(flow)) return null;
  const f = flow as Record<string, unknown>;
  const buttonsRaw = Array.isArray(f.buttons) ? f.buttons : [];
  const buttons = buttonsRaw
    .map((b) => {
      if (!b || typeof b !== "object") return null;
      const row = b as Record<string, unknown>;
      if (typeof row.id !== "string" || typeof row.title !== "string") {
        return null;
      }
      return { id: row.id, title: row.title };
    })
    .filter(Boolean) as { id: string; title: string }[];
  return {
    kind: typeof f.kind === "string" ? f.kind : undefined,
    title: typeof f.title === "string" ? f.title : undefined,
    subtitle: typeof f.subtitle === "string" ? f.subtitle : undefined,
    cta: typeof f.cta === "string" ? f.cta : undefined,
    fields: Array.isArray(f.fields)
      ? f.fields.filter((x): x is string => typeof x === "string")
      : undefined,
    buttons: buttons.length ? buttons : undefined,
    ctaUrl: typeof f.ctaUrl === "string" ? f.ctaUrl : undefined,
    ctaLabel: typeof f.ctaLabel === "string" ? f.ctaLabel : undefined,
    latitude: typeof f.latitude === "number" ? f.latitude : undefined,
    longitude: typeof f.longitude === "number" ? f.longitude : undefined,
    address: typeof f.address === "string" ? f.address : undefined,
    phone: typeof f.phone === "string" ? f.phone : undefined,
  };
}
```

with:

```ts
export function parseFlow(flow: unknown): SupportMessage["flow"] {
  if (!flow || typeof flow !== "object" || Array.isArray(flow)) return null;
  const f = flow as Record<string, unknown>;
  const buttonsRaw = Array.isArray(f.buttons) ? f.buttons : [];
  const buttons = buttonsRaw
    .map((b) => {
      if (!b || typeof b !== "object") return null;
      const row = b as Record<string, unknown>;
      if (typeof row.id !== "string" || typeof row.title !== "string") {
        return null;
      }
      return { id: row.id, title: row.title };
    })
    .filter(Boolean) as { id: string; title: string }[];
  const replyKind = f.replyKind === "button" || f.replyKind === "list" ? f.replyKind : undefined;
  return {
    kind: typeof f.kind === "string" ? f.kind : undefined,
    title: typeof f.title === "string" ? f.title : undefined,
    subtitle: typeof f.subtitle === "string" ? f.subtitle : undefined,
    cta: typeof f.cta === "string" ? f.cta : undefined,
    fields: Array.isArray(f.fields)
      ? f.fields.filter((x): x is string => typeof x === "string")
      : undefined,
    buttons: buttons.length ? buttons : undefined,
    ctaUrl: typeof f.ctaUrl === "string" ? f.ctaUrl : undefined,
    ctaLabel: typeof f.ctaLabel === "string" ? f.ctaLabel : undefined,
    latitude: typeof f.latitude === "number" ? f.latitude : undefined,
    longitude: typeof f.longitude === "number" ? f.longitude : undefined,
    address: typeof f.address === "string" ? f.address : undefined,
    phone: typeof f.phone === "string" ? f.phone : undefined,
    buttonId: typeof f.buttonId === "string" ? f.buttonId : undefined,
    replyKind,
  };
}
```

`parseFlow` is called once already, at `flow: parseFlow(m.flow),` inside this same file — that call site needs no change.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/components/support/supportWhatsappMap.test.ts`
Expected: PASS, 5 tests

- [ ] **Step 5: Typecheck and lint**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: passes

Run: `GITHUB_TOKEN=x yarn eslint src/features/admin/components/support/supportDummyData.ts src/features/admin/components/support/supportWhatsappMap.ts src/features/admin/components/support/supportWhatsappMap.test.ts`
Expected: no problems

- [ ] **Step 6: Commit on main**

```bash
git branch --show-current   # must print: main
git add src/features/admin/components/support/supportDummyData.ts src/features/admin/components/support/supportWhatsappMap.ts src/features/admin/components/support/supportWhatsappMap.test.ts
git commit -m "$(cat <<'EOF'
feat(whatsapp): pass a tapped button's id and kind to the chat UI

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Render the tap as a distinct chip

**Files:**
- Modify: `src/lib/i18n/messages/admin/en.ts`
- Modify: `src/lib/i18n/messages/admin/ar.ts`
- Create: `src/features/admin/components/support/chat/TapReplyChip.tsx`
- Modify: `src/features/admin/components/support/chat/ChatMessageBubble.tsx`

**Interfaces:**
- Consumes: Task 2's `SupportMessage["flow"]` shape (`kind: "button_reply"`, `title`, `buttonId`, `replyKind`)
- Produces: `TapReplyChip({ flow: NonNullable<SupportMessage["flow"]> })`, a small pill rendered by `ChatMessageBubble` instead of the plain body paragraph for a tap row

There are no component-level unit tests in this codebase (no DOM test runner is configured). This task is verified by typecheck, per-file lint, a local-env build, and Task 4's e2e test, which is the same pattern used for the equivalent UI-only pieces in the earlier Quick reply buttons plan.

- [ ] **Step 1: Add the translation key**

In `src/lib/i18n/messages/admin/en.ts`, directly after the line `  "admin.frontDesk.tapDetails": "Tap below for more details:",`, insert:

```ts
  "admin.frontDesk.tappedButton": "Tapped",
```

In `src/lib/i18n/messages/admin/ar.ts`, directly after the line `  "admin.frontDesk.tapDetails": "اضغط أدناه للمزيد من التفاصيل:",`, insert:

```ts
  "admin.frontDesk.tappedButton": "تم اختيار",
```

- [ ] **Step 2: Create the chip**

Create `src/features/admin/components/support/chat/TapReplyChip.tsx`:

```tsx
"use client";

import { MousePointerClick } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import type { SupportMessage } from "../supportDummyData";

type Props = {
  flow: NonNullable<SupportMessage["flow"]>;
};

/**
 * What a patient tapped — a reply button or a list item — shown as a small
 * pill distinct from a normal message bubble, so it reads as a choice they
 * made rather than something they typed.
 */
export function TapReplyChip({ flow }: Props) {
  const t = useTranslations();
  const title = flow.title ?? "";
  return (
    <span
      role="status"
      aria-label={`${t("admin.frontDesk.tappedButton")} ${title}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-[#C7D2FE] bg-[#EEF2FF] px-2.5 py-1 text-xs font-medium text-[#4338CA]"
    >
      <MousePointerClick className="h-3 w-3" />
      {title}
    </span>
  );
}
```

- [ ] **Step 3: Wire it into the bubble**

In `src/features/admin/components/support/chat/ChatMessageBubble.tsx`, replace the import block:

```tsx
import { BookmarkPlus, Reply } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import { MessageMediaGrid } from "./MessageMediaGrid";
import { MessageVideo } from "./MessageVideo";
import { VoiceNotePlayer } from "./VoiceNotePlayer";
import { DocumentCard } from "./DocumentCard";
import {
  FlowMessageCard,
  type FlowBookingContext,
} from "./FlowMessageCard";
import { InteractiveOutboundCard } from "./InteractiveOutboundCard";
import { MessageStatusTicks } from "./MessageStatusTicks";
import { ReplyQuote } from "./ReplyQuote";
import { formatWhatsappText } from "./formatWhatsappText";
import { textDirection } from "./textDirection";
import type { SupportMessage } from "../supportDummyData";
import { cn } from "@/lib/utils";
```

with:

```tsx
import { BookmarkPlus, Reply } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import { MessageMediaGrid } from "./MessageMediaGrid";
import { MessageVideo } from "./MessageVideo";
import { VoiceNotePlayer } from "./VoiceNotePlayer";
import { DocumentCard } from "./DocumentCard";
import {
  FlowMessageCard,
  type FlowBookingContext,
} from "./FlowMessageCard";
import { InteractiveOutboundCard } from "./InteractiveOutboundCard";
import { MessageStatusTicks } from "./MessageStatusTicks";
import { ReplyQuote } from "./ReplyQuote";
import { TapReplyChip } from "./TapReplyChip";
import { formatWhatsappText } from "./formatWhatsappText";
import { textDirection } from "./textDirection";
import type { SupportMessage } from "../supportDummyData";
import { cn } from "@/lib/utils";
```

Replace the `hideBody` block:

```tsx
  const hideBody =
    unsupported ||
    /unsupported message|error\s*131051/i.test(m.body ?? "") ||
    m.messageType === "location" ||
    m.flow?.kind === "location" ||
    m.flow?.kind === "contacts";
```

with:

```tsx
  const hideBody =
    unsupported ||
    /unsupported message|error\s*131051/i.test(m.body ?? "") ||
    m.messageType === "location" ||
    m.flow?.kind === "location" ||
    m.flow?.kind === "contacts" ||
    m.flow?.kind === "button_reply";
```

Replace the two render checks `showFlowCard`/`showInteractive` block:

```tsx
  const showFlowCard =
    m.flow &&
    (!m.flow.kind || m.flow.kind === "flow") &&
    !isButtonOrListReplyFlow(m.flow);
  const showInteractive =
    m.flow && m.flow.kind && interactiveKinds.has(m.flow.kind);
```

with:

```tsx
  const showFlowCard =
    m.flow &&
    (!m.flow.kind || m.flow.kind === "flow") &&
    !isButtonOrListReplyFlow(m.flow);
  const showInteractive =
    m.flow && m.flow.kind && interactiveKinds.has(m.flow.kind);
  const showTapChip = m.flow && m.flow.kind === "button_reply";
```

Replace:

```tsx
          {showInteractive && m.flow ? (
            <InteractiveOutboundCard flow={m.flow} />
          ) : null}
          {showFlowCard && m.flow ? (
            <FlowMessageCard flow={m.flow} booking={booking} />
          ) : null}
```

with:

```tsx
          {showInteractive && m.flow ? (
            <InteractiveOutboundCard flow={m.flow} />
          ) : null}
          {showTapChip && m.flow ? <TapReplyChip flow={m.flow} /> : null}
          {showFlowCard && m.flow ? (
            <FlowMessageCard flow={m.flow} booking={booking} />
          ) : null}
```

- [ ] **Step 4: Typecheck and lint**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: passes

Run: `GITHUB_TOKEN=x yarn eslint src/lib/i18n/messages/admin/en.ts src/lib/i18n/messages/admin/ar.ts src/features/admin/components/support/chat/TapReplyChip.tsx src/features/admin/components/support/chat/ChatMessageBubble.tsx`
Expected: no problems

- [ ] **Step 5: Build**

Run: `bash -c 'set -a; . ./.env.e2e; set +a; GITHUB_TOKEN=x yarn build'`
Expected: succeeds

- [ ] **Step 6: Commit on main**

```bash
git branch --show-current   # must print: main
git add src/lib/i18n/messages/admin/en.ts src/lib/i18n/messages/admin/ar.ts src/features/admin/components/support/chat/TapReplyChip.tsx src/features/admin/components/support/chat/ChatMessageBubble.tsx
git commit -m "$(cat <<'EOF'
feat(whatsapp): show a tapped button as a distinct chip in the chat

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: End-to-end test

**Files:**
- Modify: `e2e/helpers/signWebhook.ts`
- Modify: `e2e/inbox.spec.ts`

**Interfaces:**
- Consumes:
  - Tasks 1–3
  - `WEBHOOK_SECRET` (`e2e/helpers/env.ts`, already imported by `signWebhook.ts`)
  - `deliverInbound`, `uniquePhone` (`e2e/helpers/inbound.ts`) — reused, not modified
  - `seedE2E`, `setAiMode`, `conversationByPhone` (`e2e/helpers/seed.ts`)
- Produces: `inboundButtonReplyEvent(input: { phone: string; buttonId: string; title: string; wamid?: string; conversationId?: string }): unknown`, following the exact shape and export style of the existing `inboundTextEvent`

- [ ] **Step 1: Add the webhook event builder**

In `e2e/helpers/signWebhook.ts`, append after `inboundTextEvent`:

```ts
/** A patient tapping a reply button we sent (not a template quick-reply button). */
export function inboundButtonReplyEvent(input: {
  phone: string;
  buttonId: string;
  title: string;
  wamid?: string;
  conversationId?: string;
}) {
  return {
    message: {
      id: input.wamid ?? `wamid.e2e.${Date.now()}.${Math.random().toString(16).slice(2)}`,
      from: input.phone,
      type: "interactive",
      interactive: {
        type: "button_reply",
        button_reply: { id: input.buttonId, title: input.title },
      },
      timestamp: String(Math.floor(Date.now() / 1000)),
      kapso: { direction: "inbound", status: "received" },
    },
    conversation: {
      id: input.conversationId,
      phone_number: input.phone,
      contact_name: "E2E Patient",
    },
  };
}
```

- [ ] **Step 2: Write the test**

Replace the whole of `e2e/inbox.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { conversationByPhone, seedE2E, setAiMode } from "./helpers/seed";
import { uniquePhone } from "./helpers/inbound";
import { inboundButtonReplyEvent, signWebhookBody } from "./helpers/signWebhook";

test.describe("admin inbox", () => {
  test("loads the front desk for a signed-in admin", async ({ page }) => {
    await seedE2E();
    await page.goto("/admin/support");
    await expect(page).toHaveURL(/\/admin\/support/);
    await expect(page.locator("body")).not.toContainText("Unauthorized");
  });

  test("keeps an admin signed in across admin pages", async ({ page }) => {
    await page.goto("/admin/reservations");
    await expect(page).not.toHaveURL(/\/admin\/login/);
  });

  test("shows a tapped reply button as a distinct chip, not plain text", async ({ page, request }) => {
    await seedE2E();
    // The responder must not reply on its own and change what the thread shows.
    await setAiMode("off");

    const phone = uniquePhone();
    const body = JSON.stringify(
      inboundButtonReplyEvent({ phone, buttonId: "qr_visit_1", title: "Confirm" }),
    );
    const res = await request.post("/api/v1/whatsapp/webhook", {
      headers: {
        "content-type": "application/json",
        "x-webhook-event": "whatsapp.message.received",
        "x-webhook-signature": signWebhookBody(body),
        "x-idempotency-key": `e2e-${Date.now()}-${Math.random()}`,
      },
      data: body,
    });
    expect(res.ok()).toBeTruthy();

    const conversation = await conversationByPhone(phone);
    expect(conversation).not.toBeNull();

    await page.goto("/admin/support");
    await page.locator(`[data-conversation-id="${conversation!.id}"]`).first().click();

    const chip = page.getByRole("status").filter({ hasText: "Confirm" });
    await expect(chip).toBeVisible();

    // The plain-text paragraph is suppressed for a tap: "Confirm" appears
    // exactly once (inside the chip), not duplicated as an ordinary bubble.
    await expect(page.getByText("Confirm", { exact: true })).toHaveCount(1);
  });
});
```

- [ ] **Step 3: Run the e2e specs on LOCAL Supabase**

Run: `lsof -nP -iTCP:3100 -sTCP:LISTEN`
Expected: no output. If something is listening, stop and report BLOCKED; don't kill it.

Run: `bash -c 'set -a; . ./.env.e2e; set +a; GITHUB_TOKEN=x yarn e2e e2e/inbox.spec.ts e2e/quick-replies.spec.ts e2e/autoreply.spec.ts --reporter=line'`
Expected: all pass — the 3 inbox tests (2 existing plus 1 new), the quick-replies tests, and the autoreply tests, plus setup.

If a new test fails, find the real cause. Never weaken or delete assertions, and never add long sleeps. A small, justified selector change in the new test is allowed; report it.

- [ ] **Step 4: Lint**

Run: `GITHUB_TOKEN=x yarn eslint e2e/helpers/signWebhook.ts e2e/inbox.spec.ts`
Expected: no problems

- [ ] **Step 5: Commit on main**

```bash
git branch --show-current   # must print: main
git add e2e/helpers/signWebhook.ts e2e/inbox.spec.ts
git commit -m "$(cat <<'EOF'
test(e2e): a tapped reply button shows as a chip, not plain text

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Final verification (controller)

The controller runs this after Task 4 and any review are clean. It is not a subagent task.

- [ ] **Step 1: Fresh verification on `main` HEAD**
  - `GITHUB_TOKEN=x yarn typecheck`: passes.
  - Tracked-files-only unit suite: `git ls-files -- 'src/**/*.test.ts' 'src/*.test.ts' | sort -u | xargs node --experimental-strip-types --import ./scripts/test-loader.mjs --test`: 0 failures, and the count is at least 1331 + 11 (6 from Task 1, 5 from Task 2) = 1342.
  - **Whole-repo lint.** Run `eslint -f json .` in a temporary detached worktree at the base commit `fedb51d` (with `node_modules` symlinked), and again at this feature's final commit. Compare problem counts by (file, severity, ruleId). Expected: no new problems. Remove both worktrees afterwards.
  - **Port and e2e.** Confirm port 3100 is free. Then run `bash -c 'set -a; . ./.env.e2e; set +a; GITHUB_TOKEN=x yarn e2e e2e/inbox.spec.ts e2e/quick-replies.spec.ts e2e/autoreply.spec.ts --reporter=line'`: all pass.
  - **Bundle host check.**
    - `grep -rlF "puibdsyokgjdvkkousil" .next/static | wc -l` → `0`
    - `grep -rlF "127.0.0.1:54321" .next/static | wc -l` → at least 1
  - **Repo state.** No tracked changes left uncommitted from this plan's files.

- [ ] **Step 2: No production step**

There is nothing to apply. The `flow` column already exists; this plan is code only. Confirm no `supabase` command was run as part of this plan (`git log` shows no new file under `supabase/migrations/`).

Never push `main` to GitHub.
