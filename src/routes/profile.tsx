import { createFileRoute } from "@tanstack/react-router";
import { Flame, Clock, Sprout, Target } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ScoreRing } from "@/routes/dashboard";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { focusScore, scoreLabel, streakOf, useMindSeed } from "@/lib/mindseed-store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Hồ sơ — MindSeed" },
      { name: "description", content: "Streak, tổng cây, tổng giờ học, Focus Score trung bình và mục tiêu tháng." },
      { property: "og:title", content: "Hồ sơ — MindSeed" },
      { property: "og:description", content: "Hành trình tập trung của bạn, tóm gọn trong một trang." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { state, setGoal } = useMindSeed();
  const totalMinutes = state.sessions.filter((s) => s.completed).reduce((a, s) => a + s.minutes, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const score = focusScore(state);
  const goal = state.user?.monthlyGoalHours ?? 40;
  const goalPct = Math.min(100, Math.round((totalHours / goal) * 100));

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Hồ sơ</h1>

      <div className="surface mt-6 flex flex-col items-center gap-5 p-7 sm:flex-row sm:items-center">
        <div className="grid size-20 shrink-0 place-items-center rounded-3xl bg-primary text-3xl font-semibold text-primary-foreground">
          {state.user?.avatar ?? "M"}
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h2 className="truncate font-display text-xl font-semibold">{state.user?.name ?? "Bạn học"}</h2>
          <p className="truncate text-sm text-muted-foreground">{state.user?.email}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Badge icon={Flame} text={`${streakOf(state)} ngày streak`} />
            <Badge icon={Sprout} text={`${state.forest.length} cây`} />
            <Badge icon={Clock} text={`${totalHours} giờ`} />
          </div>
        </div>
        <ScoreRing score={score} size={96} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Chuỗi hiện tại" value={`${streakOf(state)} ngày`} />
        <Stat label="Tổng cây" value={`${state.forest.length}`} />
        <Stat label="Tổng giờ học" value={`${totalHours}h`} />
        <Stat label="Focus Score TB" value={`${score} · ${scoreLabel(score).label}`} />
      </div>

      <div className="surface mt-4 p-6">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">Mục tiêu tháng</h2>
          <span className="ml-auto text-sm font-medium">{goal} giờ</span>
        </div>
        <Progress value={goalPct} className="mt-4 h-2.5" />
        <p className="mt-2 text-xs text-muted-foreground">
          Đã hoàn thành {totalHours}/{goal} giờ ({goalPct}%)
        </p>
        <Slider
          value={[goal]}
          min={10}
          max={120}
          step={5}
          onValueChange={(v) => setGoal(v[0] ?? goal)}
          className="mt-6"
        />
      </div>

      {state.reflections.length > 0 && (
        <div className="surface mt-4 p-6">
          <h2 className="font-display text-lg font-semibold">Nhật ký tập trung</h2>
          <ul className="mt-4 space-y-3">
            {state.reflections.slice(0, 6).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted/60 p-3.5 text-sm">
                <span className="text-accent-foreground">{"★".repeat(r.rating)}</span>
                <span className="text-muted-foreground">
                  {r.reasons.length ? r.reasons.join(", ") : "Không có yếu tố gây xao nhãng"}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(r.at).toLocaleDateString("vi-VN")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AppShell>
  );
}

function Badge({ icon: Icon, text }: { icon: typeof Flame; text: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-medium text-primary">
      <Icon className="size-3.5" />
      {text}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface surface-hover p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}
