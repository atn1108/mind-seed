import { useEffect, useRef } from "react";

function format(s: number) {
  const safe = Math.max(0, Math.ceil(s));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

/** Show the remaining countdown in the tab title (next to the favicon) while a
 *  focus timer or shared room timer is running. Restores the original title
 *  when it stops, is paused, or the page unmounts. */
export function useCountdownTitle(leftSeconds: number, active: boolean) {
  // Capture the route/base title once; re-reading it every second would stack
  // the countdown onto itself.
  const baseRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (baseRef.current === null) baseRef.current = document.title;
    const base = baseRef.current;

    if (!active) {
      document.title = base;
      return;
    }

    // Keep only the page name during countdown (drop the "— MindSeed" suffix).
    const displayBase = base.replace(/\s*—\s*[^—]*$/, "");
    document.title = `⏳ ${format(leftSeconds)} · ${displayBase}`;
    return () => {
      document.title = base;
    };
  }, [leftSeconds, active]);
}