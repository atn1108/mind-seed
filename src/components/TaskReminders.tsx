import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useMindSeed } from "@/lib/mindseed-store";
import { useT, useTf } from "@/lib/ui-language";

const REMIND_EVERY_MS = 2 * 60 * 60 * 1000; // 2 hours
const CHECK_EVERY_MS = 60 * 1000; // check once a minute
const TASK_REMINDER_KEY = "mindseed-task-reminders";
const NOTIF_KEY = "mindseed-notifications";

type ReminderMap = Record<string, number>;

function readReminders(): ReminderMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(TASK_REMINDER_KEY);
    return raw ? (JSON.parse(raw) as ReminderMap) : {};
  } catch {
    return {};
  }
}

function writeReminders(map: ReminderMap) {
  try {
    window.localStorage.setItem(TASK_REMINDER_KEY, JSON.stringify(map));
  } catch {
    // storage unavailable (private mode) — keep in-memory only
  }
}

/** Master on/off switch shared with the Notifications settings module. */
function remindersEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(NOTIF_KEY);
    const prefs = raw ? (JSON.parse(raw) as { sessionReminders?: boolean }) : null;
    return prefs?.sessionReminders ?? true;
  } catch {
    return true;
  }
}

function showSystemNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  const send = () => new window.Notification(title, { body });
  if (window.Notification.permission === "granted") {
    send();
  } else if (window.Notification.permission === "default") {
    // Ask once on the first reminder; the user can decline.
    void window.Notification.requestPermission().then((permission) => {
      if (permission === "granted") send();
    });
  }
}

/** App-wide: nudge the user about unfinished tasks every 2 hours until each
 *  task is completed. Runs while the app is open (toast + system notification
 *  when permitted). */
export function TaskReminders() {
  const { state } = useMindSeed();
  const t = useT();
  const tf = useTf();

  // Keep fresh closures without re-creating the interval on every render.
  const tasksRef = useRef(state.tasks);
  tasksRef.current = state.tasks;
  const tRef = useRef(t);
  tRef.current = t;
  const tfRef = useRef(tf);
  tfRef.current = tf;
  const remindersRef = useRef<ReminderMap>(readReminders());

  useEffect(() => {
    const check = () => {
      if (!remindersEnabled()) return;
      const now = Date.now();
      const tasks = tasksRef.current;
      const t = tRef.current;
      const tf = tfRef.current;
      const map = remindersRef.current;
      let changed = false;

      for (const task of tasks) {
        if (task.done) continue;
        // First reminder counts from creation; afterwards from the last one.
        const baseline = map[task.id] ?? new Date(task.createdAt).getTime();
        if (now - baseline < REMIND_EVERY_MS) continue;

        map[task.id] = now;
        changed = true;

        const title = t("Task reminder");
        const message = tf("Don't forget your task “{title}” — still in progress.", {
          title: task.title,
        });
        toast.info(title, { description: message });
        showSystemNotification(title, message);
      }

      // Drop reminder history once a task is completed or removed.
      const openIds = new Set(tasks.filter((task) => !task.done).map((task) => task.id));
      for (const id of Object.keys(map)) {
        if (!openIds.has(id)) {
          delete map[id];
          changed = true;
        }
      }

      if (changed) writeReminders(map);
    };

    check();
    const id = window.setInterval(check, CHECK_EVERY_MS);
    window.addEventListener("focus", check);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", check);
    };
  }, []);

  return null;
}