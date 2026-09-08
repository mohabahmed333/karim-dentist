# Local setup — The Dental Lounge

Next.js App Router + Supabase admin CMS and clinical workspace.

## 1. Env

```bash
cp .env.example .env.local
```

Fill Supabase keys from  
https://supabase.com/dashboard/project/puibdsyokgjdvkkousil/settings/api

Optional AI assist:

```bash
GROQ_API_KEY=...
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

## 4. Clinical workspace smoke test

1. Sign in → **Patients** → open a patient → **Clinical workspace**.
2. Select a tooth → chat to draft a treatment.
3. **Create required treatment** → **Review existing** (wizard, top tabs when saved).
4. **Book** / **`/reschedule`** → date popover → Confirm.

Sample chat prompt:

```
Deep distal caries on this tooth, sensitive to cold. Suggest a composite fill from the clinic menu.
```

## 5. Useful commands

| Command | Purpose |
| --- | --- |
| `yarn dev` | Local site + admin |
| `yarn build` | Production build |
| `supabase link --project-ref puibdsyokgjdvkkousil` | Link remote DB |
| `supabase db push --linked` | Apply migrations |

## 5b. Kapso WhatsApp (Front desk)

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

## 6. Layout

| Path | Role |
| --- | --- |
| `src/app` | Routes (public `/`, admin `/admin`) |
| `src/features` | Portfolio + admin UI |
| `src/services` | Supabase data access |
| `supabase/migrations` | Schema + seed |
| `prompts/` | Versioned AI prompts |
