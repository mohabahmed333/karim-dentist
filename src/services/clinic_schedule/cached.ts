import { unstable_cache } from "next/cache";
import { getPublicClinicHours } from "./queries.server";

export const getCachedClinicHours = unstable_cache(
  getPublicClinicHours,
  ["clinic-hours"],
  { tags: ["clinic-hours"], revalidate: 3600 },
);
