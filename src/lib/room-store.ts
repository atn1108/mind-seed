import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type RoomRow = Database["public"]["Tables"]["study_rooms"]["Row"];
export type RoomStatus = RoomRow["status"];

export type RoomMember = {
  user_id: string;
  name: string;
  avatar: string;
  joined_at: number;
};

export type RoomMessage = {
  id: string;
  room_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  content: string;
  created_at: string;
};

export type MemberPublicProfile = {
  id: string;
  name: string;
  avatar: string | null;
  monthly_goal_hours: number;
  exp: number;
  total_trees: number;
  total_minutes: number;
};

/** Only local data-URI images are treated as renderable avatars. External
 *  http(s) URLs are rejected client-side too: they act as tracking pixels
 *  (IP + referer leak — the room URL is sent in the request) and abuse the
 *  victim's browser as a load source. */
export function isSafeAvatar(avatar: string | null | undefined): avatar is string {
  return typeof avatar === "string" && avatar.startsWith("data:image/");
}

export async function sendRoomMessage(roomId: string, content: string) {
  const userId = await requireUserId();
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, avatar")
    .eq("id", userId)
    .single();

  const { error } = await supabase.from("room_messages").insert({
    room_id: roomId,
    user_id: userId,
    user_name: profile?.name ?? "User",
    user_avatar: profile?.avatar ?? null,
    content: content.trim().slice(0, 500),
  });
  if (error) throw error;
}

export async function fetchMemberPublicProfile(userId: string): Promise<MemberPublicProfile> {
  const [profileRes, treesRes, sessionsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, avatar, monthly_goal_hours, exp")
      .eq("id", userId)
      .single(),
    supabase.from("garden_trees").select("id", { count: "exact" }).eq("user_id", userId),
    supabase.from("focus_sessions").select("minutes").eq("user_id", userId).eq("completed", true),
  ]);

  if (profileRes.error) throw profileRes.error;
  const p = profileRes.data;
  const totalMinutes = (sessionsRes.data ?? []).reduce((acc, s) => acc + s.minutes, 0);

  return {
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    monthly_goal_hours: p.monthly_goal_hours,
    exp: p.exp,
    total_trees: treesRes.count ?? 0,
    total_minutes: totalMinutes,
  };
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode() {
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

async function requireUserId() {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) throw new Error("You are not signed in.");
  return userId;
}

export function makeInviteLink(roomId: string) {
  return typeof window !== "undefined"
    ? `${window.location.origin}/rooms/${roomId}`
    : `/rooms/${roomId}`;
}

const ROOM_COLUMNS =
  "id,name,code,host_id,status,duration_min,remaining_sec,ends_at,has_password,created_at";

// Keep only the most recent messages in memory so an active room with heavy
// chat doesn't grow React state (and DOM) without bound.
const MAX_ROOM_MESSAGES = 200;

export async function createRoom(
  name: string,
  durationMin: number,
  password?: string,
): Promise<RoomRow> {
  const userId = await requireUserId();

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("study_rooms")
      .insert({
        name,
        code: generateCode(),
        host_id: userId,
        duration_min: durationMin,
        remaining_sec: durationMin * 60,
        has_password: !!password?.trim(),
      })
      .select(ROOM_COLUMNS)
      .single();

    if (!error) {
      if (password?.trim()) await setRoomPassword(data.id, password.trim());
      return data;
    }
    if (error.code !== "23505") throw error; // retry only on code collision
  }
  throw new Error("Could not allocate a room code, please try again.");
}

export async function joinRoomByCode(
  rawCode: string,
): Promise<{ id: string; host_id: string; has_password: boolean } | null> {
  const code = rawCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) return null;
  const { data } = await supabase
    .from("study_rooms")
    .select("id,host_id,has_password")
    .eq("code", code)
    .maybeSingle();
  return data ?? null;
}

/** Insert my membership row (no-op if already a member).
 *  ignoreDuplicates → ON CONFLICT DO NOTHING, which only needs the INSERT
 *  policy — a merge-duplicates upsert would require an UPDATE policy too. */
export async function ensureJoined(roomId: string) {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("room_members")
    .upsert(
      { room_id: roomId, user_id: userId },
      { onConflict: "room_id,user_id", ignoreDuplicates: true },
    );
  if (error) {
    logDbError("ensureJoined", error);
    throw error;
  }
}

/** Host (or admin) sets / clears the room password via RPC.
 *  Pass null to remove the password entirely. */
export async function setRoomPassword(roomId: string, password: string | null) {
  const { error } = await supabase.rpc("set_room_password", {
    p_room_id: roomId,
    p_password: password,
  });
  if (error) {
    logDbError("setRoomPassword", error);
    throw error;
  }
}

/** Password-gated join through the SECURITY DEFINER RPC.
 *  Throws an Error whose message is "WRONG_PASSWORD" on mismatch. */
