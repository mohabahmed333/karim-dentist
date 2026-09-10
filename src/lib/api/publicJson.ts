import { NextResponse } from "next/server";

/**
 * Shared response shape for the public read-only API (/api/v1/public/*).
 * CORS is wide open on purpose — these are read-only GETs with no
 * authentication, meant for any AI agent or client-side tool to call
 * directly from a browser. Never use this for a write endpoint.
 */
export function publicJson(data: unknown, opts?: { sMaxAge?: number }) {
  const sMaxAge = opts?.sMaxAge ?? 300;
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=${sMaxAge * 4}`,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}

/** CORS preflight response for a public GET-only route. */
export function publicJsonOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Max-Age": "86400",
    },
  });
}
