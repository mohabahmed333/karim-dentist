# Quick Reply Buttons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use haac-core:subagent-driven-development (recommended) or haac-core:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A saved WhatsApp quick reply can carry up to 3 reply buttons, each with an English label and an optional Arabic one. Staff edit them on `/admin/quick-replies`. Typing `/key` inserts the text and the buttons. A reply that also has an attachment sends the attachment first, then the text with its buttons.

**Architecture:**
- **Storage and validation.** Buttons are stored in a `buttons jsonb` column on `whatsapp_canned_replies` and validated by zod, which shares a pure label-problem checker with the editor.
- **Menu.** The `/` menu localizes button labels to the language of the inserted body and gives them stable ids (`qr_<slash_key>_<n>`).
- **Composer.** The composer's button draft moves up into `SupportInboxView`, stored per conversation next to drafts and attachments. Sending goes through the pure `planQuickReplySend`, which now has a `buttons` step.
- **Send route.** It rejects a button message WhatsApp would refuse, returning a clear 400.

**Tech Stack:** Next.js 16.3 (App Router), React 19, Supabase (Postgres, RLS), zod 4, `node:test` unit tests (`scripts/test.sh`), Playwright e2e with a local-only `.env.e2e`.

**Spec:** [docs/superpowers/specs/2026-09-11-quick-reply-buttons-design.md](../specs/2026-09-11-quick-reply-buttons-design.md)

## Global Constraints

**Git**
- Work directly on `main`. Before every commit, `git branch --show-current` must print `main`.
- There is no feature branch and no Jira key; the user said so.
- Other sessions commit to `main` at the same time:
  - Stage explicit paths only. Never run `git add -A` or `git add .`.
  - Never stash, reset, rebase or amend.
  - Never stage files you didn't change.
- Never push to GitHub.
- End every commit message with `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.

**Environments**
- `.env.local` points at PRODUCTION Supabase and real WhatsApp. Any build, app run or e2e run must load the local-only env in the same shell:
  `bash -c 'set -a; . ./.env.e2e; set +a; GITHUB_TOKEN=x yarn …'`
- Before e2e, confirm nothing listens on port 3100: `lsof -nP -iTCP:3100 -sTCP:LISTEN`.
- Never run `supabase db push`, `supabase link` or `supabase db reset`. Task 9 is the only exception, and the controller runs it. The local database is changed only with `supabase migration up --local`.

**Tooling**
- yarn needs the prefix `GITHUB_TOKEN=x`.
- Unit tests live next to the source as `*.test.ts`. They import the module under test with a `.ts` extension, preceded by `// @ts-expect-error -- Node strip-types needs the extension.`
- Run a single test file with:
  `node --experimental-strip-types --import ./scripts/test-loader.mjs --test <file>`

**Lint**
- A task must add NO new lint problems compared with its base commit, and must never add eslint-disable comments. Repo-wide `yarn lint` already fails on unrelated files; ignore that.
- Compare per file with `eslint -f json`, by (file, severity, ruleId), using a bash array of file paths. zsh does not word-split, and ESLint 9 has no `unix` formatter.
- Known pre-existing problems (measured at `a40d616`; re-measure at the task base if a file changed since):

  | File | Pre-existing problems |
  |---|---|
  | `SlashCommandMenu.tsx` | 1 error `react-hooks/set-state-in-effect` |
  | `SupportChatColumn.tsx` | 1 error `react-hooks/set-state-in-effect`, 1 warning `react-hooks/exhaustive-deps` |
  | `SupportInboxView.tsx` | 3 errors `react-hooks/immutability`, 1 error `react-hooks/refs`, 3 errors `react-hooks/set-state-in-effect` |
  | Every other file this plan touches | 0 |

**Limits** (verbatim from the spec)
- At most 3 buttons.
- Button title 1–20 characters. Arabic title 0–20 characters; blank is stored as null.
- WhatsApp interactive body at most 1024 characters.
- Saved button ids are `qr_<slash_key>_<n>` (n = 1..3). Buttons added by hand keep `btn_<n>`.

**Composer rules** (verbatim from the spec)
- Choosing a reply WITH buttons sets the draft to `{ mode: "buttons", labels, ids, fromQuickReply: true }`, replacing any existing buttons draft.
- Choosing a reply WITHOUT buttons removes the draft only if it came from a quick reply. A draft built by hand, buttons or CTA, is kept.
- Clearing the message box removes a draft that came from a quick reply. This happens inside `updateDraft`, not in an effect.

**Migration file name:** `20260911210000_whatsapp_quick_reply_buttons.sql`

**Unit test count on `main` at `b371c9e`:** 1170 passing. Each task below says how many tests it adds. If other sessions add tests to `main`, only the delta and "0 failures" matter.

---

### Task 1: Migration and database types

**Files:**
- Create: `supabase/migrations/20260911210000_whatsapp_quick_reply_buttons.sql`
- Modify: `src/lib/supabase/database.types.ts` (the `whatsapp_canned_replies` block, lines ~500/516/532)

**Interfaces:**
- Consumes: nothing
- Produces:
  - column `whatsapp_canned_replies.buttons jsonb` (nullable)
  - constraint `whatsapp_canned_replies_buttons_shape`
  - type `buttons: Json | null` in `Row`, and `buttons?: Json | null` in `Insert` and `Update`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260911210000_whatsapp_quick_reply_buttons.sql`:

```sql
-- Quick reply buttons: up to 3 reply buttons saved on a quick reply.
-- Each item is {"title": text (1-20), "title_ar": text | null}; labels are
-- validated in the app (length, uniqueness, no {{fields}}).
-- Rollback:
--   ALTER TABLE public.whatsapp_canned_replies DROP CONSTRAINT IF EXISTS whatsapp_canned_replies_buttons_shape;
--   ALTER TABLE public.whatsapp_canned_replies DROP COLUMN IF EXISTS buttons;

ALTER TABLE public.whatsapp_canned_replies
  ADD COLUMN IF NOT EXISTS buttons jsonb;

ALTER TABLE public.whatsapp_canned_replies
  DROP CONSTRAINT IF EXISTS whatsapp_canned_replies_buttons_shape;

-- CASE, not AND: SQL doesn't promise short-circuit evaluation, and
-- jsonb_array_length raises on a non-array.
ALTER TABLE public.whatsapp_canned_replies
  ADD CONSTRAINT whatsapp_canned_replies_buttons_shape
  CHECK (
    buttons IS NULL
    OR CASE
      WHEN jsonb_typeof(buttons) = 'array' THEN jsonb_array_length(buttons) BETWEEN 1 AND 3
      ELSE false
    END
  );
```

- [ ] **Step 2: Apply it to the LOCAL database and prove the constraint works**

Run: `supabase migration up --local`
Expected: `Applying migration 20260911210000_whatsapp_quick_reply_buttons.sql...`

Run:
```bash
docker exec supabase_db_puibdsyokgjdvkkousil psql -U postgres -d postgres -tAc "SELECT column_name FROM information_schema.columns WHERE table_name = 'whatsapp_canned_replies' AND column_name = 'buttons';"
```
Expected: `buttons`

Run:
```bash
docker exec supabase_db_puibdsyokgjdvkkousil psql -U postgres -d postgres -c "BEGIN; UPDATE public.whatsapp_canned_replies SET buttons = '[{\"title\":\"A\"},{\"title\":\"B\"},{\"title\":\"C\"},{\"title\":\"D\"}]'::jsonb WHERE slash_key = 'hello'; ROLLBACK;"
```
Expected: `ERROR:  new row for relation "whatsapp_canned_replies" violates check constraint "whatsapp_canned_replies_buttons_shape"`. The transaction is rolled back.

- [ ] **Step 3: Update the database types**

In `src/lib/supabase/database.types.ts`:
- **Row.** Replace the single line `          attachment: Json | null;` (it appears only once in the file) with:

```ts
          attachment: Json | null;
          buttons: Json | null;
```

- **Insert and Update.** Replace both occurrences of `          attachment?: Json | null;` (exactly 2 in the file; use replace-all) with:

```ts
          attachment?: Json | null;
          buttons?: Json | null;
```

Then check: `grep -c "buttons?: Json | null;" src/lib/supabase/database.types.ts` → `2`, and `grep -c "buttons: Json | null;" src/lib/supabase/database.types.ts` → `1`.

- [ ] **Step 4: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: passes

- [ ] **Step 5: Commit on main**

```bash
git branch --show-current   # must print: main
git add supabase/migrations/20260911210000_whatsapp_quick_reply_buttons.sql src/lib/supabase/database.types.ts
git commit -m "$(cat <<'EOF'
feat(whatsapp): store reply buttons on quick replies

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Button validation and service

**Files:**
- Modify: `src/services/whatsapp/cannedReplyInput.ts`
- Modify: `src/services/whatsapp/cannedReplyInput.test.ts`
- Modify: `src/services/whatsapp/cannedReplies.ts` (line ~47 insert; line ~69 patch)
- Modify: `src/services/whatsapp/cannedReplies.test.ts`

