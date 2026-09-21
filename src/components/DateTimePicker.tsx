import { useState } from "react";
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

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

/**
 * Pretty datetime picker: a button opening a calendar + hour/minute selects.
 * Same string model as datetime-local ("YYYY-MM-DDTHH:mm", "" when unset),
 * so it swaps in anywhere a datetime input was used.
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
  const current = parseLocal(value);

  const setKeepingTime = (date: Date | undefined) => {
    if (!date) {
      onChange("");
      return;
    }
    const base = current ?? new Date();
    date.setHours(base.getHours(), base.getMinutes(), 0, 0);
    onChange(toLocalValue(date));
  };

  const setTime = (hour: number, minute: number) => {
    const base = current ?? new Date();
    base.setHours(hour, minute, 0, 0);
    onChange(toLocalValue(base));
  };

  const p2 = (n: number) => String(n).padStart(2, "0");
  const label = current
    ? `${current.toLocaleDateString()} · ${p2(current.getHours())}:${p2(current.getMinutes())}`
    : t("Set date & time");

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
      <PopoverContent className="w-auto max-h-[80vh] overflow-y-auto rounded-3xl p-3" align="start">
        <Calendar mode="single" selected={current} onSelect={setKeepingTime} />
        <div className="border-t border-border px-1 py-3">
          <p className="mb-1.5 px-1 text-[11px] font-medium text-muted-foreground">{t("Hour")}</p>
          <div className="grid grid-cols-6 gap-1">
            {HOURS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setTime(h, current?.getMinutes() ?? 0)}
                className={`h-8 rounded-lg text-xs tabular-nums transition-colors ${
                  current?.getHours() === h
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {p2(h)}
              </button>
            ))}
          </div>
          <p className="mb-1.5 mt-2.5 px-1 text-[11px] font-medium text-muted-foreground">
            {t("Minute")}
          </p>
          <div className="grid grid-cols-6 gap-1">
            {MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setTime(current?.getHours() ?? 9, m)}
                className={`h-8 rounded-lg text-xs tabular-nums transition-colors ${
                  (current?.getMinutes() ?? 0) === m
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {p2(m)}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
