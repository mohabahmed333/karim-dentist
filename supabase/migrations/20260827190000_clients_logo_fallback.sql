-- Clients logo image with name as text fallback.
-- logo_url + media_type already exist on most envs; this keeps drift-safe.

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS logo_url text;

COMMENT ON COLUMN public.clients.logo_url IS
  'Optional brand logo. When null/empty, public UI shows name as text fallback.';
COMMENT ON COLUMN public.clients.name IS
  'Client label; used as text fallback when logo_url is empty.';
