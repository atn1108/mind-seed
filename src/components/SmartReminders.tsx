import { AlertCircle, Flame, ListTodo } from "lucide-react";
import { motion } from "motion/react";

import { dayKey, streakOf, useMindSeed } from "@/lib/mindseed-store";

export function SmartReminders() {
  const { state } = useMindSeed();
  const today = dayKey(new Date());
  const todaySessions = state.sessions.filter((s) => dayKey(s.startedAt) === today && s.completed);
  const openTasks = state.tasks.filter((t) => !t.done).length;
  const streak = streakOf(state);

  const items: { icon: typeof Flame; text: string }[] = [];
  if (todaySessions.length === 0)
    items.push({ icon: AlertCircle, text: "You have not started any focus session today." });
  if (streak > 0 && todaySessions.length === 0)
    items.push({ icon: Flame, text: `One more session and you’ll keep a ${streak + 1}-day streak.` });
  if (openTasks > 0)
    items.push({ icon: ListTodo, text: `${openTasks} open task${openTasks === 1 ? "" : "s"} left.` });

  if (items.length === 0) return null;

  return (
    <div className="mb-5 grid gap-2 sm:grid-cols-2">
      {items.slice(0, 2).map((item, i) => (
        <motion.div
          key={item.text}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card/70 px-4 py-3 text-sm text-muted-foreground"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <item.icon className="size-4" />
          </span>
          <span className="min-w-0">{item.text}</span>
        </motion.div>
      ))}
    </div>
  );
}
