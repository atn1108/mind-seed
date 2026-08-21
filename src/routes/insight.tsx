import { createFileRoute } from "@tanstack/react-router";
import { useT } from "@/lib/ui-language";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Brain, Sparkles } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ScoreRing } from "@/routes/dashboard";
import { dayKey, focusScore, scoreLabel, streakOf, useMindSeed } from "@/lib/mindseed-store";

export const Route = createFileRoute("/insight")({
  head: () => ({
    meta: [
      { title: "Focus Insight — MindSeed" },
      {
        name: "description",
        content:
          "A weekly report on focus hours, completed sessions, effective study windows, and improvement suggestions.",
      },
      { property: "og:title", content: "Focus Insight — MindSeed" },
      {
        property: "og:description",
        content: "Understand your focus rhythm through charts and weekly analysis.",
      },
    ],
  }),
  component: InsightPage,
});

const DAY_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function InsightPage() {
  const t = useT();
  const { state } = useMindSeed();

  const weekly = useMemo(() => {
    const out: { day: string; minutes: number; sessions: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      const ss = state.sessions.filter((s) => dayKey(s.startedAt) === key && s.completed);
      out.push({
        day: DAY_LABEL[d.getDay()]!,
        minutes: ss.reduce((a, s) => a + s.minutes, 0),
        sessions: ss.length,
      });
    }
    return out;
  }, [state.sessions]);

  const monthly = useMemo(() => {
    const out: { label: string; hours: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      const mins = state.sessions
        .filter((s) => {
          const t = new Date(s.startedAt);
          return s.completed && t >= start && t <= end;
        })
        .reduce((a, s) => a + s.minutes, 0);
      out.push({ label: `Week ${4 - i}`, hours: Math.round((mins / 60) * 10) / 10 });
    }
    return out;
  }, [state.sessions]);

  const week = useMemo(() => {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    const ss = state.sessions.filter((s) => new Date(s.startedAt) >= since);
    const done = ss.filter((s) => s.completed);
    const minutes = done.reduce((a, s) => a + s.minutes, 0);
    const byHour: Record<string, number> = { Morning: 0, Afternoon: 0, Evening: 0 };
    done.forEach((s) => {
      const h = new Date(s.startedAt).getHours();
      const slot = h < 12 ? "Morning" : h < 18 ? "Afternoon" : "Evening";
      byHour[slot] = (byHour[slot] ?? 0) + s.minutes;
    });
    return {
      total: ss.length,
      done: done.length,
      dropped: ss.length - done.length,
      hours: Math.round((minutes / 60) * 10) / 10,
      goal: Math.min(100, Math.round((minutes / (7 * 120)) * 100)),
      pie: Object.entries(byHour).map(([name, value]) => ({ name, value })),
    };
  }, [state.sessions]);

  const score = focusScore(state);
  const label = scoreLabel(score);
  const best = week.pie.slice().sort((a, b) => b.value - a.value)[0]?.name ?? "Morning";
  const worst = week.pie.slice().sort((a, b) => a.value - b.value)[0]?.name ?? "Evening";
  const pieColors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)"];

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        {t("Focus Insight")}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{t("Your last 7-day focus report.")}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Completed sessions"
          value={`${week.done}`}
          sub={`${week.total} sessions started`}
        />
        <Stat label="Focus hours" value={`${week.hours}h`} sub="over 7 days" />
        <Stat label="Dropped sessions" value={`${week.dropped}`} sub="try shorter sessions" />
        <Stat label="Weekly goal" value={`${week.goal}%`} sub="vs. 14h target" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="surface p-6">
          <h2 className="font-display text-lg font-semibold">{t("Focus time by day")}</h2>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly}>
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="var(--color-border)"
                />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)" }}
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                  }}
                  formatter={(v) => [`${v} minutes`, "Focus"]}
                />
                <Bar dataKey="minutes" fill="var(--color-chart-1)" radius={[10, 10, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface p-6">
          <h2 className="font-display text-lg font-semibold">{t("Study windows")}</h2>
          <div className="mt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={week.pie}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={84}
                  paddingAngle={3}
                >
                  {week.pie.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                  }}
                  formatter={(v: number, n) => [`${v} minutes`, n]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            {week.pie.map((p, i) => (
              <span key={p.name} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ background: pieColors[i] }} />
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="surface p-6">
          <h2 className="font-display text-lg font-semibold">{t("4-week trend")}</h2>
          <div className="mt-5 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="var(--color-border)"
                />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                  }}
                  formatter={(v) => [`${v} hours`, "Focus"]}
                />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="var(--color-chart-1)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "var(--color-chart-1)" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface p-6">
          <div className="flex items-center gap-2">
            <Brain className="size-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">{t("MindSeed analysis")}</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <Insight>
              You learn best in the <b className="text-foreground">{best.toLowerCase()}</b> —
              schedule demanding work around this window.
            </Insight>
            <Insight>
              You tend to lose focus in the <b className="text-foreground">{worst.toLowerCase()}</b>{" "}
              window, with {week.dropped} dropped sessions this week.
            </Insight>
            <Insight>
              Try reducing screen time after 9pm and replacing it with a gentle 25-minute session.
            </Insight>
          </ul>
        </div>
      </div>

      <div className="surface mt-4 flex flex-col items-center gap-5 p-6 sm:flex-row">
        <ScoreRing score={score} size={104} />
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold">Focus Score today: {label.label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{label.note}</p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            0–100 points are calculated from focus time (40%), completed sessions (20%), completed
            tasks (15%), dropout rate (15%), and streaks (10%). Your current streak is{" "}
            {streakOf(state)} days.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function Insight({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 rounded-2xl bg-primary-soft/60 p-3.5 leading-relaxed">
      <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
      <span>{children}</span>
    </li>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="surface surface-hover p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-display text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
