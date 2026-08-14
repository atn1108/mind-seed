import { createFileRoute } from "@tanstack/react-router";
import { useT } from "@/lib/language";
import { motion } from "motion/react";
import { Lock, Sparkles } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { TreeVisual } from "@/components/TreeVisual";
import { Progress } from "@/components/ui/progress";
import { SPECIES, stageOf, useMindSeed } from "@/lib/mindseed-store";

export const Route = createFileRoute("/garden")({
  head: () => ({
    meta: [
      { title: "Focus Garden — MindSeed" },
      { name: "description", content: "Every completed session helps your tree grow and unlocks new species." },
      { property: "og:title", content: "Focus Garden — MindSeed" },
      { property: "og:description", content: "Your personal focus forest, growing session by session." },
    ],
  }),
  component: GardenPage,
});

function GardenPage() {
  const t = useT();
  const { state } = useMindSeed();
  const { stage, next, progress } = stageOf(state.exp);

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t("Focus Garden")}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Seed → Sprout → Mature tree → Your forest.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="surface flex flex-col items-center p-7">
          <TreeVisual exp={state.exp} size={200} />
          <p className="mt-5 font-display text-xl font-semibold">{stage.name}</p>
          <p className="text-sm text-muted-foreground">{state.exp} EXP</p>
          <Progress value={progress} className="mt-5 h-2.5 w-full max-w-sm" />
          <p className="mt-2 text-xs text-muted-foreground">
            {next ? `${next.need - state.exp} EXP to reach ${next.name}` : "Tree is ready"}
          </p>
        </div>

        <div className="surface p-6">
          <h2 className="font-display text-lg font-semibold">{t("Species")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Plant more trees to unlock new species.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {SPECIES.map((sp) => {
              const unlocked = state.forest.length >= sp.unlockAt;
              return (
                <motion.div
                  key={sp.name}
                  whileHover={{ y: -4 }}
                  className={`grid place-items-center gap-1 rounded-2xl border border-border p-4 text-center ${
                    unlocked ? "bg-primary-soft" : "bg-muted"
                  }`}
                >
                  <span className={`text-3xl ${unlocked ? "" : "opacity-30 grayscale"}`}>
                    {sp.emoji}
                  </span>
                  <span className="text-[11px] font-medium">{sp.name}</span>
                  {!unlocked && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Lock className="size-3" /> {sp.unlockAt} trees
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="surface mt-4 p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">{t("Forest history")}</h2>
          <span className="ml-auto text-sm text-muted-foreground">{state.forest.length} trees</span>
        </div>
        {state.forest.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            The forest is empty. Complete your first focus session to begin.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
            {state.forest
              .slice()
              .reverse()
              .map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04, duration: 0.4 }}
                  className="grid place-items-center gap-1 rounded-2xl bg-primary-soft p-3 text-center"
                  title={`${t.species} • ${t.minutes} minutes`}
                >
                  <span className="text-2xl">
                    {SPECIES.find((s) => s.name === t.species)?.emoji ?? "🌳"}
                  </span>
                  <span className="w-full truncate text-[10px] text-muted-foreground">
                    {new Date(t.plantedAt).toLocaleDateString("en-US", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </motion.div>
              ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