export async function joinRoomWithPassword(roomId: string, password: string) {
  const { error } = await supabase.rpc("join_room_with_password", {
    p_room_id: roomId,
    p_password: password,
  });
  if (error) {
    logDbError("joinRoomWithPassword", error);
    if (error.message === "WRONG_PASSWORD") throw new Error("WRONG_PASSWORD");
    throw error;
  }
}

/** Host or admin may remove a room entirely; members cascade via FK. */
export async function deleteRoom(roomId: string) {
  const { data, error } = await supabase.from("study_rooms").delete().eq("id", roomId).select("id");
  if (error) {
    logDbError("deleteRoom", error);
    throw error;
  }
  // A delete that matches zero rows succeeds silently — surface it loudly,
  // because that means RLS filtered the row out.
  if (!data || data.length === 0) {
    const zero = new Error(
      "DELETE matched 0 rows — RLS is filtering this room away from your session.",
    );
    console.error("[Room] deleteRoom matched nothing:", zero.message);
    throw zero;
  }
}

function logDbError(
  where: string,
  error: { code?: string; message: string; details?: string | null; hint?: string | null },
) {
  console.error(`[Room] ${where} failed:`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

export async function leaveRoom(roomId: string) {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("room_members")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", userId);
  if (error) throw error;
}

/**
 * Shared-timer room state: one row in `study_rooms` drives every client,
 * presence drives the live member list, wall-clock math keeps the countdown
 * accurate even in throttled background tabs.
 */
export function useRoom(roomId: string) {
  const [myId, setMyId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinedOk, setJoinedOk] = useState<boolean | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [finishedTick, setFinishedTick] = useState(0);
  const completedEndRef = useRef<string | null>(null);

  useEffect(() => {
    void requireUserId()
      .then(setMyId)
      .catch(() => setMyId(null));
  }, []);

  // Load the room, register membership, open the realtime channel.
  useEffect(() => {
    if (!myId) return;
    setLoading(true);
    setError(null);

    let cancelled = false;
    let isMember = false;

    const bootstrap = async (): Promise<(() => void) | undefined> => {
      try {
        const { data, error: fetchError } = await supabase
          .from("study_rooms")
          .select(ROOM_COLUMNS)
          .eq("id", roomId)
          .maybeSingle();
        if (cancelled) return;
        if (fetchError) throw fetchError;
        if (!data) {
          setError("This room does not exist anymore.");
          return;
        }
        setRoom(data);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("name,avatar,role")
          .eq("id", myId)
          .single();

        setIsAdmin(profileData?.role === "admin");

        const selfPayload = {
          user_id: myId,
          name: profileData?.name ?? "",
          avatar: profileData?.avatar ?? "",
          joined_at: Date.now(),
        };

        // Existing members re-enter without the password; open rooms join
        // silently; protected rooms wait at the gate until verified.
        const { data: membership } = await supabase
          .from("room_members")
          .select("user_id")
          .eq("room_id", roomId)
          .eq("user_id", myId)
          .maybeSingle();

        if (membership) {
          if (!cancelled) setJoinedOk(true);
          isMember = true;
        } else if (!data.has_password || profileData?.role === "admin") {
          await ensureJoined(roomId)
            .then(() => {
              if (!cancelled) setJoinedOk(true);
              isMember = true;
            })
            .catch(() => {
              if (!cancelled) setJoinedOk(false);
            });
        } else if (!cancelled) {
          setJoinedOk(false);
        }

        const { data: initialMessages } = await supabase
          .from("room_messages")
          .select("id, room_id, user_id, user_name, user_avatar, content, created_at")
          .eq("room_id", roomId)
          .order("created_at", { ascending: false })
          .limit(MAX_ROOM_MESSAGES);
        if (initialMessages && !cancelled) setMessages([...initialMessages].reverse());

        const channel = supabase
          .channel(`room:${roomId}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "study_rooms", filter: `id=eq.${roomId}` },
            (payload) => {
              const next = (payload.new ?? null) as RoomRow | null;
              if (next) setRoom(next);
            },
          )
          .on("presence", { event: "sync" }, () => {
            const state = channel.presenceState<RoomMember>();
            const list = Object.values(state)
              .flat()
              .sort((a, b) => a.joined_at - b.joined_at);
            setMembers(list);
          })
          .subscribe((status) => {
            if (status !== "SUBSCRIBED") return;
            // Only confirmed members appear in the live list — spectators
            // waiting at the password gate stay invisible.
            if (!isMember && !cancelled) return;
            void channel.track(selfPayload);
          });

        const chatChannel = supabase
          .channel(`room-chat:${roomId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "room_messages",
              filter: `room_id=eq.${roomId}`,
            },
            (payload) => {
              const msg = payload.new as RoomMessage;
              setMessages((prev) => {
                const from = prev.length >= MAX_ROOM_MESSAGES ? prev.length - MAX_ROOM_MESSAGES + 1 : 0;
                return [...prev.slice(from), msg];
              });
            },
          )
          .subscribe();

        return () => {
          void supabase.removeChannel(channel);
          void supabase.removeChannel(chatChannel);
        };
      } catch (err) {
        console.error("[Room] Failed to open room:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not open this room.");
        }
        return undefined;
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void bootstrap().then((cleanup) => {
      if (cancelled) cleanup?.();
    });

    return () => {
      cancelled = true;
    };
  }, [roomId, myId]);

  /** Called by the room page's password gate once the user submits a pass.
   *  Reload afterwards so bootstrap re-runs as a confirmed member. */
  const submitRoomPassword = useCallback(
    async (password: string) => {
      await joinRoomWithPassword(roomId, password);
      setJoinedOk(true);
      window.location.reload();
    },
    [roomId],
  );

  // Refresh `now` while counting down; wall clock does the real math.
  const running = room?.status === "running";
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) setNow(Date.now());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const left =
    room && running && room.ends_at
      ? Math.max(0, Math.ceil((new Date(room.ends_at).getTime() - now) / 1000))
      : (room?.remaining_sec ?? 0);
  const total = (room?.duration_min ?? 25) * 60;

  const amHost = !!room && !!myId && room.host_id === myId;
  const hostOnline = !!room && members.some((m) => m.user_id === room.host_id);
  const earliest = members[0];
  const iAmEarliest = !!earliest && !!myId && earliest.user_id === myId;
  // Host steers the timer; admins may always steer; if the host disappears,
  // the longest-standing member may take over. The database policy
  // enforces the same rules server-side.
  const canControl = amHost || isAdmin || (!!room && !hostOnline && iAmEarliest);

  const patch = useCallback(
    async (p: Partial<RoomRow>) => {
      const { data, error: updateError } = await supabase
        .from("study_rooms")
        .update(p)
        .eq("id", roomId)
        .select(ROOM_COLUMNS)
        .single();
      if (updateError) {
        logDbError(`update ${JSON.stringify(p)}`, updateError);
        throw updateError;
      }
      setRoom(data);
    },
    [roomId],
  );

  const armTimer = useCallback(async () => {
    if (!room) return;
    const secs = room.remaining_sec > 0 ? room.remaining_sec : room.duration_min * 60;
    await patch({
      status: "running",
      ends_at: new Date(Date.now() + secs * 1000).toISOString(),
    });
  }, [room, patch]);

  const start = armTimer;
  const resume = armTimer;

  const pause = useCallback(async () => {
    if (!room) return;
    const remaining = Math.max(0, Math.ceil(left));
    await patch({ status: "paused", remaining_sec: remaining, ends_at: null });
  }, [room, left, patch]);

  const end = useCallback(async () => {
    if (!room) return;
    await patch({ status: "idle", remaining_sec: room.duration_min * 60, ends_at: null });
  }, [room, patch]);

  const setDuration = useCallback(
    async (min: number) => {
      if (!room) return;
      await patch({ duration_min: min, remaining_sec: min * 60, ends_at: null, status: "idle" });
    },
    [room, patch],
  );

  // Natural completion fires exactly once per armed session, on every client.
  useEffect(() => {
    if (!room || room.status !== "running" || !room.ends_at) return;
    if (left > 0) return;
    if (completedEndRef.current === room.ends_at) return;
    completedEndRef.current = room.ends_at;
    setFinishedTick((v) => v + 1);
    if (canControl) {
      void patch({ status: "idle", remaining_sec: room.duration_min * 60, ends_at: null }).catch(
        () => undefined,
      );
    }
  }, [room, left, canControl, patch]);

  const claimHost = useCallback(async () => {
    if (!myId) return;
    await patch({ host_id: myId });
  }, [myId, patch]);

  const sendMessage = useCallback(
    async (content: string) => {
      await sendRoomMessage(roomId, content);
    },
    [roomId],
  );

  return useMemo(
    () => ({
      myId,
      room,
      members,
      messages,
      loading,
      error,
      running,
      left,
      total,
      amHost,
      isAdmin,
      canControl,
      finishedTick,
      joinedOk,
      submitRoomPassword,
      start,
      pause,
      resume,
      end,
      setDuration,
      claimHost,
      sendMessage,
    }),
    [
      myId,
      room,
      members,
      messages,
      loading,
      error,
      running,
      left,
      total,
      amHost,
      isAdmin,
      canControl,
      finishedTick,
      joinedOk,
      submitRoomPassword,
      start,
      pause,
      resume,
      end,
      setDuration,
      claimHost,
      sendMessage,
    ],
  );
}
