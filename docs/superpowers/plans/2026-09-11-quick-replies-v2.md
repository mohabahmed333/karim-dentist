# Quick Replies v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use haac-core:subagent-driven-development (recommended) or haac-core:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** WhatsApp quick replies gain four things:
- Fill-in fields completed from the patient and clinic
- Attachments
- Categories, with the most-used replies listed first
- A management page, plus "Save as quick reply" from a chat

**Architecture:**
- **Fields:** a pure module parses `{{field}}` markers. A small admin endpoint looks up this conversation's values, reusing the AI pipeline's reservation query, which moves into a shared function. The composer fills the fields in when a reply is chosen, and blocks sending while any known marker remains.
- **Attachments:** files live in a private Supabase bucket. On send, the composer downloads the file and hands it to the existing multipart send path, so the text goes out as the caption.

**Tech Stack:** Next.js 16.3 (App Router), Supabase (Postgres, RLS, Storage), zod 4, React 19, `node:test` unit tests (`scripts/test.sh`), Playwright e2e (`E2E_FAKE_KAPSO=1`, `E2E_FAKE_GROQ=1`).

**Spec:** [docs/superpowers/specs/2026-09-11-quick-replies-v2-design.md](../specs/2026-09-11-quick-replies-v2-design.md)

## Global Constraints

- **Fill-in fields:** exactly `name`, `next_appointment`, `appointment_service`, `clinic_address`, `clinic_phone`, `clinic_hours`, `maps_link`.
- **Unfilled fields:** a known field with no value stays in the text as `{{field}}`, and Send is disabled (Enter ignored) while any known `{{field}}` remains.
- **Unknown fields:** a `{{field}}` that isn't in the list is rejected on save (HTTP 400).
- **Attachments:**
  - `null`, or `{kind:'image'|'document', path, mime, name, size}`, or `{kind:'location'}`
  - Images are `image/jpeg` or `image/png`; documents are `application/pdf`
  - Maximum size is 4 MB (`QUICK_REPLY_MAX_FILE_BYTES`)
  - Files go in the private bucket `whatsapp-quick-replies`
- **Caption limit:** 1024 characters. Longer text is sent first as its own message, then the file with no caption.
- **Menu order:** `use_count` descending, then `sort_order` ascending.
- **Duplicate slash key:** HTTP 409 with `code: "SLASH_KEY_TAKEN"`.
- **Migration file name:** `20260911190000_whatsapp_quick_replies_v2.sql` (the latest existing migration is `20260911180000`).
- **Every admin route:** starts with `requireAdmin()` and returns `auth.error` when it is set.
- **Git:** no Jira key (the user said "No ticket yet"). The branch is `feat/quick-replies-v2`. Commit messages follow the repo style `feat(whatsapp): …` and end with the `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>` trailer.
- **yarn:** commands need `GITHUB_TOKEN=x` in front, otherwise yarn fails to parse its config. Single unit test files run directly with `node --experimental-strip-types --import ./scripts/test-loader.mjs --test <file>`.
- **Unit tests** live next to the source as `*.test.ts`. They import the module under test with a `.ts` extension, preceded by `// @ts-expect-error -- Node strip-types needs the extension.`
- **PR boundaries:** Phase 1 (Tasks 1–6), Phase 2 (Tasks 7–8), Phase 3 (Tasks 9–11), Phase 4 (Tasks 12–13). Each phase is one PR under ~400 changed lines. Start each later phase on a new branch cut from the previous one: `feat/quick-replies-v2-page`, `feat/quick-replies-v2-composer`, `feat/quick-replies-v2-save`.

## File map

| File | Status | Responsibility |
|---|---|---|
| `src/services/whatsapp/quickReplyFields.ts` | new | Field list; fill in, find unfilled and find unknown fields (pure) |
| `src/services/whatsapp_ai/formatClinicHours.ts` | modify | Export `collapseWeekdays` for reuse |
| `src/services/whatsapp/quickReplyValues.ts` | new | Build field values from loaded rows; patient-facing hours in AR/EN (pure) |
| `src/services/reservations/upcomingReservations.ts` | new | `loadUpcomingReservations(db, phone, limit)`, shared by the AI bot and quick replies |
| `src/services/whatsapp_ai/processJob.ts` | modify | Use `loadUpcomingReservations` |
| `supabase/migrations/20260911190000_whatsapp_quick_replies_v2.sql` | new | Columns, RPC, bucket, seed categories |
| `src/lib/supabase/database.types.ts` | modify | New columns and RPC |
| `src/services/whatsapp/cannedReplyInput.ts` | new | zod create/update schemas, attachment schema, bucket constants |
| `src/services/whatsapp/cannedReplies.ts` | modify | Create, update, record use, delete (plus attachment file cleanup) |
| `src/services/whatsapp/quickReplyContext.ts` | new | Load one conversation's field values from the database |
| `src/app/api/v1/whatsapp/canned-replies/route.ts` | modify | POST uses the schema; 409 on a duplicate key |
| `src/app/api/v1/whatsapp/canned-replies/[id]/route.ts` | new | PATCH |
| `src/app/api/v1/whatsapp/canned-replies/[id]/use/route.ts` | new | POST (usage counter) |
| `src/app/api/v1/whatsapp/canned-replies/context/route.ts` | new | GET field values |
| `src/lib/i18n/messages/admin/en.ts`, `ar.ts` | modify | New text; remove the unused panel text |
| `src/features/admin/lib/adminNav.ts` | modify | Page label |
| `src/features/admin/components/quick-replies/*` | new | Management page UI and API client |
| `src/app/(internal)/admin/(dashboard)/quick-replies/page.tsx` | new | Server page |
| `src/features/admin/components/support/chat/CannedRepliesPanel.tsx` | delete | Never rendered |
| `src/features/admin/components/support/chat/quickReplyMenu.ts` | new | Menu sort and match (pure) |
| `src/features/admin/components/support/chat/SlashCommandMenu.tsx` | modify | Ranking, category badge, attachment icon, Manage link |
| `src/features/admin/components/support/chat/quickReplySend.ts` | new | Turn text plus attachment into ordered send steps (pure) |
| `src/features/admin/components/support/chat/useQuickReplyValues.ts` | new | Fetch field values, with a short cache |
| `src/features/admin/components/support/chat/QuickReplyComposerBar.tsx` | new | Unfilled-field warning and attachment chip |
| `src/features/admin/components/support/chat/ChatComposer.tsx` | modify | Fill in fields, block send, send attachments |
| `src/features/admin/components/support/SupportChatColumn.tsx`, `SupportInboxView.tsx` | modify | `onSend` may return a promise; save-from-chat dialog |
| `src/features/admin/components/support/chat/quickReplyFromMessage.ts` | new | Turn a message into a create payload (pure) |
| `src/features/admin/components/support/chat/SaveQuickReplyDialog.tsx` | new | Save dialog |
| `src/features/admin/components/support/chat/ChatMessageBubble.tsx` | modify | "Save as quick reply" button |
| `e2e/helpers/inbound.ts` | new | `uniquePhone` and `deliverInbound`, moved out of `autoreply.spec.ts` |
| `e2e/quick-replies.spec.ts` | new | End-to-end flow |

---

# Phase 1: Database and backend (PR 1)

### Task 1: Fill-in field parsing

**Files:**
- Create: `src/services/whatsapp/quickReplyFields.ts`
- Test: `src/services/whatsapp/quickReplyFields.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `QUICK_REPLY_FIELDS: readonly QuickReplyField[]`
  - `type QuickReplyField`
  - `type QuickReplyValues = Partial<Record<QuickReplyField, string>>`
  - `isQuickReplyField(key: string): key is QuickReplyField`
  - `renderQuickReply(body: string, values: QuickReplyValues): { text: string; missing: QuickReplyField[] }`
  - `findUnfilledFields(text: string): QuickReplyField[]`
  - `findUnknownFields(body: string): string[]`

- [ ] **Step 1: Write the failing test**

Create `src/services/whatsapp/quickReplyFields.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { findUnfilledFields, findUnknownFields, renderQuickReply } from "./quickReplyFields.ts";

describe("renderQuickReply", () => {
  it("fills every known field that has a value", () => {
    const out = renderQuickReply("Hi {{name}}, see you {{next_appointment}}.", {
      name: "Mona",
      next_appointment: "Tuesday 10:00",
    });
    assert.equal(out.text, "Hi Mona, see you Tuesday 10:00.");
    assert.deepEqual(out.missing, []);
  });

  it("leaves a field with no value in place and reports it", () => {
    // A half-filled message must stay visibly unfinished, never silently blank.
    const out = renderQuickReply("Hi {{name}}, see you {{next_appointment}}.", { name: "Mona" });
    assert.equal(out.text, "Hi Mona, see you {{next_appointment}}.");
    assert.deepEqual(out.missing, ["next_appointment"]);
  });

  it("treats a blank value as missing", () => {
    assert.deepEqual(renderQuickReply("{{name}}", { name: "   " }).missing, ["name"]);
  });

  it("tolerates spaces inside the braces", () => {
    assert.equal(renderQuickReply("Hi {{ name }}", { name: "Mona" }).text, "Hi Mona");
  });

  it("leaves unknown braces untouched and does not report them", () => {
    const out = renderQuickReply("Use {{coupon}}", {});
    assert.equal(out.text, "Use {{coupon}}");
    assert.deepEqual(out.missing, []);
  });

  it("reports a repeated missing field once", () => {
    assert.deepEqual(renderQuickReply("{{name}} {{name}}", {}).missing, ["name"]);
  });
});

describe("findUnfilledFields", () => {
  it("finds known fields still in the text, including ones staff typed", () => {
    assert.deepEqual(findUnfilledFields("Hi {{name}}, {{ clinic_hours }} {{coupon}}"), [
      "name",
      "clinic_hours",
    ]);
  });

  it("returns nothing for plain text", () => {
    assert.deepEqual(findUnfilledFields("Hi Mona, see you Tuesday."), []);
  });
});

