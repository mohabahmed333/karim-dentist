-- AI usage, one row per model per UTC day.
--
-- No provider in the chain offers a usage API we can query, so the only honest
-- source is what we spend ourselves: every OpenAI-compatible response carries a
-- token count, and a 429 tells us a model hit its cap. Both are recorded here
-- so /admin/usage can show which models are carrying the traffic and which one
-- ran out — the question the fallback chain exists to answer.
--
-- A daily rollup rather than a row per call: this is written on the path of
-- every patient message, and the page only ever asks for totals.
--
-- Rollback:
--   DROP FUNCTION IF EXISTS public.record_ai_usage(text, text, int, bigint, bigint, int);
--   DROP TABLE IF EXISTS public.ai_usage_daily;

CREATE TABLE IF NOT EXISTS public.ai_usage_daily (
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  provider text NOT NULL,
  model text NOT NULL,
  requests integer NOT NULL DEFAULT 0,
  prompt_tokens bigint NOT NULL DEFAULT 0,
  completion_tokens bigint NOT NULL DEFAULT 0,
  -- How often this model refused for quota, and when it last did. Enough for
  -- the page to say "hit its limit at 14:32" without sharing memory with the
  -- serverless instance that saw it.
  rate_limited_count integer NOT NULL DEFAULT 0,
  last_rate_limited_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (day, provider, model)
);

-- The page reads "today", and housekeeping reads "older than N days".
CREATE INDEX IF NOT EXISTS ai_usage_daily_day_idx
  ON public.ai_usage_daily (day DESC);

-- ---------------------------------------------------------------------------
-- Atomic increment. Concurrent auto-replies land on the same row, so the
-- upsert adds to what is there rather than reading and writing back.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_ai_usage(
  p_provider text,
  p_model text,
  p_requests int DEFAULT 0,
  p_prompt_tokens bigint DEFAULT 0,
  p_completion_tokens bigint DEFAULT 0,
  p_rate_limited int DEFAULT 0
) RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.ai_usage_daily AS u (
    day, provider, model, requests, prompt_tokens, completion_tokens,
    rate_limited_count, last_rate_limited_at
  )
  VALUES (
    (now() AT TIME ZONE 'utc')::date,
    p_provider,
    p_model,
    GREATEST(p_requests, 0),
    GREATEST(p_prompt_tokens, 0),
    GREATEST(p_completion_tokens, 0),
    GREATEST(p_rate_limited, 0),
    CASE WHEN p_rate_limited > 0 THEN now() ELSE NULL END
  )
  ON CONFLICT (day, provider, model) DO UPDATE SET
    requests = u.requests + EXCLUDED.requests,
    prompt_tokens = u.prompt_tokens + EXCLUDED.prompt_tokens,
    completion_tokens = u.completion_tokens + EXCLUDED.completion_tokens,
    rate_limited_count = u.rate_limited_count + EXCLUDED.rate_limited_count,
    -- Keep the earlier timestamp when this call was not itself rate limited.
    last_rate_limited_at = COALESCE(EXCLUDED.last_rate_limited_at, u.last_rate_limited_at),
    updated_at = now();
$$;

-- ---------------------------------------------------------------------------
-- RLS — admin-only reads, matching every other operational table. Writes come
-- from the service role, which bypasses RLS.
-- ---------------------------------------------------------------------------
ALTER TABLE public.ai_usage_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_usage_daily_admin_read ON public.ai_usage_daily;
CREATE POLICY ai_usage_daily_admin_read ON public.ai_usage_daily
  FOR SELECT TO authenticated USING (public.is_admin());

REVOKE ALL ON FUNCTION public.record_ai_usage(text, text, int, bigint, bigint, int) FROM public;
GRANT EXECUTE ON FUNCTION public.record_ai_usage(text, text, int, bigint, bigint, int) TO service_role;