**Interfaces:**
- **Consumes:** Task 1's `buttons` column and types.
- **Produces, in `cannedReplyInput.ts`:**
  - `QUICK_REPLY_BUTTON_TITLE_MAX = 20`
  - `QUICK_REPLY_BUTTONS_MAX = 3`
  - `type QuickReplyButton = { title: string; title_ar: string | null }`
  - `type ButtonLabelProblem = "duplicate_en" | "duplicate_ar" | "field_in_label"`
  - `findButtonLabelProblems(buttons: { title: string; title_ar?: string | null }[]): ButtonLabelProblem[]`
  - `cannedReplyButtonsSchema`, whose parse output is `QuickReplyButton[] | null`
- **Produces, in the create and update schemas:** a `buttons` field whose output is `QuickReplyButton[] | null | undefined`.
- **Produces, in `cannedReplies.ts`:** create and patch write `buttons`.

- [ ] **Step 1: Write the failing tests**

In `src/services/whatsapp/cannedReplyInput.test.ts`, replace the import block:

```ts
import {
  createCannedReplySchema,
  QUICK_REPLY_MAX_FILE_BYTES,
  updateCannedReplySchema,
  // @ts-expect-error -- Node strip-types needs the extension.
} from "./cannedReplyInput.ts";
```

with:

```ts
import {
  createCannedReplySchema,
  findButtonLabelProblems,
  QUICK_REPLY_BUTTON_TITLE_MAX,
  QUICK_REPLY_MAX_FILE_BYTES,
  updateCannedReplySchema,
  // @ts-expect-error -- Node strip-types needs the extension.
} from "./cannedReplyInput.ts";
```

Append to the end of the same file:

```ts
describe("quick reply buttons", () => {
  it("trims labels and stores a blank Arabic label as null", () => {
    const parsed = createCannedReplySchema.parse({
      ...valid,
      buttons: [
        { title: " Book now ", title_ar: "   " },
        { title: "Call me", title_ar: " اتصلوا بي " },
      ],
    });
    assert.deepEqual(parsed.buttons, [
      { title: "Book now", title_ar: null },
      { title: "Call me", title_ar: "اتصلوا بي" },
    ]);
  });

  it("stores an empty list as no buttons", () => {
    assert.equal(createCannedReplySchema.parse({ ...valid, buttons: [] }).buttons, null);
  });

  it("allows three buttons and rejects a fourth", () => {
    const three = [{ title: "A" }, { title: "B" }, { title: "C" }];
    assert.equal(createCannedReplySchema.safeParse({ ...valid, buttons: three }).success, true);
    assert.equal(
      createCannedReplySchema.safeParse({ ...valid, buttons: [...three, { title: "D" }] }).success,
      false,
    );
  });

  it("rejects a label longer than WhatsApp allows", () => {
    const title = "x".repeat(QUICK_REPLY_BUTTON_TITLE_MAX + 1);
    assert.equal(createCannedReplySchema.safeParse({ ...valid, buttons: [{ title }] }).success, false);
  });

  it("rejects duplicate English labels, ignoring case and spaces", () => {
    const result = createCannedReplySchema.safeParse({
      ...valid,
      buttons: [{ title: "Yes" }, { title: " yes " }],
    });
    assert.equal(result.success, false);
    assert.deepEqual(result.error?.issues[0]?.path, ["buttons"]);
  });

  it("rejects duplicate Arabic labels but allows several blank ones", () => {
    const duplicate = [
      { title: "A", title_ar: "نعم" },
      { title: "B", title_ar: "نعم" },
    ];
    assert.equal(createCannedReplySchema.safeParse({ ...valid, buttons: duplicate }).success, false);
    const blank = [{ title: "A", title_ar: "" }, { title: "B" }];
    assert.equal(createCannedReplySchema.safeParse({ ...valid, buttons: blank }).success, true);
  });

  it("rejects fill-in fields in a label", () => {
    assert.equal(
      createCannedReplySchema.safeParse({ ...valid, buttons: [{ title: "Hi {{name}}" }] }).success,
      false,
    );
    assert.equal(
      createCannedReplySchema.safeParse({ ...valid, buttons: [{ title: "Hi", title_ar: "{{name}}" }] })
        .success,
      false,
    );
  });

  it("clears buttons on update with null", () => {
    assert.deepEqual(updateCannedReplySchema.parse({ buttons: null }), { buttons: null });
  });
});

describe("findButtonLabelProblems", () => {
  it("reports each problem once", () => {
    assert.deepEqual(
      findButtonLabelProblems([
        { title: "Yes", title_ar: "نعم" },
        { title: "yes", title_ar: "نعم" },
        { title: "Yes", title_ar: "{{name}}" },
      ]).sort(),
      ["duplicate_ar", "duplicate_en", "field_in_label"],
    );
  });

  it("finds nothing wrong with distinct plain labels", () => {
    assert.deepEqual(findButtonLabelProblems([{ title: "Book" }, { title: "Call", title_ar: null }]), []);
  });
});
```

Append to the end of `src/services/whatsapp/cannedReplies.test.ts`. It already defines `const now` and imports `toCannedReplyPatch`:

```ts
describe("toCannedReplyPatch buttons", () => {
  it("passes saved buttons through", () => {
    const buttons = [{ title: "Book now", title_ar: "احجز" }];
    assert.deepEqual(toCannedReplyPatch({ buttons }, now).buttons, buttons);
  });

  it("clears buttons when null is sent", () => {
    assert.equal(toCannedReplyPatch({ buttons: null }, now).buttons, null);
  });

  it("leaves buttons out when the caller didn't send them", () => {
    assert.equal("buttons" in toCannedReplyPatch({ active: false }, now), false);
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/whatsapp/cannedReplyInput.test.ts src/services/whatsapp/cannedReplies.test.ts`
Expected: FAIL. `findButtonLabelProblems` is not exported, `buttons` is stripped or undefined, and the patch has no `buttons`.

- [ ] **Step 3: Implement**

In `src/services/whatsapp/cannedReplyInput.ts`, directly after `export type CannedReplyAttachment = z.infer<typeof cannedReplyAttachmentSchema>;`, insert:

```ts
/** WhatsApp caps reply button titles at 20 characters and a message at 3 buttons. */
export const QUICK_REPLY_BUTTON_TITLE_MAX = 20;
export const QUICK_REPLY_BUTTONS_MAX = 3;

export type QuickReplyButton = { title: string; title_ar: string | null };

export type ButtonLabelProblem = "duplicate_en" | "duplicate_ar" | "field_in_label";

const FIELD_IN_LABEL = /\{\{[^}]*\}\}/;

/**
 * What stops a reply's buttons from being saved, beyond length and count.
 * WhatsApp rejects duplicate titles, and a {{field}} can't be filled into a
 * 20-character label. Shared by the editor (inline errors) and the schema.
 */
export function findButtonLabelProblems(
  buttons: { title: string; title_ar?: string | null }[],
): ButtonLabelProblem[] {
  const problems = new Set<ButtonLabelProblem>();
  const english = new Set<string>();
  const arabic = new Set<string>();
  for (const button of buttons) {
    const en = button.title.trim();
    const ar = (button.title_ar ?? "").trim();
    if (FIELD_IN_LABEL.test(en) || FIELD_IN_LABEL.test(ar)) problems.add("field_in_label");
    const enKey = en.toLowerCase();
    if (enKey) {
      if (english.has(enKey)) problems.add("duplicate_en");
      english.add(enKey);
    }
    const arKey = ar.toLowerCase();
    if (arKey) {
      if (arabic.has(arKey)) problems.add("duplicate_ar");
      arabic.add(arKey);
    }
  }
  return [...problems];
}

const BUTTON_PROBLEM_MESSAGES: Record<ButtonLabelProblem, string> = {
  duplicate_en: "Button labels must be unique",
  duplicate_ar: "Arabic button labels must be unique",
  field_in_label: "Button labels can't contain fill-in fields",
};

const quickReplyButtonSchema = z.object({
  title: z.string().trim().min(1).max(QUICK_REPLY_BUTTON_TITLE_MAX),
  title_ar: z
    .string()
    .trim()
    .max(QUICK_REPLY_BUTTON_TITLE_MAX)
    .nullable()
    .optional()
    .transform((value) => value || null),
});

/** Up to 3 buttons; an empty list is stored as no buttons. */
export const cannedReplyButtonsSchema = z
  .array(quickReplyButtonSchema)
  .max(QUICK_REPLY_BUTTONS_MAX)
  .superRefine((buttons, ctx) => {
    for (const problem of findButtonLabelProblems(buttons)) {
      ctx.addIssue({ code: "custom", message: BUTTON_PROBLEM_MESSAGES[problem] });
    }
  })
  .nullable()
  .transform((buttons): QuickReplyButton[] | null => (buttons && buttons.length ? buttons : null));
```

In the same file, inside `const fields = { … }`, replace the line:

```ts
  attachment: cannedReplyAttachmentSchema.nullable().optional(),
```

with:

```ts
  attachment: cannedReplyAttachmentSchema.nullable().optional(),
  buttons: cannedReplyButtonsSchema.optional(),
```

In `src/services/whatsapp/cannedReplies.ts`:

- In `createCannedReply`'s insert object, replace `      attachment: input.attachment ?? null,` with:

```ts
      attachment: input.attachment ?? null,
      buttons: input.buttons ?? null,
```

- In `toCannedReplyPatch`, replace `  if (input.attachment !== undefined) patch.attachment = input.attachment;` with:

