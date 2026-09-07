# Contact card CMS Implementation Plan

> **For agentic workers:** Execute inline (no subagents). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make contact clinic/doctor/credentials and optional card image editable in Admin and Customize.

**Architecture:** Extend `site_settings`; render in `DentalContactSection`; wire Admin Contact + Customize Contact panel.

**Tech Stack:** Next.js, Supabase migrations, existing MediaUploadField / customize patches.

## Global Constraints

- Max ~100 lines per TS/TSX file; named exports; no `any`
- Schema via `supabase/migrations/`; update `database.types.ts`
- Bilingual EN/AR for text fields

---

### Task 1: Migration + types + fallback

**Files:**
- Create `supabase/migrations/20260907210000_contact_card_fields.sql`
- Update `src/lib/supabase/database.types.ts`
- Update `src/services/portfolio/fallback.ts`

- [x] Add columns + seed defaults
- [x] Types + fallback

### Task 2: Credentials helper (TDD)

**Files:**
- Create `src/features/portfolio/lib/contactCredentialsLines.ts`
- Create `src/features/portfolio/lib/contactCredentialsLines.test.ts`

- [x] Split multiline credentials; ignore empty lines
- [x] Tests green

### Task 3: Public contact section

**Files:**
- Modify `src/features/portfolio/components/dental/DentalContactSection.tsx`

- [x] Clinic name, doctor, credentials, image from settings

### Task 4: Admin + Customize editors

**Files:**
- Modify `src/features/admin/lib/contactSettingFields.ts` (or add card fields module)
- Modify `ContactEditor.tsx`, `SettingsContactFields` / dedicated card fields
- Modify `ContactPanel.tsx`, translate jobs
- Modify `SettingsSiteForm` if it duplicates contact save

- [x] Save + customize patch for new fields + image

### Task 5: Verify

- [x] Unit tests pass; migration ready to push
