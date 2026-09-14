# Treatment proposals: doctor-by-service billing proposals over WhatsApp

- **Date:** 2026-09-14
- **Status:** proposed
- **Area:** extends the patient billing/ledger system (`docs/superpowers/specs/2026-09-14-patient-billing-ledger-design.md`) — a new "Propose services" / "Pending proposals" section on the same Patient Billing page, plus a new WhatsApp notification kind.

## Problem

Two gaps, both raised by the user in one request:

1. Billing has no concept of "which doctor did this, for which service." `patient_treatments` (the source of every treatment charge) has no `doctor_id` at all, and no link back to the `services` catalog — a charge is just a tooth/CDT-code line item with a fee.
2. There's no way for a doctor to propose a set of services to a patient and have the patient (or front desk on their behalf) see and act on that proposal before it becomes a real, billed treatment — let alone have that proposal reach the patient over WhatsApp.

## Goals

1. Every treatment can carry which doctor performed it and which catalog service it fulfilled.
2. A doctor can bundle one or more services (with per-doctor pricing already established elsewhere in this codebase) into a proposal for a specific patient.
3. That proposal gets sent to the patient over WhatsApp.
4. Front desk can see pending proposals and mark them accepted or declined. Accepting turns the proposal into real, billable treatments with no manual re-entry. Declining just closes it out.

## Non-goals

- **Not a payment request.** A proposal is a pre-treatment quote/estimate the patient reviews — it does not ask for money and is unrelated to the deposit-hold flow. (Confirmed with the user: this is explicitly the "quote before treatment" reading, not "bill requesting payment now.")
- **No automatic accept/decline detection.** The patient's WhatsApp reply is read by a human; front desk clicks Accept/Decline in the admin panel. No AI parsing of the reply, no risk of a billing decision being auto-inferred from ambiguous text.
- **Not built on the CDT/tooth-based treatment model.** A proposal is a list of catalog *services*, not teeth/CDT codes — see Decisions below for why, and how the two still connect.
- **The WhatsApp send does not work yet, and that's expected.** WhatsApp Business API requires a Meta-approved template to message a patient outside an active 24h conversation window. This clinic has exactly two approved templates today (`confirmation`, `reminder_24h` — confirmed in `src/services/patient_notifications/templates.ts`). This feature adds a new template *kind* the same way those two are defined, but the actual template text still needs to be submitted to and approved by Meta outside this codebase before real sends succeed. The user explicitly chose to build this now anyway rather than wait.

## Decisions

- **Services catalog, not CDT/tooth-based** — reverses the first design pass. A separate, actively-developed part of this same repo already built exactly the "which doctors do which services, at what price" half of this problem: `service_doctors` (service↔doctor eligibility + optional per-doctor price override), `services.price_label` (clinic-wide default price, free text), and `resolveServiceDoctorPrice()` / `extractSingleAmount()` (`src/services/service_doctors/pricing.ts`) — already wired into the billing page's manual "Add charge" form. Building proposals on the CDT/tooth model would duplicate pricing logic and produce patient-facing messages full of CDT jargon. Reusing it means: no new pricing logic, and a proposal message reads "Root canal — EGP 1,500" instead of "D3330".
- **Two new columns on `patient_treatments`, not a rewrite of it.** `doctor_id` (nullable, → `profiles`) and `service_id` (nullable, → `services`). Both additive, both nullable — every existing row and every existing consumer of this table is unaffected. `tooth_name` stays `NOT NULL` (existing constraint, untouched); when a treatment is created from an accepted proposal, `tooth_name` is set to the service's title, since there's no tooth-level detail at proposal time — the doctor can still edit it once real charting happens.
  - This also fixes the known gap in the "My production this week" doctor-dashboard widget (built earlier this session), which today can only attribute a treatment's fee to a doctor by going through a linked reservation. Any treatment with `doctor_id` set — proposal-sourced or not — closes that gap directly.
- **Proposals are not committed to `patient_treatments` until accepted.** A `treatment_proposals` (one per send) + `treatment_proposal_items` (one row per service in the bundle) pair holds the proposal itself. Nothing charges, nothing shows up in charting or the billing ledger, until someone clicks Accept — matching the user's explicit choice ("auto-create the treatment + charge" on acceptance, implying nothing exists before that).
- **Lives entirely on the Patient Billing page**, not the clinical charting workspace. Since a proposal is service-based (not tooth-based), it doesn't need the chairside charting UI at all — it's a natural sibling to the "Record entry" manual-charge form already on that page, reusing the same service/doctor/price-lookup pattern. This also means zero changes to the charting workspace, which two other concurrent efforts in this repo are already actively modifying — staying out of that code entirely is the lower-risk choice, not just the more convenient one.
- **WhatsApp send reuses the `patient_notifications` outbox**, not a bespoke send path. Adding a new `TemplateKind` (`"treatment_proposal"`) to `src/services/patient_notifications/templates.ts` — same file, same "one-line edit once Meta approves it" pattern the file's own header comment already documents for its two existing kinds — means the proposal message automatically gets quiet-hours handling, opt-outs, language selection, retry, and the existing `/admin/outbox` review page for free.

## Data