```ts
  if (input.attachment !== undefined) patch.attachment = input.attachment;
  if (input.buttons !== undefined) patch.buttons = input.buttons;
```

- [ ] **Step 4: Run the tests and confirm they pass, then run the checks**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/whatsapp/cannedReplyInput.test.ts src/services/whatsapp/cannedReplies.test.ts`
Expected: PASS (13 new tests)

Run: `GITHUB_TOKEN=x yarn typecheck && GITHUB_TOKEN=x yarn test`
Expected: typecheck passes. The unit suite shows 0 failures and 1183 tests (1170 + 13).

Run: `GITHUB_TOKEN=x yarn eslint src/services/whatsapp/cannedReplyInput.ts src/services/whatsapp/cannedReplyInput.test.ts src/services/whatsapp/cannedReplies.ts src/services/whatsapp/cannedReplies.test.ts`
Expected: no problems

- [ ] **Step 5: Commit on main**

```bash
git branch --show-current   # must print: main
git add src/services/whatsapp/cannedReplyInput.ts src/services/whatsapp/cannedReplyInput.test.ts src/services/whatsapp/cannedReplies.ts src/services/whatsapp/cannedReplies.test.ts
git commit -m "$(cat <<'EOF'
feat(whatsapp): validate and save quick reply buttons

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Localized button labels in the `/` menu

**Files:**
- Modify: `src/features/admin/components/support/chat/quickReplyMenu.ts`
- Modify: `src/features/admin/components/support/chat/quickReplyMenu.test.ts`
- Modify: `src/features/admin/components/support/chat/SlashCommandMenu.tsx`

**Interfaces:**
- **Consumes:** the API rows from `GET /api/v1/whatsapp/canned-replies` (`select("*")`), which now include `buttons`.
- **Produces:**
  - `QuickReplyMenuItem.buttons?: { title: string; title_ar?: string | null }[] | null`
  - `LocalizedQuickReply.buttons: string[]`
  - `quickReplyButtonIds(slashKey: string, count: number): string[]`
  - `CannedReply.buttons: { id: string; title: string }[]` (exported from `SlashCommandMenu.tsx`)

- [ ] **Step 1: Write the failing tests**

In `src/features/admin/components/support/chat/quickReplyMenu.test.ts`, replace:

```ts
import { localizeQuickReply, matchesQuickReply, sortQuickReplies } from "./quickReplyMenu.ts";
```

with:

```ts
import { localizeQuickReply, matchesQuickReply, quickReplyButtonIds, sortQuickReplies } from "./quickReplyMenu.ts";
```

Two existing tests compare the whole result, so add `buttons: []` to their expected objects. Replace:

```ts
    assert.deepEqual(localizeQuickReply(bilingual, "ar"), {
      title: "تذكير",
      body: "نراكم قريباً",
      locale: "ar",
    });
```

with:

```ts
    assert.deepEqual(localizeQuickReply(bilingual, "ar"), {
      title: "تذكير",
      body: "نراكم قريباً",
      locale: "ar",
      buttons: [],
    });
```

and replace:

```ts
    assert.deepEqual(localizeQuickReply({ ...bilingual, title: " Hi ", body: " 10:30 " }, "en"), {
      title: "Hi",
      body: "10:30",
      locale: "en",
    });
```

with:

```ts
    assert.deepEqual(localizeQuickReply({ ...bilingual, title: " Hi ", body: " 10:30 " }, "en"), {
      title: "Hi",
      body: "10:30",
      locale: "en",
      buttons: [],
    });
```

Append to the end of the file:

```ts
describe("localizeQuickReply buttons", () => {
  const withButtons = {
    id: "v",
    slash_key: "visit",
    title: "Reminder",
    title_ar: "تذكير",
    body: "See you soon",
    body_ar: "نراكم قريباً",
    buttons: [
      { title: "Confirm", title_ar: "تأكيد" },
      { title: "Call me", title_ar: "  " },
    ],
  };

  it("uses Arabic labels with Arabic text, falling back to English when a label is blank", () => {
    assert.deepEqual(localizeQuickReply(withButtons, "ar").buttons, ["تأكيد", "Call me"]);
  });

  it("uses English labels with English text", () => {
    assert.deepEqual(localizeQuickReply(withButtons, "en").buttons, ["Confirm", "Call me"]);
  });

  it("uses Arabic labels when Arabic text was saved in the English column", () => {
    const result = localizeQuickReply({ ...withButtons, body: "أهلاً بكم", body_ar: null }, "en");
    assert.deepEqual(result.buttons, ["تأكيد", "Call me"]);
  });

  it("returns no labels for a reply without buttons", () => {
    assert.deepEqual(localizeQuickReply({ ...withButtons, buttons: null }, "en").buttons, []);
  });
});

describe("quickReplyButtonIds", () => {
  it("numbers ids from the slash key", () => {
    assert.deepEqual(quickReplyButtonIds("visit", 2), ["qr_visit_1", "qr_visit_2"]);
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/components/support/chat/quickReplyMenu.test.ts`
Expected: FAIL. `quickReplyButtonIds` isn't exported, and `buttons` is missing from the result.

- [ ] **Step 3: Implement**

In `src/features/admin/components/support/chat/quickReplyMenu.ts`:

- In `QuickReplyMenuItem`, replace `  attachment?: CannedReplyAttachment | null;` with:

```ts
  attachment?: CannedReplyAttachment | null;
  buttons?: { title: string; title_ar?: string | null }[] | null;
```

- Replace `export type LocalizedQuickReply = { title: string; body: string; locale: "ar" | "en" };` with:

```ts
export type LocalizedQuickReply = {
  title: string;
  body: string;
  locale: "ar" | "en";
  /** Button labels in the language of `body`. */
  buttons: string[];
};
```

- Replace the whole `localizeQuickReply` function (from `export function localizeQuickReply(` through its closing `}`) with:

```ts
export function localizeQuickReply(reply: QuickReplyMenuItem, locale: "ar" | "en"): LocalizedQuickReply {
  const pick = (en: string | null | undefined, ar: string | null | undefined) => {
    const arabic = (ar ?? "").trim();
    return locale === "ar" && arabic ? arabic : (en ?? "").trim();
  };
  const title = pick(reply.title, reply.title_ar);
  // Button labels follow the language the body is actually written in.
  const labels = (bodyLocale: "ar" | "en") =>
    (reply.buttons ?? []).map((button) => {
      const arabic = (button.title_ar ?? "").trim();
      return bodyLocale === "ar" && arabic ? arabic : button.title.trim();
    });
  const arabicBody = locale === "ar" ? (reply.body_ar ?? "").trim() : "";
  if (arabicBody) return { title, body: arabicBody, locale: "ar", buttons: labels("ar") };
  const body = (reply.body ?? "").trim();
  const bodyLocale = lastStrongLocale(body.replace(FIELD_TOKEN, " ")) ?? "en";
  return { title, body, locale: bodyLocale, buttons: labels(bodyLocale) };
}

/** Stable ids for a saved reply's buttons, so a tap can later be traced to its reply. */
export function quickReplyButtonIds(slashKey: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `qr_${slashKey}_${index + 1}`);
}
```

In `src/features/admin/components/support/chat/SlashCommandMenu.tsx`:

- Replace `import { ChevronDown, MapPin, Paperclip, Search } from "lucide-react";` with:

```tsx
import { ChevronDown, MapPin, MessageSquarePlus, Paperclip, Search } from "lucide-react";
```

- Replace the import block:

```tsx
import {
  localizeQuickReply,
  matchesQuickReply,
  sortQuickReplies,
  type QuickReplyMenuItem,
} from "./quickReplyMenu";
```

with:

```tsx
import {
  localizeQuickReply,
  matchesQuickReply,
  quickReplyButtonIds,
  sortQuickReplies,
  type QuickReplyMenuItem,
} from "./quickReplyMenu";
```

- In `export type CannedReply = {`, replace `  attachment: CannedReplyAttachment | null;` with:

```tsx
  attachment: CannedReplyAttachment | null;
  /** Reply buttons in the language of `body`, with stable ids. */
  buttons: { id: string; title: string }[];
```

- Replace the whole `localizeReply` function with:

```tsx
function localizeReply(r: QuickReplyMenuItem, locale: Locale): CannedReply {
  const localized = localizeQuickReply(r, locale === "ar" ? "ar" : "en");
  const ids = quickReplyButtonIds(r.slash_key, localized.buttons.length);
  return {
    id: r.id,
    slash_key: r.slash_key,
    title: localized.title,
    body: localized.body,
    locale: localized.locale,
    category: r.category ?? null,
    attachment: r.attachment ?? null,
    buttons: localized.buttons.map((title, index) => ({ id: ids[index], title })),
  };
}
```

- In the row markup, replace:

```tsx
                  {r.category ? (
```

with:

```tsx
                  {r.buttons.length ? (
                    <MessageSquarePlus className="size-3 shrink-0 text-[#6B7280]" aria-hidden />
                  ) : null}
                  {r.category ? (
```

