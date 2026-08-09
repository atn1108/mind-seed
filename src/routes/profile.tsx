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
      { title: "Profile — MindSeed" },
      { name: "description", content: "Streak, total trees, total study hours, average Focus Score, and monthly goal." },
      { property: "og:title", content: "Profile — MindSeed" },
      { property: "og:description", content: "Your focus journey, summarized in one page." },
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
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Profile</h1>

      <div className="surface mt-6 flex flex-col items-center gap-5 p-7 sm:flex-row sm:items-center">
        <div className="grid size-20 shrink-0 place-items-center rounded-3xl bg-primary text-3xl font-semibold text-primary-foreground">
          {state.user?.avatar ?? "M"}
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h2 className="truncate font-display text-xl font-semibold">{state.user?.name ?? "Learner"}</h2>
          <p className="truncate text-sm text-muted-foreground">{state.user?.email}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Badge icon={Flame} text={`${streakOf(state)} day streak`} />
            <Badge icon={Sprout} text={`${state.forest.length} trees`} />
            <Badge icon={Clock} text={`${totalHours}h`} />
          </div>
        </div>
        <ScoreRing score={score} size={96} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Current streak" value={`${streakOf(state)} days`} />
        <Stat label="Total trees" value={`${state.forest.length}`} />
        <Stat label="Study hours" value={`${totalHours}h`} />
        <Stat label="Average Focus Score" value={`${score} · ${scoreLabel(score).label}`} />
      </div>

      <div className="surface mt-4 p-6">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">Monthly goal</h2>
          <span className="ml-auto text-sm font-medium">{goal} hours</span>
        </div>
        <Progress value={goalPct} className="mt-4 h-2.5" />
        <p className="mt-2 text-xs text-muted-foreground">
          Completed {totalHours}/{goal} hours ({goalPct}%)
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
          <h2 className="font-display text-lg font-semibold">Focus journal</h2>
          <ul className="mt-4 space-y-3">
            {state.reflections.slice(0, 6).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted/60 p-3.5 text-sm">
                <span className="text-accent-foreground">{"★".repeat(r.rating)}</span>
                <span className="text-muted-foreground">
                  {r.reasons.length ? r.reasons.join(", ") : "No distraction factors recorded"}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(r.at).toLocaleDateString("en-US")}
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
