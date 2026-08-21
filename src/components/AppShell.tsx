import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  Home,
  Languages,
  LogOut,
  ListTodo,
  Moon,
  Sprout,
  Sun,
  Timer,
  User,
  Languages,
} from "lucide-react";

import { LangToggle } from "@/components/LangToggle";
import { Logo } from "@/components/Logo";
import { SmartReminders } from "@/components/SmartReminders";
import { useMindSeed } from "@/lib/mindseed-store";
<<<<<<< HEAD
import { useLanguage, useT, type Language } from "@/lib/language";
=======
import { useUiLanguage } from "@/lib/ui-language";
>>>>>>> 0285da5 (redesign login page, add en/vi switcher, switch font to plus jakarta sans)

const NAV = [
  {
    to: "/dashboard",
    icon: Home,
    label: { en: "Home", vi: "Trang chủ" },
    short: { en: "Home", vi: "Nhà" },
  },
  {
    to: "/garden",
    icon: Sprout,
    label: { en: "Focus Garden", vi: "Vườn tập trung" },
    short: { en: "Garden", vi: "Vườn" },
  },
  {
    to: "/timer",
    icon: Timer,
    label: { en: "Focus Timer", vi: "Đồng hồ tập trung" },
    short: { en: "Timer", vi: "Hẹn giờ" },
  },
  {
    to: "/tasks",
    icon: ListTodo,
    label: { en: "Tasks", vi: "Nhiệm vụ" },
    short: { en: "Tasks", vi: "Việc" },
  },
  {
    to: "/insight",
    icon: BarChart3,
    label: { en: "Insight", vi: "Phân tích" },
    short: { en: "Insight", vi: "Phân tích" },
  },
  {
    to: "/profile",
    icon: User,
    label: { en: "Profile", vi: "Hồ sơ" },
    short: { en: "Profile", vi: "Hồ sơ" },
  },
] as const;

const SHELL_COPY = {
  en: {
    lightMode: "Light mode",
    darkMode: "Dark mode",
    toLight: "Switch to light mode",
    toDark: "Switch to dark mode",
    logout: "Log out",
  },
  vi: {
    lightMode: "Chế độ sáng",
    darkMode: "Chế độ tối",
    toLight: "Chuyển sang chế độ sáng",
    toDark: "Chuyển sang chế độ tối",
    logout: "Đăng xuất",
  },
} as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { state, ready, logout } = useMindSeed();
<<<<<<< HEAD
  const { language, setLanguage } = useLanguage();
  const t = useT();
=======
  const { lang } = useUiLanguage();
>>>>>>> 0285da5 (redesign login page, add en/vi switcher, switch font to plus jakarta sans)
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const t = SHELL_COPY[lang];
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
<<<<<<< HEAD
                  <span className="truncate">{t(item.label)}</span>
=======
                  <span className="truncate">{item.label[lang]}</span>
>>>>>>> 0285da5 (redesign login page, add en/vi switcher, switch font to plus jakarta sans)
                </Link>
              );
            })}
          </nav>
<<<<<<< HEAD
          <LanguageSwitcher language={language} onChange={setLanguage} />
=======
          <div className="mt-2 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted-foreground">
            <Languages className="size-[18px] shrink-0" aria-hidden="true" />
            <LangToggle />
          </div>
>>>>>>> 0285da5 (redesign login page, add en/vi switcher, switch font to plus jakarta sans)
          <button
            onClick={() => setIsDark((v) => !v)}
            className="mt-2 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={isDark ? t.toLight : t.toDark}
            aria-pressed={isDark}
          >
            {isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            <span>{isDark ? t.lightMode : t.darkMode}</span>
          </button>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/" });
            }}
            className="mt-2 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-[18px]" />
            {t.logout}
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
<<<<<<< HEAD
              <LanguageSwitcher language={language} onChange={setLanguage} compact />
=======
              <LangToggle />
>>>>>>> 0285da5 (redesign login page, add en/vi switcher, switch font to plus jakarta sans)
              <button
                onClick={() => setIsDark((v) => !v)}
                className="shrink-0 rounded-full border border-border bg-card p-2 text-muted-foreground"
                aria-label={isDark ? t.toLight : t.toDark}
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
                aria-label={t.logout}
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
              <span className="truncate">{item.short[lang]}</span>
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
  const t = useT();
  return (
    <div
      className={`flex items-center gap-2 rounded-2xl border border-border/70 bg-background px-3 py-2 text-sm ${compact ? "px-2 py-1.5" : "mt-2"}`}
      aria-label={t("Language")}
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
