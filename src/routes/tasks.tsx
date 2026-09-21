import { createFileRoute } from "@tanstack/react-router";
import { useT, useTf } from "@/lib/ui-language";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { DateTimePicker } from "@/components/DateTimePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMindSeed, type Priority, type Task } from "@/lib/mindseed-store";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — MindSeed" },
      {
        name: "description",
        content: "Manage tasks with deadlines, priorities, and EXP for your garden when completed.",
      },
      { property: "og:title", content: "Tasks — MindSeed" },
      {
        property: "og:description",
        content: "Complete your tasks and grow a stronger focus garden.",
      },
    ],
  }),
  component: TasksPage,
});

const PRIORITY: Record<Priority, { label: string; className: string }> = {
  high: { label: "High", className: "bg-destructive/12 text-destructive" },
  medium: { label: "Medium", className: "bg-accent/30 text-accent-foreground" },
  low: { label: "Low", className: "bg-primary-soft text-primary" },
};

/** Parse a stored deadline (ISO, or legacy date-only / space-separated timestamptz). */
function parseDeadline(iso: string) {
  const s = iso.includes(" ") ? iso.replace(" ", "T") : iso;
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00` : s);
}

/** ISO deadline -> "YYYY-MM-DDTHH:mm" for datetime-local inputs (viewer timezone). */
function toLocalInputValue(iso: string) {
  if (!iso) return "";
  const d = parseDeadline(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** datetime-local value -> ISO string for storage, or null when empty/invalid. */
function toStoredDeadline(local: string) {
  if (!local) return null;
  const ms = new Date(local).getTime();
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

/** "21/9/2026, 14:30" — the time part is hidden when none was set (midnight). */
function formatDeadline(iso: string) {
  const d = parseDeadline(iso);
  const date = d.toLocaleDateString();
  if (d.getHours() === 0 && d.getMinutes() === 0) return date;
  return `${date}, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function deadlineMs(task: Task) {
  if (!task.deadline) return Number.NaN;
  return parseDeadline(task.deadline).getTime();
}

function isOverdue(task: Task, now = Date.now()) {
  if (task.done || !task.deadline) return false;
  const ms = deadlineMs(task);
  return !Number.isNaN(ms) && ms < now;
}

type OpenTab = "all" | "ontime";

function TasksPage() {
  const t = useT();
  const tf = useTf();
  const { state, addTask, updateTask, removeTask } = useMindSeed();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [deadline, setDeadline] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [draftDeadline, setDraftDeadline] = useState("");
  const [draftPriority, setDraftPriority] = useState<Priority>("medium");
  const [tab, setTab] = useState<OpenTab>("all");

  // Re-evaluate overdue state as time passes while the page stays open.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const iso = toStoredDeadline(deadline);
    addTask({ title: title.trim(), priority, ...(iso ? { deadline: iso } : {}) });
    setTitle("");
    setDeadline("");
    toast.success(t("New task added"));
  };

  const done = state.tasks.filter((t) => t.done);
  // Overdue tasks automatically move to the Completed side, locked.
  const expired = state.tasks.filter((t) => !t.done && isOverdue(t, now));
  const open = state.tasks.filter((t) => !t.done && !isOverdue(t, now));

  const counts = useMemo(
    () => ({
      all: open.length,
      ontime: open.filter((t) => t.deadline).length,
    }),
    [open],
  );

  // Earliest deadline first, deadline-less last (newest first).
  const visible = useMemo(() => {
    const list = tab === "ontime" ? open.filter((t) => t.deadline) : open;
    return [...list].sort((a, b) => {
      const da = deadlineMs(a);
      const db = deadlineMs(b);
      if (!Number.isNaN(da) && !Number.isNaN(db) && da !== db) return da - db;
      if (!Number.isNaN(da)) return -1;
      if (!Number.isNaN(db)) return 1;
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });
  }, [open, tab]);

  const closed = useMemo(
    () => [...[...expired].sort((a, b) => deadlineMs(b) - deadlineMs(a)), ...done],
    [expired, done],
  );

  const TABS: { key: OpenTab; label: string; count: number }[] = [
    { key: "all", label: t("All"), count: counts.all },
    { key: "ontime", label: t("On time"), count: counts.ontime },
  ];

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        {t("Tasks")}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {t("Every completed task helps your tree earn 12 EXP.")}
      </p>

      <form
        onSubmit={submit}
        className="surface mt-6 grid gap-3 p-5 sm:grid-cols-[1fr_auto_auto_auto]"
      >
        <Input
          placeholder={t("What needs your attention today?")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-11 rounded-2xl"
        />
        <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
          <SelectTrigger className="!h-11 shrink-0 rounded-2xl sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">{t("High priority")}</SelectItem>
            <SelectItem value="medium">{t("Medium priority")}</SelectItem>
            <SelectItem value="low">{t("Low priority")}</SelectItem>
          </SelectContent>
        </Select>
        <DateTimePicker value={deadline} onChange={setDeadline} className="sm:w-56" />
        <Button type="submit" className="h-11 rounded-2xl px-5 transition-transform active:scale-[0.97]">
          <Plus className="size-4" />
          {t("Add")}
        </Button>
      </form>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 px-1 text-sm font-semibold text-muted-foreground">
            {tf("In progress ({n})", { n: open.length })}
          </h2>
          <div className="mb-3 flex gap-2 px-1">
            {TABS.map((tabItem) => (
              <button
                key={tabItem.key}
                onClick={() => setTab(tabItem.key)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  tab === tabItem.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-primary-soft hover:text-primary"
                }`}
              >
                {tabItem.label} ({tabItem.count})
              </button>
            ))}
          </div>
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {visible.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  editing={editing === task.id}
                  draft={draft}
                  setDraft={setDraft}
                  draftDeadline={draftDeadline}
                  setDraftDeadline={setDraftDeadline}
                  draftPriority={draftPriority}
                  setDraftPriority={setDraftPriority}
                  onEdit={() => {
                    setEditing(task.id);
                    setDraft(task.title);
                    setDraftDeadline(task.deadline ? toLocalInputValue(task.deadline) : "");
                    setDraftPriority(task.priority);
                  }}
                  onSave={() => {
                    updateTask(task.id, {
                      title: draft.trim() || task.title,
                      deadline: toStoredDeadline(draftDeadline),
                      priority: draftPriority,
                    });
                    setEditing(null);
                  }}
                  onCancel={() => setEditing(null)}
                  onToggle={async () => {
                    try {
                      await updateTask(task.id, { done: true });
                      toast.success("Làm tốt lắm! Bạn đã nhận được +12 EXP 🌿");
                    } catch {
                      toast.error(t("Couldn't complete the task. Please try again."));
                    }
                  }}
                  onRemove={() => removeTask(task.id)}
                />
              ))}
            </AnimatePresence>
          </ul>
          {open.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {t("All clear. Take a moment to breathe.")}
            </p>
          )}
          {open.length > 0 && visible.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {t("Nothing here.")}
            </p>
          )}
        </section>

        <section>
          <h2 className="mb-3 px-1 text-sm font-semibold text-muted-foreground">
            {tf("Completed ({n})", { n: closed.length })}
          </h2>
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {closed.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  editing={false}
                  draft={draft}
                  setDraft={setDraft}
                  draftDeadline={draftDeadline}
                  setDraftDeadline={setDraftDeadline}
                  draftPriority={draftPriority}
                  setDraftPriority={setDraftPriority}
                  onEdit={() => {}}
                  onSave={() => {}}
                  onCancel={() => {}}
                  onToggle={() => {}}
                  onRemove={() => removeTask(task.id)}
                />
              ))}
            </AnimatePresence>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}

function TaskRow({
  task,
  editing,
  draft,
  setDraft,
  draftDeadline,
  setDraftDeadline,
  draftPriority,
  setDraftPriority,
  onEdit,
  onSave,
  onCancel,
  onToggle,
  onRemove,
}: {
  task: Task;
  editing: boolean;
  draft: string;
  setDraft: (v: string) => void;
  draftDeadline: string;
  setDraftDeadline: (v: string) => void;
  draftPriority: Priority;
  setDraftPriority: (v: Priority) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const t = useT();
  const tf = useTf();
  const p = PRIORITY[task.priority];
  const overdue = !task.done && isOverdue(task);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{
        layout: { type: "spring", stiffness: 350, damping: 32 },
        duration: 0.32,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="surface flex items-center gap-3 p-4"
    >
      <button
        onClick={onToggle}
        aria-label={t("Mark complete")}
        disabled={task.done || overdue}
        className={`grid size-6 shrink-0 place-items-center rounded-lg border transition-all duration-200 ${
          task.done
            ? "cursor-default border-primary bg-primary text-primary-foreground"
            : overdue
              ? "cursor-pointer border-destructive bg-destructive text-yellow-300 active:scale-90"
              : "cursor-pointer border-border active:scale-90"
        }`}
      >
        {task.done ? <Check className="size-3.5" /> : overdue && <X className="size-3.5" />}
      </button>

      <div className="min-w-0 flex-1">
        {editing ? (
          <>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-9 rounded-xl"
              autoFocus
            />
            <div className="mt-2 flex gap-2">
              <DateTimePicker
                value={draftDeadline}
                onChange={setDraftDeadline}
                className="h-9 min-w-0 flex-1 rounded-xl text-xs"
              />
              <Select value={draftPriority} onValueChange={(v) => setDraftPriority(v as Priority)}>
                <SelectTrigger className="!h-9 rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">{t("High priority")}</SelectItem>
                  <SelectItem value="medium">{t("Medium priority")}</SelectItem>
                  <SelectItem value="low">{t("Low priority")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        ) : (
          <p
            className={`truncate text-sm font-medium ${task.done ? "text-muted-foreground line-through" : ""}`}
          >
            {task.title}
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.className}`}>
            {t(p.label)}
          </span>
          {overdue && (
            <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold text-destructive">
              {t("Overdue")}
            </span>
          )}
          {task.deadline && (
            <span
              className={`text-[11px] ${overdue ? "font-medium text-destructive" : "text-muted-foreground"}`}
            >
              {tf("Due {date}", { date: formatDeadline(task.deadline) })}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {editing ? (
          <>
            <IconBtn onClick={onSave} label={t("Save")}>
              <Check className="size-4" />
            </IconBtn>
            <IconBtn onClick={onCancel} label={t("Cancel")}>
              <X className="size-4" />
            </IconBtn>
          </>
        ) : (
          !task.done &&
          !overdue && (
            <IconBtn onClick={onEdit} label={t("Edit")}>
              <Pencil className="size-4" />
            </IconBtn>
          )
        )}
        <IconBtn onClick={onRemove} label={t("Delete")}>
          <Trash2 className="size-4" />
        </IconBtn>
      </div>
    </motion.li>
  );
}

function IconBtn({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}
