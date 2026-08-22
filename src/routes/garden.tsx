import { createFileRoute } from "@tanstack/react-router";
import { useT, useTf } from "@/lib/ui-language";
import { motion } from "motion/react";
import { Lock, Sparkles } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { TreeVisual } from "@/components/TreeVisual";
import { Progress } from "@/components/ui/progress";
import { EASE_OUT, springSoft } from "@/lib/motion";
import { SPECIES, stageOf, useMindSeed } from "@/lib/mindseed-store";

export const Route = createFileRoute("/garden")({
  head: () => ({
    meta: [
      { title: "Focus Garden — MindSeed" },
      {
        name: "description",
        content: "Every completed session helps your tree grow and unlocks new species.",
      },
      { property: "og:title", content: "Focus Garden — MindSeed" },
      {
        property: "og:description",
        content: "Your personal focus forest, growing session by session.",
      },
    ],
  }),
  component: GardenPage,
});

function GardenPage() {
  const t = useT();
  const tf = useTf();
  const { state } = useMindSeed();
  const { stage, next, progress } = stageOf(state.exp);

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        {t("Focus Garden")}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {t("Seed → Sprout → Mature tree → Your forest.")}
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="surface flex flex-col items-center p-7">
          <TreeVisual exp={state.exp} size={200} />
          <p className="mt-5 font-display text-xl font-semibold">{t(stage.name)}</p>
          <p className="text-sm text-muted-foreground">{state.exp} EXP</p>
          <Progress value={progress} className="mt-5 h-2.5 w-full max-w-sm" />
          <p className="mt-2 text-xs text-muted-foreground">
            {next
              ? tf("{n} EXP to reach {name}", { n: next.need - state.exp, name: t(next.name) })
              : t("Tree is ready")}
          </p>
        </div>

        <div className="surface p-6">
          <h2 className="font-display text-lg font-semibold">{t("Species")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Plant more trees to unlock new species.")}
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {SPECIES.map((sp) => {
              const unlocked = state.forest.length >= sp.unlockAt;
              return (
                <motion.div
                  key={sp.name}
                  whileHover={unlocked ? { y: -5, scale: 1.03 } : { y: 0 }}
                  whileTap={unlocked ? { scale: 0.97 } : { scale: 1 }}
                  transition={springSoft}
                  className={`grid place-items-center gap-1 rounded-2xl border border-border p-4 text-center ${
                    unlocked ? "bg-primary-soft" : "bg-muted"
                  }`}
                >
                  <span className={`text-3xl ${unlocked ? "" : "opacity-30 grayscale"}`}>
                    {sp.emoji}
                  </span>
                  <span className="text-[11px] font-medium">{t(sp.name)}</span>
                  {!unlocked && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Lock className="size-3" /> {tf("{n} trees", { n: sp.unlockAt })}
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
          <span className="ml-auto text-sm text-muted-foreground">{tf("{n} trees", { n: state.forest.length })}</span>
        </div>
        {state.forest.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {t("The forest is empty. Complete your first focus session to begin.")}
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
            {state.forest
              .slice()
              .reverse()
              .map((tree, i) => (
                <motion.div
                  key={tree.id}
                  initial={{ opacity: 0, scale: 0.6, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.5, ease: EASE_OUT }}
                  className="grid place-items-center gap-1 rounded-2xl bg-primary-soft p-3 text-center"
                  title={`${t(tree.species)} • ${tree.minutes} ${t("min")}`}
                >
                  <span className="text-2xl">
                    {SPECIES.find((s) => s.name === tree.species)?.emoji ?? "🌳"}
                  </span>
                  <span className="w-full truncate text-[10px] text-muted-foreground">
                    {new Date(tree.plantedAt).toLocaleDateString("en-US", {
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
