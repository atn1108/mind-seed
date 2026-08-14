import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  Home,
  LogOut,
  ListTodo,
  Moon,
  Sprout,
  Sun,
  Timer,
  User,
  Languages,
} from "lucide-react";

import { Logo } from "@/components/Logo";
import { SmartReminders } from "@/components/SmartReminders";
import { useMindSeed } from "@/lib/mindseed-store";
import { useLanguage, type Language } from "@/lib/language";

const NAV = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/garden", label: "Focus Garden", icon: Sprout },
  { to: "/timer", label: "Focus Timer", icon: Timer },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/insight", label: "Insight", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { state, ready, logout } = useMindSeed();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem("mindseed-theme");
    if (stored) return stored === "dark";
    return true;
  });

  useEffect(() => {
    if (ready && !state.user) navigate({ to: "/" });
  }, [ready, state.user, navigate]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    window.localStorage.setItem("mindseed-theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <div className="bg-leaf min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-[1440px] gap-6 px-4 py-4 sm:px-6 lg:gap-8 lg:px-8 lg:py-8">
        {/* desktop sidebar */}
        <aside className="glass sticky top-8 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col rounded-3xl p-4 lg:flex">
          <Link to="/dashboard" className="flex items-center gap-2 px-2 py-2">
            <Logo size={34} />
            <span className="font-display text-lg font-semibold tracking-tight">MindSeed</span>
          </Link>
          <nav aria-label="Primary navigation" className="mt-8 flex flex-1 flex-col gap-1">
            {NAV.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary-soft text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="size-[18px] shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <LanguageSwitcher language={language} onChange={setLanguage} />
          <button
            onClick={() => setIsDark((v) => !v)}
            className="mt-2 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={isDark}
          >
            {isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            <span>{isDark ? "Light mode" : "Dark mode"}</span>
          </button>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/" });
            }}
            className="mt-2 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-[18px]" />
            Log out
          </button>
        </aside>

        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          {/* mobile top bar */}
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <Link to="/dashboard" className="flex min-w-0 items-center gap-2">
              <Logo size={30} />
              <span className="truncate font-display text-base font-semibold">MindSeed</span>
            </Link>
            <div className="flex items-center gap-2">
              <LanguageSwitcher language={language} onChange={setLanguage} compact />
              <button
                onClick={() => setIsDark((v) => !v)}
                className="shrink-0 rounded-full border border-border bg-card p-2 text-muted-foreground"
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                aria-pressed={isDark}
              >
                {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate({ to: "/" });
                }}
                className="shrink-0 rounded-full border border-border bg-card p-2 text-muted-foreground"
                aria-label="Log out"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>

          <SmartReminders />

          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* mobile bottom nav */}
      <nav aria-label="Mobile navigation" className="glass fixed inset-x-3 bottom-3 z-40 flex items-center justify-between rounded-3xl px-2 py-2 shadow-lift lg:hidden">
        {NAV.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[10px] font-medium transition-colors ${
                active ? "bg-primary-soft text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="size-[18px]" />
              <span className="truncate">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function LanguageSwitcher({
  language,
  onChange,
  compact = false,
}: {
  language: Language;
  onChange: (language: Language) => void;
  compact?: boolean;
}) {
  const isVietnamese = language === "vi";
  return (
    <div
      className={`flex items-center gap-2 rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm ${compact ? "px-2 py-1.5" : "mt-2"}`}
      aria-label="Language"
    >
      {!compact && <Languages className="size-[18px] text-muted-foreground" aria-hidden="true" />}
      <span className={isVietnamese ? "font-medium text-muted-foreground" : "font-semibold text-foreground"}>EN</span>
      <button
        type="button"
        role="switch"
        aria-checked={isVietnamese}
        aria-label={isVietnamese ? "Switch language to English" : "Switch language to Vietnamese"}
        onClick={() => onChange(isVietnamese ? "en" : "vi")}
        className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-input transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <span
          className={`pointer-events-none block size-4 rounded-full bg-background shadow transition-transform ${isVietnamese ? "translate-x-4" : "translate-x-0"}`}
        />
      </button>
      <span className={isVietnamese ? "font-semibold text-foreground" : "font-medium text-muted-foreground"}>VI</span>
    </div>
  );
}
