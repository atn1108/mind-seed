import { useState } from "react";
import { CalendarClock, ChevronDown, X } from "lucide-react";

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

const p2 = (n: number) => String(n).padStart(2, "0");

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
  const [menu, setMenu] = useState<"hour" | "minute" | null>(null);
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

  const label = current
    ? `${current.toLocaleDateString()} · ${p2(current.getHours())}:${p2(current.getMinutes())}`
    : t("Set date & time");

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setMenu(null);
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
      <PopoverContent className="w-auto rounded-3xl p-3" align="start">
        <Calendar mode="single" selected={current} onSelect={setKeepingTime} />
        <div className="flex items-center justify-center gap-2 border-t border-border px-3 py-3">
          <TimeMenu
            label={t("Hour")}
            value={current?.getHours() ?? 9}
            options={HOURS}
            open={menu === "hour"}
            onOpen={() => setMenu("hour")}
            onClose={() => setMenu(null)}
            onPick={(h) => setTime(h, current?.getMinutes() ?? 0)}
          />
          <span className="font-semibold text-muted-foreground">:</span>
          <TimeMenu
            label={t("Minute")}
            value={current?.getMinutes() ?? 0}
            options={MINUTES}
            open={menu === "minute"}
            onOpen={() => setMenu("minute")}
            onClose={() => setMenu(null)}
            onPick={(m) => setTime(current?.getHours() ?? 9, m)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Custom dropdown: trigger button + floating option menu. Same pattern as a
 *  native select, but styled to match the app and tappable everywhere. */
function TimeMenu({
  label,
  value,
  options,
  open,
  onOpen,
  onClose,
  onPick,
}: {
  label: string;
  value: number;
  options: number[];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onPick: (v: number) => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={label}
        onClick={() => (open ? onClose() : onOpen())}
        className={`flex h-9 min-w-[4.25rem] items-center justify-between gap-1.5 rounded-xl border px-3 text-sm tabular-nums transition-colors ${
          open
            ? "border-primary bg-primary-soft text-primary"
            : "border-input bg-transparent text-foreground hover:bg-muted/60"
        }`}
      >
        {p2(value)}
        <ChevronDown
          className={`size-3.5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={onClose}
            className="fixed inset-0 z-40 cursor-default"
          />
          <ul className="absolute left-1/2 top-full z-50 mt-1.5 max-h-44 w-full min-w-[4.25rem] -translate-x-1/2 overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-lg [scrollbar-width:thin]">
            {options.map((o) => (
              <li key={o}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(o);
                    onClose();
                  }}
                  className={`w-full rounded-lg px-2 py-1.5 text-center text-sm tabular-nums transition-colors ${
                    o === value
                      ? "bg-primary font-semibold text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {p2(o)}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