- [ ] **Step 4: Run the tests and checks**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/components/support/chat/quickReplyMenu.test.ts`
Expected: PASS (5 new tests; the 2 updated tests still pass)

Run: `GITHUB_TOKEN=x yarn typecheck && GITHUB_TOKEN=x yarn test`
Expected: passes; 0 failures; 1188 tests

Run eslint with `-f json` on `quickReplyMenu.ts`, `quickReplyMenu.test.ts` and `SlashCommandMenu.tsx`.
Expected: only the pre-existing `SlashCommandMenu.tsx` error (`react-hooks/set-state-in-effect`); 0 elsewhere.

- [ ] **Step 5: Commit on main**

```bash
git branch --show-current   # must print: main
git add src/features/admin/components/support/chat/quickReplyMenu.ts src/features/admin/components/support/chat/quickReplyMenu.test.ts src/features/admin/components/support/chat/SlashCommandMenu.tsx
git commit -m "$(cat <<'EOF'
feat(whatsapp): show quick reply buttons in the / menu in the text's language

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Send route rejects button messages WhatsApp would refuse

**Files:**
- Create: `src/services/whatsapp/interactiveButtons.ts`
- Test: `src/services/whatsapp/interactiveButtons.test.ts`
- Modify: `src/app/api/v1/whatsapp/send/route.ts`

**Interfaces:**
- **Consumes:** nothing new.
- **Produces:**
  - `INTERACTIVE_BODY_LIMIT = 1024`
  - `type InteractiveButtonsProblem = "no_buttons" | "body_too_long" | "duplicate_titles"`
  - `checkInteractiveButtons(text: string, buttons: { title: string }[] | undefined): InteractiveButtonsProblem | null`
  - The route returns 400 `{ error: "Invalid buttons", code: <problem> }` for an invalid `interactive_buttons` send.

- [ ] **Step 1: Write the failing test**

Create `src/services/whatsapp/interactiveButtons.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { checkInteractiveButtons, INTERACTIVE_BODY_LIMIT } from "./interactiveButtons.ts";

describe("checkInteractiveButtons", () => {
  const two = [{ title: "Confirm" }, { title: "Call me" }];

  it("accepts text within the limit with distinct titles", () => {
    assert.equal(checkInteractiveButtons("See you soon", two), null);
    assert.equal(checkInteractiveButtons("x".repeat(INTERACTIVE_BODY_LIMIT), two), null);
  });

  it("rejects a message without buttons", () => {
    assert.equal(checkInteractiveButtons("Hi", undefined), "no_buttons");
    assert.equal(checkInteractiveButtons("Hi", []), "no_buttons");
  });

  it("rejects text over WhatsApp's limit", () => {
    assert.equal(checkInteractiveButtons("x".repeat(INTERACTIVE_BODY_LIMIT + 1), two), "body_too_long");
  });

  it("rejects titles that differ only in case or spaces", () => {
    assert.equal(checkInteractiveButtons("Hi", [{ title: "Yes" }, { title: " yes" }]), "duplicate_titles");
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/whatsapp/interactiveButtons.test.ts`
Expected: FAIL with `Cannot find module '.../interactiveButtons.ts'`

- [ ] **Step 3: Implement**

Create `src/services/whatsapp/interactiveButtons.ts`:

```ts
/** WhatsApp's body limit for a message with reply buttons. */
export const INTERACTIVE_BODY_LIMIT = 1024;

export type InteractiveButtonsProblem = "no_buttons" | "body_too_long" | "duplicate_titles";

/**
 * Why WhatsApp would reject a reply-button message. Checked before calling
 * Kapso, so staff get a clear 400 instead of a generic send failure.
 */
export function checkInteractiveButtons(
  text: string,
  buttons: { title: string }[] | undefined,
): InteractiveButtonsProblem | null {
  if (!buttons || buttons.length === 0) return "no_buttons";
  if (text.length > INTERACTIVE_BODY_LIMIT) return "body_too_long";
  const titles = buttons.map((button) => button.title.trim().toLowerCase());
  if (new Set(titles).size !== titles.length) return "duplicate_titles";
  return null;
}
```

In `src/app/api/v1/whatsapp/send/route.ts`:

- Add this import next to the other `@/services/whatsapp/*` imports:

```ts
import { checkInteractiveButtons } from "@/services/whatsapp/interactiveButtons";
```

- Replace this block (the only `kind === "text" && !text` in the file):

```ts
      } else if (kind === "text" && !text) {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
      }
```

with:

```ts
      } else if (kind === "text" && !text) {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
      } else if (kind === "interactive_buttons") {
        const problem = checkInteractiveButtons(text, buttons);
        if (problem) {
          return NextResponse.json({ error: "Invalid buttons", code: problem }, { status: 400 });
        }
      }
```

- [ ] **Step 4: Run the tests and checks**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/whatsapp/interactiveButtons.test.ts`
Expected: PASS (4 tests)

Run: `GITHUB_TOKEN=x yarn typecheck && GITHUB_TOKEN=x yarn test`
Expected: passes; 0 failures; 1192 tests

Run: `GITHUB_TOKEN=x yarn eslint src/services/whatsapp/interactiveButtons.ts src/services/whatsapp/interactiveButtons.test.ts src/app/api/v1/whatsapp/send/route.ts`
Expected: no problems

- [ ] **Step 5: Commit on main**

```bash
git branch --show-current   # must print: main
git add src/services/whatsapp/interactiveButtons.ts src/services/whatsapp/interactiveButtons.test.ts src/app/api/v1/whatsapp/send/route.ts
git commit -m "$(cat <<'EOF'
fix(whatsapp): reject button messages WhatsApp would refuse with a clear 400

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Send order with buttons

**Files:**
- Modify: `src/features/admin/components/support/chat/quickReplySend.ts`
- Modify: `src/features/admin/components/support/chat/quickReplySend.test.ts`

**Interfaces:**
- **Consumes:** `INTERACTIVE_BODY_LIMIT` from Task 4 (`@/services/whatsapp/interactiveButtons`).
- **Produces:**
  - The `QuickReplySendStep` union adds `{ kind: "buttons"; text: string; buttons: { id: string; title: string }[] }`. An empty `text` means "use the default prompt".
  - `planQuickReplySend(text: string, attachment: CannedReplyAttachment | null, buttons: { id: string; title: string }[] = [])`

- [ ] **Step 1: Write the failing tests**

In `src/features/admin/components/support/chat/quickReplySend.test.ts`, directly after the existing `.ts` import line of `./quickReplySend.ts`, add:

```ts
import { INTERACTIVE_BODY_LIMIT } from "@/services/whatsapp/interactiveButtons";
```

Append to the end of the file:

```ts
const buttons = [
  { id: "qr_visit_1", title: "Confirm" },
  { id: "qr_visit_2", title: "Call me" },
];

describe("planQuickReplySend with buttons", () => {
  it("sends the text with its buttons as one message", () => {
    assert.deepEqual(planQuickReplySend("  See you soon  ", null, buttons), [
      { kind: "buttons", text: "See you soon", buttons },
    ]);
  });

  it("uses the default prompt when there is no text", () => {
    assert.deepEqual(planQuickReplySend("   ", null, buttons), [{ kind: "buttons", text: "", buttons }]);
  });

  it("keeps text of exactly the limit on the button message", () => {
    const text = "x".repeat(INTERACTIVE_BODY_LIMIT);
    assert.deepEqual(planQuickReplySend(text, null, buttons), [{ kind: "buttons", text, buttons }]);
  });

  it("sends over-long text first, then the buttons with the prompt", () => {
    const text = "x".repeat(INTERACTIVE_BODY_LIMIT + 1);
    assert.deepEqual(planQuickReplySend(text, null, buttons), [
      { kind: "text", text },
      { kind: "buttons", text: "", buttons },
    ]);
  });

  it("sends a file without a caption, then the text with buttons", () => {
    assert.deepEqual(planQuickReplySend("Our price list", pdf, buttons), [
      { kind: "file", caption: "" },
      { kind: "buttons", text: "Our price list", buttons },
    ]);
  });

  it("sends a file, then over-long text, then the buttons with the prompt", () => {
    const text = "x".repeat(INTERACTIVE_BODY_LIMIT + 1);
    assert.deepEqual(planQuickReplySend(text, image, buttons), [
      { kind: "file", caption: "" },
      { kind: "text", text },
      { kind: "buttons", text: "", buttons },
    ]);
  });

  it("sends the pin first, then the text with buttons", () => {
    assert.deepEqual(planQuickReplySend("Find us here", { kind: "location" }, buttons), [
      { kind: "location" },
      { kind: "buttons", text: "Find us here", buttons },
    ]);
  });

  it("sends the pin, then over-long text, then the buttons with the prompt", () => {
    const text = "x".repeat(INTERACTIVE_BODY_LIMIT + 1);
    assert.deepEqual(planQuickReplySend(text, { kind: "location" }, buttons), [
      { kind: "location" },
      { kind: "text", text },
      { kind: "buttons", text: "", buttons },
    ]);
  });

  it("treats an empty button list as no buttons", () => {
    assert.deepEqual(planQuickReplySend("Hello", null, []), [{ kind: "text", text: "Hello" }]);
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/components/support/chat/quickReplySend.test.ts`
Expected: FAIL. No `buttons` steps are produced, and the existing 7 tests still pass.

- [ ] **Step 3: Implement**

Replace the whole of `src/features/admin/components/support/chat/quickReplySend.ts` with:

