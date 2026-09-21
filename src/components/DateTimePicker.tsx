import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarClock, X } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useT } from "@/lib/ui-language";
import { cn } from "@/lib/utils";

function parseLocal(value: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value); // "YYYY-MM-DDTHH:mm" parses in local time
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function toLocalValue(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const p2 = (n: number) => String(n).padStart(2, "0");

// Dials always show 12 positions per ring; hours use two rings (0-11, 12-23).
const HOUR_RINGS = [
  Array.from({ length: 12 }, (_, i) => i),
  Array.from({ length: 12 }, (_, i) => i + 12),
];
const MINUTE_STEPS = Array.from({ length: 12 }, (_, i) => i * 5);

type Mode = "date" | "hour" | "minute";

/**
 * Datetime picker with a clock-face time dial: tap a number and the hand
 * points at it. The calendar fades out to make room for the dial.
 * Same string model as datetime-local ("YYYY-MM-DDTHH:mm", "" when unset).
 */
export function DateTimePicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("date");
  const current = parseLocal(value);

  const hour = current?.getHours() ?? 9;
  const minute = current?.getMinutes() ?? 0;

  const setKeepingTime = (date: Date | undefined) => {
    if (!date) {
      onChange("");
      return;
    }
    const base = current ?? new Date();
    date.setHours(base.getHours(), base.getMinutes(), 0, 0);
    onChange(toLocalValue(date));
  };

  const setTime = (h: number, m: number) => {
    const base = current ?? new Date();
    base.setHours(h, m, 0, 0);
    onChange(toLocalValue(base));
  };

  const pickHour = (h: number) => {
    setTime(h, minute);
    setMode("minute");
  };

  const pickMinute = (m: number) => {
    setTime(hour, m);
    setOpen(false);
  };

  const label = current
    ? `${current.toLocaleDateString()} · ${p2(hour)}:${p2(minute)}`
    : t("Set date & time");

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setMode("date");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-11 items-center gap-2 rounded-2xl border border-input bg-transparent px-3 text-sm shadow-sm transition-colors hover:bg-muted/50",
            !current && "text-muted-foreground",
            className,
          )}
        >
          <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate tabular-nums">{label}</span>
          {current && (
            <span
              role="button"
              tabIndex={0}
              aria-label={t("Clear")}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange("");
                }
              }}
              className="ml-auto rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[300px] max-w-[calc(100vw-2rem)] rounded-3xl p-3"
        align="start"
        collisionPadding={16}
      >
        <div className="mb-2 flex flex-col items-center gap-1.5">
          <Seg active={mode === "date"} onClick={() => setMode("date")} className="w-full">
            <span className="block max-w-full truncate tabular-nums">
              {current ? current.toLocaleDateString() : t("Date")}
            </span>
          </Seg>
          <div className="flex items-center justify-center gap-1.5">
            <Seg active={mode === "hour"} onClick={() => setMode("hour")} className="w-12">
              <span className="tabular-nums">{p2(hour)}</span>
            </Seg>
            <span className="font-semibold text-muted-foreground">:</span>
            <Seg active={mode === "minute"} onClick={() => setMode("minute")} className="w-12">
              <span className="tabular-nums">{p2(minute)}</span>
            </Seg>
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.16 }}
          >
            {mode === "date" ? (
              <Calendar mode="single" selected={current} onSelect={setKeepingTime} />
            ) : mode === "hour" ? (
              <ClockDial
                size={272}
                rings={HOUR_RINGS}
                format={(h) => String(h)}
                selected={hour}
                onPick={pickHour}
              />
            ) : (
              <ClockDial
                size={232}
                rings={[MINUTE_STEPS]}
                format={p2}
                selected={MINUTE_STEPS.includes(minute) ? minute : -1}
                onPick={pickMinute}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-1 flex items-center justify-between border-t border-border px-1 pt-2.5">
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {t("Clear")}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-transform active:scale-95"
          >
            {t("Done")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Seg({
  active,
  onClick,
  className,
  children,
}: {
  active: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-center text-xs font-semibold transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:text-foreground"
      } ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

/** Analog dial with one ring per value set (hours: outer 0-11, inner 12-23).
 *  Tapping a number selects it; a hand under the numbers points at it.
 *  `selected` is the value itself (-1 hides the hand). */
function ClockDial({
  size,
  rings,
  format,
  selected,
  onPick,
}: {
  size: number;
  rings: number[][];
  format: (v: number) => string;
  selected: number;
  onPick: (value: number) => void;
}) {
  const center = size / 2;
  const radii = rings.map((_, r) => center - 24 - r * 40);
  const hit = rings.map((values, r) => ({ r, i: values.indexOf(selected) })).find((h) => h.i >= 0);

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full bg-muted/60" />
      {hit && (
        <div
          className="absolute left-1/2 top-1/2 z-0 h-0.5 origin-left rounded-full bg-primary/70"
          style={{ width: radii[hit.r], transform: `rotate(${-90 + hit.i * 30}deg)` }}
        />
      )}
      <div className="absolute left-1/2 top-1/2 z-10 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
      {rings.map((values, r) =>
        values.map((v, i) => {
          const a = ((i * 30 - 90) * Math.PI) / 180;
          const x = Math.cos(a) * radii[r]!;
          const y = Math.sin(a) * radii[r]!;
          const isSel = v === selected;
          return (
            <button
              key={`${r}-${v}`}
              type="button"
              onClick={() => onPick(v)}
              style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
              className={`absolute z-10 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[13px] tabular-nums transition-all active:scale-90 ${
                isSel
                  ? "bg-primary font-semibold text-primary-foreground shadow"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {format(v)}
            </button>
          );
        }),
      )}
    </div>
  );
}
