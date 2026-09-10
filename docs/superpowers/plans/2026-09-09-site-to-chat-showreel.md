# Site → Chat Showreel Scene Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline). Do **not** use subagent-driven-development — this repo forbids Task/subagent fan-out. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one continuous `site-to-chat` product scene (~24s): public booking form fill → hard cut to admin dashboard → WhatsApp float → confirm reservation.

**Architecture:** Phased React scene (`public` | `admin`) under existing showreel product demo. Public phase uses a focused booking panel with offline submit; admin phase reuses `ShowreelAdminSceneFrame` + dashboard + demo inbox. Shared Sara Hassan / Tue 10:30 / teeth whitening fixture ties form, schedule, and chat.

**Tech Stack:** Next.js App Router, TypeScript, existing showreel cursor timelines, `useShowreelPhase`, AdminShell demo inbox, node:test.

## Global Constraints

- Offline only: no Kapso, no `/api/v1/booking` writes, no Supabase mutations from demo path
- Product scene id: `site-to-chat`; slide tags: Book · Dashboard · Confirm
- Runtime scene ~22–25s; full reel stay in LinkedIn budget (adjust test upper bound if needed, target ≤160s)
- Max ~100 lines per new TS/TSX file; named exports; no `any`
- Keep existing `site` / `whatsapp` / `dashboard` slides; **add** this beat (do not replace WhatsApp workspace flow)
- Do not launch Task/subagents

---

## File map

| File | Responsibility |
|------|----------------|
| `fixtures/siteToChatFixtures.ts` | Shared patient/slot/copy for form + chat + confirm |
| `showreelProductRoute.ts` + `showreelSlideTypes.ts` | Register `site-to-chat` |
| `showreelCursorTimeline.ts` | Cursor steps for both phases |
| `ShowreelPublicBookingPanel.tsx` | Public-phase UI + offline submit |
| `buildShowreelSiteToChatInbox.ts` | Demo inbox with website-booking inbound |
| `SiteToChatScene.tsx` | Phase cut + wire panels |
| `ShowreelProductDemo.tsx` | Switch case |
| `showreelSlideData.ts` | New feature slide after `site` |
| Tests | Route, timeline ids, slide order/runtime, fixture asserts |

---

### Task 1: Shared fixture + route type (TDD)

**Files:**
- Create: `src/features/portfolio/showreel/product-scenes/fixtures/siteToChatFixtures.ts`
- Modify: `src/features/portfolio/showreel/product-scenes/fixtures/index.ts`
- Modify: `src/features/portfolio/showreel/product-scenes/fixtures/showreelFixtures.test.ts`
- Modify: `src/features/portfolio/showreel/showreelSlideTypes.ts`
- Modify: `src/features/portfolio/showreel/showreelProductRoute.ts`
- Modify: `src/features/portfolio/showreel/showreelProductRoute.test.ts`

**Interfaces:**
- Produces: `SITE_TO_CHAT_FIXTURE` with `patientName`, `phone`, `email`, `serviceId`, `serviceLabel`, `slotLabel`, `inboundBody`, `confirmBody`
- Produces: `ShowreelProductScene` includes `"site-to-chat"`

- [ ] **Step 1: Write failing fixture + route tests**

Add to `showreelFixtures.test.ts`:

```ts
import { SITE_TO_CHAT_FIXTURE } from "./index.ts";

test("site-to-chat fixture aligns Sara / whitening / Tue 10:30", () => {
  assert.equal(SITE_TO_CHAT_FIXTURE.patientName, "Sara Hassan");
  assert.match(SITE_TO_CHAT_FIXTURE.slotLabel, /Tue 10:30/);
  assert.match(SITE_TO_CHAT_FIXTURE.serviceLabel, /whitening/i);
  assert.ok(SITE_TO_CHAT_FIXTURE.inboundBody.includes("website"));
  assert.ok(SITE_TO_CHAT_FIXTURE.confirmBody.includes("10:30"));
});
```

Add to `showreelProductRoute.test.ts`:

```ts
assert.equal(parseShowreelProductScene("site-to-chat"), "site-to-chat");
assert.equal(isShowreelProductScene("site-to-chat"), true);
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
GITHUB_TOKEN=dummy node --experimental-strip-types --import ./scripts/test-loader.mjs --test \
  src/features/portfolio/showreel/product-scenes/fixtures/showreelFixtures.test.ts \
  src/features/portfolio/showreel/showreelProductRoute.test.ts
```

Expected: FAIL — `SITE_TO_CHAT_FIXTURE` missing / scene not in union.