```ts
import type { CannedReplyAttachment } from "@/services/whatsapp/cannedReplyInput";
import { INTERACTIVE_BODY_LIMIT } from "@/services/whatsapp/interactiveButtons";

/** WhatsApp's caption limit for images and documents. */
export const WHATSAPP_CAPTION_LIMIT = 1024;

export type QuickReplyButtonSend = { id: string; title: string };

export type QuickReplySendStep =
  | { kind: "text"; text: string }
  | { kind: "file"; caption: string }
  | { kind: "location" }
  /** An empty `text` means the buttons carry the default "Please choose an option:" prompt. */
  | { kind: "buttons"; text: string; buttons: QuickReplyButtonSend[] };

/**
 * The messages one composer send becomes when a quick reply carries an
 * attachment and/or reply buttons.
 *
 * Without buttons, a file takes the text as its caption, text over the caption
 * limit goes first, and a location pin follows the text.
 *
 * With buttons, the attachment goes first (a file without a caption) so the
 * buttons are the last thing the patient sees. Text over WhatsApp's interactive
 * body limit is sent on its own before the buttons.
 */
export function planQuickReplySend(
  text: string,
  attachment: CannedReplyAttachment | null,
  buttons: QuickReplyButtonSend[] = [],
): QuickReplySendStep[] {
  const body = text.trim();

  if (buttons.length) {
    const lead: QuickReplySendStep[] = !attachment
      ? []
      : attachment.kind === "location"
        ? [{ kind: "location" }]
        : [{ kind: "file", caption: "" }];
    if (body.length > INTERACTIVE_BODY_LIMIT) {
      return [...lead, { kind: "text", text: body }, { kind: "buttons", text: "", buttons }];
    }
    return [...lead, { kind: "buttons", text: body, buttons }];
  }

  const textStep: QuickReplySendStep[] = body ? [{ kind: "text", text: body }] : [];
  if (!attachment) return textStep;
  if (attachment.kind === "location") return [...textStep, { kind: "location" }];
  if (body.length > WHATSAPP_CAPTION_LIMIT) return [...textStep, { kind: "file", caption: "" }];
  return [{ kind: "file", caption: body }];
}
```

- [ ] **Step 4: Run the tests and checks**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/components/support/chat/quickReplySend.test.ts`
Expected: PASS (16 tests: 7 existing plus 9 new)

Run: `GITHUB_TOKEN=x yarn typecheck && GITHUB_TOKEN=x yarn test`
Expected: passes; 0 failures; 1201 tests. `ChatComposer.tsx` still compiles, because its loop handles `text`, `location` and a fallback `else if (file)`. Task 7 adds the `buttons` branch.

Run: `GITHUB_TOKEN=x yarn eslint src/features/admin/components/support/chat/quickReplySend.ts src/features/admin/components/support/chat/quickReplySend.test.ts`
Expected: no problems

- [ ] **Step 5: Commit on main**

```bash
git branch --show-current   # must print: main
git add src/features/admin/components/support/chat/quickReplySend.ts src/features/admin/components/support/chat/quickReplySend.test.ts
git commit -m "$(cat <<'EOF'
feat(whatsapp): plan the attachment, text and buttons of a quick reply send

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Buttons on the management page

**Files:**
- Modify: `src/lib/i18n/messages/admin/en.ts` (after `"admin.pages.quickReplies.attachFailed"`, line ~122)
- Modify: `src/lib/i18n/messages/admin/ar.ts` (after `"admin.pages.quickReplies.attachFailed"`, line ~124)
- Create: `src/features/admin/components/quick-replies/QuickReplyButtonsField.tsx`
- Modify: `src/features/admin/components/quick-replies/QuickReplyForm.tsx`
- Modify: `src/features/admin/components/quick-replies/QuickRepliesEditor.tsx`

**Interfaces:**
- **Consumes from Task 2:** `QUICK_REPLY_BUTTONS_MAX`, `QUICK_REPLY_BUTTON_TITLE_MAX`, `findButtonLabelProblems`, `ButtonLabelProblem`.
- **Consumes:** the existing PATCH `/api/v1/whatsapp/canned-replies/[id]`, which accepts `buttons` after Task 2.
- **Produces:**
  - `QuickReplyButtonsField({ value: EditableButton[]; onChange })`
  - `type EditableButton = { title: string; title_ar: string }`
  - `buttonsFieldErrors(value): (ButtonLabelProblem | "empty_en")[]`
  - Editor inputs with the accessible names `Button label (EN) 1`, `Button label (AR) 1`, and so on.
  - An "Add button" control.

There are no component unit tests (no DOM runner). This task is verified by typecheck, the build, and Task 8's e2e.

- [ ] **Step 1: Add the translations**

In `src/lib/i18n/messages/admin/en.ts`, directly after `  "admin.pages.quickReplies.attachFailed": "Could not upload the file.",`, insert:

```ts
  "admin.pages.quickReplies.buttons": "Buttons",
  "admin.pages.quickReplies.buttonsHint": "Up to 3 reply buttons sent under the message, 20 characters each.",
  "admin.pages.quickReplies.buttonLabelEn": "Button label (EN)",
  "admin.pages.quickReplies.buttonLabelAr": "Button label (AR)",
  "admin.pages.quickReplies.addButton": "Add button",
  "admin.pages.quickReplies.removeButton": "Remove button",
  "admin.pages.quickReplies.buttonsDuplicateEn": "Button labels must be different.",
  "admin.pages.quickReplies.buttonsDuplicateAr": "Arabic button labels must be different.",
  "admin.pages.quickReplies.buttonsFieldInLabel": "Button labels can't contain fill-in fields.",
  "admin.pages.quickReplies.buttonsEmpty": "Every button needs an English label.",
```

In `src/lib/i18n/messages/admin/ar.ts`, directly after `  "admin.pages.quickReplies.attachFailed": "تعذر رفع الملف.",`, insert:

```ts
  "admin.pages.quickReplies.buttons": "الأزرار",
  "admin.pages.quickReplies.buttonsHint": "حتى 3 أزرار رد تُرسل أسفل الرسالة، 20 حرفاً لكل زر.",
  "admin.pages.quickReplies.buttonLabelEn": "نص الزر (إنجليزي)",
  "admin.pages.quickReplies.buttonLabelAr": "نص الزر (عربي)",
  "admin.pages.quickReplies.addButton": "إضافة زر",
  "admin.pages.quickReplies.removeButton": "إزالة الزر",
  "admin.pages.quickReplies.buttonsDuplicateEn": "يجب أن تختلف نصوص الأزرار.",
  "admin.pages.quickReplies.buttonsDuplicateAr": "يجب أن تختلف نصوص الأزرار العربية.",
  "admin.pages.quickReplies.buttonsFieldInLabel": "لا يمكن أن تحتوي نصوص الأزرار على حقول.",
  "admin.pages.quickReplies.buttonsEmpty": "كل زر يحتاج نصاً بالإنجليزية.",
```

- [ ] **Step 2: Create the buttons field**

Create `src/features/admin/components/quick-replies/QuickReplyButtonsField.tsx`:

```tsx
"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/lib/i18n";
import {
  QUICK_REPLY_BUTTONS_MAX,
  QUICK_REPLY_BUTTON_TITLE_MAX,
  findButtonLabelProblems,
  type ButtonLabelProblem,
} from "@/services/whatsapp/cannedReplyInput";

export type EditableButton = { title: string; title_ar: string };

type Props = {
  value: EditableButton[];
  onChange: (value: EditableButton[]) => void;
};

const PROBLEM_KEYS = {
  duplicate_en: "admin.pages.quickReplies.buttonsDuplicateEn",
  duplicate_ar: "admin.pages.quickReplies.buttonsDuplicateAr",
  field_in_label: "admin.pages.quickReplies.buttonsFieldInLabel",
} as const satisfies Record<ButtonLabelProblem, string>;

/** Everything that blocks saving: the schema's label problems plus a button without an English label. */
export function buttonsFieldErrors(value: EditableButton[]): (ButtonLabelProblem | "empty_en")[] {
  const errors: (ButtonLabelProblem | "empty_en")[] = findButtonLabelProblems(value);
  if (value.some((button) => !button.title.trim())) errors.push("empty_en");
  return errors;
}

export function QuickReplyButtonsField({ value, onChange }: Props) {
  const t = useTranslations();
  const errors = buttonsFieldErrors(value);
  const update = (index: number, patch: Partial<EditableButton>) =>
    onChange(value.map((button, i) => (i === index ? { ...button, ...patch } : button)));

  return (
    <div className="space-y-2">
      <Label>{t("admin.pages.quickReplies.buttons")}</Label>
      <p className="text-xs text-muted-foreground">{t("admin.pages.quickReplies.buttonsHint")}</p>
      {value.map((button, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            aria-label={`${t("admin.pages.quickReplies.buttonLabelEn")} ${index + 1}`}
            placeholder={t("admin.pages.quickReplies.buttonLabelEn")}
            value={button.title}
            maxLength={QUICK_REPLY_BUTTON_TITLE_MAX}
            onChange={(event) => update(index, { title: event.target.value })}
          />
          <Input
            aria-label={`${t("admin.pages.quickReplies.buttonLabelAr")} ${index + 1}`}
            placeholder={t("admin.pages.quickReplies.buttonLabelAr")}
            dir="rtl"
            value={button.title_ar}
            maxLength={QUICK_REPLY_BUTTON_TITLE_MAX}
            onChange={(event) => update(index, { title_ar: event.target.value })}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`${t("admin.pages.quickReplies.removeButton")} ${index + 1}`}
            onClick={() => onChange(value.filter((_, i) => i !== index))}
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
      {value.length < QUICK_REPLY_BUTTONS_MAX ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...value, { title: "", title_ar: "" }])}
        >
          <Plus className="mr-1 size-4" />
          {t("admin.pages.quickReplies.addButton")}
        </Button>
      ) : null}
      {errors.map((error) => (
        <p key={error} role="alert" className="text-xs text-red-600">
          {t(error === "empty_en" ? "admin.pages.quickReplies.buttonsEmpty" : PROBLEM_KEYS[error])}
        </p>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Wire the field into the form**

In `src/features/admin/components/quick-replies/QuickReplyForm.tsx`:

1. Replace `import { QuickReplyAttachmentField } from "./QuickReplyAttachmentField";` with:

```tsx
import { QuickReplyAttachmentField } from "./QuickReplyAttachmentField";
import {
  QuickReplyButtonsField,
  buttonsFieldErrors,
  type EditableButton,
} from "./QuickReplyButtonsField";
```

2. Replace `  const [focused, setFocused] = useState<"body" | "body_ar">("body");` with:

```tsx
  const [buttons, setButtons] = useState<EditableButton[]>(() =>
    ((item.buttons as { title: string; title_ar: string | null }[] | null) ?? []).map((button) => ({
      title: button.title,
      title_ar: button.title_ar ?? "",
    })),
  );
  const [focused, setFocused] = useState<"body" | "body_ar">("body");
