import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useT, useTf } from "@/lib/ui-language";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  Crown,
  Link2,
  LockKeyhole,
  Pause,
  Play,
  Shield,
  Square,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Confetti } from "@/components/ReflectionDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STAGES, useMindSeed } from "@/lib/mindseed-store";
import { deleteRoom, leaveRoom, makeInviteLink, useRoom } from "@/lib/room-store";

export const Route = createFileRoute("/rooms/$roomId")({
  head: () => ({
    meta: [{ title: "Study Room — MindSeed" }],
  }),
  component: RoomPage,
});

const DURATIONS = [25, 30, 45, 60];

/** Tree grows through the 4 MindSeed stages as the shared session progresses. */
function stageFor(progressPct: number) {
  const idx = Math.min(3, Math.floor((Math.max(0, Math.min(100, progressPct)) / 100) * 4));
  return STAGES[idx]!;
}

function StatusPill({ status }: { status: "idle" | "running" | "paused" }) {
  const t = useT();
  const tone =
    status === "running"
      ? "bg-primary-soft text-primary"
      : status === "paused"
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
        : "bg-muted text-muted-foreground";
  return (
    <span
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${tone}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          status === "running"
            ? "animate-pulse bg-primary"
            : status === "paused"
              ? "bg-amber-500"
              : "bg-muted-foreground/50"
        }`}
      />
      {t(status === "running" ? "In focus…" : status === "paused" ? "Paused" : "Ready")}
    </span>
  );
}

function MemberCard({
  name,
  avatar,
  isHost,
  isMe,
  progress,
  delay,
}: {
  name: string;
  avatar: string;
  isHost: boolean;
  isMe: boolean;
  progress: number;
  delay: number;
}) {
  const t = useT();
  const stage = stageFor(progress);
  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-2xl border p-3 ${
        isMe ? "border-primary/40 bg-primary-soft/50" : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="relative shrink-0">
          <span className="grid size-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {avatar || name.trim().charAt(0).toUpperCase() || "?"}
          </span>
          <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-card bg-emerald-500" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {name || t("Anonymous")}
            {isMe && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">({t("you")})</span>
            )}
          </p>
          {isHost && (
            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-accent/30 px-2 py-0.5 text-[11px] font-semibold">
              <Crown className="size-3" />
              {t("Host")}
            </span>
          )}
        </div>
        <motion.span
          key={stage.name}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-xl"
          aria-label={t(stage.name)}
          title={t(stage.name)}
        >
          {stage.emoji}
        </motion.span>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "linear" }}
        />
      </div>
    </motion.li>
  );
}

function RoomPage() {
  const t = useT();
  const tf = useTf();
  const navigate = useNavigate();
  const { roomId } = Route.useParams();
  const { addSession } = useMindSeed();

  const view = useRoom(roomId);
  const { room } = view;

  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [banner, setBanner] = useState(false);
  const [gatePassword, setGatePassword] = useState("");
  const [gateError, setGateError] = useState(false);
  const [gateBusy, setGateBusy] = useState(false);

  const handleGateSubmit = async () => {
    if (!room) return;
    setGateBusy(true);
    try {
      await view.submitRoomPassword(gatePassword.trim());
      // submitRoomPassword reloads the page on success.
    } catch (err) {
      console.error("[Room] Password gate rejected:", err);
      setGateError(true);
      setGateBusy(false);
    }
  };

  // Celebrate + credit the session exactly once per armed timer.
  const celebratedRef = useRef(view.finishedTick);
  useEffect(() => {
    if (view.finishedTick === celebratedRef.current) return;
    celebratedRef.current = view.finishedTick;
    if (!room) return;
    toast.success(t("Session complete! Your tree just grew 🌿"));
    setConfetti(true);
    setBanner(true);
    setTimeout(() => setConfetti(false), 3000);
    setTimeout(() => setBanner(false), 3800);
    void addSession(room.duration_min, true).catch((err) =>
      console.error("[Room] Failed to log session:", err),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- celebrate once per tick
  }, [view.finishedTick]);

  if (!room) {
    return (
      <AppShell>
        <p className="mt-6 text-sm text-muted-foreground">
          {view.loading ? t("Opening room…") : (view.error ?? t("Room unavailable."))}
        </p>
        <Button asChild variant="outline" className="mt-4 rounded-full">
          <Link to="/rooms">
            <ArrowLeft className="size-4" />
            {t("Back to rooms")}
          </Link>
        </Button>
      </AppShell>
    );
  }

  // Password gate: spectators see this instead of the room until verified.
  if (view.joinedOk === false) {
    return (
      <AppShell>
        <div className="mx-auto mt-10 max-w-sm surface flex flex-col items-center p-8 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
            <LockKeyhole className="size-6" />
          </span>
          <h1 className="mt-4 font-display text-xl font-semibold">{room.name}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("This room is password protected. Enter the password to join.")}
          </p>
          <Input
            type="password"
            autoFocus
            value={gatePassword}
            onChange={(e) => {
              setGatePassword(e.target.value);
              setGateError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && gatePassword.trim()) void handleGateSubmit();
            }}
            placeholder={t("Room password")}
            maxLength={40}
            className="mt-5 rounded-2xl text-center"
            aria-label={t("Room password")}
          />
          {gateError && (
            <p className="mt-2 text-xs text-destructive">{t("Wrong password. Try again.")}</p>
          )}
          <Button
            className="mt-4 w-full cursor-pointer rounded-2xl"
            disabled={!gatePassword.trim() || gateBusy}
            onClick={() => void handleGateSubmit()}
          >
            {gateBusy ? t("Checking…") : t("Unlock & join")}
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mt-3 cursor-pointer rounded-full text-xs"
          >
            <Link to="/rooms">
              <ArrowLeft className="size-4" />
              {t("Back to rooms")}
            </Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const progressPct = Math.max(0, Math.min(100, ((view.total - view.left) / view.total) * 100));
  const size = 300;
  const r = size / 2 - 18;
  const c = 2 * Math.PI * r;
  const canSteer = view.canControl && room.status === "idle";

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await leaveRoom(roomId);
      await navigate({ to: "/rooms" });
    } catch (err) {
      console.error("[Room] Leave failed:", err);
      setLeaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteRoom(roomId);
      toast.success(tf("Room “{name}” deleted.", { name: room.name }));
      await navigate({ to: "/rooms" });
    } catch (err) {
      console.error("[Room] Delete failed:", err);
      toast.error(t("Could not delete the room."));
      setDeleting(false);
    }
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(makeInviteLink(roomId));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t("Invite link copied!"));
    } catch {
      toast.error(t("Could not copy the link."));
    }
  };

  return (
    <AppShell>
      <Confetti show={confetti} />

      {/* completion banner */}
      {banner && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-x-0 top-6 z-50 mx-auto w-fit rounded-full border border-primary/30 bg-card px-6 py-3 shadow-lift"
        >
          <p className="font-display text-sm font-semibold text-primary">
            {t("Session complete — everyone’s tree grew! 🎉")}
          </p>
        </motion.div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/rooms"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            {t("Back to rooms")}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2.5">
            <h1 className="truncate font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {room.name}
            </h1>
            <StatusPill status={room.status} />
            {room.has_password && (
              <span
                className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400"
                title={t("Password protected")}
              >
                <LockKeyhole className="size-3" />
                {t("Password protected")}
              </span>
            )}
            {/* compact invite link — hover previews the full URL, click copies */}
            <button
              onClick={() => void copyInvite()}
              className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full bg-muted px-3 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
              title={makeInviteLink(roomId)}
              aria-label={t("Copy invite link")}
            >
              <Link2 className="size-3 shrink-0 text-primary" />
              <span className="truncate">/rooms/{room.code}</span>
              {copied && <Check className="size-3 shrink-0 text-primary" />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void copyInvite()}
            className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 font-mono text-xs tracking-widest text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
            aria-label={t("Copy invite link")}
            title={t("Copy invite link")}
          >
            {room.code} {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          </button>
          {(view.amHost || view.isAdmin) && (
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-4" />
              {t("Delete room")}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer rounded-full"
            disabled={leaving}
            onClick={() => void handleLeave()}
          >
            {t("Leave")}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        {/* shared timer */}
        <div className="surface relative flex flex-col items-center overflow-hidden p-6 sm:p-9">
          <div
            className={`pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl transition-opacity duration-700 ${
              view.running ? "bg-primary/20 opacity-100" : "opacity-0"
            }`}
          />

          {view.isAdmin && !view.amHost && (
            <p className="mb-2 flex items-center gap-1.5 rounded-full bg-accent/25 px-3 py-1 text-xs font-medium text-foreground">
              <Shield className="size-3.5" />
              {t("Admin mode — you can control and delete this room")}
            </p>
          )}
          {!view.canControl && (
            <p className="mb-4 text-xs text-muted-foreground">
              {t("Only the host can control the shared timer.")}
            </p>
          )}

          {canSteer && (
            <div className="flex flex-wrap justify-center gap-2">
              {DURATIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => void view.setDuration(m)}
                  disabled={!view.canControl}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    m === room.duration_min
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-primary-soft hover:text-primary"
                  }`}
                >
                  {m} {t("min")}
                </button>
              ))}
            </div>
          )}
          {!canSteer && view.running && room.ends_at && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
              <Clock className="size-3.5" />
              {tf("Ends at {time}", {
                time: new Date(room.ends_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              })}
            </p>
          )}

          <div
            className="relative mt-8 grid place-items-center"
            style={{ width: size, height: size }}
          >
            <svg width={size} height={size} className="-rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                strokeWidth="14"
                className="stroke-muted"
                fill="none"
              />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                strokeWidth="14"
                strokeLinecap="round"
                className="stroke-primary drop-shadow-[0_0_10px_rgba(16,185,129,0.35)]"
                fill="none"
                strokeDasharray={c}
                animate={{ strokeDashoffset: c - (c * progressPct) / 100 }}
                transition={{ duration: 0.6, ease: "linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                key={view.left <= 0 ? "done" : "counting"}
                animate={view.running ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="font-display text-6xl font-semibold tabular-nums tracking-tight sm:text-7xl"
              >
                {String(Math.floor(view.left / 60)).padStart(2, "0")}:
                {String(view.left % 60).padStart(2, "0")}
              </motion.span>
              <span className="mt-2 text-sm text-muted-foreground">
                {view.running
                  ? t("In focus…")
                  : room.status === "paused"
                    ? t("Paused")
                    : t(view.members.length > 1 ? "Waiting for the host to start…" : "Ready")}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              className="h-12 cursor-pointer rounded-2xl px-8 transition-transform active:scale-[0.97]"
              disabled={!view.canControl || view.running}
              onClick={() =>
                void (room.status === "paused" ? view.resume() : view.start()).catch((err) =>
                  console.error("[Room] Timer action failed:", err),
                )
              }
            >
              <Play className="size-4 fill-current" />
              {room.status === "paused" ? t("Resume") : t("Start")}
            </Button>
            <Button
              variant="outline"
              className="h-12 cursor-pointer rounded-2xl px-6 transition-transform active:scale-[0.97]"
              disabled={!view.canControl || !view.running}
              onClick={() =>
                void view.pause().catch((err) => console.error("[Room] Timer action failed:", err))
              }
            >
              <Pause className="size-4" />
              {t("Pause")}
            </Button>
            <Button
              variant="outline"
              className="h-12 cursor-pointer rounded-2xl px-6 transition-transform active:scale-[0.97]"
              disabled={!view.canControl || room.status === "idle"}
              onClick={() =>
                void view.end().catch((err) => console.error("[Room] Timer action failed:", err))
              }
            >
              <Square className="size-4" />
              {t("End")}
            </Button>
          </div>

          {!view.amHost && !view.canControl && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-4 cursor-pointer rounded-full text-xs"
              onClick={() =>
                void view.claimHost().catch((err) => console.error("[Room] Claim failed:", err))
              }
            >
              {t("Host left? Take over")}
            </Button>
          )}
        </div>

        {/* room garden */}
        <div className="surface p-6 sm:p-7">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Users className="size-4 text-primary" />
            {t("Room garden")}
            <span className="ml-auto rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary tabular-nums">
              {view.members.length}
            </span>
          </h2>

          {view.members.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">{t("Loading members…")}</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2.5">
              {view.members.map((m, i) => (
                <MemberCard
                  key={m.user_id}
                  name={m.name}
                  avatar={m.avatar}
                  isHost={m.user_id === room.host_id}
                  isMe={m.user_id === view.myId}
                  progress={progressPct}
                  delay={i * 0.06}
                />
              ))}
            </ul>
          )}

          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            {t(
              "Everyone’s seed sprouts into a tree as the session progresses — finish it to log EXP.",
            )}
          </p>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete this room?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tf("Room “{name}” will be removed for everyone.", { name: room.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-destructive text-white hover:bg-destructive/90"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              {deleting ? t("Deleting…") : t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