- [ ] **Step 3: Implement fixture + route**

`siteToChatFixtures.ts`:

```ts
import { DEMO_CONV } from "./demoIds";

/** Shared identity for public booking → dashboard → WhatsApp confirm. */
export const SITE_TO_CHAT_FIXTURE = {
  conversationId: DEMO_CONV.sara,
  patientName: "Sara Hassan",
  phone: "+201000000001", // match Sara demo phone if different — copy from whatsappConversations
  email: "sara@example.com",
  serviceId: "svc-whitening",
  serviceLabel: "Teeth whitening",
  slotLabel: "Tue 10:30",
  slotDayValue: "", // set to a fixed YYYY-MM-DD used by demo slots
  slotId: "slot-site-tue-1030",
  inboundBody:
    "I just booked Teeth whitening for Tue 10:30 on the website.",
  confirmBody:
    "You're confirmed for Tue 10:30 — Teeth whitening. See you then!",
} as const;
```

Before shipping Step 3, open `whatsappConversations.ts` and copy Sara’s real `phone` into the fixture (do not invent a mismatched number).

Update `index.ts` export. Add `"site-to-chat"` to `ShowreelProductScene` and `PRODUCT_SCENES`.

- [ ] **Step 4: Run tests — expect PASS**

Same command as Step 2. Expected: PASS.

- [ ] **Step 5: Commit** (only if user asked for commits; otherwise skip)

```bash
git add src/features/portfolio/showreel/product-scenes/fixtures \
  src/features/portfolio/showreel/showreelSlideTypes.ts \
  src/features/portfolio/showreel/showreelProductRoute.ts \
  src/features/portfolio/showreel/showreelProductRoute.test.ts
git commit -m "$(cat <<'EOF'
feat: add site-to-chat showreel fixture and route

EOF
)"
```

---

### Task 2: Cursor timeline for site-to-chat

**Files:**
- Modify: `src/features/portfolio/showreel/product-scenes/showreelCursorTimeline.ts`
- Modify: `src/features/portfolio/showreel/product-scenes/buildShowreelDashboardProps.test.ts`

**Interfaces:**
- Produces: `SHOWREEL_SITE_TO_CHAT_CURSOR_STEPS: ShowreelCursorStep[]`
- Step ids (exact):  
  `scroll-booking`, `fill-name`, `fill-phone`, `fill-service`, `pick-slot`, `submit-booking`, `wait-success`, `hold-dashboard`, `open-whatsapp`, `wait-whatsapp`, `send-confirm`, `hold-confirmed`

**Timing sketch (ms, scene active=0):**

| id | at | notes |
|----|-----|-------|
| scroll-booking | 400 | scrollSelector `#booking-form` or `[data-showreel-action="booking-form"]` |
| fill-name | 1200 | dispatch fill |
| fill-phone | 2400 | dispatch fill |
| fill-service | 3600 | dispatch fill |
| pick-slot | 5000 | click slot |
| submit-booking | 6500 | click submit |
| wait-success | 7800 | waitForSelector success |
| hold-dashboard | 10500 | after phase cut — selector schedule appt |
| open-whatsapp | 12500 | click open-front-desk or chat-fab |
| wait-whatsapp | 14000 | whatsapp-panel visible |
| send-confirm | 16500 | click send + dispatch confirm |
| hold-confirmed | 20000 | panel hold |

- [ ] **Step 1: Write failing test for step ids**

In `buildShowreelDashboardProps.test.ts` import `SHOWREEL_SITE_TO_CHAT_CURSOR_STEPS` and assert:

```ts
assert.deepEqual(showreelCursorStepIds(SHOWREEL_SITE_TO_CHAT_CURSOR_STEPS), [
  "scroll-booking",
  "fill-name",
  "fill-phone",
  "fill-service",
  "pick-slot",
  "submit-booking",
  "wait-success",
  "hold-dashboard",
  "open-whatsapp",
  "wait-whatsapp",
  "send-confirm",
  "hold-confirmed",
]);
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
GITHUB_TOKEN=dummy node --experimental-strip-types --import ./scripts/test-loader.mjs --test \
  src/features/portfolio/showreel/product-scenes/buildShowreelDashboardProps.test.ts
```

- [ ] **Step 3: Implement `SHOWREEL_SITE_TO_CHAT_CURSOR_STEPS`**

Use `dispatch` with name `showreel-site-to-chat` and details:

```ts
{ type: "fill"; field: "name" | "phone" | "service" | "slot" }
{ type: "submit" }
{ type: "confirm" }
```

Clicks:

- `[data-showreel-action="booking-submit"]`
- `[data-showreel-action="booking-slot"]` (or fixture slot id)
- `[data-showreel-action="open-front-desk"]` or `chat-fab`
- `[data-showreel-action="whatsapp-send"]` for confirm (paired with confirm dispatch that appends `confirmBody`)

Keep file under control: if `showreelCursorTimeline.ts` grows past ~400 lines, split site-to-chat steps into `showreelSiteToChatTimeline.ts` and re-export.

- [ ] **Step 4: Run test — expect PASS**

- [ ] **Step 5: Commit** (if user requested)

---

### Task 3: Public booking panel (offline)

**Files:**
- Create: `src/features/portfolio/showreel/product-scenes/ShowreelPublicBookingPanel.tsx`
- Create: `src/features/portfolio/showreel/product-scenes/showreelSiteToChatEvents.ts`
- Optional touch: none on live `BookingForm` if panel is self-contained (preferred — avoids bloating 300-line form)

**Interfaces:**
- Produces: `SHOWREEL_SITE_TO_CHAT_EVENT = "showreel-site-to-chat"`
- Produces: `ShowreelSiteToChatDetail` union matching cursor dispatches
- Produces: `ShowreelPublicBookingPanel({ active: boolean })` — clinic-branded booking UI with:
  - `data-showreel-action="booking-form"`
  - inputs: `booking-name`, `booking-phone`, `booking-service`, `booking-slot`, `booking-submit`
  - success: `booking-success`
- On fill/submit events, update controlled fields from `SITE_TO_CHAT_FIXTURE`; submit sets success locally (no fetch)

- [ ] **Step 1: Implement events module (~40 lines)**

```ts
export const SHOWREEL_SITE_TO_CHAT_EVENT = "showreel-site-to-chat";

export type ShowreelSiteToChatDetail =
  | { type: "fill"; field: "name" | "phone" | "service" | "slot" }
  | { type: "submit" }
  | { type: "confirm" };
```

- [ ] **Step 2: Implement `ShowreelPublicBookingPanel`**

Layout: white page, “The Dental Lounge” header strip, form titled like public booking, fixture service option + one slot button labeled `SITE_TO_CHAT_FIXTURE.slotLabel`. Listen for `SHOWREEL_SITE_TO_CHAT_EVENT` while `active`. Visual language should match dental public site (navy text, rounded inputs) — no purple AI chrome.

- [ ] **Step 3: Manual smoke** — open `/showreel/demo?mode=product&scene=site-to-chat` later after Task 4; for now unit not required beyond types compiling.

- [ ] **Step 4: Commit** (if user requested)

---

### Task 4: Admin inbox builder + SiteToChatScene

**Files:**
- Create: `src/features/portfolio/showreel/product-scenes/buildShowreelSiteToChatInbox.ts`
- Create: `src/features/portfolio/showreel/product-scenes/SiteToChatScene.tsx`
- Modify: `src/features/portfolio/showreel/product-scenes/ShowreelProductDemo.tsx`
- Modify: `src/features/admin/components/support/SupportInboxView.tsx` **only if** demo confirm needs the same local send path WhatsApp scene already uses — prefer dispatch that appends message via existing demo inbox clone pattern in `buildShowreelDemoInbox` / scene-local state

**Interfaces:**
- Consumes: `SITE_TO_CHAT_FIXTURE`, `SHOWREEL_SITE_TO_CHAT_CURSOR_STEPS`, `ShowreelAdminSceneFrame`, `ClinicDashboard`, `buildShowreelDashboardProps`
- Produces: `SiteToChatScene({ active: boolean })`
- Phase clock:

```ts
const PHASE_STEPS = [{ id: "admin" as const, at: 10000 }];
const phase = useShowreelPhase(active, "public", PHASE_STEPS);
```

- Inbox: Sara selected; last inbound = `inboundBody`; on `confirm` detail, append outbound `confirmBody` to cloned `messagesById` (same pattern as Smart UX demo send persistence)

- [ ] **Step 1: Implement `buildShowreelSiteToChatInbox`**

Clone from `buildShowreelDemoInbox` / WhatsApp `buildInbox`, force `forcedSelectedId: SITE_TO_CHAT_FIXTURE.conversationId`, ensure unread optional cleared when opening, seed inbound website booking message at end of Sara thread.

- [ ] **Step 2: Implement `SiteToChatScene`**