describe("findUnknownFields", () => {
  it("names the fields the composer could never fill", () => {
    assert.deepEqual(findUnknownFields("Hi {{nmae}} at {{clinic_address}}"), ["nmae"]);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/whatsapp/quickReplyFields.test.ts`
Expected: FAIL with `Cannot find module '.../quickReplyFields.ts'`

- [ ] **Step 3: Write the minimal implementation**

Create `src/services/whatsapp/quickReplyFields.ts`:

```ts
/**
 * Fill-in fields for WhatsApp quick replies: `{{name}}`, `{{next_appointment}}`…
 *
 * Only the fields listed here are recognised. A known field with no value is
 * left in the text as-is, and the composer refuses to send while one remains:
 * a half-filled "see you on {{next_appointment}}" must never reach a patient.
 * Anything else in braces is ordinary text to the composer, but the editor
 * rejects it on save, so a typo like {{nmae}} is caught before anyone uses it.
 */
export const QUICK_REPLY_FIELDS = [
  "name",
  "next_appointment",
  "appointment_service",
  "clinic_address",
  "clinic_phone",
  "clinic_hours",
  "maps_link",
] as const;

export type QuickReplyField = (typeof QUICK_REPLY_FIELDS)[number];
export type QuickReplyValues = Partial<Record<QuickReplyField, string>>;

const TOKEN = /\{\{\s*([a-zA-Z_]+)\s*\}\}/g;

export function isQuickReplyField(key: string): key is QuickReplyField {
  return (QUICK_REPLY_FIELDS as readonly string[]).includes(key);
}

export function renderQuickReply(
  body: string,
  values: QuickReplyValues,
): { text: string; missing: QuickReplyField[] } {
  const missing = new Set<QuickReplyField>();
  const text = body.replace(TOKEN, (match, key: string) => {
    if (!isQuickReplyField(key)) return match;
    const value = values[key]?.trim();
    if (value) return value;
    missing.add(key);
    return `{{${key}}}`;
  });
  return { text, missing: [...missing] };
}

export function findUnfilledFields(text: string): QuickReplyField[] {
  const found = new Set<QuickReplyField>();
  for (const match of text.matchAll(TOKEN)) {
    if (isQuickReplyField(match[1])) found.add(match[1]);
  }
  return [...found];
}

export function findUnknownFields(body: string): string[] {
  const found = new Set<string>();
  for (const match of body.matchAll(TOKEN)) {
    if (!isQuickReplyField(match[1])) found.add(match[1]);
  }
  return [...found];
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/whatsapp/quickReplyFields.test.ts`
Expected: PASS, 9 tests

- [ ] **Step 5: Commit**

```bash
git add src/services/whatsapp/quickReplyFields.ts src/services/whatsapp/quickReplyFields.test.ts
git commit -m "$(cat <<'EOF'
feat(whatsapp): parse fill-in fields in quick replies

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Field values from patient and clinic data

**Files:**
- Modify: `src/services/whatsapp_ai/formatClinicHours.ts`
- Modify: `src/services/whatsapp_ai/formatClinicHours.test.ts`
- Create: `src/services/whatsapp/quickReplyValues.ts`
- Test: `src/services/whatsapp/quickReplyValues.test.ts`

**Interfaces:**
- **Consumes** from Task 1:
  - `QuickReplyValues`
- **Consumes** from existing code:
  - `formatAppointmentDateTime(startsAt, language: "ar"|"en", timeZone?)` and `CLINIC_TIME_ZONE`, from `src/services/patient_notifications/formatWhen.ts`
  - `ClinicHoursInput`
- **Produces:**
  - `collapseWeekdays(weekdays: number[]): number[][]`, exported from `formatClinicHours.ts`
  - `type QuickReplyLanguage = "ar" | "en"`
  - `formatHoursForPatient(hours: ClinicHoursInput | null, lang: QuickReplyLanguage): string | null`
  - `type QuickReplyValueInput`, the input type for the next function
  - `buildQuickReplyValues(input: QuickReplyValueInput): QuickReplyValues`

- [ ] **Step 1: Write the failing tests**

Append to `src/services/whatsapp_ai/formatClinicHours.test.ts`. Change its import line to `import { collapseWeekdays, formatClinicHours } from "./formatClinicHours.ts";`, then add at the end of the file:

```ts
describe("collapseWeekdays", () => {
  it("groups consecutive days, dropping duplicates and invalid days", () => {
    assert.deepEqual(collapseWeekdays([4, 0, 1, 1, 2, 6, 9, -1]), [[0, 1, 2], [4], [6]]);
  });

  it("returns no groups for no valid days", () => {
    assert.deepEqual(collapseWeekdays([7, 1.5]), []);
  });
});
```

Create `src/services/whatsapp/quickReplyValues.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { buildQuickReplyValues, formatHoursForPatient } from "./quickReplyValues.ts";

const base = {
  lang: "en" as const,
  contactName: "WhatsApp Name",
  patientDisplayName: null,
  reservations: [],
  clinic: { phone: "+20 100 000 0000", address: "Road 90, New Cairo" },
  hours: { open_weekdays: [0, 1, 2, 3, 4], time_windows: ["10:00-18:00"], timezone: "Africa/Cairo" },
  location: { latitude: 30.0074, longitude: 31.4913 },
};

describe("buildQuickReplyValues", () => {
  it("uses the linked patient's first name first", () => {
    const values = buildQuickReplyValues({
      ...base,
      patientDisplayName: "Mona Adel",
      reservations: [{ patient_name: "Other Person", service_label: null, starts_at: "2026-07-15T07:00:00Z" }],
    });
    assert.equal(values.name, "Mona");
  });

  it("falls back to the reservation name, then the WhatsApp contact name", () => {
    const fromReservation = buildQuickReplyValues({
      ...base,
      reservations: [{ patient_name: "Karim Samy", service_label: null, starts_at: "2026-07-15T07:00:00Z" }],
    });
    assert.equal(fromReservation.name, "Karim");
    assert.equal(buildQuickReplyValues(base).name, "WhatsApp");
  });

  it("leaves the name out when nothing is known", () => {
    assert.equal(buildQuickReplyValues({ ...base, contactName: "  " }).name, undefined);
  });

  it("leaves appointment fields out when there is no upcoming visit", () => {
    const values = buildQuickReplyValues(base);
    assert.equal(values.next_appointment, undefined);
    assert.equal(values.appointment_service, undefined);
  });

  it("formats the next appointment in the clinic's timezone", () => {
    // 07:00 UTC on 15 July is 10:00 in Cairo (UTC+3 in summer).
    const values = buildQuickReplyValues({
      ...base,
      reservations: [{ patient_name: null, service_label: "Cleaning", starts_at: "2026-07-15T07:00:00Z" }],
    });
    assert.match(values.next_appointment ?? "", /15 July 2026/);
    assert.match(values.next_appointment ?? "", /10:00/);
    assert.equal(values.appointment_service, "Cleaning");
  });

  it("writes Arabic dates with Western digits", () => {
    const values = buildQuickReplyValues({
      ...base,
      lang: "ar",
      reservations: [{ patient_name: null, service_label: null, starts_at: "2026-07-15T07:00:00Z" }],
    });
    assert.match(values.next_appointment ?? "", /2026/);
    assert.match(values.next_appointment ?? "", /10:00/);
  });

  it("always fills the clinic details", () => {
    const values = buildQuickReplyValues(base);
    assert.equal(values.clinic_address, "Road 90, New Cairo");
    assert.equal(values.clinic_phone, "+20 100 000 0000");
    assert.equal(values.maps_link, "https://www.google.com/maps?q=30.0074,31.4913");
    assert.equal(values.clinic_hours, "Sunday to Thursday, 10:00 to 18:00");
  });
});

describe("formatHoursForPatient", () => {
  it("reads naturally in English with several time windows", () => {
    assert.equal(
      formatHoursForPatient({ open_weekdays: [0], time_windows: ["10:00-13:00", "14:00-18:00"] }, "en"),
      "Sunday, 10:00 to 13:00 and 14:00 to 18:00",
    );
  });

  it("reads naturally in Arabic", () => {
    assert.equal(
      formatHoursForPatient({ open_weekdays: [0, 1, 2, 3, 4], time_windows: ["10:00-18:00"] }, "ar"),
      "الأحد إلى الخميس، 10:00 إلى 18:00",
    );
  });

  it("returns null when hours are not configured, so the field stays unfilled", () => {
    assert.equal(formatHoursForPatient(null, "en"), null);
    assert.equal(formatHoursForPatient({ open_weekdays: [], time_windows: ["10:00-18:00"] }, "en"), null);
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/whatsapp_ai/formatClinicHours.test.ts src/services/whatsapp/quickReplyValues.test.ts`
Expected: FAIL. `collapseWeekdays` is not exported, and `quickReplyValues.ts` does not exist.

- [ ] **Step 3: Write the minimal implementation**

In `src/services/whatsapp_ai/formatClinicHours.ts`, replace this block inside `formatClinicHours`:

```ts
  const days = [...new Set(hours.open_weekdays)]
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .sort((a, b) => a - b);
  if (!days.length) {
    return "Opening hours: (not configured — do not state opening hours)";
  }

  const groups: number[][] = [];
  for (const day of days) {
    const last = groups[groups.length - 1];
    if (last && day === last[last.length - 1] + 1) last.push(day);
    else groups.push([day]);
  }
```

with:

```ts
  const groups = collapseWeekdays(hours.open_weekdays);
  if (!groups.length) {
    return "Opening hours: (not configured — do not state opening hours)";
  }
```

and add this export above `formatClinicHours`:

```ts
/** Valid weekdays (0 = Sunday), de-duplicated and grouped into runs of consecutive days. */
export function collapseWeekdays(weekdays: number[]): number[][] {
  const days = [...new Set(weekdays)]
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .sort((a, b) => a - b);
  const groups: number[][] = [];
  for (const day of days) {
    const last = groups[groups.length - 1];
    if (last && day === last[last.length - 1] + 1) last.push(day);
    else groups.push([day]);
  }
  return groups;
}
```

Create `src/services/whatsapp/quickReplyValues.ts`:

```ts
import {
  CLINIC_TIME_ZONE,
  formatAppointmentDateTime,
} from "@/services/patient_notifications/formatWhen";
import {
  collapseWeekdays,
  type ClinicHoursInput,
} from "@/services/whatsapp_ai/formatClinicHours";
import type { QuickReplyValues } from "./quickReplyFields";

export type QuickReplyLanguage = "ar" | "en";

const DAY_NAMES: Record<QuickReplyLanguage, readonly string[]> = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
};

/**
 * Opening hours as a patient reads them. `formatClinicHours` writes for the
 * model's prompt ("Opening hours: … The clinic is closed on any day not
 * listed."), which is not something to paste into a message.
 */
export function formatHoursForPatient(
  hours: ClinicHoursInput | null,
  lang: QuickReplyLanguage,
): string | null {
  if (!hours?.time_windows?.length) return null;
  const groups = collapseWeekdays(hours.open_weekdays ?? []);
  if (!groups.length) return null;
  const names = DAY_NAMES[lang];
  const to = lang === "ar" ? " إلى " : " to ";
  const comma = lang === "ar" ? "، " : ", ";
  const days = groups
    .map((group) =>
      group.length === 1
        ? names[group[0]]
        : `${names[group[0]]}${to}${names[group[group.length - 1]]}`,
    )
    .join(comma);
  const windows = hours.time_windows
    .map((window) => window.replace("-", to))
    .join(lang === "ar" ? " و" : " and ");
  return `${days}${comma}${windows}`;
}

export type QuickReplyValueInput = {
  lang: QuickReplyLanguage;
  contactName: string | null;
  patientDisplayName: string | null;
  /** Upcoming reservations, soonest first. */
  reservations: {
    patient_name: string | null;
    service_label: string | null;
    starts_at: string;
  }[];
  clinic: { phone: string; address: string };
  hours: ClinicHoursInput | null;
  location: { latitude: number; longitude: number };
};

/**
 * Every value a quick reply can use for one conversation. A field is left out
 * rather than guessed when the data is not there — the composer then keeps the
 * `{{field}}` marker and blocks the send.
 */
export function buildQuickReplyValues(input: QuickReplyValueInput): QuickReplyValues {
  const next = input.reservations[0] ?? null;
  const values: QuickReplyValues = {
    clinic_address: input.clinic.address,
    clinic_phone: input.clinic.phone,
    // Same link shape as locationMapsUrl in the chat's location card.
    maps_link: `https://www.google.com/maps?q=${input.location.latitude},${input.location.longitude}`,
  };

  const fullName =
    [input.patientDisplayName, next?.patient_name, input.contactName]
      .map((candidate) => candidate?.trim() ?? "")
      .find(Boolean) ?? "";
  const firstName = fullName.split(/\s+/)[0];
  if (firstName) values.name = firstName;

  if (next) {
    values.next_appointment = formatAppointmentDateTime(
      next.starts_at,
      input.lang,
      input.hours?.timezone || CLINIC_TIME_ZONE,
    );
    const service = next.service_label?.trim();
    if (service) values.appointment_service = service;
  }

  const hours = formatHoursForPatient(input.hours, input.lang);
  if (hours) values.clinic_hours = hours;

  return values;
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/whatsapp_ai/formatClinicHours.test.ts src/services/whatsapp/quickReplyValues.test.ts`
Expected: PASS. All existing `formatClinicHours` tests still pass.

- [ ] **Step 5: Commit**

```bash
git add src/services/whatsapp_ai/formatClinicHours.ts src/services/whatsapp_ai/formatClinicHours.test.ts src/services/whatsapp/quickReplyValues.ts src/services/whatsapp/quickReplyValues.test.ts
git commit -m "$(cat <<'EOF'
feat(whatsapp): build quick reply field values from patient and clinic data

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Share the upcoming-reservations query

**Files:**
- Create: `src/services/reservations/upcomingReservations.ts`
- Test: `src/services/reservations/upcomingReservations.test.ts`
- Modify: `src/services/whatsapp_ai/processJob.ts`

**Interfaces:**
- Consumes: the Supabase client typed `SupabaseClient<Database>`
- Produces:
  - `type UpcomingReservation = { id: string; patient_name: string; service_label: string; starts_at: string; status: string }`
  - `loadUpcomingReservations(db, phone: string, limit?: number, now?: Date): Promise<UpcomingReservation[]>`

- [ ] **Step 1: Write the failing test**

Create `src/services/reservations/upcomingReservations.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { loadUpcomingReservations } from "./upcomingReservations.ts";

/** Records every builder call; awaiting the chain resolves to `rows`. */
function recordingDb(rows: unknown[] | null) {
  const calls: unknown[][] = [];
  const query: Record<string, unknown> = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") {
          return (resolve: (value: unknown) => unknown) => resolve({ data: rows, error: null });
        }
        return (...args: unknown[]) => {
          calls.push([prop, ...args]);
          return query;
        };
      },
    },
  );
  return {
    calls,
    db: {
      from(table: string) {
        calls.push(["from", table]);
        return query;
      },
    },
  };
}

describe("loadUpcomingReservations", () => {
  it("matches the patient on the last 8 digits of the phone", async () => {
    const { calls, db } = recordingDb([]);
    await loadUpcomingReservations(db as never, "+20 101 2345 678");
    assert.deepEqual(calls[0], ["from", "reservations"]);
    assert.ok(calls.some((c) => c[0] === "eq" && c[1] === "phone_suffix" && c[2] === "12345678"));
  });

  it("only looks forward, soonest first, and skips cancelled or deleted visits", async () => {
    const { calls, db } = recordingDb([]);
    const now = new Date("2026-09-11T10:00:00.000Z");
    await loadUpcomingReservations(db as never, "01012345678", 1, now);
    assert.ok(calls.some((c) => c[0] === "gte" && c[1] === "starts_at" && c[2] === now.toISOString()));
    assert.ok(calls.some((c) => c[0] === "neq" && c[1] === "status" && c[2] === "cancelled"));
    assert.ok(calls.some((c) => c[0] === "is" && c[1] === "deleted_at" && c[2] === null));
    assert.ok(calls.some((c) => c[0] === "order" && c[1] === "starts_at"));
    assert.ok(calls.some((c) => c[0] === "limit" && c[1] === 1));
  });

  it("returns an empty list when the query finds nothing", async () => {
    const { db } = recordingDb(null);
    assert.deepEqual(await loadUpcomingReservations(db as never, "010"), []);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/reservations/upcomingReservations.test.ts`
Expected: FAIL with `Cannot find module '.../upcomingReservations.ts'`

- [ ] **Step 3: Write the minimal implementation**

Create `src/services/reservations/upcomingReservations.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type UpcomingReservation = {
  id: string;
  patient_name: string;
  service_label: string;
  starts_at: string;
  status: string;
};

/**
 * A patient's future, non-cancelled visits, soonest first.
 *
 * Matched on the last 8 phone digits (the indexed `phone_suffix`), the same way
 * inbound WhatsApp messages are matched to conversations, so "+20 10…" and
 * "010…" find the same patient. Shared by the auto-responder and quick replies
 * so both always agree on what "your next appointment" is.
 */
export async function loadUpcomingReservations(
  db: SupabaseClient<Database>,
  phone: string,
  limit = 5,
  now: Date = new Date(),
): Promise<UpcomingReservation[]> {
  const { data } = await db
    .from("reservations")
    .select("id,patient_name,service_label,starts_at,status")
    .eq("phone_suffix", phone.replace(/\D/g, "").slice(-8))
    .is("deleted_at", null)
    .gte("starts_at", now.toISOString())
    .neq("status", "cancelled")
    .order("starts_at", { ascending: true })
    .limit(limit);
  return (data ?? []) as UpcomingReservation[];
}
```

In `src/services/whatsapp_ai/processJob.ts`:

Add the import after the `searchClinicKnowledge` import:

```ts
import { loadUpcomingReservations } from "@/services/reservations/upcomingReservations";
```

In the `Promise.all` destructuring, change `{ data: reservations },` to `reservations,`.

Replace this query inside the `Promise.all` array:

```ts
      db
        .from("reservations")
        .select("id,service_label,starts_at,status")
        .eq("phone_suffix", conversation.phone_number.replace(/\D/g, "").slice(-8))
        .is("deleted_at", null)
        .gte("starts_at", nowIso)
        .neq("status", "cancelled")
        .order("starts_at", { ascending: true })
        .limit(5),
```

with:

```ts
      loadUpcomingReservations(db, conversation.phone_number, 5, new Date(nowIso)),
```

Replace the `reservations:` entry in the `prompt` object:

```ts
        reservations: (reservations ?? []) as {
          id: string;
          service_label: string;
          starts_at: string;
          status: string;
        }[],
```

with:

```ts
        // Exactly the fields the prompt used before: patient_name is loaded for
        // quick replies and must not start appearing in the model's context.
        reservations: reservations.map(({ id, service_label, starts_at, status }) => ({
          id,
          service_label,
          starts_at,
          status,
        })),
```

- [ ] **Step 4: Run the tests and typecheck**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/reservations/upcomingReservations.test.ts src/services/whatsapp_ai/runAutoReply.test.ts src/services/whatsapp_ai/goldenCases.test.ts`
Expected: PASS

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: no errors. If `SupabaseClient<Database>` is rejected where `processJob` passes its service client, change the parameter type to `ReturnType<typeof import("@/lib/supabase/service").createServiceClient>`. Use a type-only import so the test still runs without the service client.

- [ ] **Step 5: Commit**

```bash
git add src/services/reservations/upcomingReservations.ts src/services/reservations/upcomingReservations.test.ts src/services/whatsapp_ai/processJob.ts
git commit -m "$(cat <<'EOF'
refactor(whatsapp-ai): share the upcoming-reservations lookup

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Migration and database types

**Files:**
- Create: `supabase/migrations/20260911190000_whatsapp_quick_replies_v2.sql`
- Modify: `src/lib/supabase/database.types.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `whatsapp_canned_replies` columns: `category text null`, `use_count int not null default 0`, `last_used_at timestamptz null`, `attachment jsonb null`
  - RPC `record_canned_reply_use(p_id uuid) returns void`
  - Bucket `whatsapp-quick-replies`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260911190000_whatsapp_quick_replies_v2.sql`:

```sql
-- Quick replies v2: categories, usage ranking, and one attachment per reply.
-- Rollback:
--   ALTER TABLE public.whatsapp_canned_replies
--     DROP COLUMN category, DROP COLUMN use_count, DROP COLUMN last_used_at, DROP COLUMN attachment;
--   DROP FUNCTION public.record_canned_reply_use(uuid);
--   DELETE FROM storage.buckets WHERE id = 'whatsapp-quick-replies';

ALTER TABLE public.whatsapp_canned_replies
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS use_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_used_at timestamptz,
  ADD COLUMN IF NOT EXISTS attachment jsonb;

ALTER TABLE public.whatsapp_canned_replies
  DROP CONSTRAINT IF EXISTS whatsapp_canned_replies_attachment_kind;
ALTER TABLE public.whatsapp_canned_replies
  ADD CONSTRAINT whatsapp_canned_replies_attachment_kind
  CHECK (attachment IS NULL OR attachment->>'kind' IN ('image', 'document', 'location'));

-- Invoker rights: the existing is_admin() row policy is what allows the update.
CREATE OR REPLACE FUNCTION public.record_canned_reply_use(p_id uuid)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE public.whatsapp_canned_replies
  SET use_count = use_count + 1,
      last_used_at = now()
  WHERE id = p_id;
$$;

GRANT EXECUTE ON FUNCTION public.record_canned_reply_use(uuid) TO authenticated;

-- Private: attachments are fetched by signed-in staff, never linked publicly.
INSERT INTO storage.buckets (id, name, public)
VALUES ('whatsapp-quick-replies', 'whatsapp-quick-replies', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS storage_admin_all_whatsapp_quick_replies ON storage.objects;
CREATE POLICY storage_admin_all_whatsapp_quick_replies ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'whatsapp-quick-replies' AND public.is_admin())
  WITH CHECK (bucket_id = 'whatsapp-quick-replies' AND public.is_admin());

UPDATE public.whatsapp_canned_replies
SET category = v.category, updated_at = now()
FROM (
  VALUES
    ('hello', 'General'),
    ('thanks', 'General'),
    ('wait', 'General'),
    ('hours', 'Clinic info'),
    ('directions', 'Clinic info'),
    ('booking', 'Booking')
) AS v(slash_key, category)
WHERE whatsapp_canned_replies.slash_key = v.slash_key
  AND whatsapp_canned_replies.category IS NULL;

INSERT INTO public.whatsapp_canned_replies
  (slash_key, title, title_ar, body, body_ar, category, sort_order)
VALUES (
  'visit',
  'Appointment reminder',
  'تذكير بالموعد',
  'Hi {{name}}, a reminder of your appointment on {{next_appointment}}. Reply here if you need to change it.',
  'أهلاً {{name}}، نذكّركم بموعدكم يوم {{next_appointment}}. ردّوا هنا إذا احتجتم لتغييره.',
  'Booking',
  55
)
ON CONFLICT (slash_key) DO NOTHING;
```

- [ ] **Step 2: Apply it to the local database**

Run: `supabase migration up`
Expected: `Applying migration 20260911190000_whatsapp_quick_replies_v2.sql...`, with no error.

Do **not** run `supabase db push --linked` yet. It changes the shared project, so the user confirms that separately at the end.

- [ ] **Step 3: Update the database types**

In `src/lib/supabase/database.types.ts`, inside `whatsapp_canned_replies`:

In `Row`, after `active: boolean;` add:

```ts
          category: string | null;
          use_count: number;
          last_used_at: string | null;
          attachment: Json | null;
```

In both `Insert` and `Update`, after `active?: boolean;` add:

```ts
          category?: string | null;
          use_count?: number;
          last_used_at?: string | null;
          attachment?: Json | null;
```

Inside `Functions: {`, just before `cancel_reservation_and_release_slot: {`, add:

```ts
      record_canned_reply_use: {
        Args: {
          p_id: string;
        };
        Returns: undefined;
      };
```

- [ ] **Step 4: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260911190000_whatsapp_quick_replies_v2.sql src/lib/supabase/database.types.ts
git commit -m "$(cat <<'EOF'
feat(whatsapp): store quick reply categories, usage and attachments

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Input validation and service functions

**Files:**
- Create: `src/services/whatsapp/cannedReplyInput.ts`
- Test: `src/services/whatsapp/cannedReplyInput.test.ts`
- Modify: `src/services/whatsapp/cannedReplies.ts` (full replacement below)
- Test: `src/services/whatsapp/cannedReplies.test.ts`

**Interfaces:**
- **Consumes** from Task 1:
  - `findUnknownFields`
- **Consumes** from Task 4:
  - The new columns and the RPC
- **Produces** from `cannedReplyInput.ts`:
  - `QUICK_REPLY_BUCKET = "whatsapp-quick-replies"`
  - `QUICK_REPLY_MAX_FILE_BYTES = 4 * 1024 * 1024`
  - `cannedReplyAttachmentSchema`, `type CannedReplyAttachment`
  - `createCannedReplySchema`, `type CreateCannedReplyInput`
  - `updateCannedReplySchema`, `type UpdateCannedReplyInput`
- **Produces** from `cannedReplies.ts`:
  - `type WhatsappCannedReply`
  - `listCannedReplies(supabase, opts?)` (unchanged)
  - `createCannedReply(supabase, input: CreateCannedReplyInput)`
  - `updateCannedReply(supabase, id, input: UpdateCannedReplyInput)`
  - `recordCannedReplyUse(supabase, id)`
  - `deleteCannedReply(supabase, id)`
  - `toCannedReplyPatch(input, now?)`
  - `attachmentPath(attachment: unknown): string | null`
  - `isDuplicateSlashKey(error: unknown): boolean`

- [ ] **Step 1: Write the failing tests**

Create `src/services/whatsapp/cannedReplyInput.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createCannedReplySchema,
  QUICK_REPLY_MAX_FILE_BYTES,
  updateCannedReplySchema,
  // @ts-expect-error -- Node strip-types needs the extension.
} from "./cannedReplyInput.ts";

const valid = { slash_key: "Visit", title: "Visit", body: "Hi {{name}}" };

describe("createCannedReplySchema", () => {
  it("lower-cases the slash key", () => {
    const parsed = createCannedReplySchema.parse(valid);
    assert.equal(parsed.slash_key, "visit");
  });

  it("rejects a slash key staff could not type after /", () => {
    assert.equal(createCannedReplySchema.safeParse({ ...valid, slash_key: "two words" }).success, false);
  });

  it("rejects an unknown fill-in field in either language", () => {
    const english = createCannedReplySchema.safeParse({ ...valid, body: "Hi {{nmae}}" });
    assert.equal(english.success, false);
    const arabic = createCannedReplySchema.safeParse({ ...valid, body_ar: "مرحبا {{nmae}}" });
    assert.equal(arabic.success, false);
    assert.deepEqual(arabic.error?.issues[0]?.path, ["body_ar"]);
  });

  it("accepts a clinic location attachment", () => {
    assert.equal(createCannedReplySchema.safeParse({ ...valid, attachment: { kind: "location" } }).success, true);
  });

  it("rejects a PDF passed off as an image", () => {
    const attachment = { kind: "image", mime: "application/pdf", path: "a.pdf", name: "a.pdf", size: 10 };
    assert.equal(createCannedReplySchema.safeParse({ ...valid, attachment }).success, false);
  });

  it("rejects files larger than the send route can carry", () => {
    const attachment = {
      kind: "document",
      mime: "application/pdf",
      path: "a.pdf",
      name: "a.pdf",
      size: QUICK_REPLY_MAX_FILE_BYTES + 1,
    };
    assert.equal(createCannedReplySchema.safeParse({ ...valid, attachment }).success, false);
  });
});

describe("updateCannedReplySchema", () => {
  it("refuses an empty update", () => {
    assert.equal(updateCannedReplySchema.safeParse({}).success, false);
  });

  it("allows switching a reply off on its own", () => {
    assert.deepEqual(updateCannedReplySchema.parse({ active: false }), { active: false });
  });

  it("still rejects unknown fields on edit", () => {
    assert.equal(updateCannedReplySchema.safeParse({ body: "{{coupon}}" }).success, false);
  });
});
```

Create `src/services/whatsapp/cannedReplies.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { attachmentPath, isDuplicateSlashKey, toCannedReplyPatch } from "./cannedReplies.ts";

const now = new Date("2026-09-11T10:00:00.000Z");

describe("toCannedReplyPatch", () => {
  it("only includes the keys the caller sent", () => {
    assert.deepEqual(toCannedReplyPatch({ active: false }, now), {
      active: false,
      updated_at: now.toISOString(),
    });
  });

  it("stores blank optional text as null", () => {
    const patch = toCannedReplyPatch({ title_ar: "  ", body_ar: "", category: " " }, now);
    assert.equal(patch.title_ar, null);
    assert.equal(patch.body_ar, null);
    assert.equal(patch.category, null);
  });

  it("clears the attachment when null is sent", () => {
    assert.equal(toCannedReplyPatch({ attachment: null }, now).attachment, null);
  });
});

describe("attachmentPath", () => {
  it("returns the storage path of a file attachment", () => {
    assert.equal(
      attachmentPath({ kind: "image", path: "a.png", mime: "image/png", name: "a.png", size: 1 }),
      "a.png",
    );
  });

  it("returns null for a location pin or nothing", () => {
    assert.equal(attachmentPath({ kind: "location" }), null);
    assert.equal(attachmentPath(null), null);
  });
});

describe("isDuplicateSlashKey", () => {
  it("recognises Postgres unique violations", () => {
    assert.equal(isDuplicateSlashKey({ code: "23505", message: "duplicate key" }), true);
    assert.equal(isDuplicateSlashKey({ code: "42501" }), false);
    assert.equal(isDuplicateSlashKey(new Error("x")), false);
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/whatsapp/cannedReplyInput.test.ts src/services/whatsapp/cannedReplies.test.ts`
Expected: FAIL. `cannedReplyInput.ts` is missing, and `toCannedReplyPatch` is not exported.

- [ ] **Step 3: Write the minimal implementation**

Create `src/services/whatsapp/cannedReplyInput.ts`:

```ts
import { z } from "zod";
import { findUnknownFields } from "./quickReplyFields";

export const QUICK_REPLY_BUCKET = "whatsapp-quick-replies";

/**
 * On send the file goes through our /api/v1/whatsapp/send function, whose
 * request body Vercel caps near 4.5 MB — well under WhatsApp's own limits.
 */
export const QUICK_REPLY_MAX_FILE_BYTES = 4 * 1024 * 1024;

const storedFile = {
  path: z.string().min(1).max(300),
  name: z.string().min(1).max(200),
  size: z.number().int().positive().max(QUICK_REPLY_MAX_FILE_BYTES),
};

export const cannedReplyAttachmentSchema = z.discriminatedUnion("kind", [
  // WhatsApp only accepts JPEG and PNG images.
  z.object({ kind: z.literal("image"), mime: z.enum(["image/jpeg", "image/png"]), ...storedFile }),
  z.object({ kind: z.literal("document"), mime: z.literal("application/pdf"), ...storedFile }),
  z.object({ kind: z.literal("location") }),
]);

export type CannedReplyAttachment = z.infer<typeof cannedReplyAttachmentSchema>;

const noUnknownFields = (text: string | null | undefined) =>
  findUnknownFields(text ?? "").length === 0;
const UNKNOWN_FIELD_MESSAGE = "Unknown fill-in field";

const fields = {
  slash_key: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9_-]+$/i)
    .transform((key) => key.toLowerCase()),
  title: z.string().trim().min(1).max(80),
  title_ar: z.string().trim().max(80).nullable().optional(),
  body: z.string().trim().min(1).max(2000).refine(noUnknownFields, UNKNOWN_FIELD_MESSAGE),
  body_ar: z
    .string()
    .trim()
    .max(2000)
    .nullable()
    .optional()
    .refine(noUnknownFields, UNKNOWN_FIELD_MESSAGE),
  category: z.string().trim().max(40).nullable().optional(),
  sort_order: z.number().int().optional(),
  active: z.boolean().optional(),
  attachment: cannedReplyAttachmentSchema.nullable().optional(),
};

export const createCannedReplySchema = z.object(fields);

export const updateCannedReplySchema = z
  .object(fields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "Nothing to update" });

export type CreateCannedReplyInput = z.infer<typeof createCannedReplySchema>;
export type UpdateCannedReplyInput = z.infer<typeof updateCannedReplySchema>;
```

Replace the whole of `src/services/whatsapp/cannedReplies.ts` with:

```ts
import type { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  QUICK_REPLY_BUCKET,
  type CreateCannedReplyInput,
  type UpdateCannedReplyInput,
} from "./cannedReplyInput";

type AdminClient = Awaited<ReturnType<typeof createClient>>;
type CannedReplyUpdate = Database["public"]["Tables"]["whatsapp_canned_replies"]["Update"];
export type WhatsappCannedReply =
  Database["public"]["Tables"]["whatsapp_canned_replies"]["Row"];

const blankToNull = (value: string | null | undefined) => value?.trim() || null;

export async function listCannedReplies(
  supabase: AdminClient,
  opts?: { activeOnly?: boolean },
): Promise<WhatsappCannedReply[]> {
  let q = supabase
    .from("whatsapp_canned_replies")
    .select("*")
    .order("sort_order", { ascending: true });
  if (opts?.activeOnly !== false) {
    q = q.eq("active", true);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createCannedReply(
  supabase: AdminClient,
  input: CreateCannedReplyInput,
): Promise<WhatsappCannedReply> {
  const { data, error } = await supabase
    .from("whatsapp_canned_replies")
    .insert({
      slash_key: input.slash_key,
      title: input.title,
      title_ar: blankToNull(input.title_ar),
      body: input.body,
      body_ar: blankToNull(input.body_ar),
      category: blankToNull(input.category),
      sort_order: input.sort_order ?? 100,
      active: input.active ?? true,
      attachment: input.attachment ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/** The row patch for an update: only keys the caller sent, blanks stored as null. */
export function toCannedReplyPatch(
  input: UpdateCannedReplyInput,
  now: Date = new Date(),
): CannedReplyUpdate {
  const patch: CannedReplyUpdate = { updated_at: now.toISOString() };
  if (input.slash_key !== undefined) patch.slash_key = input.slash_key;
  if (input.title !== undefined) patch.title = input.title;
  if (input.title_ar !== undefined) patch.title_ar = blankToNull(input.title_ar);
  if (input.body !== undefined) patch.body = input.body;
  if (input.body_ar !== undefined) patch.body_ar = blankToNull(input.body_ar);
  if (input.category !== undefined) patch.category = blankToNull(input.category);
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order;
  if (input.active !== undefined) patch.active = input.active;
  if (input.attachment !== undefined) patch.attachment = input.attachment;
  return patch;
}

export async function updateCannedReply(
  supabase: AdminClient,
  id: string,
  input: UpdateCannedReplyInput,
): Promise<WhatsappCannedReply> {
  let previousPath: string | null = null;
  if (input.attachment !== undefined) {
    const { data } = await supabase
      .from("whatsapp_canned_replies")
      .select("attachment")
      .eq("id", id)
      .maybeSingle();
    previousPath = attachmentPath(data?.attachment);
  }
  const { data, error } = await supabase
    .from("whatsapp_canned_replies")
    .update(toCannedReplyPatch(input))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  if (previousPath && previousPath !== attachmentPath(data.attachment)) {
    await removeAttachmentFile(supabase, previousPath);
  }
  return data;
}

export async function recordCannedReplyUse(
  supabase: AdminClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.rpc("record_canned_reply_use", { p_id: id });
  if (error) throw error;
}

export async function deleteCannedReply(
  supabase: AdminClient,
  id: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("whatsapp_canned_replies")
    .delete()
    .eq("id", id)
    .select("attachment")
    .maybeSingle();
  if (error) throw error;
  const path = attachmentPath(data?.attachment);
  if (path) await removeAttachmentFile(supabase, path);
}

export function attachmentPath(attachment: unknown): string | null {
  if (
    attachment &&
    typeof attachment === "object" &&
    "path" in attachment &&
    typeof attachment.path === "string"
  ) {
    return attachment.path;
  }
  return null;
}

export function isDuplicateSlashKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

/** Best effort: a leftover file only costs storage; the edit itself already succeeded. */
async function removeAttachmentFile(supabase: AdminClient, path: string) {
  const { error } = await supabase.storage.from(QUICK_REPLY_BUCKET).remove([path]);
  if (error) console.error("[canned-replies] could not remove attachment", path, error);
}
```

- [ ] **Step 4: Run the tests and typecheck**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/whatsapp/cannedReplyInput.test.ts src/services/whatsapp/cannedReplies.test.ts`
Expected: PASS

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: errors only in `src/app/api/v1/whatsapp/canned-replies/route.ts`, because `createCannedReply`'s input type changed. Task 6 fixes them. Any other error must be fixed now.

- [ ] **Step 5: Commit**

```bash
git add src/services/whatsapp/cannedReplyInput.ts src/services/whatsapp/cannedReplyInput.test.ts src/services/whatsapp/cannedReplies.ts src/services/whatsapp/cannedReplies.test.ts
git commit -m "$(cat <<'EOF'
feat(whatsapp): validate and edit quick replies with attachments

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: API routes and field-value loader

**Files:**
- Create: `src/services/whatsapp/quickReplyContext.ts`
- Modify: `src/app/api/v1/whatsapp/canned-replies/route.ts` (full replacement below)
- Create: `src/app/api/v1/whatsapp/canned-replies/[id]/route.ts`
- Create: `src/app/api/v1/whatsapp/canned-replies/[id]/use/route.ts`
- Create: `src/app/api/v1/whatsapp/canned-replies/context/route.ts`

**Interfaces:**
- **Consumes:**
  - Tasks 2, 3 and 5 (value builder, reservations query, schemas and service)
  - `clinicContactFromSettings` and `CLINIC_LOCATION` (`src/lib/clinic/whatsappClinicContact.ts`)
  - `requireAdmin` (`src/lib/api/requireAdmin.ts`)
- **Produces:**
  - `POST /api/v1/whatsapp/canned-replies`: returns `{reply}`; `400 {error, path}`; `409 {error, code:"SLASH_KEY_TAKEN"}`
  - `PATCH /api/v1/whatsapp/canned-replies/:id`: returns `{reply}`; 400, 404 or 409
  - `POST /api/v1/whatsapp/canned-replies/:id/use`: returns `{ok:true}`
  - `GET /api/v1/whatsapp/canned-replies/context?conversationId=<uuid>&lang=ar|en`: returns `{values: QuickReplyValues}`; 400 or 404
  - `loadQuickReplyContext(db, conversationId, lang): Promise<QuickReplyValues | null>`

- [ ] **Step 1: Write the loader**

Create `src/services/whatsapp/quickReplyContext.ts`:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  CLINIC_LOCATION,
  clinicContactFromSettings,
} from "@/lib/clinic/whatsappClinicContact";
import { loadUpcomingReservations } from "@/services/reservations/upcomingReservations";
import type { ClinicHoursInput } from "@/services/whatsapp_ai/formatClinicHours";
import type { QuickReplyValues } from "./quickReplyFields";
import { buildQuickReplyValues, type QuickReplyLanguage } from "./quickReplyValues";

/**
 * Field values for one conversation, or null when it does not exist.
 *
 * Runs as the signed-in admin (RLS applies), not the service role: staff can
 * only fill a reply with data they could already open themselves.
 */
export async function loadQuickReplyContext(
  db: SupabaseClient<Database>,
  conversationId: string,
  lang: QuickReplyLanguage,
): Promise<QuickReplyValues | null> {
  const { data: conversation } = await db
    .from("whatsapp_conversations")
    .select("phone_number,contact_name,patient_key")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conversation) return null;

  const [reservations, profile, { data: settings }, { data: hours }] = await Promise.all([
    loadUpcomingReservations(db, conversation.phone_number, 1),
    conversation.patient_key
      ? db
          .from("patient_profiles")
          .select("display_name")
          .eq("patient_key", conversation.patient_key)
          .maybeSingle()
          .then((result) => result.data)
      : Promise.resolve(null),
    db
      .from("site_settings")
      .select("contact_phone, contact_address, contact_clinic_name")
      .limit(1)
      .maybeSingle(),
    db
      .from("clinic_hours")
      .select("open_weekdays,time_windows,timezone")
      .limit(1)
      .maybeSingle(),
  ]);

  return buildQuickReplyValues({
    lang,
    contactName: conversation.contact_name,
    patientDisplayName: profile?.display_name ?? null,
    reservations,
    clinic: clinicContactFromSettings(settings),
    hours: hours as ClinicHoursInput | null,
    location: CLINIC_LOCATION,
  });
}
```

- [ ] **Step 2: Write the routes**

Replace the whole of `src/app/api/v1/whatsapp/canned-replies/route.ts` with:

```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { z } from "zod";
import {
  createCannedReply,
  deleteCannedReply,
  isDuplicateSlashKey,
  listCannedReplies,
} from "@/services/whatsapp/cannedReplies";
import { createCannedReplySchema } from "@/services/whatsapp/cannedReplyInput";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const supabase = auth.supabase;
    const all = new URL(request.url).searchParams.get("all") === "1";
    const replies = await listCannedReplies(supabase, {
      activeOnly: !all,
    });
    return NextResponse.json({ replies });
  } catch (error) {
    console.error("[whatsapp/canned-replies GET]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const parsed = createCannedReplySchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: issue?.message ?? "Invalid body", path: issue?.path },
      { status: 400 },
    );
  }
  try {
    const reply = await createCannedReply(auth.supabase, parsed.data);
    return NextResponse.json({ reply });
  } catch (error) {
    if (isDuplicateSlashKey(error)) {
      return NextResponse.json(
        { error: "Slash key already used", code: "SLASH_KEY_TAKEN" },
        { status: 409 },
      );
    }
    console.error("[whatsapp/canned-replies POST]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const supabase = auth.supabase;
    const id = new URL(request.url).searchParams.get("id");
    if (!id || !z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await deleteCannedReply(supabase, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[whatsapp/canned-replies DELETE]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

Create `src/app/api/v1/whatsapp/canned-replies/[id]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { isDuplicateSlashKey, updateCannedReply } from "@/services/whatsapp/cannedReplies";
import { updateCannedReplySchema } from "@/services/whatsapp/cannedReplyInput";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** Edit a quick reply: any subset of its fields, including switching it off. */
export async function PATCH(request: Request, context: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const parsed = updateCannedReplySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: issue?.message ?? "Invalid body", path: issue?.path },
      { status: 400 },
    );
  }

  try {
    const reply = await updateCannedReply(auth.supabase, id, parsed.data);
    return NextResponse.json({ reply });
  } catch (error) {
    if (isDuplicateSlashKey(error)) {
      return NextResponse.json(
        { error: "Slash key already used", code: "SLASH_KEY_TAKEN" },
        { status: 409 },
      );
    }
    // PostgREST's "no rows" from .single() after an update that matched nothing.
    if (typeof error === "object" && error !== null && "code" in error && error.code === "PGRST116") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("[whatsapp/canned-replies PATCH]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

Create `src/app/api/v1/whatsapp/canned-replies/[id]/use/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { recordCannedReplyUse } from "@/services/whatsapp/cannedReplies";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** Count one use, so the composer's / menu lists the replies staff reach for most. */
export async function POST(_request: Request, context: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    await recordCannedReplyUse(auth.supabase, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[whatsapp/canned-replies use]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

Create `src/app/api/v1/whatsapp/canned-replies/context/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { loadQuickReplyContext } from "@/services/whatsapp/quickReplyContext";

export const runtime = "nodejs";

const querySchema = z.object({
  conversationId: z.string().uuid(),
  lang: z.enum(["ar", "en"]).default("en"),
});

/** Values for the fill-in fields of quick replies used in one conversation. */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const params = new URL(request.url).searchParams;
  const parsed = querySchema.safeParse({
    conversationId: params.get("conversationId"),
    lang: params.get("lang") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  try {
    const values = await loadQuickReplyContext(
      auth.supabase,
      parsed.data.conversationId,
      parsed.data.lang,
    );
    if (!values) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ values });
  } catch (error) {
    console.error("[whatsapp/canned-replies context]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Typecheck, lint and run all unit tests**

Run: `GITHUB_TOKEN=x yarn typecheck && GITHUB_TOKEN=x yarn lint && GITHUB_TOKEN=x yarn test`
Expected: no type or lint errors, and every test passes.

- [ ] **Step 4: Smoke-test the routes against the local app**

Run `GITHUB_TOKEN=x yarn dev`. Sign in at `/admin/login` (`admin@dentallounge.local` / `DentalLounge2026!`). Then, in the browser devtools console on any `/admin` page:

```js
await (await fetch("/api/v1/whatsapp/canned-replies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slash_key: "hello", title: "x", body: "x" }) })).json()
```

Expected: `{error: "Slash key already used", code: "SLASH_KEY_TAKEN"}`

```js
await (await fetch("/api/v1/whatsapp/canned-replies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slash_key: "typo", title: "x", body: "Hi {{nmae}}" }) })).json()
```

Expected: `{error: "Unknown fill-in field", path: ["body"]}`

Open a real conversation in `/admin/support`, copy its id from the `data-conversation-id` attribute in the inbox list, then:

```js
await (await fetch("/api/v1/whatsapp/canned-replies/context?conversationId=<id>&lang=en")).json()
```

Expected: `{values: {clinic_address, clinic_phone, maps_link, clinic_hours?, name?, next_appointment?…}}`

- [ ] **Step 5: Commit, then open PR 1**

```bash
git add src/services/whatsapp/quickReplyContext.ts src/app/api/v1/whatsapp/canned-replies
git commit -m "$(cat <<'EOF'
feat(whatsapp): quick reply edit, usage and field-value endpoints

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

Phase 1 is done. Follow `haac-core:finishing-a-development-branch` to open PR 1 from `feat/quick-replies-v2`, then `git switch -c feat/quick-replies-v2-page` for Phase 2.

---

# Phase 2: Management page (PR 2)

### Task 7: Translation text and page label

**Files:**
- Modify: `src/lib/i18n/messages/admin/en.ts`
- Modify: `src/lib/i18n/messages/admin/ar.ts`
- Modify: `src/features/admin/lib/adminNav.ts`
- Delete: `src/features/admin/components/support/chat/CannedRepliesPanel.tsx`

**Interfaces:**
- Consumes: nothing
- Produces these message keys, used by Tasks 8, 11 and 12:
  - `admin.nav.quickReplies`
  - `admin.pages.quickReplies.*`
  - `admin.quickReplies.field.<field>`, one per fill-in field
  - `admin.frontDesk.cannedManage`
  - `admin.frontDesk.fillInBeforeSending`
  - `admin.frontDesk.quickReplyAttachment`
  - `admin.frontDesk.quickReplyAttachmentFail`
  - `admin.frontDesk.saveAsQuickReply`
  - `admin.frontDesk.savedAsQuickReply`
  - `admin.frontDesk.saveQuickReplyFail`

- [ ] **Step 1: Add the English text**

In `src/lib/i18n/messages/admin/en.ts`, directly after `"admin.pages.knowledge.tags": "Tags",` insert:

```ts
  "admin.nav.quickReplies": "Quick replies",
  "admin.pages.quickReplies.title": "Quick replies",
  "admin.pages.quickReplies.description": "Saved WhatsApp messages staff insert by typing / in a chat. Fill-in fields are completed from the patient and clinic.",
  "admin.pages.quickReplies.add": "Add quick reply",
  "admin.pages.quickReplies.empty": "No quick replies yet.",
  "admin.pages.quickReplies.slashKey": "Slash key",
  "admin.pages.quickReplies.slashKeyHint": "Letters, numbers, - and _. Staff type /key in a chat.",
  "admin.pages.quickReplies.slashKeyTaken": "Another quick reply already uses this key.",
  "admin.pages.quickReplies.titleEn": "Title (EN)",
  "admin.pages.quickReplies.titleAr": "Title (AR)",
  "admin.pages.quickReplies.bodyEn": "Message (EN)",
  "admin.pages.quickReplies.bodyAr": "Message (AR)",
  "admin.pages.quickReplies.category": "Category",
  "admin.pages.quickReplies.uses": "Uses",
  "admin.pages.quickReplies.active": "Active",
  "admin.pages.quickReplies.insertField": "Insert field",
  "admin.pages.quickReplies.unknownFields": "Unknown fields:",
  "admin.pages.quickReplies.preview": "Preview (sample patient)",
  "admin.pages.quickReplies.attachment": "Attachment",
  "admin.pages.quickReplies.attachUpload": "Upload JPG, PNG or PDF",
  "admin.pages.quickReplies.attachLocation": "Clinic location pin",
  "admin.pages.quickReplies.attachRemove": "Remove attachment",
  "admin.pages.quickReplies.attachNone": "No attachment",
  "admin.pages.quickReplies.attachTooBig": "Files must be 4 MB or smaller.",
  "admin.pages.quickReplies.attachWrongType": "Only JPG, PNG or PDF files can be attached.",
  "admin.pages.quickReplies.attachFailed": "Could not upload the file.",
  "admin.quickReplies.field.name": "patient first name",
  "admin.quickReplies.field.next_appointment": "next appointment",
  "admin.quickReplies.field.appointment_service": "appointment treatment",
  "admin.quickReplies.field.clinic_address": "clinic address",
  "admin.quickReplies.field.clinic_phone": "clinic phone",
  "admin.quickReplies.field.clinic_hours": "opening hours",
  "admin.quickReplies.field.maps_link": "map link",
```

In the same file, replace the lines from `"admin.frontDesk.cannedAdded": "Quick reply added",` through `"This removes the canned reply from slash commands.",` (the old panel's text, used only by `CannedRepliesPanel.tsx`, which Task 8 deletes) with:

```ts
  "admin.frontDesk.cannedManage": "Manage quick replies",
  "admin.frontDesk.fillInBeforeSending": "Fill in before sending:",
  "admin.frontDesk.quickReplyAttachment": "Sends with",
  "admin.frontDesk.quickReplyAttachmentFail": "Could not load the quick reply's attachment. Nothing was sent.",
  "admin.frontDesk.saveAsQuickReply": "Save as quick reply",
  "admin.frontDesk.savedAsQuickReply": "Saved as a quick reply",
  "admin.frontDesk.saveQuickReplyFail": "Could not save the quick reply",
```

- [ ] **Step 2: Add the Arabic text**

In `src/lib/i18n/messages/admin/ar.ts`, directly after `"admin.pages.knowledge.tags": "الوسوم",` insert:

```ts
  "admin.nav.quickReplies": "الردود السريعة",
  "admin.pages.quickReplies.title": "الردود السريعة",
  "admin.pages.quickReplies.description": "رسائل واتساب محفوظة يُدرجها الموظفون بكتابة / في المحادثة. تُملأ الحقول تلقائياً من بيانات المريض والعيادة.",
  "admin.pages.quickReplies.add": "إضافة رد سريع",
  "admin.pages.quickReplies.empty": "لا توجد ردود سريعة بعد.",
  "admin.pages.quickReplies.slashKey": "مفتاح الاختصار",
  "admin.pages.quickReplies.slashKeyHint": "حروف إنجليزية وأرقام و - و _. يكتب الموظفون /المفتاح في المحادثة.",
  "admin.pages.quickReplies.slashKeyTaken": "هذا المفتاح مستخدم في رد سريع آخر.",
  "admin.pages.quickReplies.titleEn": "العنوان (إنجليزي)",
  "admin.pages.quickReplies.titleAr": "العنوان (عربي)",
  "admin.pages.quickReplies.bodyEn": "الرسالة (إنجليزي)",
  "admin.pages.quickReplies.bodyAr": "الرسالة (عربي)",
  "admin.pages.quickReplies.category": "الفئة",
  "admin.pages.quickReplies.uses": "مرات الاستخدام",
  "admin.pages.quickReplies.active": "مفعّل",
  "admin.pages.quickReplies.insertField": "إدراج حقل",
  "admin.pages.quickReplies.unknownFields": "حقول غير معروفة:",
  "admin.pages.quickReplies.preview": "معاينة (مريض تجريبي)",
  "admin.pages.quickReplies.attachment": "مرفق",
  "admin.pages.quickReplies.attachUpload": "رفع JPG أو PNG أو PDF",
  "admin.pages.quickReplies.attachLocation": "موقع العيادة",
  "admin.pages.quickReplies.attachRemove": "إزالة المرفق",
  "admin.pages.quickReplies.attachNone": "بدون مرفق",
  "admin.pages.quickReplies.attachTooBig": "يجب ألا يتجاوز حجم الملف 4 ميجابايت.",
  "admin.pages.quickReplies.attachWrongType": "يمكن إرفاق ملفات JPG أو PNG أو PDF فقط.",
  "admin.pages.quickReplies.attachFailed": "تعذر رفع الملف.",
  "admin.quickReplies.field.name": "الاسم الأول للمريض",
  "admin.quickReplies.field.next_appointment": "الموعد القادم",
  "admin.quickReplies.field.appointment_service": "علاج الموعد",
  "admin.quickReplies.field.clinic_address": "عنوان العيادة",
  "admin.quickReplies.field.clinic_phone": "هاتف العيادة",
  "admin.quickReplies.field.clinic_hours": "ساعات العمل",
  "admin.quickReplies.field.maps_link": "رابط الخريطة",
```

In the same file, replace the lines from `"admin.frontDesk.cannedAdded": "تمت إضافة الرد السريع",` through the value line after `"admin.frontDesk.cannedDeleteDesc":` with:

```ts
  "admin.frontDesk.cannedManage": "إدارة الردود السريعة",
  "admin.frontDesk.fillInBeforeSending": "املأ قبل الإرسال:",
  "admin.frontDesk.quickReplyAttachment": "يُرسل مع",
  "admin.frontDesk.quickReplyAttachmentFail": "تعذر تحميل مرفق الرد السريع. لم يُرسل شيء.",
  "admin.frontDesk.saveAsQuickReply": "حفظ كرد سريع",
  "admin.frontDesk.savedAsQuickReply": "تم الحفظ كرد سريع",
  "admin.frontDesk.saveQuickReplyFail": "تعذر حفظ الرد السريع",
```

- [ ] **Step 3: Add the page label**

In `src/features/admin/lib/adminNav.ts`, inside `adminPageLabelKeys`, after `"/admin/knowledge": "admin.nav.knowledge",` add:

```ts
  "/admin/quick-replies": "admin.nav.quickReplies",
```

- [ ] **Step 4: Delete the unused panel and typecheck**

The removed text keys belonged only to `CannedRepliesPanel.tsx`, which nothing renders. Delete it in this task so every commit typechecks:

```bash
git rm src/features/admin/components/support/chat/CannedRepliesPanel.tsx
```

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: no errors. An error means a key is missing from one language file, so add it.

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n/messages/admin/en.ts src/lib/i18n/messages/admin/ar.ts src/features/admin/lib/adminNav.ts
git commit -m "$(cat <<'EOF'
feat(admin): copy for the quick replies page and composer

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: `/admin/quick-replies` management page

**Files:**
- Create: `src/features/admin/components/quick-replies/quickRepliesApi.ts`
- Create: `src/features/admin/components/quick-replies/QuickReplyAttachmentField.tsx`
- Create: `src/features/admin/components/quick-replies/QuickReplyForm.tsx`
- Create: `src/features/admin/components/quick-replies/QuickReplyEditCard.tsx`
- Create: `src/features/admin/components/quick-replies/QuickRepliesEditor.tsx`
- Create: `src/app/(internal)/admin/(dashboard)/quick-replies/page.tsx`

**Interfaces:**
- **Consumes:**
  - Task 1: `QUICK_REPLY_FIELDS`, `findUnknownFields`, `renderQuickReply`
  - Task 5: `QUICK_REPLY_BUCKET`, `QUICK_REPLY_MAX_FILE_BYTES`, `CannedReplyAttachment`, `WhatsappCannedReply`, `listCannedReplies`
  - Task 6: the routes
  - Task 7: the text keys
  - Existing: `useBoardCrud`, `CollectionSplitLayout`, `CollectionTable`, `LocalizedAdminPageHeader`, `ConfirmDeleteDialog`
- **Produces**, used by Task 12:
  - `QuickReplyApiError` (`message`, `code?: string`)
  - `createQuickReply(input: Record<string, unknown>): Promise<WhatsappCannedReply>`
  - `updateQuickReply(id, input)`
  - `deleteQuickReply(id)`

The test stack has no component tests (there is no DOM runner under `node:test`). This task is covered by typecheck and build, the Task 13 e2e test, and the manual check in Step 4.

- [ ] **Step 1: Write the API client and the attachment field**

Create `src/features/admin/components/quick-replies/quickRepliesApi.ts`:

```ts
import type { WhatsappCannedReply } from "@/services/whatsapp/cannedReplies";

export class QuickReplyApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

const JSON_HEADERS = { "Content-Type": "application/json" };

async function readReply(res: Response): Promise<WhatsappCannedReply> {
  const data = (await res.json().catch(() => null)) as {
    reply?: WhatsappCannedReply;
    error?: string;
    code?: string;
  } | null;
  if (!res.ok || !data?.reply) {
    throw new QuickReplyApiError(data?.error ?? "Request failed", data?.code);
  }
  return data.reply;
}

export async function createQuickReply(input: Record<string, unknown>) {
  const res = await fetch("/api/v1/whatsapp/canned-replies", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  return readReply(res);
}

export async function updateQuickReply(id: string, input: Record<string, unknown>) {
  const res = await fetch(`/api/v1/whatsapp/canned-replies/${id}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  return readReply(res);
}

export async function deleteQuickReply(id: string): Promise<void> {
  const res = await fetch(`/api/v1/whatsapp/canned-replies?id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new QuickReplyApiError("Delete failed");
}
```

Create `src/features/admin/components/quick-replies/QuickReplyAttachmentField.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";
import { FileText, ImageIcon, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import {
  QUICK_REPLY_BUCKET,
  QUICK_REPLY_MAX_FILE_BYTES,
  type CannedReplyAttachment,
} from "@/services/whatsapp/cannedReplyInput";

const ACCEPTED = {
  "image/jpeg": "image",
  "image/png": "image",
  "application/pdf": "document",
} as const;

type Props = {
  value: CannedReplyAttachment | null;
  onChange: (value: CannedReplyAttachment | null) => void;
};

export function QuickReplyAttachmentField({ value, onChange }: Props) {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setError(null);
    const kind = ACCEPTED[file.type as keyof typeof ACCEPTED];
    if (!kind) {
      setError(t("admin.pages.quickReplies.attachWrongType"));
      return;
    }
    if (file.size > QUICK_REPLY_MAX_FILE_BYTES) {
      setError(t("admin.pages.quickReplies.attachTooBig"));
      return;
    }
    setUploading(true);
    try {
      const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
      const { error: uploadError } = await createClient()
        .storage.from(QUICK_REPLY_BUCKET)
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      onChange({ kind, mime: file.type, path, name: file.name, size: file.size } as CannedReplyAttachment);
    } catch {
      setError(t("admin.pages.quickReplies.attachFailed"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const Icon = value?.kind === "location" ? MapPin : value?.kind === "image" ? ImageIcon : FileText;

  return (
    <div className="space-y-2">
      <Label>{t("admin.pages.quickReplies.attachment")}</Label>
      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
          <span className="flex min-w-0 items-center gap-2">
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="truncate">
              {value.kind === "location" ? t("admin.pages.quickReplies.attachLocation") : value.name}
            </span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("admin.pages.quickReplies.attachRemove")}
            onClick={() => onChange(null)}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t("admin.pages.quickReplies.attachNone")}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? t("admin.saving") : t("admin.pages.quickReplies.attachUpload")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange({ kind: "location" })}>
          {t("admin.pages.quickReplies.attachLocation")}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
```

- [ ] **Step 2: Write the form, edit card, editor and page**

Create `src/features/admin/components/quick-replies/QuickReplyForm.tsx`:

```tsx
"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "@/lib/i18n";
import type { WhatsappCannedReply } from "@/services/whatsapp/cannedReplies";
import type { CannedReplyAttachment } from "@/services/whatsapp/cannedReplyInput";
import {
  QUICK_REPLY_FIELDS,
  findUnknownFields,
  renderQuickReply,
  type QuickReplyField,
  type QuickReplyValues,
} from "@/services/whatsapp/quickReplyFields";
import { QuickReplyAttachmentField } from "./QuickReplyAttachmentField";

export const QUICK_REPLY_FORM_ID = "quick-reply-form";

const SAMPLE_VALUES: QuickReplyValues = {
  name: "Mona",
  next_appointment: "Wednesday 15 July 2026 at 10:00 am",
  appointment_service: "Teeth cleaning",
  clinic_address: "A 41 Ozone Medical Center, New Cairo",
  clinic_phone: "+20 111 192 2252",
  clinic_hours: "Sunday to Thursday, 10:00 to 18:00",
  maps_link: "https://www.google.com/maps?q=30.0074,31.4913",
};

type Props = {
  item: WhatsappCannedReply;
  categories: string[];
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  pending: boolean;
  message: string | null;
};

export function QuickReplyForm({ item, categories, onSubmit, pending, message }: Props) {
  const t = useTranslations();
  const [body, setBody] = useState(item.body);
  const [bodyAr, setBodyAr] = useState(item.body_ar ?? "");
  const [attachment, setAttachment] = useState<CannedReplyAttachment | null>(
    (item.attachment as CannedReplyAttachment | null) ?? null,
  );
  const [focused, setFocused] = useState<"body" | "body_ar">("body");
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const bodyArRef = useRef<HTMLTextAreaElement>(null);
  const unknown = useMemo(
    () => [...new Set([...findUnknownFields(body), ...findUnknownFields(bodyAr)])],
    [body, bodyAr],
  );

  function insertField(field: QuickReplyField) {
    const isEnglish = focused === "body";
    const el = isEnglish ? bodyRef.current : bodyArRef.current;
    const current = isEnglish ? body : bodyAr;
    const start = el?.selectionStart ?? current.length;
    const end = el?.selectionEnd ?? current.length;
    const token = `{{${field}}}`;
    (isEnglish ? setBody : setBodyAr)(current.slice(0, start) + token + current.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (unknown.length) return;
    const form = new FormData(event.currentTarget);
    await onSubmit({
      slash_key: String(form.get("slash_key") ?? ""),
      title: String(form.get("title") ?? ""),
      title_ar: String(form.get("title_ar") ?? ""),
      category: String(form.get("category") ?? ""),
      body,
      body_ar: bodyAr,
      attachment,
      active: form.get("active") === "on",
    });
  }

  return (
    <form id={QUICK_REPLY_FORM_ID} className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
      <div className="space-y-2">
        <Label htmlFor="slash_key">{t("admin.pages.quickReplies.slashKey")}</Label>
        <Input id="slash_key" name="slash_key" defaultValue={item.slash_key} pattern="[A-Za-z0-9_\-]+" required />
        <p className="text-xs text-muted-foreground">{t("admin.pages.quickReplies.slashKeyHint")}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">{t("admin.pages.quickReplies.titleEn")}</Label>
        <Input id="title" name="title" defaultValue={item.title} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="title_ar">{t("admin.pages.quickReplies.titleAr")}</Label>
        <Input id="title_ar" name="title_ar" defaultValue={item.title_ar ?? ""} dir="rtl" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">{t("admin.pages.quickReplies.category")}</Label>
        <Input id="category" name="category" defaultValue={item.category ?? ""} list="quick-reply-categories" />
        <datalist id="quick-reply-categories">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">{t("admin.pages.quickReplies.bodyEn")}</Label>
        <Textarea
          id="body"
          ref={bodyRef}
          rows={5}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onFocus={() => setFocused("body")}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body_ar">{t("admin.pages.quickReplies.bodyAr")}</Label>
        <Textarea
          id="body_ar"
          ref={bodyArRef}
          rows={5}
          dir="rtl"
          value={bodyAr}
          onChange={(event) => setBodyAr(event.target.value)}
          onFocus={() => setFocused("body_ar")}
        />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium">{t("admin.pages.quickReplies.insertField")}</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_REPLY_FIELDS.map((field) => (
            <Button
              key={field}
              type="button"
              variant="outline"
              size="sm"
              title={t(`admin.quickReplies.field.${field}` as const)}
              onClick={() => insertField(field)}
            >
              {`{{${field}}}`}
            </Button>
          ))}
        </div>
      </div>
      {unknown.length ? (
        <p role="alert" className="text-sm text-red-600">
          {t("admin.pages.quickReplies.unknownFields")} {unknown.map((field) => `{{${field}}}`).join(", ")}
        </p>
      ) : null}
      <div className="space-y-1 rounded-md bg-muted/50 p-3">
        <p className="text-xs font-medium text-muted-foreground">{t("admin.pages.quickReplies.preview")}</p>
        <p className="whitespace-pre-wrap text-sm">{renderQuickReply(body, SAMPLE_VALUES).text}</p>
        {bodyAr.trim() ? (
          <p dir="rtl" className="whitespace-pre-wrap text-sm">
            {renderQuickReply(bodyAr, SAMPLE_VALUES).text}
          </p>
        ) : null}
      </div>
      <QuickReplyAttachmentField value={attachment} onChange={setAttachment} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={item.active} />
        {t("admin.pages.quickReplies.active")}
      </label>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {pending ? <p className="text-sm text-muted-foreground">{t("admin.saving")}</p> : null}
    </form>
  );
}
```

Create `src/features/admin/components/quick-replies/QuickReplyEditCard.tsx`:

```tsx
"use client";

import { useTranslations } from "@/lib/i18n";
import type { WhatsappCannedReply } from "@/services/whatsapp/cannedReplies";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QUICK_REPLY_FORM_ID, QuickReplyForm } from "./QuickReplyForm";

type Props = {
  item: WhatsappCannedReply;
  categories: string[];
  pending: boolean;
  message: string | null;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onDeleteClick: () => void;
};

export function QuickReplyEditCard({ item, categories, pending, message, onSubmit, onDeleteClick }: Props) {
  const t = useTranslations();
  return (
    <Card className="gap-0 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium">{t("admin.edit")}</h2>
        <Button variant="destructive" size="sm" onClick={onDeleteClick}>
          {t("admin.delete")}
        </Button>
      </div>
      <QuickReplyForm
        key={item.id}
        item={item}
        categories={categories}
        onSubmit={onSubmit}
        pending={pending}
        message={message}
      />
      <Button className="mt-4 w-full" type="submit" form={QUICK_REPLY_FORM_ID} disabled={pending}>
        {pending ? t("admin.saving") : t("admin.save")}
      </Button>
    </Card>
  );
}
```

Create `src/features/admin/components/quick-replies/QuickRepliesEditor.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MapPin, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";
import type { WhatsappCannedReply } from "@/services/whatsapp/cannedReplies";
import { useBoardCrud } from "../../hooks/useBoardCrud";
import { CollectionSplitLayout } from "../CollectionSplitLayout";
import { CollectionTable } from "../CollectionTable";
import { ConfirmDeleteDialog } from "../ConfirmDeleteDialog";
import { LocalizedAdminPageHeader } from "../LocalizedAdminPageHeader";
import { QuickReplyEditCard } from "./QuickReplyEditCard";
import {
  QuickReplyApiError,
  createQuickReply,
  deleteQuickReply,
  updateQuickReply,
} from "./quickRepliesApi";

type Props = { items: WhatsappCannedReply[] };

export function QuickRepliesEditor({ items: initial }: Props) {
  const t = useTranslations();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const board = useBoardCrud<WhatsappCannedReply>({
    initial,
    create: (sort_order) =>
      createQuickReply({
        // A unique placeholder key, switched off: an unfinished reply must never
        // appear in a chat's / menu.
        slash_key: `new-${Date.now().toString(36)}`,
        title: t("admin.untitled"),
        body: t("admin.untitled"),
        sort_order,
        active: false,
      }),
    update: async (id, payload) => {
      try {
        const row = await updateQuickReply(id, payload);
        toast.success(t("admin.cms.saveSuccess"));
        return row;
      } catch (error) {
        if (error instanceof QuickReplyApiError && error.code === "SLASH_KEY_TAKEN") {
          throw new Error(t("admin.pages.quickReplies.slashKeyTaken"));
        }
        throw error;
      }
    },
    remove: deleteQuickReply,
  });

  const categories = useMemo(
    () =>
      [...new Set(board.items.map((reply) => reply.category?.trim()).filter((c): c is string => Boolean(c)))].sort(),
    [board.items],
  );

  return (
    <>
      <LocalizedAdminPageHeader
        titleKey="admin.pages.quickReplies.title"
        descriptionKey="admin.pages.quickReplies.description"
        actions={
          <Button onClick={() => void board.addItem()} disabled={board.pending}>
            {t("admin.pages.quickReplies.add")}
          </Button>
        }
      />
      <CollectionSplitLayout
        list={
          <div className="p-2">
            <CollectionTable
              tableId="whatsapp_canned_replies"
              rows={board.items}
              selectedId={board.selected?.id}
              emptyMessage={t("admin.pages.quickReplies.empty")}
              onRowClick={board.openItem}
              rowActions={[
                { id: "edit", label: t("admin.edit"), icon: "edit", onClick: (r) => board.openItem(r.id) },
                {
                  id: "delete",
                  label: t("admin.delete"),
                  icon: "delete",
                  tone: "danger",
                  onClick: (r) => {
                    board.openItem(r.id);
                    setDeleteOpen(true);
                  },
                },
              ]}
              columns={[
                {
                  key: "slash_key",
                  header: t("admin.pages.quickReplies.slashKey"),
                  sortValue: (r) => r.slash_key,
                  searchValue: (r) =>
                    `${r.slash_key} ${r.title} ${r.title_ar ?? ""} ${r.body} ${r.body_ar ?? ""} ${r.category ?? ""}`,
                  cell: (r) => `/${r.slash_key}`,
                },
                {
                  key: "title",
                  header: t("admin.pages.quickReplies.titleEn"),
                  sortValue: (r) => r.title,
                  cell: (r) => (
                    <span className="inline-flex items-center gap-1.5">
                      {r.title}
                      {r.attachment ? (
                        (r.attachment as { kind?: string }).kind === "location" ? (
                          <MapPin className="size-3.5 text-muted-foreground" aria-hidden />
                        ) : (
                          <Paperclip className="size-3.5 text-muted-foreground" aria-hidden />
                        )
                      ) : null}
                    </span>
                  ),
                },
                {
                  key: "category",
                  header: t("admin.pages.quickReplies.category"),
                  sortValue: (r) => r.category ?? "",
                  cell: (r) => r.category ?? "—",
                },
                {
                  key: "uses",
                  header: t("admin.pages.quickReplies.uses"),
                  sortValue: (r) => r.use_count,
                  cell: (r) => r.use_count,
                },
                {
                  key: "active",
                  header: t("admin.pages.quickReplies.active"),
                  sortValue: (r) => (r.active ? 1 : 0),
                  cell: (r) => (r.active ? t("admin.yes") : t("admin.no")),
                },
              ]}
            />
          </div>
        }
        detail={
          board.selected ? (
            <QuickReplyEditCard
              item={board.selected}
              categories={categories}
              pending={board.pending}
              message={board.message}
              onSubmit={board.onSave}
              onDeleteClick={() => setDeleteOpen(true)}
            />
          ) : null
        }
      />
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        pending={board.pending}
        onConfirm={() => {
          void board.onDelete();
          setDeleteOpen(false);
        }}
      />
    </>
  );
}
```

If `CollectionColumn.cell` is typed to return `string` instead of `ReactNode`, typecheck will say so. In that case, make the `title` cell return `r.title`, and add a separate `attachment` column whose cell returns `r.attachment ? "📎" : ""`.

Create `src/app/(internal)/admin/(dashboard)/quick-replies/page.tsx`:

```tsx
import { QuickRepliesEditor } from "@/features/admin/components/quick-replies/QuickRepliesEditor";
import { createClient } from "@/lib/supabase/server";
import { listCannedReplies } from "@/services/whatsapp/cannedReplies";

export const dynamic = "force-dynamic";

export default async function AdminQuickRepliesPage() {
  const supabase = await createClient();
  const items = await listCannedReplies(supabase, { activeOnly: false });
  return <QuickRepliesEditor items={items} />;
}
```

- [ ] **Step 3: Typecheck, lint and build**

Run: `GITHUB_TOKEN=x yarn typecheck && GITHUB_TOKEN=x yarn lint && GITHUB_TOKEN=x yarn build`
Expected: everything passes, and the build output lists `/admin/quick-replies`.

- [ ] **Step 4: Manual check**

Run `GITHUB_TOKEN=x yarn dev` and open `/admin/quick-replies` as the admin. Check each of these:
1. **List:** the 7 seeded replies appear, with categories and 0 uses.
2. **Add:** click "Add quick reply". A new row appears, switched off.
3. **Fields:** set the slash key `test`, click `{{name}}` in "Insert field", then type ` {{nmae}}`. The red unknown-fields line appears and Save does nothing. Fix the typo and Save. A "Saved" toast appears.
4. **Duplicate key:** change the slash key to `hello` and Save. The form shows "Another quick reply already uses this key."
5. **Attachments:**
   - Upload a PNG and Save, then reload. The attachment persists.
   - Choose "Clinic location pin" and Save. In Supabase Studio's `whatsapp-quick-replies` bucket, the PNG is gone.
   - Upload a file over 4 MB. The size error shows.
6. **Delete:** delete the test reply.
7. **Arabic:** switch the admin UI to Arabic. All text on the page is translated.

- [ ] **Step 5: Commit, then open PR 2**

```bash
git add src/features/admin/components/quick-replies "src/app/(internal)/admin/(dashboard)/quick-replies"
git commit -m "$(cat <<'EOF'
feat(admin): manage quick replies with fields, categories and attachments

Replaces the canned replies dialog that was never rendered.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

Phase 2 is done. Open PR 2 (based on PR 1), then `git switch -c feat/quick-replies-v2-composer`.

---

# Phase 3: Composer (PR 3)

### Task 9: Menu ranking, category and attachment icon

**Files:**
- Create: `src/features/admin/components/support/chat/quickReplyMenu.ts`
- Test: `src/features/admin/components/support/chat/quickReplyMenu.test.ts`
- Modify: `src/features/admin/components/support/chat/SlashCommandMenu.tsx`

**Interfaces:**
- **Consumes** from Task 5:
  - `CannedReplyAttachment`
- **Produces:**
  - `type QuickReplyMenuItem`
  - `sortQuickReplies<T extends QuickReplyMenuItem>(replies: T[]): T[]`
  - `matchesQuickReply(reply: QuickReplyMenuItem, query: string): boolean`
  - `CannedReply` (exported from `SlashCommandMenu.tsx`) becomes `{ id; slash_key; title; body; category: string | null; attachment: CannedReplyAttachment | null }`

- [ ] **Step 1: Write the failing test**

Create `src/features/admin/components/support/chat/quickReplyMenu.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { matchesQuickReply, sortQuickReplies } from "./quickReplyMenu.ts";

const reply = (id: string, use_count: number, sort_order: number, extra = {}) => ({
  id,
  slash_key: id,
  title: `Title ${id}`,
  body: "Body",
  use_count,
  sort_order,
  ...extra,
});

describe("sortQuickReplies", () => {
  it("lists the most used replies first", () => {
    const sorted = sortQuickReplies([reply("a", 1, 10), reply("b", 9, 20), reply("c", 4, 30)]);
    assert.deepEqual(sorted.map((r: { id: string }) => r.id), ["b", "c", "a"]);
  });

  it("keeps the staff-set order between replies used equally often", () => {
    const sorted = sortQuickReplies([reply("late", 0, 50), reply("early", 0, 10)]);
    assert.deepEqual(sorted.map((r: { id: string }) => r.id), ["early", "late"]);
  });

  it("does not reorder the array it was given", () => {
    const input = [reply("a", 0, 2), reply("b", 5, 1)];
    sortQuickReplies(input);
    assert.equal(input[0].id, "a");
  });
});

describe("matchesQuickReply", () => {
  it("matches everything for an empty query", () => {
    assert.equal(matchesQuickReply(reply("a", 0, 0), "  "), true);
  });

  it("matches the category", () => {
    assert.equal(matchesQuickReply(reply("a", 0, 0, { category: "Booking" }), "book"), true);
  });

  it("matches the Arabic title", () => {
    assert.equal(matchesQuickReply(reply("a", 0, 0, { title_ar: "حجز موعد" }), "حجز"), true);
  });

  it("does not match unrelated text", () => {
    assert.equal(matchesQuickReply(reply("a", 0, 0), "parking"), false);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/components/support/chat/quickReplyMenu.test.ts`
Expected: FAIL with `Cannot find module '.../quickReplyMenu.ts'`

- [ ] **Step 3: Write the implementation and update the menu**

Create `src/features/admin/components/support/chat/quickReplyMenu.ts`:

```ts
import type { CannedReplyAttachment } from "@/services/whatsapp/cannedReplyInput";

/** A quick reply row as the composer's / menu receives it from the API. */
export type QuickReplyMenuItem = {
  id: string;
  slash_key: string;
  title: string;
  title_ar?: string | null;
  body: string;
  body_ar?: string | null;
  category?: string | null;
  use_count?: number;
  sort_order?: number;
  attachment?: CannedReplyAttachment | null;
};

/** Most used first; ties keep the order staff set on the management page. */
export function sortQuickReplies<T extends QuickReplyMenuItem>(replies: T[]): T[] {
  return [...replies].sort(
    (a, b) =>
      (b.use_count ?? 0) - (a.use_count ?? 0) || (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
}

export function matchesQuickReply(reply: QuickReplyMenuItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [reply.slash_key, reply.title, reply.title_ar, reply.body, reply.body_ar, reply.category].some(
    (value) => (value ?? "").toLowerCase().includes(q),
  );
}
```

In `src/features/admin/components/support/chat/SlashCommandMenu.tsx`, make these edits:

1. Replace the imports block:

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n/pickLocalized";
import type { Locale } from "@/lib/i18n/LocaleProvider";
import { AdminInput } from "@/features/admin/ui";
```

with:

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, MapPin, Paperclip, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n/pickLocalized";
import type { Locale } from "@/lib/i18n/LocaleProvider";
import { AdminInput } from "@/features/admin/ui";
import type { CannedReplyAttachment } from "@/services/whatsapp/cannedReplyInput";
import {
  matchesQuickReply,
  sortQuickReplies,
  type QuickReplyMenuItem,
} from "./quickReplyMenu";
```

2. Replace the `CannedReply` and `RawCannedReply` types and the `localizeReply` function with:

```tsx
export type CannedReply = {
  id: string;
  slash_key: string;
  title: string;
  body: string;
  category: string | null;
  attachment: CannedReplyAttachment | null;
};

function localizeReply(r: QuickReplyMenuItem, locale: Locale): CannedReply {
  return {
    id: r.id,
    slash_key: r.slash_key,
    title: pickLocalized(locale, r.title, r.title_ar),
    body: pickLocalized(locale, r.body, r.body_ar),
    category: r.category ?? null,
    attachment: r.attachment ?? null,
  };
}
```

3. Replace `useState<RawCannedReply[]>` with `useState<QuickReplyMenuItem[]>`, and `d: { replies?: RawCannedReply[] }` with `d: { replies?: QuickReplyMenuItem[] }`.

4. Replace both the `localized` and `filtered` `useMemo` blocks with:

```tsx
  const filtered = useMemo(
    () =>
      sortQuickReplies(replies)
        .filter((r) => matchesQuickReply(r, search))
        .map((r) => localizeReply(r, contentLocale)),
    [contentLocale, replies, search],
  );
```

5. Replace the option row's first `<span>`:

```tsx
                <span className="font-medium text-[#111827]">
                  /{r.slash_key} · {r.title}
                </span>
```

with:

```tsx
                <span className="flex items-center gap-1.5 font-medium text-[#111827]">
                  <span className="truncate">
                    /{r.slash_key} · {r.title}
                  </span>
                  {r.attachment ? (
                    r.attachment.kind === "location" ? (
                      <MapPin className="size-3 shrink-0 text-[#6B7280]" aria-hidden />
                    ) : (
                      <Paperclip className="size-3 shrink-0 text-[#6B7280]" aria-hidden />
                    )
                  ) : null}
                  {r.category ? (
                    <span className="shrink-0 rounded bg-[#EEF2FF] px-1.5 py-px text-[10px] font-medium text-[#4338CA]">
                      {r.category}
                    </span>
                  ) : null}
                </span>
```

6. Directly after the closing `</div>` of `<div className="relative min-h-0">` (just before the outer `</div>` that closes the listbox), add:

```tsx
      <Link
        href="/admin/quick-replies"
        className="block shrink-0 border-t border-[#E5E7EB] px-3 py-2 text-xs font-medium text-[var(--admin-primary)] hover:bg-[#F3F4F6]"
      >
        {t("admin.frontDesk.cannedManage")}
      </Link>
```

7. Delete the unused `useSlashFiltered` export at the bottom of the file. `grep -rn useSlashFiltered src` finds no other usage.

- [ ] **Step 4: Run the test and typecheck**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/components/support/chat/quickReplyMenu.test.ts`
Expected: PASS

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: no errors. `ChatComposer.injectCanned` only reads `reply.body`, so the wider `CannedReply` type is compatible.

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/components/support/chat/quickReplyMenu.ts src/features/admin/components/support/chat/quickReplyMenu.test.ts src/features/admin/components/support/chat/SlashCommandMenu.tsx
git commit -m "$(cat <<'EOF'
feat(whatsapp): rank the / menu by use and show categories

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Plan the messages for a quick reply with an attachment

**Files:**
- Create: `src/features/admin/components/support/chat/quickReplySend.ts`
- Test: `src/features/admin/components/support/chat/quickReplySend.test.ts`

**Interfaces:**
- **Consumes** from Task 5:
  - `CannedReplyAttachment`
- **Produces:**
  - `WHATSAPP_CAPTION_LIMIT = 1024`
  - `type QuickReplySendStep = {kind:"text"; text} | {kind:"file"; caption} | {kind:"location"}`
  - `planQuickReplySend(text: string, attachment: CannedReplyAttachment | null): QuickReplySendStep[]`

- [ ] **Step 1: Write the failing test**

Create `src/features/admin/components/support/chat/quickReplySend.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { planQuickReplySend, WHATSAPP_CAPTION_LIMIT } from "./quickReplySend.ts";

const image = { kind: "image", mime: "image/png", path: "p.png", name: "p.png", size: 10 } as const;
const pdf = { kind: "document", mime: "application/pdf", path: "p.pdf", name: "p.pdf", size: 10 } as const;

describe("planQuickReplySend", () => {
  it("sends plain text when there is no attachment", () => {
    assert.deepEqual(planQuickReplySend("  Hello  ", null), [{ kind: "text", text: "Hello" }]);
  });

  it("sends nothing for empty text and no attachment", () => {
    assert.deepEqual(planQuickReplySend("   ", null), []);
  });

  it("sends a file with the text as its caption, as one message", () => {
    assert.deepEqual(planQuickReplySend("Our price list", pdf), [{ kind: "file", caption: "Our price list" }]);
  });

  it("keeps a caption of exactly the limit on the file", () => {
    const text = "x".repeat(WHATSAPP_CAPTION_LIMIT);
    assert.deepEqual(planQuickReplySend(text, image), [{ kind: "file", caption: text }]);
  });

  it("sends over-long text first, then the file without a caption", () => {
    const text = "x".repeat(WHATSAPP_CAPTION_LIMIT + 1);
    assert.deepEqual(planQuickReplySend(text, image), [
      { kind: "text", text },
      { kind: "file", caption: "" },
    ]);
  });

  it("sends the text before a location pin, which cannot carry a caption", () => {
    assert.deepEqual(planQuickReplySend("Find us here", { kind: "location" }), [
      { kind: "text", text: "Find us here" },
      { kind: "location" },
    ]);
  });

  it("sends only the pin when there is no text", () => {
    assert.deepEqual(planQuickReplySend("", { kind: "location" }), [{ kind: "location" }]);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/components/support/chat/quickReplySend.test.ts`
Expected: FAIL with `Cannot find module '.../quickReplySend.ts'`

- [ ] **Step 3: Write the minimal implementation**

Create `src/features/admin/components/support/chat/quickReplySend.ts`:

```ts
import type { CannedReplyAttachment } from "@/services/whatsapp/cannedReplyInput";

/** WhatsApp's caption limit for images and documents. */
export const WHATSAPP_CAPTION_LIMIT = 1024;

export type QuickReplySendStep =
  | { kind: "text"; text: string }
  | { kind: "file"; caption: string }
  | { kind: "location" };

/**
 * The messages one composer send becomes when a quick reply carries an attachment.
 *
 * A file takes the text as its caption, so the patient gets a single message.
 * Text over WhatsApp's caption limit would be rejected, so it goes first on its
 * own. A location pin cannot carry a caption at all.
 */
export function planQuickReplySend(
  text: string,
  attachment: CannedReplyAttachment | null,
): QuickReplySendStep[] {
  const body = text.trim();
  const textStep: QuickReplySendStep[] = body ? [{ kind: "text", text: body }] : [];
  if (!attachment) return textStep;
  if (attachment.kind === "location") return [...textStep, { kind: "location" }];
  if (body.length > WHATSAPP_CAPTION_LIMIT) return [...textStep, { kind: "file", caption: "" }];
  return [{ kind: "file", caption: body }];
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/components/support/chat/quickReplySend.test.ts`
Expected: PASS, 7 tests

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/components/support/chat/quickReplySend.ts src/features/admin/components/support/chat/quickReplySend.test.ts
git commit -m "$(cat <<'EOF'
feat(whatsapp): plan caption and message order for quick reply attachments

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Composer fills in fields, blocks unfinished sends, and sends attachments

**Files:**
- Create: `src/features/admin/components/support/chat/useQuickReplyValues.ts`
- Create: `src/features/admin/components/support/chat/QuickReplyComposerBar.tsx`
- Modify: `src/features/admin/components/support/chat/ChatComposer.tsx`
- Modify: `src/features/admin/components/support/SupportChatColumn.tsx`
- Modify: `src/features/admin/components/support/SupportInboxView.tsx`

**Interfaces:**
- **Consumes:**
  - Task 1: `findUnfilledFields`, `renderQuickReply`, `QuickReplyField`, `QuickReplyValues`
  - Task 5: `QUICK_REPLY_BUCKET`, `CannedReplyAttachment`
  - Task 6: the `/use` and `/context` routes
  - Task 9: `CannedReply` (now carries `attachment`)
  - Task 10: `planQuickReplySend`
  - Existing: `clinicLocationPin()` (`chat/clinicLocationPin.ts`)
- **Produces:**
  - `ChatComposer` and `SupportChatColumn` accept `onSend: (payload: ComposerSendPayload) => void | Promise<void>`
  - `useQuickReplyValues(conversationId?: string): (lang: "ar" | "en") => Promise<QuickReplyValues>`

- [ ] **Step 1: Write the values hook and the composer bar**

Create `src/features/admin/components/support/chat/useQuickReplyValues.ts`:

```ts
"use client";

import { useCallback, useRef } from "react";
import type { QuickReplyValues } from "@/services/whatsapp/quickReplyFields";

/** Long enough to avoid refetching on every reply, short enough to pick up a booking made mid-chat. */
const CACHE_MS = 60_000;

/**
 * Field values for the open conversation, per language.
 *
 * A failed lookup returns no values: every field then stays unfilled and the
 * composer blocks the send. Guessing is never an option for a patient message.
 */
export function useQuickReplyValues(conversationId: string | undefined) {
  const cache = useRef(new Map<string, { at: number; values: QuickReplyValues }>());

  return useCallback(
    async (lang: "ar" | "en"): Promise<QuickReplyValues> => {
      if (!conversationId) return {};
      const key = `${conversationId}:${lang}`;
      const hit = cache.current.get(key);
      if (hit && Date.now() - hit.at < CACHE_MS) return hit.values;
      try {
        const res = await fetch(
          `/api/v1/whatsapp/canned-replies/context?conversationId=${encodeURIComponent(conversationId)}&lang=${lang}`,
        );
        if (!res.ok) return {};
        const data = (await res.json()) as { values?: QuickReplyValues };
        const values = data.values ?? {};
        cache.current.set(key, { at: Date.now(), values });
        return values;
      } catch {
        return {};
      }
    },
    [conversationId],
  );
}
```

Create `src/features/admin/components/support/chat/QuickReplyComposerBar.tsx`:

```tsx
"use client";

import { AlertTriangle, FileText, ImageIcon, MapPin, X } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import type { CannedReplyAttachment } from "@/services/whatsapp/cannedReplyInput";
import type { QuickReplyField } from "@/services/whatsapp/quickReplyFields";

type Props = {
  unfilled: QuickReplyField[];
  attachment: CannedReplyAttachment | null;
  onRemoveAttachment: () => void;
};

export function QuickReplyComposerBar({ unfilled, attachment, onRemoveAttachment }: Props) {
  const t = useTranslations();
  if (!unfilled.length && !attachment) return null;
  const Icon = attachment?.kind === "location" ? MapPin : attachment?.kind === "image" ? ImageIcon : FileText;

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
      {unfilled.length ? (
        <p
          role="status"
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-800 ring-1 ring-amber-200"
        >
          <AlertTriangle className="size-3.5" aria-hidden />
          {t("admin.frontDesk.fillInBeforeSending")}{" "}
          {unfilled.map((field) => t(`admin.quickReplies.field.${field}` as const)).join(", ")}
        </p>
      ) : null}
      {attachment ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[#374151] ring-1 ring-[#E5E7EB]">
          <Icon className="size-3.5" aria-hidden />
          {t("admin.frontDesk.quickReplyAttachment")}{" "}
          {attachment.kind === "location" ? t("admin.pages.quickReplies.attachLocation") : attachment.name}
          <button
            type="button"
            aria-label={t("admin.pages.quickReplies.attachRemove")}
            onClick={onRemoveAttachment}
            className="rounded-full p-0.5 hover:bg-black/5"
          >
            <X className="size-3" />
          </button>
        </span>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Wire it into `ChatComposer.tsx`**

In `src/features/admin/components/support/chat/ChatComposer.tsx`:

1. After the line `import { Mic, Plus, Send, Smile } from "lucide-react";`, add:

```tsx
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  QUICK_REPLY_BUCKET,
  type CannedReplyAttachment,
} from "@/services/whatsapp/cannedReplyInput";
import {
  findUnfilledFields,
  renderQuickReply,
} from "@/services/whatsapp/quickReplyFields";
import { clinicLocationPin } from "./clinicLocationPin";
import { QuickReplyComposerBar } from "./QuickReplyComposerBar";
import { planQuickReplySend } from "./quickReplySend";
import { useQuickReplyValues } from "./useQuickReplyValues";
```

2. In `type Props`, change `onSend: (payload: ComposerSendPayload) => void;` to:

```tsx
  /** May return a promise; multi-message quick replies wait for each send in turn. */
  onSend: (payload: ComposerSendPayload) => void | Promise<void>;
```

3. Directly after `const [slashIndex, setSlashIndex] = useState(0);`, add:

```tsx
  const [quickAttachment, setQuickAttachment] =
    useState<CannedReplyAttachment | null>(null);
  const loadQuickReplyValues = useQuickReplyValues(conversationId);
  const unfilled = useMemo(() => findUnfilledFields(draft), [draft]);
  // A known {{field}} anywhere in the draft — from a reply or typed by hand —
  // means the message is unfinished. It must not reach a patient.
  const blocked = unfilled.length > 0;
```

4. Replace the `canSend` declaration with:

```tsx
  const canSend =
    Boolean(draft.trim()) ||
    Boolean(quickAttachment) ||
    interactive?.mode === "buttons" ||
    interactive?.mode === "cta";
```

5. Replace the whole `injectCanned` function with:

```tsx
  async function injectCanned(reply: CannedReply) {
    if (!slash) return;
    const before = draft.slice(0, slash.start);
    const after = draft.slice(slash.start + 1 + slash.query.length);
    void fetch(`/api/v1/whatsapp/canned-replies/${reply.id}/use`, {
      method: "POST",
    }).catch(() => undefined);
    const values = await loadQuickReplyValues(inputLocale);
    updateDraft(`${before}${renderQuickReply(reply.body, values).text}${after}`);
    if (reply.attachment) setQuickAttachment(reply.attachment);
  }

  async function sendWithAttachment(
    text: string,
    attachment: CannedReplyAttachment,
  ) {
    let file: File | null = null;
    if (attachment.kind !== "location") {
      const { data, error } = await createClient()
        .storage.from(QUICK_REPLY_BUCKET)
        .download(attachment.path);
      if (error || !data) {
        // Keep the draft and the chip: staff can retry or remove the attachment.
        toast.error(t("admin.frontDesk.quickReplyAttachmentFail"));
        return;
      }
      file = new File([data], attachment.name, { type: attachment.mime });
    }

    const steps = planQuickReplySend(text, attachment);
    onDraftChange("");
    setQuickAttachment(null);
    for (const [index, step] of steps.entries()) {
      // Only the first message quotes the reply-to, as a single send would.
      const prepare = (payload: ComposerSendPayload) =>
        index === 0 ? withReply(payload) : payload;
      if (step.kind === "text") {
        await onSend(prepare({ kind: "text", text: step.text }));
      } else if (step.kind === "location") {
        const pin = clinicLocationPin();
        await onSend(
          prepare({
            kind: "location",
            text: pin.address,
            location: pin,
            flow: {
              kind: "location",
              title: pin.name,
              address: pin.address,
              latitude: pin.latitude,
              longitude: pin.longitude,
            },
          }),
        );
      } else if (file) {
        const url = URL.createObjectURL(file);
        await onSend(
          prepare({
            kind: attachment.kind === "image" ? "image" : "document",
            file,
            text: step.caption || undefined,
            localMedia: [{ url, mime: file.type, name: file.name, size: file.size }],
          }),
        );
      }
    }
    onClearReply?.();
  }
```

6. Change `function submitText() {` to `async function submitText() {`, and make its first lines:

```tsx
  async function submitText() {
    if (blocked) return;
    const text = draft.trim();
```

7. In `submitText`, replace the final plain-text block:

```tsx
    if (!text) return;
    onSend(withReply({ kind: "text", text }));
```

with:

```tsx
    if (quickAttachment) {
      await sendWithAttachment(text, quickAttachment);
      return;
    }
    if (!text) return;
    onSend(withReply({ kind: "text", text }));
```

8. In the `SlashCommandMenu` JSX, change `onSelect={injectCanned}` to:

```tsx
                  onSelect={(reply) => void injectCanned(reply)}
```

9. Directly after `<InteractiveBuilder value={interactive} onChange={setInteractive} />`, add:

```tsx
            <QuickReplyComposerBar
              unfilled={unfilled}
              attachment={quickAttachment}
              onRemoveAttachment={() => setQuickAttachment(null)}
            />
```

10. In the textarea `onKeyDown`, replace the final block:

```tsx
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submitText();
                      }
```

with:

```tsx
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void submitText();
                      }
```

11. On the Send `<button>`, change `disabled={disabled}` to `disabled={disabled || blocked}` and `onClick={submitText}` to `onClick={() => void submitText()}`.

- [ ] **Step 3: Let the inbox wait for each send**

In `src/features/admin/components/support/SupportChatColumn.tsx`, change `onSend: (payload: ComposerSendPayload) => void;` to:

```tsx
  onSend: (payload: ComposerSendPayload) => void | Promise<void>;
```

In `src/features/admin/components/support/SupportInboxView.tsx`, the same block appears twice (around lines 986 and 1091):

```tsx
                onSend={(payload) => {
                  if (sending) return;
                  void handleSend(payload);
                }}
```

Replace both with:

```tsx
                onSend={(payload) => {
                  if (sending) return;
                  // Returned so a quick reply's text, file and pin go out in order.
                  return handleSend(payload);
                }}
```

`handleSend` already catches its own errors and marks the message failed, so awaiting it never throws into the composer.

- [ ] **Step 4: Typecheck, lint, test and check by hand**

Run: `GITHUB_TOKEN=x yarn typecheck && GITHUB_TOKEN=x yarn lint && GITHUB_TOKEN=x yarn test`
Expected: everything passes

Manual check with `GITHUB_TOKEN=x yarn dev` in `/admin/support`, on a real conversation. On the Kapso test number only, with the 24h window open:
1. Type `/visit` and press Enter. The first name is filled in. With no upcoming reservation, `{{next_appointment}}` stays, the amber "Fill in before sending: next appointment" chip shows, the Send button is disabled and Enter does nothing.
2. Replace the marker with a date. The chip disappears and Send works.
3. Type `{{clinic_hours}}` by hand. Send is disabled again.
4. Give a reply a PDF attachment on `/admin/quick-replies`, then use it. The "Sends with …pdf" chip shows. On send, the patient receives the PDF with the text as its caption.
5. Give a reply the clinic location pin. The text arrives first, then the pin.
6. Remove the chip before sending. Only the text is sent.
7. Type `/` with the keyboard in Arabic. The menu shows Arabic replies, and fields fill in Arabic.
8. The most-used reply moves to the top the next time the menu opens.

- [ ] **Step 5: Commit, then open PR 3**

```bash
git add src/features/admin/components/support/chat/useQuickReplyValues.ts src/features/admin/components/support/chat/QuickReplyComposerBar.tsx src/features/admin/components/support/chat/ChatComposer.tsx src/features/admin/components/support/SupportChatColumn.tsx src/features/admin/components/support/SupportInboxView.tsx
git commit -m "$(cat <<'EOF'
feat(whatsapp): fill quick reply fields and send their attachments

The composer refuses to send while a known {{field}} is still in the text.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

Phase 3 is done. Open PR 3, then `git switch -c feat/quick-replies-v2-save`.

---

# Phase 4: Save from chat, and e2e (PR 4)

### Task 12: "Save as quick reply" from a sent message

**Files:**
- Create: `src/features/admin/components/support/chat/quickReplyFromMessage.ts`
- Test: `src/features/admin/components/support/chat/quickReplyFromMessage.test.ts`
- Create: `src/features/admin/components/support/chat/SaveQuickReplyDialog.tsx`
- Modify: `src/features/admin/components/support/chat/ChatMessageBubble.tsx`
- Modify: `src/features/admin/components/support/SupportChatColumn.tsx`

**Interfaces:**
- **Consumes:**
  - Task 8: `createQuickReply`, `QuickReplyApiError`
  - Task 7: the text keys
  - Existing: `lastStrongLocale(text): "ar" | "en" | null` (`chat/textDirection.ts`)
- **Produces:**
  - `quickReplyFromMessage(text: string, input: { slashKey: string; title: string; category: string }): { slash_key; title; category: string | null; body: string; body_ar: string | null }`
  - `ChatMessageBubble` prop `onSaveAsQuickReply?: (message: SupportMessage) => void`

- [ ] **Step 1: Write the failing test**

Create `src/features/admin/components/support/chat/quickReplyFromMessage.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { quickReplyFromMessage } from "./quickReplyFromMessage.ts";

const form = { slashKey: " Parking ", title: " Parking ", category: " " };

describe("quickReplyFromMessage", () => {
  it("files an English message under the English body only", () => {
    const payload = quickReplyFromMessage("  Free parking under the building. ", form);
    assert.equal(payload.body, "Free parking under the building.");
    assert.equal(payload.body_ar, null);
  });

  it("files an Arabic message under both bodies, since English is required", () => {
    const payload = quickReplyFromMessage("يوجد جراج مجاني أسفل المبنى.", form);
    assert.equal(payload.body_ar, "يوجد جراج مجاني أسفل المبنى.");
    assert.equal(payload.body, "يوجد جراج مجاني أسفل المبنى.");
  });

  it("normalises the key, trims the title and stores a blank category as null", () => {
    const payload = quickReplyFromMessage("x", form);
    assert.equal(payload.slash_key, "parking");
    assert.equal(payload.title, "Parking");
    assert.equal(payload.category, null);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/components/support/chat/quickReplyFromMessage.test.ts`
Expected: FAIL with `Cannot find module '.../quickReplyFromMessage.ts'`

- [ ] **Step 3: Write the implementation and UI**

Create `src/features/admin/components/support/chat/quickReplyFromMessage.ts`:

```ts
import { lastStrongLocale } from "./textDirection";

/**
 * A create payload from a message staff already sent.
 *
 * The English body is required, so an Arabic message fills both bodies: the
 * reply works straight away, and staff can add an English version later.
 */
export function quickReplyFromMessage(
  text: string,
  input: { slashKey: string; title: string; category: string },
) {
  const body = text.trim();
  return {
    slash_key: input.slashKey.trim().toLowerCase(),
    title: input.title.trim(),
    category: input.category.trim() || null,
    body,
    body_ar: lastStrongLocale(body) === "ar" ? body : null,
  };
}
```

Create `src/features/admin/components/support/chat/SaveQuickReplyDialog.tsx`:

```tsx
"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/lib/i18n";
import {
  QuickReplyApiError,
  createQuickReply,
} from "@/features/admin/components/quick-replies/quickRepliesApi";
import { quickReplyFromMessage } from "./quickReplyFromMessage";
import type { SupportMessage } from "../supportDummyData";

type Props = {
  message: SupportMessage | null;
  onOpenChange: (open: boolean) => void;
};

export function SaveQuickReplyDialog({ message, onOpenChange }: Props) {
  const t = useTranslations();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      await createQuickReply(
        quickReplyFromMessage(message.body, {
          slashKey: String(form.get("slash_key") ?? ""),
          title: String(form.get("title") ?? ""),
          category: String(form.get("category") ?? ""),
        }),
      );
      toast.success(t("admin.frontDesk.savedAsQuickReply"));
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof QuickReplyApiError && err.code === "SLASH_KEY_TAKEN"
          ? t("admin.pages.quickReplies.slashKeyTaken")
          : t("admin.frontDesk.saveQuickReplyFail"),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={Boolean(message)}
      onOpenChange={(open) => {
        if (!open) setError(null);
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.frontDesk.saveAsQuickReply")}</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(event) => void handleSubmit(event)}>
          <p className="line-clamp-4 whitespace-pre-wrap rounded-md bg-[#F3F4F6] px-3 py-2 text-sm">
            {message?.body}
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="save-qr-slash">{t("admin.pages.quickReplies.slashKey")}</Label>
            <Input id="save-qr-slash" name="slash_key" pattern="[A-Za-z0-9_\-]+" required />
            <p className="text-xs text-muted-foreground">{t("admin.pages.quickReplies.slashKeyHint")}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="save-qr-title">{t("admin.pages.quickReplies.titleEn")}</Label>
            <Input id="save-qr-title" name="title" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="save-qr-category">{t("admin.pages.quickReplies.category")}</Label>
            <Input id="save-qr-category" name="category" />
          </div>
          {error ? (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t("admin.saving") : t("admin.save")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

In `src/features/admin/components/support/chat/ChatMessageBubble.tsx`:

1. Change `import { Reply } from "lucide-react";` to `import { BookmarkPlus, Reply } from "lucide-react";`

2. In `type Props`, after `onReply?: (message: SupportMessage) => void;`, add:

```tsx
  onSaveAsQuickReply?: (message: SupportMessage) => void;
```

3. In the destructured parameters, after `onReply,`, add `onSaveAsQuickReply,`.

4. After `const bodyDir = textDirection(body || "");`, add:

```tsx
  // Only plain text staff or the assistant sent: that is what a quick reply can hold.
  const canSaveAsQuickReply =
    Boolean(onSaveAsQuickReply) &&
    isAgent &&
    Boolean(body.trim()) &&
    (!m.messageType || m.messageType === "text");
```

5. Replace the footer's left side:

```tsx
            {onReply ? (
              <button
                type="button"
                onClick={startReply}
                className="inline-flex items-center gap-1 rounded px-1 py-0.5 font-medium text-[#6B7280] opacity-70 hover:bg-black/5 hover:text-[#111827] hover:opacity-100 group-hover:opacity-100"
                aria-label={t("admin.frontDesk.reply")}
              >
                <Reply className="h-3 w-3" />
                {t("admin.frontDesk.reply")}
              </button>
            ) : (
              <span />
            )}
```

with:

```tsx
            <span className="inline-flex items-center gap-1">
              {onReply ? (
                <button
                  type="button"
                  onClick={startReply}
                  className="inline-flex items-center gap-1 rounded px-1 py-0.5 font-medium text-[#6B7280] opacity-70 hover:bg-black/5 hover:text-[#111827] hover:opacity-100 group-hover:opacity-100"
                  aria-label={t("admin.frontDesk.reply")}
                >
                  <Reply className="h-3 w-3" />
                  {t("admin.frontDesk.reply")}
                </button>
              ) : null}
              {canSaveAsQuickReply ? (
                <button
                  type="button"
                  onClick={() => onSaveAsQuickReply?.(m)}
                  className="inline-flex items-center rounded p-1 text-[#6B7280] opacity-70 hover:bg-black/5 hover:text-[#111827] hover:opacity-100 group-hover:opacity-100"
                  aria-label={t("admin.frontDesk.saveAsQuickReply")}
                  title={t("admin.frontDesk.saveAsQuickReply")}
                >
                  <BookmarkPlus className="h-3 w-3" />
                </button>
              ) : null}
            </span>
```

In `src/features/admin/components/support/SupportChatColumn.tsx`:

1. After `import { AiDraftCard } from "./chat/AiDraftCard";`, add:

```tsx
import { SaveQuickReplyDialog } from "./chat/SaveQuickReplyDialog";
```

2. In the component body, next to its other `useState` calls, add:

```tsx
  const [saveQuickReplyFrom, setSaveQuickReplyFrom] = useState<SupportMessage | null>(null);
```

3. In the `<ChatMessageBubble` JSX, after `onReply={onReply}`, add:

```tsx
            onSaveAsQuickReply={setSaveQuickReplyFrom}
```

4. Directly before the closing `</section>`, add:

```tsx
      <SaveQuickReplyDialog
        message={saveQuickReplyFrom}
        onOpenChange={(open) => {
          if (!open) setSaveQuickReplyFrom(null);
        }}
      />
```

- [ ] **Step 4: Run the tests, typecheck and check by hand**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/components/support/chat/quickReplyFromMessage.test.ts`
Expected: PASS

Run: `GITHUB_TOKEN=x yarn typecheck && GITHUB_TOKEN=x yarn lint`
Expected: no errors

Manual check in `/admin/support`:
1. Hover a sent text message. The bookmark icon shows. It does not show on patient messages, images or voice notes.
2. Save a message with key `parking`. A toast confirms it, and `/parking` now appears in the `/` menu.
3. Save another message with key `hello`. The dialog shows "Another quick reply already uses this key."

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/components/support/chat/quickReplyFromMessage.ts src/features/admin/components/support/chat/quickReplyFromMessage.test.ts src/features/admin/components/support/chat/SaveQuickReplyDialog.tsx src/features/admin/components/support/chat/ChatMessageBubble.tsx src/features/admin/components/support/SupportChatColumn.tsx
git commit -m "$(cat <<'EOF'
feat(whatsapp): save a sent message as a quick reply

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: End-to-end test

**Files:**
- Create: `e2e/helpers/inbound.ts`
- Modify: `e2e/autoreply.spec.ts` (use the helper instead of its local copies)
- Create: `e2e/quick-replies.spec.ts`

**Interfaces:**
- **Consumes:**
  - Everything above
  - `seedE2E`, `serviceClient`, `conversationByPhone`, `messagesFor` and `setAiMode` (`e2e/helpers/seed.ts`)
  - `inboundTextEvent` and `signWebhookBody` (`e2e/helpers/signWebhook.ts`)
- **Produces:**
  - `uniquePhone(): string`
  - `deliverInbound(request, phone, text)`

The attachment send is not tested end to end. With `E2E_FAKE_KAPSO=1`, only `sendKapso` is faked, while the send route's media upload (`uploadMediaFile`) would still call Kapso. Attachments are covered by the `quickReplySend` unit test and the manual check in Task 11.

- [ ] **Step 1: Move the inbound helpers**

Create `e2e/helpers/inbound.ts`:

```ts
import type { APIRequestContext } from "@playwright/test";
import { inboundTextEvent, signWebhookBody } from "./signWebhook";

/**
 * A distinct number per test, so each gets its own conversation. Sharing one
 * conversation makes "how many AI replies exist" ambiguous across tests.
 */
export function uniquePhone() {
  return `+2010${String(Date.now()).slice(-7)}${Math.floor(Math.random() * 10)}`;
}

/** Deliver a signed inbound text message through the real webhook route. */
export async function deliverInbound(request: APIRequestContext, phone: string, text: string) {
  const body = JSON.stringify(inboundTextEvent({ phone, text }));
  return request.post("/api/v1/whatsapp/webhook", {
    headers: {
      "content-type": "application/json",
      "x-webhook-event": "whatsapp.message.received",
      "x-webhook-signature": signWebhookBody(body),
      "x-idempotency-key": `e2e-${Date.now()}-${Math.random()}`,
    },
    data: body,
  });
}
```

In `e2e/autoreply.spec.ts`:
- Delete its local `uniquePhone` and `deliverInbound` functions.
- Replace `import { inboundTextEvent, signWebhookBody } from "./helpers/signWebhook";` with:

```ts
import { deliverInbound, uniquePhone } from "./helpers/inbound";
import { inboundTextEvent } from "./helpers/signWebhook";
```

Keep `inboundTextEvent`: the "rejects an unsigned webhook" test still builds a body with it. If `signWebhookBody` is still used elsewhere in the file, keep that import too. `yarn typecheck` reports any unused import.

- [ ] **Step 2: Write the spec**

Create `e2e/quick-replies.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { deliverInbound, uniquePhone } from "./helpers/inbound";
import {
  conversationByPhone,
  messagesFor,
  seedE2E,
  serviceClient,
  setAiMode,
} from "./helpers/seed";

const SLASH_KEY = "e2e-visit";

test.describe("quick replies", () => {
  test.beforeEach(async () => {
    await seedE2E();
    // The responder must not reply on its own and change what the thread shows.
    await setAiMode("off");
    const { error } = await serviceClient()
      .from("whatsapp_canned_replies")
      .upsert(
        {
          slash_key: SLASH_KEY,
          title: "E2E visit",
          body: "Hi {{name}}, see you on {{next_appointment}}.",
          category: "E2E",
          active: true,
          attachment: null,
          sort_order: 1,
        },
        { onConflict: "slash_key" },
      );
    if (error) throw error;
  });

  test("lists quick replies on the management page", async ({ page }) => {
    await page.goto("/admin/quick-replies");
    await expect(page.getByText(`/${SLASH_KEY}`)).toBeVisible();
  });

  test("fills known fields and blocks sending until the rest are replaced", async ({ page, request }) => {
    const phone = uniquePhone();
    expect((await deliverInbound(request, phone, "hello")).ok()).toBeTruthy();
    const conversation = await conversationByPhone(phone);
    expect(conversation).not.toBeNull();

    await page.goto("/admin/support");
    await page.locator(`[data-conversation-id="${conversation!.id}"]`).first().click();

    const composer = page.getByLabel("Message", { exact: true });
    await composer.fill(`/${SLASH_KEY}`);
    await page.getByRole("option", { name: new RegExp(SLASH_KEY) }).click();

    // "E2E Patient" is the webhook's contact name; this new number has no reservation.
    await expect(composer).toHaveValue("Hi E2E, see you on {{next_appointment}}.");
    await expect(page.getByRole("status").filter({ hasText: "next appointment" })).toBeVisible();
    const send = page.getByRole("button", { name: "Send", exact: true });
    await expect(send).toBeDisabled();
    await composer.press("Enter");
    expect((await messagesFor(conversation!.id)).some((m) => m.direction === "outbound")).toBe(false);

    await composer.fill("Hi E2E, see you on Tuesday.");
    await expect(send).toBeEnabled();
    await send.click();

    await expect
      .poll(
        async () =>
          (await messagesFor(conversation!.id)).some(
            (m) => m.direction === "outbound" && m.body === "Hi E2E, see you on Tuesday.",
          ),
        { timeout: 15_000 },
      )
      .toBe(true);
  });
});
```

- [ ] **Step 3: Run the e2e suite**

This needs the local Supabase stack running with Task 4's migration applied, and `.env.e2e` filled in (see `playwright.config.ts`).

Run: `GITHUB_TOKEN=x yarn e2e e2e/quick-replies.spec.ts e2e/autoreply.spec.ts`
Expected: all tests pass. That includes the unchanged auto-responder tests, which confirms the helper move broke nothing.

If the Send button lookup fails, the composer is showing the mic button instead of Send. That means `canSend` is false, which happens only when the draft is empty, so check that the `fill` calls landed.

- [ ] **Step 4: Run the full verification**

Run: `GITHUB_TOKEN=x yarn typecheck && GITHUB_TOKEN=x yarn lint && GITHUB_TOKEN=x yarn test && GITHUB_TOKEN=x yarn build`
Expected: everything passes. Keep the output for `haac-core:verification-before-completion`.

- [ ] **Step 5: Commit, then open PR 4**

```bash
git add e2e/helpers/inbound.ts e2e/autoreply.spec.ts e2e/quick-replies.spec.ts
git commit -m "$(cat <<'EOF'
test(e2e): quick replies fill fields and block unfinished sends

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

Phase 4 is done. Run `haac-core:verification-before-completion` and `haac-core:requesting-code-review`, then open PR 4.

**Before merging PR 1 to production:** ask the user to confirm `supabase db push --linked`. It applies `20260911190000_whatsapp_quick_replies_v2.sql` to the shared project `puibdsyokgjdvkkousil`. Do not run it without that confirmation.
