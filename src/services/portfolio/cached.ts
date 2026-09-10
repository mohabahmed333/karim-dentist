import { unstable_cache } from "next/cache";
import { getPortfolioData } from "./queries";

/**
 * getPortfolioData() reads via createPublicClient(), which hardcodes
 * fetch(..., { cache: "no-store" }) — that alone forces every caller
 * dynamic, regardless of route config. unstable_cache() isolates that
 * uncached inner call behind Next's own cache, so pages that only call
 * the cached wrapper (not getPortfolioData directly) can be static/ISR.
 *
 * One tag for the whole bundle rather than per-table: getPortfolioData
 * already fetches everything in a single Promise.all, so splitting tags
 * would mean splitting the query too. Revalidating "portfolio" on any
 * content save invalidates the whole cached result — correct, if not
 * maximally precise. 900s (15 min) is the safety net if a save handler's
 * revalidateTag call is ever missed — see src/services/admin/revalidate.ts.
 */
export const getCachedPortfolioData = unstable_cache(
  getPortfolioData,
  ["portfolio-data"],
  { tags: ["portfolio"], revalidate: 900 },
);
