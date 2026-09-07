"use client";

import { useEffect, useRef, useState } from "react";

export function usePhaseOpen(count: number) {
  const [open, setOpen] = useState(count > 0);
  const previous = useRef(count);

  useEffect(() => {
    if (previous.current === 0 && count > 0) setOpen(true);
    previous.current = count;
  }, [count]);

  return { open, setOpen };
}
