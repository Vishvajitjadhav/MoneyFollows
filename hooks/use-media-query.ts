"use client";

import { useSyncExternalStore } from "react";

/** SSR-safe media query. Returns `serverValue` during server render/hydration. */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export const useIsDesktop = () => useMediaQuery("(min-width: 768px)");