New migration (exact timestamp picked fresh at implementation time — this repo has had a new migration land every few minutes during this session from concurrent work, so hardcoding one here would likely collide):

```sql
ALTER TABLE public.patient_treatments
  ADD COLUMN IF NOT EXISTS doctor_id uuid REFERENCES public.profiles (id),
  ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services (id);

CREATE INDEX IF NOT EXISTS patient_treatments_doctor_id_idx
  ON public.patient_treatments (doctor_id);

CREATE TABLE IF NOT EXISTS public.treatment_proposals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_key text NOT NULL,
  doctor_id   uuid NOT NULL REFERENCES public.profiles (id),
  status      text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'accepted', 'declined')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  decided_at  timestamptz,
  decided_by  uuid REFERENCES public.profiles (id)
);

CREATE INDEX IF NOT EXISTS treatment_proposals_patient_key_idx
  ON public.treatment_proposals (patient_key);

CREATE TABLE IF NOT EXISTS public.treatment_proposal_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.treatment_proposals (id) ON DELETE CASCADE,
  service_id  uuid NOT NULL REFERENCES public.services (id),
  description text NOT NULL, -- snapshot of the service title at proposal time
  amount_egp  numeric NOT NULL CHECK (amount_egp > 0)
);

-- RLS: admin-only, matching every other table in this feature and its
-- predecessor (patient_treatments, patient_billing_entries).
```

Both new tables get the standard admin-only RLS policy (`USING (public.is_admin())`), matching `patient_treatments`/`patient_billing_entries`.

Permission: reuses `patients.billing.edit` (already exists, already granted to `owner`/`front-desk`, not `doctor`) for accept/decline. Creating a proposal is doctor-initiated, so it's gated on `patients.treatments.edit` (already exists, already granted to the `doctor` role) — a doctor doesn't need billing-edit to propose services, only front desk/owner needs it to convert a proposal into a real charge.

## WhatsApp

Reuses the exact mechanism already in place for the six other not-yet-approved notification kinds (`followup`, `recall_6m`, `waitlist_offer`, `review_request`, `cancellation`, and one more — see `src/services/patient_notifications/templateProposals.ts`'s header comment): `buildTemplateForKind()` (`templateParams.ts`) switches on `kind` and falls through to `default: return null` for anything without a case, which `dispatchNotification.ts` cleanly records as `skipped` / `no_approved_template` — no crash, no special-casing needed elsewhere.

So this feature does **not** touch `TemplateKind`/`PATIENT_TEMPLATES`/`buildTemplateForKind` at all yet — that trio only gets a new case once a template is actually Meta-approved (a later, separate one-line change, exactly like the file's own header comment already describes for its two existing kinds). What this feature does add:

- Enqueues a `patient_notifications` row with `kind: "treatment_proposal"` (via the same `.upsert(..., { onConflict: "dedupe_key", ignoreDuplicates: true })` pattern `enqueueFollowupsAndRecalls` already uses), `service_label` set to a pre-composed human-readable summary ("Root canal (EGP 1,500), Crown (EGP 2,000) — Dr. Youssef — Total EGP 3,500") — composed server-side at proposal-send time, never by a model, same reasoning as `depositInstructions`. This reuses the *existing* `ConfirmationInput` shape (`patientName`, `clinicName`, `startsAt`, `serviceLabel`, `language`) with zero type changes: the whole message rides in `serviceLabel`.
- A new entry in `TEMPLATE_PROPOSALS` (`templateProposals.ts`) — the EN/AR body text to submit to Meta, sitting alongside the other six already-documented-but-unsubmitted proposals, so "what do I submit for this one" lives in the same place as every other pending template.

Until that template is approved and wired in, the proposal is fully queued and correctly tracked (visible in `/admin/outbox`, same as the other six pending kinds) but doesn't yet reach the patient — this is the same limitation already called out in Non-goals, just grounded in the actual mechanism now.

## UI

**Patient Billing page** (`src/features/admin/components/patients/billing/PatientBillingView.tsx`) gains two new sections:

- **"Propose services"** (visible to anyone with `patients.treatments.edit`): pick a doctor (reusing the `doctors` list already passed into this component for the charge form's price lookup), add one or more service line items (service picker → price auto-fills via the existing `resolveServiceDoctorPrice`/`extractSingleAmount`, editable), "Send proposal" creates the `treatment_proposals`/`treatment_proposal_items` rows and enqueues the WhatsApp notification.
- **"Pending proposals"** (visible to anyone with `patients.billing.edit`): lists proposals with `status = 'sent'` for this patient, each with Accept/Decline. Accept inserts one `patient_treatments` row per item (`doctor_id`, `service_id`, `tooth_name` = service title, `fee_amount` = item amount, `status: 'open'`) and marks the proposal `accepted`. Decline just marks it `declined`.

No new routes, no new nav entries — everything lives on the page that already exists.

## Known limitation, accepted

A proposal's price is locked in at send time (`treatment_proposal_items.amount_egp`, a snapshot) — if a doctor's price override or the service's clinic-wide price changes after a proposal is sent but before it's accepted, the already-sent proposal keeps its original price. This matches how a quote should behave (the number the patient saw is the number they get), so it's the intended behavior, not a gap.
