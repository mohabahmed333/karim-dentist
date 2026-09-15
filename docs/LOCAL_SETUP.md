# Local setup — The Dental Lounge

Next.js App Router + Supabase admin CMS and clinical workspace.

## 1. Env

```bash
cp .env.example .env.local
```

Fill Supabase keys from  
https://supabase.com/dashboard/project/puibdsyokgjdvkkousil/settings/api

Optional AI assist. Every AI feature asks one chain of models, top to bottom,
and the first with quota left answers — so any one of these works, and more of
them means the assistant keeps answering after a busy day:

```bash
GEMINI_API_KEY=...     # https://aistudio.google.com/apikey — free, resets daily
MISTRAL_API_KEY=...    # https://console.mistral.ai — free Experiment tier, monthly
GROQ_API_KEY=...       # https://console.groq.com — free, resets daily
```

All three free tiers renew on their own. Providers that only hand out trial
credits are deliberately not in the chain — a link that dies a month after
signup fails silently, which is what the chain exists to prevent.

Check the keys you added actually answer, in Arabic as well as English:

```bash
node --experimental-strip-types --import ./scripts/test-loader.mjs \
  --env-file=.env.local scripts/ai-chain-smoke.mjs
```

## 2. Install & run

```bash
yarn
yarn dev
```

- Public site: http://localhost:3000  
- Admin login: http://localhost:3000/admin/login  
- Admin home: http://localhost:3000/admin  

## 3. Admin login (local)

| Field | Value |
| --- | --- |
| **Email (username)** | `admin@dentallounge.local` |
| **Password** | `DentalLounge2026!` |

These are **local / demo credentials only**. Do not reuse in production.

### Create the user once (Supabase)

1. Open [Authentication → Users](https://supabase.com/dashboard/project/puibdsyokgjdvkkousil/auth/users).
2. **Add user** → email `admin@dentallounge.local`, password `DentalLounge2026!`, auto-confirm.
3. If this is the first auth user, migration `20260822214000_admin_and_dummy_data.sql` promotes them to `profiles.role = 'admin'`.
4. Otherwise set admin in SQL:

```sql
UPDATE public.profiles
SET role = 'admin',
    display_name = 'Admin',
    deleted_at = NULL,
    updated_at = now()
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'admin@dentallounge.local'
  LIMIT 1
);
```

You can also mirror these in `.env.local` for your own notes (not required by the app):

```bash
ADMIN_EMAIL=admin@dentallounge.local
ADMIN_PASSWORD=DentalLounge2026!
```

## 4. Test accounts and a test patient (billing flow)

The owner account above can see everything, which makes it the wrong account
for testing anything role-specific — a doctor cannot read the WhatsApp inbox,
and only the front desk collects payment. One script creates both logins, a
patient sitting in the chair right now, and the completed work to bill:

```bash
node --env-file=.env.e2e scripts/seed-billing-demo.mjs --dry-run   # see the plan
node --env-file=.env.e2e scripts/seed-billing-demo.mjs             # write it
node --env-file=.env.e2e scripts/seed-billing-demo.mjs --undo      # remove it
```

| Role | Email | Password |
| --- | --- | --- |
| Owner | `admin@dentallounge.local` | `DentalLounge2026!` |
| Doctor | `doctor@dentallounge.local` | `DentalLounge2026!` |
| Front desk | `frontdesk@dentallounge.local` | `DentalLounge2026!` |

It also seeds **Test Patient Billing** (`+201000000001`) with an appointment at
10:00 today assigned to the test doctor, two completed treatments on that
appointment, and a doctor fee of EGP 750 / 1200 for the two services it used.

**It refuses to run against production.** `.env.local` points at the hosted
project, so the script checks the URL and stops unless you pass
`--i-know-this-is-production`. Use `.env.e2e`.

Every id it writes goes into `scripts/.seed-billing-demo.json`, and `--undo`
deletes exactly those and nothing else. Logins that already existed are reused
rather than recreated, and never deleted by `--undo`.

### Walking the billing flow

1. Sign in as the **doctor** → `/admin/my-day`. The test patient is in the
   chair. **Bill visit** opens with two lines — the treatments, not the booked
   service — priced 750 and 1200 from that doctor's fees. Send it.
2. Sign in as the **front desk** (a second browser or a private window, so both
   sessions stay live) → the Billing nav entry now carries a count, and the
   overview Attention list shows *Bills awaiting payment*.
3. Open `/admin/billing`. With the doctor's window still open, send a second
   bill: the request appears without a reload, with a chime.
4. **Collect cash** → the patient's ledger gains a payment row and the badge
   drops.

Step 3 needs the realtime migration applied (`supabase db push`); without it
the queue still updates, just on the 30-second poll instead of instantly.

## 5. Clinical workspace smoke test

1. Sign in → **Patients** → open a patient → **Clinical workspace**.
2. Select a tooth → chat to draft a treatment.
3. **Create required treatment** → **Review existing** (wizard, top tabs when saved).
4. **Book** / **`/reschedule`** → date popover → Confirm.

Sample chat prompt:

```
Deep distal caries on this tooth, sensitive to cold. Suggest a composite fill from the clinic menu.
```

## 6. Useful commands

| Command | Purpose |
| --- | --- |
| `yarn dev` | Local site + admin |
| `yarn build` | Production build |
| `supabase link --project-ref puibdsyokgjdvkkousil` | Link remote DB |
| `supabase db push --linked` | Apply migrations |

## 6b. Kapso WhatsApp (Front desk)

Front desk (`/admin/support`) stores chats in Supabase and sends/receives via Kapso.

Add to `.env.local` (never commit):

```bash
KAPSO_API_KEY=...
KAPSO_PHONE_NUMBER_ID=...
KAPSO_WEBHOOK_SECRET=...   # same secret_key you set in Kapso
KAPSO_BUSINESS_ACCOUNT_ID=...  # WhatsApp Business Account (WABA) id — list templates
```

Webhook path (Kapso → your app → Supabase):

```text
https://YOUR_PUBLIC_HOST/api/v1/whatsapp/webhook
```

Local: run `yarn dev`, then `ngrok http 3000`, register the ngrok HTTPS URL + path above in Kapso WhatsApp webhooks for your phone number. Subscribe to message received/sent/delivered/read/failed and conversation created/ended.

## 7. Layout

| Path | Role |
| --- | --- |
| `src/app` | Routes (public `/`, admin `/admin`) |
| `src/features` | Portfolio + admin UI |
| `src/services` | Supabase data access |
| `supabase/migrations` | Schema + seed |
| `prompts/` | Versioned AI prompts |
