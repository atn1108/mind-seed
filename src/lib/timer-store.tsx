import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useMindSeed } from "@/lib/mindseed-store";

type TimerCtx = {
  durationMin: number;
  running: boolean;
  /** Seconds left — derived from wall clock so background-tab throttling cannot drift it. */
  left: number;
  total: number;
  /** Increments each time a session completes naturally; UI reacts to changes. */
  finishedTick: number;
  setDuration: (min: number) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
};

const Ctx = createContext<TimerCtx | null>(null);

export function TimerProvider({ children }: { children: ReactNode }) {
  const { addSession } = useMindSeed();
  const [durationMin, setDurationMin] = useState(25);
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(25 * 60);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [finishedTick, setFinishedTick] = useState(0);
  const completedRef = useRef(false);

  // The interval only refreshes `now`; the countdown itself is wall-clock math.
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [running]);

  // Recalculate instantly when the tab becomes visible again.
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) setNow(Date.now());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const left = endsAt !== null ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : remaining;

  // Natural completion: credit the session exactly once, even while off-page.
  useEffect(() => {
    if (running && endsAt !== null && left === 0 && !completedRef.current) {
      completedRef.current = true;
      setRunning(false);
      setEndsAt(null);
      setRemaining(0);
      setFinishedTick((v) => v + 1);
    }
  }, [running, endsAt, left]);

  const setDuration = useCallback((min: number) => {
    completedRef.current = false;
    setDurationMin(min);
    setRunning(false);
    setEndsAt(null);
    setRemaining(min * 60);
  }, []);

  const start = useCallback(() => {
    // A finished (or empty) session restarts from the full duration instead of
    // instantly completing again at 00:00.
    const secs = remaining > 0 ? remaining : durationMin * 60;
    completedRef.current = false;
    setRunning(true);
    setEndsAt(Date.now() + secs * 1000);
  }, [remaining, durationMin]);

  const pause = useCallback(() => {
    setRunning(false);
    if (endsAt !== null) {
      setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
      setEndsAt(null);
    }
  }, [endsAt]);

  const resume = start;

  const stop = useCallback(() => {
    const elapsedSec = durationMin * 60 - left;
    if (elapsedSec > 0 && elapsedSec < durationMin * 60) addSession(durationMin, false);
    completedRef.current = false;
    setRunning(false);
    setEndsAt(null);
    setRemaining(durationMin * 60);
  }, [durationMin, left, addSession]);

  const value = useMemo<TimerCtx>(
    () => ({
      durationMin,
      running,
      left,
      total: durationMin * 60,
      finishedTick,
      setDuration,
      start,
      pause,
      resume,
      stop,
    }),
    [durationMin, running, left, finishedTick, setDuration, start, pause, resume, stop],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTimer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTimer must be used within <TimerProvider>");
  return ctx;
}
