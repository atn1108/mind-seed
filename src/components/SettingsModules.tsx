import { useEffect, useState, type ReactNode } from "react";
import { Cloud, Moon, Sun, type LucideIcon } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { LangToggle } from "@/components/LangToggle";
import { useT } from "@/lib/ui-language";
import { cn } from "@/lib/utils";

/* ---------------------------------- Launcher --------------------------------- */

export function SettingsLauncher({
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="surface surface-hover flex cursor-pointer items-center gap-3 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{label}</span>
        {hint && (
          <span className="block truncate text-xs text-muted-foreground">{hint}</span>
        )}
      </span>
    </button>
  );
}

/* ----------------------------------- Shell ----------------------------------- */

function ModuleDialog({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-1">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------- Theme module -------------------------------- */

type Theme = "light" | "dark";

function readTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem("mindseed-theme");
  if (stored === "light" || stored === "dark") return stored;
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeModule({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useT();
  const [theme, setTheme] = useState<Theme>(readTheme);

  useEffect(() => {
    if (!open) return;
    setTheme(readTheme());
  }, [open]);

  const apply = (next: Theme) => {
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      window.localStorage.setItem("mindseed-theme", next);
    } catch {
      // storage unavailable — keep in-memory only
    }
  };

  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: t("Light mode"), icon: Sun },
    { value: "dark", label: t("Dark mode"), icon: Moon },
  ];

  return (
    <ModuleDialog open={open} onOpenChange={onOpenChange} title={t("Appearance")}>
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => apply(opt.value)}
            aria-pressed={theme === opt.value}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border p-5 text-sm font-medium transition-colors",
              theme === opt.value
                ? "border-primary bg-primary-soft text-primary"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            <opt.icon className="size-6" />
            {opt.label}
          </button>
        ))}
      </div>
    </ModuleDialog>
  );
}

/* ------------------------------ Language module ------------------------------ */

export function LanguageModule({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useT();
  return (
    <ModuleDialog open={open} onOpenChange={onOpenChange} title={t("Language")}>
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
        <span className="text-sm text-muted-foreground">EN / VI</span>
        <LangToggle />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        More languages coming soon.
      </p>
    </ModuleDialog>
  );
}

/* ---------------------------- Notifications module --------------------------- */

const NOTIF_KEY = "mindseed-notifications";

type NotifPrefs = { sessionReminders: boolean; weeklySummary: boolean };

function readNotifs(): NotifPrefs {
  if (typeof window === "undefined") return { sessionReminders: true, weeklySummary: true };
  try {
    const raw = window.localStorage.getItem(NOTIF_KEY);
    if (raw) return JSON.parse(raw) as NotifPrefs;
  } catch {
    // ignore malformed data
  }
  return { sessionReminders: true, weeklySummary: true };
}

export function NotificationsModule({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const t = useT();
  const [prefs, setPrefs] = useState<NotifPrefs>(readNotifs);

  const update = (patch: Partial<NotifPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    try {
      window.localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable — keep in-memory only
    }
  };

  const rows = [
    { key: "sessionReminders" as const, label: t("Session reminders") },
    { key: "weeklySummary" as const, label: t("Weekly summary") },
  ];

  return (
    <ModuleDialog open={open} onOpenChange={onOpenChange} title={t("Notifications")}>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4"
          >
            <span className="text-sm">{row.label}</span>
            <Switch
              checked={prefs[row.key]}
              onCheckedChange={(v) => update({ [row.key]: v })}
              aria-label={row.label}
            />
          </li>
        ))}
      </ul>
    </ModuleDialog>
  );
}

/* ------------------------------- Dropbox module ------------------------------ */

export function DropboxModule({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useT();
  const [connected] = useState(false);

  return (
    <ModuleDialog open={open} onOpenChange={onOpenChange} title={t("Cloud backup")}>
      <div className="flex items-center gap-3 rounded-2xl border border-border p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/25 text-accent-foreground">
          <Cloud className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Dropbox</span>
          <span
            className={cn(
              "block text-xs",
              connected ? "text-primary" : "text-muted-foreground",
            )}
          >
            {connected ? t("Connected") : t("Not connected")}
          </span>
        </span>
      </div>
      <button
        type="button"
        disabled
        className="mt-4 h-11 w-full cursor-not-allowed rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground opacity-60"
      >
        {connected ? t("Connected") : `${t("Connect Dropbox")} · ${t("Coming soon")}`}
      </button>
    </ModuleDialog>
  );
}
