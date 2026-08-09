import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
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
      { name: "description", content: "Manage tasks with deadlines, priorities, and EXP for your garden when completed." },
      { property: "og:title", content: "Tasks — MindSeed" },
      { property: "og:description", content: "Complete your tasks and grow a stronger focus garden." },
    ],
  }),
  component: TasksPage,
});

const PRIORITY: Record<Priority, { label: string; className: string }> = {
  high: { label: "High", className: "bg-destructive/12 text-destructive" },
  medium: { label: "Medium", className: "bg-accent/30 text-accent-foreground" },
  low: { label: "Low", className: "bg-primary-soft text-primary" },
};

function TasksPage() {
  const { state, addTask, updateTask, removeTask } = useMindSeed();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [deadline, setDeadline] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({ title: title.trim(), priority, ...(deadline ? { deadline } : {}) });
    setTitle("");
    setDeadline("");
    toast.success("New task added");
  };

  const done = state.tasks.filter((t) => t.done);
  const open = state.tasks.filter((t) => !t.done);

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Tasks</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Every completed task helps your tree earn 12 EXP.
      </p>

      <form onSubmit={submit} className="surface mt-6 grid gap-3 p-5 sm:grid-cols-[1fr_auto_auto_auto]">
        <Input
          placeholder="What needs your attention today?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-11 rounded-2xl"
        />
        <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
          <SelectTrigger className="!h-11 rounded-2xl sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">High priority</SelectItem>
            <SelectItem value="medium">Medium priority</SelectItem>
            <SelectItem value="low">Low priority</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="h-11 rounded-2xl sm:w-44"
        />
        <Button type="submit" className="h-11 rounded-2xl px-5">
          <Plus className="size-4" />
          Add
        </Button>
      </form>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 px-1 text-sm font-semibold text-muted-foreground">
            In progress ({open.length})
          </h2>
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {open.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  editing={editing === t.id}
                  draft={draft}
                  setDraft={setDraft}
                  onEdit={() => {
                    setEditing(t.id);
                    setDraft(t.title);
                  }}
                  onSave={() => {
                    updateTask(t.id, { title: draft.trim() || t.title });
                    setEditing(null);
                  }}
                  onCancel={() => setEditing(null)}
                  onToggle={() => {
                    updateTask(t.id, { done: true });
                    toast.success("Nice work! Your tree earned 12 EXP 🌿");
                  }}
                  onRemove={() => removeTask(t.id)}
                />
              ))}
            </AnimatePresence>
          </ul>
          {open.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              All clear. Take a moment to breathe.
            </p>
          )}
        </section>

        <section>
          <h2 className="mb-3 px-1 text-sm font-semibold text-muted-foreground">
            Completed ({done.length})
          </h2>
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {done.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  editing={false}
                  draft={draft}
                  setDraft={setDraft}
                  onEdit={() => {}}
                  onSave={() => {}}
                  onCancel={() => {}}
                  onToggle={() => updateTask(t.id, { done: false })}
                  onRemove={() => removeTask(t.id)}
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
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const p = PRIORITY[task.priority];
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="surface flex items-center gap-3 p-4"
    >
      <button
        onClick={onToggle}
        aria-label="Mark complete"
        className={`grid size-6 shrink-0 place-items-center rounded-lg border transition-colors ${
          task.done ? "border-primary bg-primary text-primary-foreground" : "border-border"
        }`}
      >
        {task.done && <Check className="size-3.5" />}
      </button>

      <div className="min-w-0 flex-1">
        {editing ? (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-9 rounded-xl"
            autoFocus
          />
        ) : (
          <p className={`truncate text-sm font-medium ${task.done ? "text-muted-foreground line-through" : ""}`}>
            {task.title}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.className}`}>
            {p.label}
          </span>
          {task.deadline && (
            <span className="text-[11px] text-muted-foreground">
              Due {new Date(task.deadline).toLocaleDateString("en-US")}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {editing ? (
          <>
            <IconBtn onClick={onSave} label="Save">
              <Check className="size-4" />
            </IconBtn>
            <IconBtn onClick={onCancel} label="Cancel">
              <X className="size-4" />
            </IconBtn>
          </>
        ) : (
          !task.done && (
            <IconBtn onClick={onEdit} label="Edit">
              <Pencil className="size-4" />
            </IconBtn>
          )
        )}
        <IconBtn onClick={onRemove} label="Delete">
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
