import { createFileRoute } from "@tanstack/react-router";
import { useT } from "@/lib/ui-language";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Minus, Pause, Play, Plus, Square } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Confetti, ReflectionDialog } from "@/components/ReflectionDialog";
import { TreeVisual } from "@/components/TreeVisual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMindSeed } from "@/lib/mindseed-store";
import { useTimer } from "@/lib/timer-store";

const OPTIONS = [25, 30, 45, 60];
const MIN_CUSTOM = 5;
const MAX_CUSTOM = 180;

const clampCustom = (m: number) => Math.min(MAX_CUSTOM, Math.max(MIN_CUSTOM, Math.round(m)));

export const Route = createFileRoute("/timer")({
  head: () => ({
    meta: [
      { title: "Focus Timer — MindSeed" },
      {
        name: "description",
        content:
          "A 25/30/45/60 minute timer with progress tracking and tree growth after each session.",
      },
      { property: "og:title", content: "Focus Timer — MindSeed" },
      {
        property: "og:description",
        content: "One focused session, one small step for your garden.",
      },
    ],
  }),
  component: TimerPage,
});

function TimerPage() {
  const t = useT();
  const { state } = useMindSeed();
  const timer = useTimer();
  const { durationMin, running, left, total, finishedTick } = timer;

  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("45");

  const isCustom = !OPTIONS.includes(durationMin);
  const progress = ((total - left) / total) * 100;
  const size = 300;
  const r = size / 2 - 16;
  const c = 2 * Math.PI * r;

  // Celebrate only when a NEW completion happens while this page is open —
  // never re-fire for an old finishedTick on mount.
  const celebratedRef = useRef(finishedTick);
  useEffect(() => {
    if (finishedTick === celebratedRef.current) return;
    celebratedRef.current = finishedTick;
    toast.success(t("Session complete! Your tree just grew 🌿"));
    setConfetti(true);
    setTimeout(() => setConfetti(false), 3000);
    setTimeout(() => setReflect(true), 900);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- celebrate once per tick; t is stable enough here
  }, [finishedTick]);

  const select = (m: number) => {
    setCustomOpen(false);
    timer.setDuration(m);
  };

  const applyCustom = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) return;
    select(clampCustom(parsed));
  };

  const stepCustom = (delta: number) => {
    const base = Number.parseInt(customValue, 10);
    const next = clampCustom((Number.isNaN(base) ? durationMin : base) + delta);
    setCustomValue(String(next));
    select(next);
  };

  const [confetti, setConfetti] = useState(false);
  const [reflect, setReflect] = useState(false);

  return (
    <AppShell>
      <Confetti show={confetti} />
      <ReflectionDialog open={reflect} onOpenChange={setReflect} />

      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        {t("Focus Timer")}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {t("Choose a study session length and let everything else fade away.")}
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="surface flex flex-col items-center p-6 sm:p-9">
          <div className="flex flex-wrap justify-center gap-2">
            {OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => select(m)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  m === durationMin
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-primary-soft hover:text-primary"
                }`}
              >
                {m} {t("min")}
              </button>
            ))}
            <button
              onClick={() => {
                if (!isCustom)
                  setCustomValue(String(clampCustom(Number.parseInt(customValue, 10) || durationMin)));
                setCustomOpen((v) => !v);
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isCustom || customOpen
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-primary-soft hover:text-primary"
              }`}
            >
              {isCustom ? `${durationMin} ${t("min")}` : t("Custom")}
            </button>
          </div>

          {customOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="mt-3 flex items-center justify-center gap-2"
            >
              <Button
                variant="outline"
                size="icon"
                className="size-9 shrink-0 cursor-pointer rounded-full"
                onClick={() => stepCustom(-5)}
                aria-label="-5 min"
              >
                <Minus className="size-4" />
              </Button>
              <Input
                type="number"
                inputMode="numeric"
                min={MIN_CUSTOM}
                max={MAX_CUSTOM}
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onBlur={() => applyCustom(customValue)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    applyCustom(customValue);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className="h-10 w-24 rounded-full text-center tabular-nums"
                aria-label={t("Custom minutes")}
              />
              <span className="text-sm text-muted-foreground">{t("min")}</span>
              <Button
                variant="outline"
                size="icon"
                className="size-9 shrink-0 cursor-pointer rounded-full"
                onClick={() => stepCustom(5)}
                aria-label="+5 min"
              >
                <Plus className="size-4" />
              </Button>
            </motion.div>
          )}

          <div
            className="relative mt-8 grid place-items-center"
            style={{ width: size, height: size }}
          >
            <svg width={size} height={size} className="-rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                strokeWidth="14"
                className="stroke-muted"
                fill="none"
              />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                strokeWidth="14"
                strokeLinecap="round"
                className="stroke-primary"
                fill="none"
                strokeDasharray={c}
                animate={{ strokeDashoffset: c - (c * progress) / 100 }}
                transition={{ duration: 0.6, ease: "linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-6xl font-semibold tabular-nums tracking-tight">
                {String(Math.floor(left / 60)).padStart(2, "0")}:
                {String(left % 60).padStart(2, "0")}
              </span>
              <span className="mt-1.5 text-sm text-muted-foreground">
                {running ? t("In focus…") : left < total ? t("Paused") : t("Ready")}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              className="h-12 rounded-2xl px-8 text-[15px] transition-transform active:scale-[0.97]"
              onClick={() => (running ? timer.pause() : left < total ? timer.resume() : timer.start())}
            >
              {running ? <Pause className="size-4" /> : <Play className="size-4 fill-current" />}
              {running ? t("Pause") : left < total ? t("Resume") : t("Start")}
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-2xl px-6 transition-transform active:scale-[0.97]"
              onClick={() => {
                timer.stop();
                toast(t("Session stopped. No problem — try again when you’re ready."));
              }}
            >
              <Square className="size-4" />
              {t("End")}
            </Button>
          </div>
        </div>

        <div className="surface flex flex-col items-center justify-center gap-4 p-7">
          <TreeVisual exp={state.exp} size={180} />
          <p className="text-center text-sm text-muted-foreground">
            {t("Your tree grows after each completed session. If you leave mid-session, it only earns a little EXP.")}
          </p>
          <div className="mt-2 grid w-full grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl bg-primary-soft p-4">
              <p className="font-display text-2xl font-semibold">{state.forest.length}</p>
              <p className="text-xs text-muted-foreground">{t("Trees planted")}</p>
            </div>
            <div className="rounded-2xl bg-accent/25 p-4">
              <p className="font-display text-2xl font-semibold">{state.exp}</p>
              <p className="text-xs text-muted-foreground">{t("Current EXP")}</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
