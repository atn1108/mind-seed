import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { BarChart3, Home, LogOut, ListTodo, Sprout, Timer, User, Users } from "lucide-react";

import { Logo } from "@/components/Logo";
import { SmartReminders } from "@/components/SmartReminders";
import { useMindSeed } from "@/lib/mindseed-store";
import { EASE_OUT } from "@/lib/motion";
import { useTimer } from "@/lib/timer-store";
import { useT } from "@/lib/ui-language";

const NAV = [
  { to: "/dashboard", icon: Home, label: "Home", short: "shortHome" },
  { to: "/garden", icon: Sprout, label: "Focus Garden", short: "shortGarden" },
  { to: "/timer", icon: Timer, label: "Focus Timer", short: "shortTimer" },
  { to: "/rooms", icon: Users, label: "Study Rooms", short: "shortRooms" },
  { to: "/tasks", icon: ListTodo, label: "Tasks", short: "shortTasks" },
  { to: "/insight", icon: BarChart3, label: "Insight", short: "shortInsight" },
  { to: "/profile", icon: User, label: "Profile", short: "shortProfile" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { state, ready, logout } = useMindSeed();
  const t = useT();
  const timer = useTimer();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const timerActive = timer.running || (timer.left > 0 && timer.left < timer.total);

  useEffect(() => {
    if (ready && !state.user) navigate({ to: "/" });
  }, [ready, state.user, navigate]);

  useEffect(() => {
    const stored = window.localStorage.getItem("mindseed-theme");
    document.documentElement.classList.toggle("dark", stored !== "light");
  }, []);

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
              if (item.to === "/profile") return null;
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
                  <span className="truncate">{t(item.label)}</span>
                </Link>
              );
            })}
          </nav>
          {timerActive && (
            <Link
              to="/timer"
              className="mb-2 flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary-soft px-3 py-2.5 transition-colors hover:bg-primary/15"
              aria-label={t("Focus Timer")}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-semibold tabular-nums text-primary-foreground">
                {Math.floor(timer.left / 60)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-sm font-semibold tabular-nums">
                  {String(Math.floor(timer.left / 60)).padStart(2, "0")}:
                  {String(timer.left % 60).padStart(2, "0")}
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {timer.running ? t("In focus…") : t("Paused")}
                </span>
              </span>
              <span
                className={`size-1.5 shrink-0 rounded-full ${
                  timer.running ? "animate-pulse bg-primary" : "bg-muted-foreground/40"
                }`}
              />
            </Link>
          )}
          <Link
            to="/profile"
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
              pathname === "/profile"
                ? "bg-primary-soft text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span className="grid size-7 shrink-0 overflow-hidden place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {state.user?.avatar?.startsWith("data:") || state.user?.avatar?.startsWith("http") ? (
                <img src={state.user.avatar} alt="Avatar" className="size-full object-cover" />
              ) : (
                state.user?.avatar ?? "M"
              )}
            </span>
            <span className="min-w-0 truncate">{state.user?.name ?? t("namePlaceholder")}</span>
          </Link>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/" });
            }}
            className="mt-2 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-[18px]" />
            {t("logout")}
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
              <button
                onClick={() => {
                  logout();
                  navigate({ to: "/" });
                }}
                className="shrink-0 rounded-full border border-border bg-card p-2 text-muted-foreground"
                aria-label={t("logout")}
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>

          <SmartReminders />

          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.38, ease: EASE_OUT }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* mobile bottom nav */}
      <nav
        aria-label="Mobile navigation"
        className="glass fixed inset-x-3 bottom-3 z-40 flex items-center justify-between rounded-3xl px-2 py-2 shadow-lift lg:hidden"
      >
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
              <span className="truncate">{t(item.short)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
