import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useT, useTf } from "@/lib/ui-language";
import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, DoorOpen, Lock, LogOut, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useMindSeed } from "@/lib/mindseed-store";
import type { RoomRow } from "@/lib/room-store";
import {
  createRoom,
  deleteRoom,
  ensureJoined,
  joinRoomByCode,
  joinRoomWithPassword,
} from "@/lib/room-store";

export const Route = createFileRoute("/rooms/")({
  head: () => ({
    meta: [
      { title: "Study Rooms — MindSeed" },
      {
        name: "description",
        content: "Create or join a shared study room with one synchronized focus timer.",
      },
      { property: "og:title", content: "Study Rooms — MindSeed" },
      {
        property: "og:description",
        content: "Focus side by side with friends in real time.",
      },
    ],
  }),
  component: RoomsPage,
});

const DURATIONS = [25, 30, 45, 60];

type LobbyRoom = Pick<
  RoomRow,
  "id" | "name" | "code" | "host_id" | "status" | "duration_min" | "has_password" | "created_at"
> & { room_members: { count: number }[] };

function statusTone(status: RoomRow["status"]) {
  if (status === "running") return "bg-primary";
  if (status === "paused") return "bg-amber-500";
  return "bg-muted-foreground/40";
}

function RoomsPage() {
  const t = useT();
  const tf = useTf();
  const navigate = useNavigate();
  const { state } = useMindSeed();
  const isAdmin = state.user?.role === "admin";

  const [rooms, setRooms] = useState<LobbyRoom[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<LobbyRoom | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDuration, setNewDuration] = useState(25);
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [pendingJoin, setPendingJoin] = useState<LobbyRoom | null>(null);
  const [joinGatePassword, setJoinGatePassword] = useState("");
  const [joiningLocked, setJoiningLocked] = useState(false);
  const refreshRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRooms = useCallback(async () => {
    const { data, error } = await supabase
      .from("study_rooms")
      .select(
        "id,name,code,host_id,status,duration_min,has_password,created_at,room_members(count)",
      )
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) {
      console.error("[Rooms] Failed to list rooms:", error);
      return;
    }
    setRooms(data ?? []);
    setLoadingRooms(false);
  }, []);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    void fetchRooms();

    // Live-ish lobby: any insert/update/delete on rooms or membership refetches.
    const channel = supabase
      .channel("rooms-lobby")
      .on("postgres_changes", { event: "*", schema: "public", table: "study_rooms" }, () => {
        if (refreshRef.current) clearTimeout(refreshRef.current);
        refreshRef.current = setTimeout(() => void fetchRooms(), 400);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "room_members" }, () => {
        if (refreshRef.current) clearTimeout(refreshRef.current);
        refreshRef.current = setTimeout(() => void fetchRooms(), 400);
      })
      .subscribe();

    const interval = window.setInterval(() => void fetchRooms(), 15000);

    return () => {
      window.clearInterval(interval);
      void supabase.removeChannel(channel);
      if (refreshRef.current) clearTimeout(refreshRef.current);
    };
  }, [fetchRooms]);

  const openRoom = useCallback(
    async (room: LobbyRoom) => {
      // Protected rooms ask for the password first (admins walk right in).
      if (room.has_password && !isAdmin && myId !== room.host_id) {
        setPendingJoin(room);
        return;
      }
      // Membership bookkeeping must never block entering the room — the room
      // page retries it on every mount anyway.
      void ensureJoined(room.id).catch(() => {
        toast.error(t("Joined in view-only mode — membership sync failed."));
      });
      await navigate({ to: "/rooms/$roomId", params: { roomId: room.id } });
    },
    [navigate, t, isAdmin, myId],
  );

  const handleCreate = async () => {
    const name = newName.trim() || t("Untitled room");
    setCreating(true);
    try {
      const room = await createRoom(name.slice(0, 60), newDuration, newPassword);
      setCreateOpen(false);
      setNewName("");
      setNewPassword("");
      // The room page registers the creator as its first member on mount.
      await navigate({ to: "/rooms/$roomId", params: { roomId: room.id } });
    } catch (err) {
      console.error("[Rooms] Create failed:", err);
      toast.error(t("Could not create the room. Please try again."));
    } finally {
      setCreating(false);
    }
  };

  const handleJoinByCode = async () => {
    setJoining(true);
    try {
      const found = await joinRoomByCode(joinCode);
      if (!found) {
        toast.error(t("No room found with that code."));
        return;
      }
      await openRoom({ ...found, name: "", code: joinCode.trim().toUpperCase() } as LobbyRoom);
    } finally {
      setJoining(false);
    }
  };

  const handlePasswordJoin = async () => {
    if (!pendingJoin) return;
    setJoiningLocked(true);
    try {
      await joinRoomWithPassword(pendingJoin.id, joinGatePassword);
      toast.success(t("Password accepted — welcome in!"));
      const roomId = pendingJoin.id;
      setPendingJoin(null);
      setJoinGatePassword("");
      await navigate({ to: "/rooms/$roomId", params: { roomId } });
    } catch (err) {
      if (err instanceof Error && err.message === "WRONG_PASSWORD") {
        toast.error(t("Wrong password. Try again."));
      } else {
        console.error("[Rooms] Password join failed:", err);
        toast.error(t("Could not join the room. Please try again."));
      }
    } finally {
      setJoiningLocked(false);
    }
  };

  const copyLink = async (roomId: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/rooms/${roomId}`);
      toast.success(t("Invite link copied!"));
    } catch {
      toast.error(t("Could not copy the link."));
    }
  };

  const handleDeleteRoom = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteRoom(pendingDelete.id);
      toast.success(tf("Room “{name}” deleted.", { name: pendingDelete.name }));
      setPendingDelete(null);
    } catch (err) {
      console.error("[Rooms] Delete failed:", err);
      toast.error(t("Could not delete the room."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        {t("Study Rooms")}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {t("Focus together — one shared timer, everyone grows.")}
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="surface p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <DoorOpen className="size-4 text-primary" />
              {t("Open rooms")}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 cursor-pointer rounded-full"
              aria-label={t("Refresh")}
              onClick={() => void fetchRooms()}
            >
              <RefreshCw className={`size-4 ${loadingRooms ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {loadingRooms ? (
            <p className="mt-6 text-sm text-muted-foreground">{t("Loading rooms…")}</p>
          ) : rooms.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              {t("No rooms yet — create the first one!")}
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {rooms.map((room) => {
                const count = room.room_members?.[0]?.count ?? 0;
                const canDelete = isAdmin || (myId !== null && room.host_id === myId);
                return (
                  <li
                    key={room.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3.5"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={`size-2.5 shrink-0 rounded-full ${statusTone(room.status)}`} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                          <span className="truncate">{room.name}</span>
                          {room.has_password && (
                            <Lock
                              className="size-3.5 shrink-0 text-amber-500"
                              aria-label={t("Password protected")}
                            />
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                          <Users className="mr-1 inline size-3" />
                          {tf("{n} studying", { n: count })} · {room.duration_min} {t("min")} ·{" "}
                          {t(
                            room.status === "running"
                              ? "In focus…"
                              : room.status === "paused"
                                ? "Paused"
                                : "Ready",
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-border/60">
                      <button
                        onClick={() => void copyLink(room.id)}
                        className="rounded-xl bg-muted px-2.5 py-1.5 font-mono text-xs tracking-widest text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                        aria-label={t("Copy invite link")}
                        title={t("Copy invite link")}
                      >
                        {room.code} <Copy className="inline size-3" />
                      </button>
                      <Button
                        size="sm"
                        className="cursor-pointer rounded-xl px-4"
                        onClick={() => void openRoom(room)}
                      >
                        {t("Join")}
                      </Button>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 cursor-pointer rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label={t("Delete room")}
                          title={t("Delete room")}
                          onClick={() => setPendingDelete(room)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="surface p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Plus className="size-4 text-primary" />
              {t("New room")}
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t("You will be the host and control the shared timer.")}
            </p>
            <Button
              className="mt-4 w-full cursor-pointer rounded-2xl"
              onClick={() => setCreateOpen(true)}
            >
              {t("Create a study room")}
            </Button>
          </div>

          <div className="surface p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <LogOut className="size-4 rotate-180 text-primary" />
              {t("Have an invite code?")}
            </h2>
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter" && joinCode.trim()) void handleJoinByCode();
              }}
              placeholder="ABC123"
              maxLength={6}
              autoComplete="off"
              className="mt-4 rounded-2xl text-center font-mono text-lg uppercase tracking-widest"
              aria-label={t("Invite code")}
            />
            <Button
              variant="outline"
              className="mt-3 w-full cursor-pointer rounded-2xl"
              disabled={!joinCode.trim() || joining}
              onClick={() => void handleJoinByCode()}
            >
              {t("Join by code")}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="w-[92vw] sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>{t("Create a study room")}</DialogTitle>
            <DialogDescription>{t("Pick a name and session length to begin.")}</DialogDescription>
          </DialogHeader>

          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t("Room name (e.g. Late-night grind)")}
            maxLength={60}
            autoComplete="off"
            className="rounded-2xl"
            aria-label={t("Room name")}
          />

          <div className="flex flex-wrap justify-center gap-2">
            {DURATIONS.map((m) => (
              <button
                key={m}
                onClick={() => setNewDuration(m)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  m === newDuration
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-primary-soft hover:text-primary"
                }`}
              >
                {m} {t("min")}
              </button>
            ))}
          </div>

          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("Password (optional)")}
              maxLength={40}
              autoComplete="off"
              className="rounded-2xl pl-10"
              aria-label={t("Room password")}
            />
          </div>

          <DialogFooter>
            <Button
              className="w-full cursor-pointer rounded-2xl"
              disabled={creating}
              onClick={() => void handleCreate()}
            >
              {creating ? t("Creating…") : t("Create room")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingJoin !== null}
        onOpenChange={(v) => {
          if (!v) {
            setPendingJoin(null);
            setJoinGatePassword("");
          }
        }}
      >
        <DialogContent className="w-[92vw] sm:max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="size-4 text-primary" />
              {t("This room is password protected")}
            </DialogTitle>
            <DialogDescription>
              {tf("Enter the password for “{name}” to join.", { name: pendingJoin?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <Input
            type="text"
            autoFocus
            value={joinGatePassword}
            onChange={(e) => setJoinGatePassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && joinGatePassword.trim()) void handlePasswordJoin();
            }}
            placeholder={t("Room password")}
            maxLength={40}
            autoComplete="off"
            className="rounded-2xl text-center"
            aria-label={t("Room password")}
          />
          <DialogFooter>
            <Button
              className="w-full cursor-pointer rounded-2xl"
              disabled={!joinGatePassword.trim() || joiningLocked}
              onClick={() => void handlePasswordJoin()}
            >
              {joiningLocked ? t("Checking…") : t("Unlock & join")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(v) => !v && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete this room?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tf("Room “{name}” will be removed for everyone.", {
                name: pendingDelete?.name ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer bg-destructive text-white hover:bg-destructive/90"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteRoom();
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
