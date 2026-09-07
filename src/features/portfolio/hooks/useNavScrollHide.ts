"use client";

import { useScrollDirectionHide } from "./useScrollDirectionHide";

export function useNavScrollHide(open: boolean) {
  useScrollDirectionHide("site-nav", open);
}
