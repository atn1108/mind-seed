import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import {
  BarChart3,
  Home,
  LogOut,
  ListTodo,
  Sprout,
  Timer,
  User,
} from "lucide-react";

import { Logo } from "@/components/Logo";
import { SmartReminders } from "@/components/SmartReminders";
import { useMindSeed } from "@/lib/mindseed-store";

const NAV = [
  { to: "/dashboard", label: "Trang chủ", icon: Home },
  { to: "/garden", label: "Focus Garden", icon: Sprout },
  { to: "/timer", label: "Focus Timer", icon: Timer },
  { to: "/tasks", label: "Nhiệm vụ", icon: ListTodo },
  { to: "/insight", label: "Insight", icon: BarChart3 },
  { to: "/profile", label: "Hồ sơ", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { state, ready, logout } = useMindSeed();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (ready && !state.user) navigate({ to: "/" });
  }, [ready, state.user, navigate]);

  return (
    <div className="bg-leaf min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-4 sm:px-6 lg:py-8">
        {/* desktop sidebar */}
        <aside className="glass sticky top-8 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col rounded-3xl p-4 lg:flex">
          <Link to="/dashboard" className="flex items-center gap-2 px-2 py-2">
            <Logo size={34} />
            <span className="font-display text-lg font-semibold tracking-tight">MindSeed</span>
          </Link>
          <nav className="mt-6 flex flex-1 flex-col gap-1">
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
          <button
            onClick={() => {
              logout();
              navigate({ to: "/" });
            }}
            className="mt-2 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-[18px]" />
            Đăng xuất
          </button>
        </aside>

        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          {/* mobile top bar */}
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <Link to="/dashboard" className="flex min-w-0 items-center gap-2">
              <Logo size={30} />
              <span className="truncate font-display text-base font-semibold">MindSeed</span>
            </Link>
            <button
              onClick={() => {
                logout();
                navigate({ to: "/" });
              }}
              className="shrink-0 rounded-full border border-border bg-card p-2 text-muted-foreground"
              aria-label="Đăng xuất"
            >
              <LogOut className="size-4" />
            </button>
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
      <nav className="glass fixed inset-x-3 bottom-3 z-40 flex items-center justify-between rounded-3xl px-2 py-2 lg:hidden">
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
