/** Local Supabase defaults from `supabase start`. Overridable for CI. */
export const SUPABASE_URL =
  process.env.E2E_SUPABASE_URL ?? "http://127.0.0.1:54321";
export const SERVICE_ROLE_KEY =
  process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "";
export const WEBHOOK_SECRET =
  process.env.KAPSO_WEBHOOK_SECRET ?? "e2e-webhook-secret";

export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@dentallounge.local";
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "DentalLounge2026!";
export const VIEWER_EMAIL = process.env.E2E_VIEWER_EMAIL ?? "viewer@dentallounge.local";
export const VIEWER_PASSWORD = process.env.E2E_VIEWER_PASSWORD ?? "Viewer2026!";
