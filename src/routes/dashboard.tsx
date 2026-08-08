import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useMemo } from "react";
import { Clock, Flame, ListTodo, Play, Sprout, Target } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { TreeVisual } from "@/components/TreeVisual";
import { Progress } from "@/components/ui/progress";
import {
  QUOTES,
  dayKey,
  focusScore,
  minutesOn,
  scoreLabel,
  stageOf,
  streakOf,
  useMindSeed,
} from "@/lib/mindseed-store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Trang chủ — MindSeed" },
      { name: "description", content: "Tổng quan khu vườn, thời gian tập trung, nhiệm vụ và Focus Score hôm nay." },
      { property: "og:title", content: "Trang chủ — MindSeed" },
      { property: "og:description", content: "Theo dõi sự tập trung của bạn mỗi ngày cùng MindSeed." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { state } = useMindSeed();
  const today = dayKey(new Date());
  const minutes = minutesOn(state, today);
  const score = focusScore(state);
  const label = scoreLabel(score);
  const streak = streakOf(state);
  const { stage, progress, next } = stageOf(state.exp);
  const quote = useMemo(() => QUOTES[new Date().getDate() % QUOTES.length]!, []);
  const openTasks = state.tasks.filter((t) => !t.done);

  return (
    <AppShell>
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Xin chào, {state.user?.name ?? "bạn"} 👋
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground sm:text-[15px]">“{quote}”</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-accent/25 px-3.5 py-2 text-sm font-semibold text-accent-foreground">
          <Flame className="size-4" />
          {streak} ngày
        </div>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Focus Garden" icon={Sprout} to="/garden">
          <div className="flex items-center gap-4">
            <TreeVisual exp={state.exp} size={92} />
            <div className="min-w-0">
              <p className="text-2xl font-semibold">{state.forest.length} cây</p>
              <p className="truncate text-sm text-muted-foreground">{stage.name}</p>
              <Progress value={progress} className="mt-3 h-2" />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {next ? `${progress}% tới ${next.name}` : "Sẵn sàng thu hoạch"}
              </p>
            </div>
          </div>
        </Card>

        <Card title="Focus Time" icon={Clock} to="/timer">
          <p className="font-display text-4xl font-semibold">
            {Math.floor(minutes / 60)}
            <span className="text-lg font-medium text-muted-foreground">h </span>
            {minutes % 60}
            <span className="text-lg font-medium text-muted-foreground">p</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Tổng thời gian tập trung hôm nay</p>
          <Progress value={Math.min(100, (minutes / 120) * 100)} className="mt-4 h-2" />
          <p className="mt-1.5 text-xs text-muted-foreground">Mục tiêu ngày: 120 phút</p>
        </Card>

        <Card title="Today's Tasks" icon={ListTodo} to="/tasks">
          {openTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bạn đã hoàn thành mọi việc hôm nay 🎉</p>
          ) : (
            <ul className="space-y-2.5">
              {openTasks.slice(0, 3).map((t) => (
                <li key={t.id} className="flex items-center gap-2.5 text-sm">
                  <span
                    className={`size-2 shrink-0 rounded-full ${
                      t.priority === "high"
                        ? "bg-destructive"
                        : t.priority === "medium"
                          ? "bg-accent"
                          : "bg-secondary"
                    }`}
                  />
                  <span className="truncate">{t.title}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            {state.tasks.filter((t) => t.done).length}/{state.tasks.length} nhiệm vụ đã xong
          </p>
        </Card>

        <Card title="Focus Score" icon={Target} to="/insight">
          <div className="flex items-center gap-4">
            <ScoreRing score={score} />
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold">{label.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{label.note}</p>
            </div>
          </div>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="mt-6"
      >
        <Link
          to="/timer"
          className="group flex items-center justify-between gap-4 rounded-3xl bg-primary px-6 py-6 text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:-translate-y-0.5 sm:px-8"
        >
          <div className="min-w-0">
            <p className="font-display text-xl font-semibold sm:text-2xl">Bắt đầu phiên học</p>
            <p className="mt-1 truncate text-sm opacity-85">
              25 phút tập trung — cây của bạn sẽ lớn thêm một chút.
            </p>
          </div>
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary-foreground/15 transition-transform group-hover:scale-110">
            <Play className="size-6 fill-current" />
          </span>
        </Link>
      </motion.div>
    </AppShell>
  );
}

function Card({
  title,
  icon: Icon,
  to,
  children,
}: {
  title: string;
  icon: typeof Clock;
  to: "/garden" | "/timer" | "/tasks" | "/insight";
  children: React.ReactNode;
}) {
  return (
    <Link to={to} className="surface surface-hover block p-5">
      <div className="mb-4 flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
        <span className="grid size-8 place-items-center rounded-xl bg-primary-soft text-primary">
          <Icon className="size-4" />
        </span>
        {title}
      </div>
      {children}
    </Link>
  );
}

export function ScoreRing({ score, size = 88 }: { score: number; size?: number }) {
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="7" className="stroke-muted" fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth="7"
          strokeLinecap="round"
          className="stroke-primary"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * score) / 100 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-xl font-semibold">
        {score}
      </span>
    </div>
  );
}