```

3. Replace `    if (unknown.length) return;` with:

```tsx
    if (unknown.length || buttonsFieldErrors(buttons).length) return;
```

4. Replace:

```tsx
      attachment,
      active: form.get("active") === "on",
```

with:

```tsx
      attachment,
      // The server trims labels, stores blank Arabic labels as null, and an empty list as no buttons.
      buttons: buttons.map((button) => ({ title: button.title, title_ar: button.title_ar })),
      active: form.get("active") === "on",
```

5. Replace the end of the preview block:

```tsx
        {bodyAr.trim() ? (
          <p dir="rtl" className="whitespace-pre-wrap text-sm">
            {renderQuickReply(bodyAr, SAMPLE_VALUES).text}
          </p>
        ) : null}
      </div>
```

with:

```tsx
        {bodyAr.trim() ? (
          <p dir="rtl" className="whitespace-pre-wrap text-sm">
            {renderQuickReply(bodyAr, SAMPLE_VALUES).text}
          </p>
        ) : null}
        {buttons.some((button) => button.title.trim()) ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {buttons
              .filter((button) => button.title.trim())
              .map((button, index) => (
                <span
                  key={index}
                  className="rounded-full border border-[#D1D5DB] bg-white px-2.5 py-0.5 text-xs text-[#374151]"
                >
                  {button.title.trim()}
                </span>
              ))}
          </div>
        ) : null}
      </div>
```

6. Replace `      <QuickReplyAttachmentField value={attachment} onChange={setAttachment} />` with:

```tsx
      <QuickReplyAttachmentField value={attachment} onChange={setAttachment} />
      <QuickReplyButtonsField value={buttons} onChange={setButtons} />
```

- [ ] **Step 4: Add a buttons icon to the list**

In `src/features/admin/components/quick-replies/QuickRepliesEditor.tsx`:

- Replace `import { MapPin, Paperclip } from "lucide-react";` with:

```tsx
import { MapPin, MessageSquarePlus, Paperclip } from "lucide-react";
```

- Replace:

```tsx
                          <Paperclip className="size-3.5 text-muted-foreground" aria-hidden />
                        )
                      ) : null}
                    </span>
```

with:

```tsx
                          <Paperclip className="size-3.5 text-muted-foreground" aria-hidden />
                        )
                      ) : null}
                      {Array.isArray(r.buttons) && r.buttons.length ? (
                        <MessageSquarePlus className="size-3.5 text-muted-foreground" aria-hidden />
                      ) : null}
                    </span>
```

- [ ] **Step 5: Run the checks**

Run: `GITHUB_TOKEN=x yarn typecheck && GITHUB_TOKEN=x yarn test`
Expected: passes; 0 failures; 1201 tests

Run: `GITHUB_TOKEN=x yarn eslint src/lib/i18n/messages/admin/en.ts src/lib/i18n/messages/admin/ar.ts src/features/admin/components/quick-replies/QuickReplyButtonsField.tsx src/features/admin/components/quick-replies/QuickReplyForm.tsx src/features/admin/components/quick-replies/QuickRepliesEditor.tsx`
Expected: no problems

Run: `bash -c 'set -a; . ./.env.e2e; set +a; GITHUB_TOKEN=x yarn build'`
Expected: succeeds

- [ ] **Step 6: Commit on main**

```bash
git branch --show-current   # must print: main
git add src/lib/i18n/messages/admin/en.ts src/lib/i18n/messages/admin/ar.ts src/features/admin/components/quick-replies/QuickReplyButtonsField.tsx src/features/admin/components/quick-replies/QuickReplyForm.tsx src/features/admin/components/quick-replies/QuickRepliesEditor.tsx
git commit -m "$(cat <<'EOF'
feat(admin): edit quick reply buttons with English and Arabic labels

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Message box inserts and sends saved buttons

**Files:**
- Modify: `src/features/admin/components/support/chat/InteractiveBuilder.tsx`
- Modify: `src/features/admin/components/support/chat/ChatComposer.tsx`
- Modify: `src/features/admin/components/support/SupportChatColumn.tsx`
- Modify: `src/features/admin/components/support/SupportInboxView.tsx`

**Interfaces:**
- **Consumes:**
  - Task 3: `CannedReply.buttons: { id; title }[]`
  - Task 5: `planQuickReplySend(text, attachment, buttons)` and the `buttons` step
  - The existing i18n key `admin.frontDesk.pleaseChoose`
- **Produces:**
  - `InteractiveDraft` buttons mode: `{ mode: "buttons"; labels: string[]; ids?: string[]; fromQuickReply?: boolean }`
  - Optional props on both `ChatComposer` and `SupportChatColumn`: `interactive?: InteractiveDraft | null` and `onInteractiveChange?: (draft: InteractiveDraft | null) => void`
  - `SupportInboxView` state `interactiveById`

- [ ] **Step 1: Carry ids and origin in the builder draft**

In `src/features/admin/components/support/chat/InteractiveBuilder.tsx`:

- Replace:

```tsx
export type InteractiveDraft =
  | { mode: "buttons"; labels: string[] }
  | { mode: "cta"; label: string; url: string };
```

with:

```tsx
export type InteractiveDraft =
  | {
      mode: "buttons";
      labels: string[];
      /** Stable ids of buttons inserted from a saved quick reply, by position. */
      ids?: string[];
      /** Set when the draft came from a quick reply rather than being built by hand. */
      fromQuickReply?: boolean;
    }
  | { mode: "cta"; label: string; url: string };
```

- Replace:

```tsx
                const labels = [...value.labels];
                labels[i] = e.target.value;
                onChange({ mode: "buttons", labels });
```

with:

```tsx
                const labels = [...value.labels];
                labels[i] = e.target.value;
                onChange({ ...value, labels });
```

- Replace:

```tsx
                onChange({
                  mode: "buttons",
                  labels: [...value.labels, ""],
                })
```

with:

```tsx
                onChange({ ...value, labels: [...value.labels, ""] })
```

- [ ] **Step 2: Make the composer's button draft controlled and send it through the plan**

In `src/features/admin/components/support/chat/ChatComposer.tsx`:

1. In `type Props`, replace:

```tsx
  quickAttachment?: CannedReplyAttachment | null;
  onQuickAttachmentChange?: (attachment: CannedReplyAttachment | null) => void;
};
```

with:

```tsx
  quickAttachment?: CannedReplyAttachment | null;
  onQuickAttachmentChange?: (attachment: CannedReplyAttachment | null) => void;
  /** This chat's reply-button draft, built by hand or inserted from a quick reply. */
  interactive?: InteractiveDraft | null;
  onInteractiveChange?: (draft: InteractiveDraft | null) => void;
};
```

2. In the destructured params, replace:

```tsx
  quickAttachment = null,
  onQuickAttachmentChange,
}: Props) {
```

with:

```tsx
  quickAttachment = null,
  onQuickAttachmentChange,
  interactive = null,
  onInteractiveChange,
}: Props) {
```

3. Delete the local state:

```tsx
  const [interactive, setInteractive] = useState<InteractiveDraft | null>(
    null,
  );
```

4. In the showreel `useEffect`, make these replacements:
   - `        setInteractive({` → `        onInteractiveChange?.({` (the "quick-replies" preset)
   - both remaining `        setInteractive(null);` → `        onInteractiveChange?.(null);` (the "voice-start" and "send-message" handlers)
   - the dependency array `  }, [onClearReply, onDraftChange, onSend]);` → `  }, [onClearReply, onDraftChange, onInteractiveChange, onSend]);`

5. Replace the body of `updateDraft`:

```tsx
    onDraftChange(value);
    // Clearing the message box also drops the quick reply's attachment.
    if (!value.trim() && quickAttachment) onQuickAttachmentChange?.(null);
```

with:

