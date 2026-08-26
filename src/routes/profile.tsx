import { createFileRoute } from "@tanstack/react-router";
import { useT, useTf } from "@/lib/ui-language";
import { useState } from "react";
import { toast } from "sonner";
import { Flame, Clock, Sprout, Target, Languages, Bell, SunMoon, Settings2 } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ScoreRing } from "@/routes/dashboard";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  LanguageModule,
  NotificationsModule,
  SettingsLauncher,
  ThemeModule,
} from "@/components/SettingsModules";
import { focusScore, scoreLabel, streakOf, useMindSeed } from "@/lib/mindseed-store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — MindSeed" },
      {
        name: "description",
        content: "Streak, total trees, total study hours, average Focus Score, and monthly goal.",
      },
      { property: "og:title", content: "Profile — MindSeed" },
      { property: "og:description", content: "Your focus journey, summarized in one page." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const t = useT();
  const tf = useTf();
  const { state, setGoal, updateAvatar } = useMindSeed();
  const [module, setModule] = useState<null | "theme" | "language" | "notifications">(null);
  const [goalDraft, setGoalDraft] = useState<number | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const totalMinutes = state.sessions.filter((s) => s.completed).reduce((a, s) => a + s.minutes, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const score = focusScore(state);
  const goal = state.user?.monthlyGoalHours ?? 40;
  const goalPct = Math.min(100, Math.round((totalHours / goal) * 100));

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      await updateAvatar(file);
      toast.success(t("Avatar updated successfully"));
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "INVALID_TYPE") {
          toast.error(t("Please upload a valid JPG, PNG, or WebP image."));
        } else if (err.message === "FILE_TOO_LARGE") {
          toast.error(t("Image size must be less than 3MB."));
        } else {
          toast.error(t("Could not update avatar. Please try again."));
        }
      } else {
        toast.error(t("Could not update avatar. Please try again."));
      }
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        {t("Profile")}
      </h1>

      <div className="surface mt-6 flex flex-col items-center gap-5 p-7 sm:flex-row sm:items-center">
        <label className="relative group cursor-pointer grid size-20 shrink-0 overflow-hidden place-items-center rounded-3xl bg-primary text-3xl font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-105">
          {state.user?.avatar?.startsWith("data:") || state.user?.avatar?.startsWith("http") ? (
            <img src={state.user.avatar} alt="Avatar" className="size-full object-cover" />
          ) : (
            state.user?.avatar ?? "M"
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center text-white text-xs font-medium">
            {uploadingAvatar ? "..." : t("Change")}
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={uploadingAvatar}
            onChange={handleAvatarChange}
          />
        </label>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h2 className="truncate font-display text-xl font-semibold">
            {state.user?.name ?? t("namePlaceholder")}
          </h2>
          <p className="truncate text-sm text-muted-foreground">{state.user?.email}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Badge icon={Flame} text={tf("{n} day streak", { n: streakOf(state) })} />
            <Badge icon={Sprout} text={tf("{n} trees", { n: state.forest.length })} />
            <Badge icon={Clock} text={`${totalHours}h`} />
          </div>
        </div>
        <ScoreRing score={score} size={96} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t("Current streak")} value={`${streakOf(state)} ${t("days")}`} />
        <Stat label={t("Total trees")} value={`${state.forest.length}`} />
        <Stat label={t("Study hours")} value={`${totalHours}h`} />
        <Stat label={t("Average Focus Score")} value={`${score} · ${t(scoreLabel(score).label)}`} />
      </div>

      <div className="surface mt-4 p-6">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">{t("Monthly goal")}</h2>
          <span className="ml-auto text-sm font-medium">
            {tf("{goal} hours", { goal: goalDraft ?? goal })}
          </span>
        </div>
        <Progress value={goalPct} className="mt-4 h-2.5" />
        <p className="mt-2 text-xs text-muted-foreground">
          {tf("Completed {x}/{y} hours ({p}%)", { x: totalHours, y: goal, p: goalPct })}
        </p>
        <Slider
          value={[goalDraft ?? goal]}
          min={10}
          max={120}
          step={5}
          onValueChange={(v) => setGoalDraft(v[0] ?? goal)}
          onValueCommit={(v) => {
            const next = v[0];
            if (next != null && next !== goal) {
              setGoal(next);
              toast.success(t("Monthly goal updated"));
            }
            setGoalDraft(null);
          }}
          className="mt-6"
        />
      </div>

      <section className="mt-4">
        <div className="mb-3 flex items-center gap-2 px-1">
          <Settings2 className="size-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">{t("Settings")}</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SettingsLauncher
            icon={SunMoon}
            label={t("Appearance")}
            hint={t("Light mode") + " · " + t("Dark mode")}
            onClick={() => setModule("theme")}
          />
          <SettingsLauncher
            icon={Languages}
            label={t("Language")}
            hint="EN / VI"
            onClick={() => setModule("language")}
          />
          <SettingsLauncher
            icon={Bell}
            label={t("Notifications")}
            hint={t("Session reminders")}
            onClick={() => setModule("notifications")}
          />
        </div>
      </section>

      <ThemeModule open={module === "theme"} onOpenChange={(v) => !v && setModule(null)} />
      <LanguageModule open={module === "language"} onOpenChange={(v) => !v && setModule(null)} />
      <NotificationsModule
        open={module === "notifications"}
        onOpenChange={(v) => !v && setModule(null)}
      />

      {state.reflections.length > 0 && (
        <div className="surface mt-4 p-6">
          <h2 className="font-display text-lg font-semibold">{t("Focus journal")}</h2>
          <ul className="mt-4 space-y-3">
            {state.reflections.slice(0, 6).map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted/60 p-3.5 text-sm"
              >
                <span className="text-accent-foreground">{"★".repeat(r.rating)}</span>
                <span className="text-muted-foreground">
                  {r.reasons.length
                    ? r.reasons.map((reason) => t(reason)).join(", ")
                    : t("No distraction factors recorded")}
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
