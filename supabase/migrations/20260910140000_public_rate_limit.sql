-- Rate limiting for public, unauthenticated write endpoints (currently just
-- POST /api/v1/booking). A single-column log table + one atomic RPC that
-- counts-and-inserts under an advisory lock, so concurrent requests from
-- the same (bucket, identifier) can't both slip through the check.
-- Rollback:
--   DROP FUNCTION IF EXISTS public.check_and_log_rate_limit;
--   DROP TABLE IF EXISTS public.public_request_log;

CREATE TABLE IF NOT EXISTS public.public_request_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bucket text NOT NULL,
  identifier text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- The RPC always queries "recent" rows for a (bucket, identifier); this
-- index makes that a range scan instead of a table scan as the log grows.
CREATE INDEX IF NOT EXISTS public_request_log_lookup_idx
  ON public.public_request_log (bucket, identifier, created_at DESC);

-- Unbounded growth guard: nothing reads rows older than the widest window
-- any caller uses (currently one hour), so anything older is dead weight.
CREATE INDEX IF NOT EXISTS public_request_log_created_at_idx
  ON public.public_request_log (created_at);

ALTER TABLE public.public_request_log ENABLE ROW LEVEL SECURITY;

-- No direct table access for anon/authenticated at all — every read and
-- write goes through the SECURITY DEFINER RPC below.
DROP POLICY IF EXISTS public_request_log_admin_all ON public.public_request_log;
CREATE POLICY public_request_log_admin_all
  ON public.public_request_log
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.check_and_log_rate_limit(
  p_bucket text,
  p_identifier text,
  p_max_requests int,
  p_window_seconds int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  -- Serializes concurrent calls for the SAME (bucket, identifier) only —
  -- unrelated callers never block each other. Released automatically at
  -- the end of this transaction (each RPC call is its own transaction).
  PERFORM pg_advisory_xact_lock(hashtextextended(p_bucket || ':' || p_identifier, 0));

  SELECT count(*) INTO v_count
  FROM public.public_request_log
  WHERE bucket = p_bucket
    AND identifier = p_identifier
    AND created_at > now() - make_interval(secs => p_window_seconds);

  IF v_count >= p_max_requests THEN
    RETURN false;
  END IF;

  INSERT INTO public.public_request_log (bucket, identifier)
  VALUES (p_bucket, p_identifier);

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.check_and_log_rate_limit(text, text, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_and_log_rate_limit(text, text, int, int) TO anon, authenticated;