```tsx
    onDraftChange(value);
    // Clearing the message box also drops what a quick reply brought with it:
    // its attachment, and buttons it inserted (never buttons built by hand).
    if (!value.trim()) {
      if (quickAttachment) onQuickAttachmentChange?.(null);
      if (interactive?.mode === "buttons" && interactive.fromQuickReply) onInteractiveChange?.(null);
    }
```

6. In `injectCanned`, replace `    onQuickAttachmentChange?.(reply.attachment ?? null);` with:

```tsx
    onQuickAttachmentChange?.(reply.attachment ?? null);
    if (reply.buttons.length) {
      onInteractiveChange?.({
        mode: "buttons",
        labels: reply.buttons.map((button) => button.title),
        ids: reply.buttons.map((button) => button.id),
        fromQuickReply: true,
      });
    } else if (interactive?.mode === "buttons" && interactive.fromQuickReply) {
      // A reply without buttons removes buttons an earlier reply inserted, but
      // never a draft staff built by hand.
      onInteractiveChange?.(null);
    }
```

7. Replace the whole `sendWithAttachment` function (from `  async function sendWithAttachment(` through its closing `  }`, just before `  function withReply(`) with:

```tsx
  function buttonsPayload(
    text: string,
    buttons: { id: string; title: string }[],
  ): ComposerSendPayload {
    return {
      kind: "interactive_buttons",
      text: text || t("admin.frontDesk.pleaseChoose"),
      buttons,
      flow: { kind: "buttons", title: "Quick replies", subtitle: text, buttons },
    };
  }

  /** Labels by position; buttons from a saved reply keep their ids, hand-added ones get btn_<n>. */
  function draftButtons(draft: Extract<InteractiveDraft, { mode: "buttons" }>) {
    return draft.labels
      .map((label, index) => ({ id: draft.ids?.[index] ?? `btn_${index + 1}`, title: label.trim() }))
      .filter((button) => button.title);
  }

  async function sendQuickReply(
    text: string,
    attachment: CannedReplyAttachment | null,
    buttons: { id: string; title: string }[],
  ) {
    if (quickSendingRef.current) return;
    quickSendingRef.current = true;
    setQuickSending(true);
    try {
      let file: File | null = null;
      if (attachment && attachment.kind !== "location") {
        const { data, error } = await createClient()
          .storage.from(QUICK_REPLY_BUCKET)
          .download(attachment.path);
        if (error || !data) {
          // Keep the draft, the chip and the buttons: staff can retry or remove the attachment.
          toast.error(t("admin.frontDesk.quickReplyAttachmentFail"));
          return;
        }
        file = new File([data], attachment.name, { type: attachment.mime });
      }

      const steps = planQuickReplySend(text, attachment, buttons);
      onDraftChange("");
      onQuickAttachmentChange?.(null);
      if (buttons.length) onInteractiveChange?.(null);
      // Every step reuses the onSend captured at click time. Don't refactor this
      // to read a "latest onSend" ref: the parent's `sending` guard would drop
      // the later steps.
      for (const [index, step] of steps.entries()) {
        // Only the first message quotes the reply-to, as a single send would.
        const prepare = (payload: ComposerSendPayload) =>
          index === 0 ? withReply(payload) : payload;
        if (step.kind === "text") {
          await onSend(prepare({ kind: "text", text: step.text }));
        } else if (step.kind === "buttons") {
          await onSend(prepare(buttonsPayload(step.text, step.buttons)));
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
        } else if (step.kind === "file" && file && attachment && attachment.kind !== "location") {
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
    } finally {
      quickSendingRef.current = false;
      setQuickSending(false);
    }
  }
```

8. In `submitText`, replace the whole buttons branch:

```tsx
    if (interactive?.mode === "buttons") {
      const labels = interactive.labels.map((l) => l.trim()).filter(Boolean);
      if (!labels.length) return;
      onSend(
        withReply({
          kind: "interactive_buttons",
          text: text || t("admin.frontDesk.pleaseChoose"),
          buttons: labels.map((title, i) => ({
            id: `btn_${i + 1}`,
            title,
          })),
          flow: {
            kind: "buttons",
            title: "Quick replies",
            subtitle: text,
            buttons: labels.map((title, i) => ({
              id: `btn_${i + 1}`,
              title,
            })),
          },
        }),
      );
      setInteractive(null);
      onDraftChange("");
      onClearReply?.();
      return;
    }
```

with:

```tsx
    if (interactive?.mode === "buttons") {
      const buttons = draftButtons(interactive);
      if (!buttons.length) return;
      // Attachment (if any) first, then the text with its buttons.
      await sendQuickReply(text, quickAttachment, buttons);
      return;
    }
```

9. In the CTA branch of `submitText`, replace `      setInteractive(null);` with `      onInteractiveChange?.(null);`.

10. Replace:

```tsx
    if (quickAttachment) {
      await sendWithAttachment(text, quickAttachment);
      return;
    }
```

with:

```tsx
    if (quickAttachment) {
      await sendQuickReply(text, quickAttachment, []);
      return;
    }
```

11. Replace `            <InteractiveBuilder value={interactive} onChange={setInteractive} />` with:

```tsx
            <InteractiveBuilder value={interactive} onChange={(draft) => onInteractiveChange?.(draft)} />
```

Then check that no local setter is left: `grep -n "setInteractive\|sendWithAttachment" src/features/admin/components/support/chat/ChatComposer.tsx`. Expected: no output.

- [ ] **Step 3: Pass the draft through the chat column**

In `src/features/admin/components/support/SupportChatColumn.tsx`:

- Directly after `import type { CannedReplyAttachment } from "@/services/whatsapp/cannedReplyInput";`, add:

```tsx
import type { InteractiveDraft } from "./chat/InteractiveBuilder";
```

- Replace `  onQuickAttachmentChange?: (attachment: CannedReplyAttachment | null) => void;` with:

```tsx
  onQuickAttachmentChange?: (attachment: CannedReplyAttachment | null) => void;
  interactive?: InteractiveDraft | null;
  onInteractiveChange?: (draft: InteractiveDraft | null) => void;
```

- In the destructured params, replace:

```tsx
  quickAttachment,
  onQuickAttachmentChange,
```

with:

```tsx
  quickAttachment,
  onQuickAttachmentChange,
  interactive,
  onInteractiveChange,
```

- Replace `            onQuickAttachmentChange={onQuickAttachmentChange}` with:

```tsx
            onQuickAttachmentChange={onQuickAttachmentChange}
            interactive={interactive}
            onInteractiveChange={onInteractiveChange}
```

- [ ] **Step 4: Keep the draft per conversation in the inbox**

In `src/features/admin/components/support/SupportInboxView.tsx`:

- Directly after `import type { CannedReplyAttachment } from "@/services/whatsapp/cannedReplyInput";`, add:

```tsx
import type { InteractiveDraft } from "./chat/InteractiveBuilder";
```

- Replace:

```tsx
  const [attachmentsById, setAttachmentsById] = useState<
    Record<string, CannedReplyAttachment | null>
  >({});
```

with:

```tsx
  const [attachmentsById, setAttachmentsById] = useState<
    Record<string, CannedReplyAttachment | null>
  >({});
  /** The reply-button draft (built by hand or from a quick reply) stays with its chat too. */
  const [interactiveById, setInteractiveById] = useState<
    Record<string, InteractiveDraft | null>
  >({});
```

- Replace `    setAttachmentsById((prev) => ({ ...prev, [id]: null }));` with:

```tsx
    setAttachmentsById((prev) => ({ ...prev, [id]: null }));
    setInteractiveById((prev) => ({ ...prev, [id]: null }));
```

- Replace ALL occurrences (exactly 2, one per `SupportChatColumn` mount) of:

```tsx
                onQuickAttachmentChange={(attachment) =>
                  setAttachmentsById((prev) => ({
                    ...prev,
                    [conversation.id]: attachment,
                  }))
                }
```

with:

```tsx
                onQuickAttachmentChange={(attachment) =>
                  setAttachmentsById((prev) => ({
                    ...prev,
                    [conversation.id]: attachment,
                  }))
                }
                interactive={interactiveById[conversation.id] ?? null}
                onInteractiveChange={(draft) =>
                  setInteractiveById((prev) => ({
                    ...prev,
                    [conversation.id]: draft,
                  }))
                }
```

Then check: `grep -c "onInteractiveChange={(draft)" src/features/admin/components/support/SupportInboxView.tsx` → `2`

- [ ] **Step 5: Run the checks**

Run: `GITHUB_TOKEN=x yarn typecheck && GITHUB_TOKEN=x yarn test`
Expected: passes; 0 failures; 1201 tests

Run eslint with `-f json` on the 4 files and compare with the task base.
Expected: no new problems. The pre-existing ones remain:
- `SupportChatColumn.tsx`: 1 error and 1 warning
- `SupportInboxView.tsx`: 7 errors
- `InteractiveBuilder.tsx`: 0
- `ChatComposer.tsx`: 0

Run: `bash -c 'set -a; . ./.env.e2e; set +a; GITHUB_TOKEN=x yarn build'`
Expected: succeeds

- [ ] **Step 6: Commit on main**