```tsx
export function SiteToChatScene({ active }: { active: boolean }) {
  const phase = useShowreelPhase(active, "public", [{ id: "admin", at: 10000 }]);
  // public: ShowreelPublicBookingPanel
  // admin: ShowreelAdminSceneFrame forceChatLayout float, demoInbox, cursorSteps, ClinicDashboard demoMode
  // Listen confirm → append message
}
```

Hard cut: `{phase === "public" ? <Public…/> : <Admin…/>}` — no crossfade.

Wire `ShowreelProductDemo` case `"site-to-chat"`.

Ensure schedule already shows Sara / whitening (existing `RESERVATION_FIXTURES`); if not pending for today, add/adjust one fixture row in Task 1 fixture file or `reservationFixtures` so `hold-dashboard` has `[data-showreel-action="schedule-appointment"]` for Sara — verify id in fixtures.

- [ ] **Step 3: Run route + timeline tests again — PASS**

- [ ] **Step 4: Commit** (if user requested)

---

### Task 5: Slide data + runtime budget

**Files:**
- Modify: `src/features/portfolio/showreel/showreelSlideData.ts`
- Modify: `src/features/portfolio/showreel/showreelSlides.test.ts`

**Interfaces:**
- Produces: feature slide `id: "site-to-chat"` after `"site"`, `durationMs: 24000`, `productScene: "site-to-chat"`, tags `["Book", "Dashboard", "Confirm"]`

- [ ] **Step 1: Update failing order test**

```ts
assert.deepEqual(ids, [
  "intro",
  "site",
  "site-to-chat",
  "ai-booking",
  "whatsapp",
  "clinical-ai",
  "smart-ux",
  "dashboard",
  "customize",
  "outro",
]);
const totalMs = SHOWREEL_SLIDES.reduce((sum, s) => sum + s.durationMs, 0);
assert.ok(totalMs >= 110_000 && totalMs <= 160_000, `runtime ${totalMs}`);
```

Also assert device id `site-to-chat:desktop` in ready-tracking test if needed.

- [ ] **Step 2: Run — expect FAIL on order**

- [ ] **Step 3: Insert FEATURE slide in `showreelSlideData.ts`**

```ts
FEATURE(
  "site-to-chat",
  "Website booking",
  "From site to chat",
  "Customer books on the public site — then front desk confirms on WhatsApp.",
  ["Book", "Dashboard", "Confirm"],
  {
    durationMs: 24000,
    desktopSrc: PRODUCT("site-to-chat"),
    productScene: "site-to-chat",
  },
),
```

Place immediately after the `site` FEATURE block.

- [ ] **Step 4: Run slides test — expect PASS**

```bash
GITHUB_TOKEN=dummy node --experimental-strip-types --import ./scripts/test-loader.mjs --test \
  src/features/portfolio/showreel/showreelSlides.test.ts
```

- [ ] **Step 5: Commit** (if user requested)

---

### Task 6: Verification

**Files:** none new

- [ ] **Step 1: Run focused showreel tests**

```bash
GITHUB_TOKEN=dummy node --experimental-strip-types --import ./scripts/test-loader.mjs --test \
  src/features/portfolio/showreel/showreelProductRoute.test.ts \
  src/features/portfolio/showreel/showreelSlides.test.ts \
  src/features/portfolio/showreel/product-scenes/fixtures/showreelFixtures.test.ts \
  src/features/portfolio/showreel/product-scenes/buildShowreelDashboardProps.test.ts
```

Expected: all PASS.

- [ ] **Step 2: Manual preview**

Open: `/showreel/demo?mode=product&scene=site-to-chat`

Confirm: form fills → success → cut to dashboard → WhatsApp opens → confirmation text appears. No network booking POST.

- [ ] **Step 3: Clear `todo.md` when done**

---

## Spec coverage check

| Spec requirement | Task |
|------------------|------|
| Public form fill with entered data | 3, 2 |
| Offline submit success | 3 |
| Hard cut to dashboard | 4 |
| Matching schedule patient | 4 (+ fixture) |
| Open WhatsApp float | 2, 4 |
| Confirm reservation message | 2, 4 |
| Shared Sara / whitening / Tue 10:30 | 1 |
| Route `site-to-chat` | 1, 4 |
| Slide ~22–25s + tags | 5 |
| Keep other slides | 5 |
| Tests | 1, 2, 5, 6 |

## Out of scope (do not implement)

Alternate slots, book card, clinical workspace, customize, dual-iframe crossfade, closing chat, real API writes.
