import { createClient } from "@/lib/supabase/server";

/**
 * Atomically checks and logs one attempt against a (bucket, identifier)
 * window via the check_and_log_rate_limit RPC. Returns true when the
 * request is allowed (and has been logged), false when the caller should
 * be rejected. Fails open on an unexpected DB error — a rate limiter that
 * takes down the feature it protects on a transient outage is worse than
 * one that occasionally lets a burst through.
 */
export async function checkRateLimit(
  bucket: string,
  identifier: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("check_and_log_rate_limit", {
      p_bucket: bucket,
      p_identifier: identifier,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error("checkRateLimit RPC error", error);
      return true;
    }
    return data === true;
  } catch (err) {
    console.error("checkRateLimit failed", err);
    return true;
  }
}