```bash
git branch --show-current   # must print: main
git add src/features/admin/components/support/chat/InteractiveBuilder.tsx src/features/admin/components/support/chat/ChatComposer.tsx src/features/admin/components/support/SupportChatColumn.tsx src/features/admin/components/support/SupportInboxView.tsx
git commit -m "$(cat <<'EOF'
feat(whatsapp): insert and send a quick reply's buttons, attachment first

The button draft now lives per conversation, like the text and attachment,
and a buttons send no longer skips a quick reply attachment.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: End-to-end tests

**Files:**
- Modify: `e2e/quick-replies.spec.ts`

**Interfaces:**
- **Consumes:**
  - Tasks 1–7
  - `seedE2E`, `serviceClient`, `conversationByPhone`, `setAiMode` (`e2e/helpers/seed.ts`)
  - `uniquePhone` and `deliverInbound` (`e2e/helpers/inbound.ts`)
- **Produces:** 2 new Playwright tests.

- [ ] **Step 1: Add the tests**

In `e2e/quick-replies.spec.ts`, replace:

```ts
const ATTACH_KEY = "e2e-attach";
```

with:

```ts
const ATTACH_KEY = "e2e-attach";
const BUTTONS_KEY = "e2e-buttons";
const PIN_BUTTONS_KEY = "e2e-pin-buttons";
```

Then, directly before the final `});` that closes `test.describe("quick replies", …)`, insert:

```ts
  test("saves reply buttons in the editor and sends them with the text", async ({ page, request }) => {
    const { error } = await serviceClient()
      .from("whatsapp_canned_replies")
      .upsert(
        {
          slash_key: BUTTONS_KEY,
          title: "E2E buttons",
          body: "Would you like to book?",
          active: true,
          attachment: null,
          buttons: null,
          category: "E2E",
          sort_order: 3,
        },
        { onConflict: "slash_key" },
      );
    if (error) throw error;

    await page.goto("/admin/quick-replies");
    await page.getByText(`/${BUTTONS_KEY}`, { exact: true }).click();
    await page.getByRole("button", { name: "Add button" }).click();
    await page.getByLabel("Button label (EN) 1").fill("Book now");
    await page.getByLabel("Button label (AR) 1").fill("احجز الآن");
    await page.getByRole("button", { name: "Add button" }).click();
    await page.getByLabel("Button label (EN) 2").fill("Call me");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Saved", { exact: true })).toBeVisible();

    const { data: saved, error: readError } = await serviceClient()
      .from("whatsapp_canned_replies")
      .select("buttons")
      .eq("slash_key", BUTTONS_KEY)
      .single();
    if (readError) throw readError;
    expect(saved.buttons).toEqual([
      { title: "Book now", title_ar: "احجز الآن" },
      { title: "Call me", title_ar: null },
    ]);

    const phone = uniquePhone();
    expect((await deliverInbound(request, phone, "hello")).ok()).toBeTruthy();
    const conversation = await conversationByPhone(phone);
    expect(conversation).not.toBeNull();

    const captured: Record<string, unknown>[] = [];
    await page.route("**/api/v1/whatsapp/send", async (route) => {
      captured.push(route.request().postDataJSON() as Record<string, unknown>);
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto("/admin/support");
    await page.locator(`[data-conversation-id="${conversation!.id}"]`).first().click();

    const composer = page.getByLabel("Message", { exact: true });
    await composer.fill(`/${BUTTONS_KEY}`);
    await page.getByRole("option", { name: new RegExp(BUTTONS_KEY) }).click();
    await expect(composer).toHaveValue("Would you like to book?");
    await expect(page.getByPlaceholder("Button 1")).toHaveValue("Book now");
    await expect(page.getByPlaceholder("Button 2")).toHaveValue("Call me");

    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect.poll(() => captured.length).toBe(1);
    expect(captured[0]).toMatchObject({
      kind: "interactive_buttons",
      text: "Would you like to book?",
      buttons: [
        { id: `qr_${BUTTONS_KEY}_1`, title: "Book now" },
        { id: `qr_${BUTTONS_KEY}_2`, title: "Call me" },
      ],
    });
    await expect(composer).toHaveValue("");
    await expect(page.getByPlaceholder("Button 1")).toBeHidden();

    // Clearing the message box removes buttons that came from a quick reply.
    await composer.fill(`/${BUTTONS_KEY}`);
    await page.getByRole("option", { name: new RegExp(BUTTONS_KEY) }).click();
    await expect(page.getByPlaceholder("Button 1")).toHaveValue("Book now");
    await composer.fill("");
    await expect(page.getByPlaceholder("Button 1")).toBeHidden();
  });

  test("sends a reply's location pin first, then its text with buttons", async ({ page, request }) => {
    const { error } = await serviceClient()
      .from("whatsapp_canned_replies")
      .upsert(
        {
          slash_key: PIN_BUTTONS_KEY,
          title: "E2E pin buttons",
          body: "Here is how to find us.",
          active: true,
          attachment: { kind: "location" },
          buttons: [{ title: "Got it", title_ar: null }],
          category: "E2E",
          sort_order: 4,
        },
        { onConflict: "slash_key" },
      );
    if (error) throw error;

    const phone = uniquePhone();
    expect((await deliverInbound(request, phone, "hello")).ok()).toBeTruthy();
    const conversation = await conversationByPhone(phone);
    expect(conversation).not.toBeNull();

    const captured: Record<string, unknown>[] = [];
    await page.route("**/api/v1/whatsapp/send", async (route) => {
      captured.push(route.request().postDataJSON() as Record<string, unknown>);
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto("/admin/support");
    await page.locator(`[data-conversation-id="${conversation!.id}"]`).first().click();

    const composer = page.getByLabel("Message", { exact: true });
    await composer.fill(`/${PIN_BUTTONS_KEY}`);
    await page.getByRole("option", { name: new RegExp(PIN_BUTTONS_KEY) }).click();
    await expect(composer).toHaveValue("Here is how to find us.");
    await expect(page.getByPlaceholder("Button 1")).toHaveValue("Got it");

    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect.poll(() => captured.length).toBe(2);
    expect(captured.map((body) => body.kind)).toEqual(["location", "interactive_buttons"]);
    expect(captured[1]).toMatchObject({
      text: "Here is how to find us.",
      buttons: [{ id: `qr_${PIN_BUTTONS_KEY}_1`, title: "Got it" }],
    });
  });
```

- [ ] **Step 2: Run the e2e specs on LOCAL Supabase**

Run: `lsof -nP -iTCP:3100 -sTCP:LISTEN`
Expected: no output. If something is listening, stop and report BLOCKED; don't kill it.

Run: `bash -c 'set -a; . ./.env.e2e; set +a; GITHUB_TOKEN=x yarn e2e e2e/quick-replies.spec.ts e2e/autoreply.spec.ts --reporter=line'`
Expected: all pass: the 5 quick-replies tests (3 existing plus 2 new), the autoreply tests, and setup.

If a new test fails, find the real cause. Never weaken or delete assertions, and never add long sleeps. A small, justified selector change in the new tests is allowed; report it.

- [ ] **Step 3: Lint**

Run: `GITHUB_TOKEN=x yarn eslint e2e/quick-replies.spec.ts`
Expected: no problems

- [ ] **Step 4: Commit on main**

```bash
git branch --show-current   # must print: main
git add e2e/quick-replies.spec.ts
git commit -m "$(cat <<'EOF'
test(e2e): quick reply buttons from the editor to the send, pin first

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Final verification and applying the migration (controller)

The controller runs this after every task and the final review are clean. It is not a subagent task.

- [ ] **Step 1: Fresh verification on `main` HEAD**
  - `GITHUB_TOKEN=x yarn typecheck`: passes.
  - `GITHUB_TOKEN=x yarn test`: 0 failures.
  - **Whole-repo lint.** Run `eslint -f json` with no file arguments in a temporary detached worktree at `b371c9e` (with `node_modules` symlinked), and again at HEAD. Compare problem counts by (file, severity, ruleId). Expected: no new problems. Remove the worktree afterwards.
  - **Port and e2e.** Confirm port 3100 is free. Then run `bash -c 'set -a; . ./.env.e2e; set +a; GITHUB_TOKEN=x yarn e2e e2e/quick-replies.spec.ts e2e/autoreply.spec.ts --reporter=line'`: all pass.
  - **Bundle host check.**
    - `grep -rlF "puibdsyokgjdvkkousil" .next/static | wc -l` → `0`
    - `grep -rlF "127.0.0.1:54321" .next/static | wc -l` → at least 1
  - **Repo state.** `git status --short`: no tracked changes left by this plan.

- [ ] **Step 2: Apply to production (user-approved: this migration only)**

Run from `main`, with `supabase/.temp/project-ref` equal to `puibdsyokgjdvkkousil` and `SUPABASE_DB_PASSWORD` read from `.env.local` without printing it:
  1. `supabase db push --linked --dry-run`. It must list EXACTLY `20260911210000_whatsapp_quick_reply_buttons.sql`. If it lists anything else, stop and ask the user.
  2. `supabase db push --linked --yes`: exit 0, `Applying migration 20260911210000_whatsapp_quick_reply_buttons.sql...`
  3. `supabase migration list --linked` shows `20260911210000` in the Remote column.
  4. A read-only production check with the service client: `select("slash_key, buttons").limit(1)` succeeds, which proves the column exists. Existing rows have `buttons = null`.

Never push `main` to GitHub.
