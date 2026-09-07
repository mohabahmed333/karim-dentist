"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const TOOTH_PARAM = "tooth";

/** Read/write selected FDI via `?tooth=` so refresh keeps the selection. */
export function useToothSearchParam() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toothFromUrl = searchParams.get(TOOTH_PARAM);

  const setToothInUrl = useCallback(
    (fdi: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (fdi) params.set(TOOTH_PARAM, fdi);
      else params.delete(TOOTH_PARAM);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  return { toothFromUrl, setToothInUrl };
}
