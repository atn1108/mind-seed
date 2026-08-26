import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";

/* ---------------------------------- types --------------------------------- */

export type Priority = "low" | "medium" | "high";

export type Session = {
  id: string;
  startedAt: string;
  minutes: number;
  completed: boolean;
};

export type Task = {
  id: string;
  title: string;
  deadline?: string;
  priority: Priority;
  done: boolean;
  createdAt: string;
};

export type Reflection = {
  id: string;
  at: string;
  rating: number;
  reasons: string[];
};

export type TreeRecord = {
  id: string;
  species: string;
  plantedAt: string;
  minutes: number;
};

export type MindSeedState = {
  user: {
    name: string;
    email: string;
    avatar: string;
    monthlyGoalHours: number;
    role: "user" | "admin";
  } | null;
  sessions: Session[];
  tasks: Task[];
  reflections: Reflection[];
  forest: TreeRecord[];
  exp: number;
};

/* --------------------------------- species -------------------------------- */

export const SPECIES = [
  { name: "Sprout", emoji: "🌱", unlockAt: 0 },
  { name: "Banyan", emoji: "🌳", unlockAt: 1 },
  { name: "Blossom", emoji: "🌸", unlockAt: 3 },
  { name: "Sea Palm", emoji: "🌴", unlockAt: 6 },
  { name: "Evergreen", emoji: "🌲", unlockAt: 10 },
  { name: "Maple", emoji: "🍁", unlockAt: 15 },
] as const;

export const STAGES = [
  { name: "Seed", emoji: "🌰", need: 0 },
  { name: "Sprout", emoji: "🌱", need: 40 },
  { name: "Young Tree", emoji: "🌿", need: 90 },
  { name: "Mature Tree", emoji: "🌳", need: 150 },
] as const;

export const DISTRACTIONS = ["TikTok", "Facebook", "Messenger", "Game", "Sleepy", "Noise", "Other"];

export const QUOTES = [
  "Every focused minute today becomes tomorrow’s success.",
  "Focus is a seed; consistency is the sunlight.",
  "You do not need to be perfect — you only need to begin.",
  "A great forest starts with one small seed.",
  "Slow and deep is better than fast and empty.",
  "Your phone can wait. Your dreams cannot.",
];

/* --------------------------------- utils --------------------------------- */

export const dayKey = (d: Date | string) => new Date(d).toISOString().slice(0, 10);

function mapProfile(row: {
  name: string;
  email: string | null;
  avatar: string | null;
  monthly_goal_hours: number;
  exp: number;
  role?: string | null;
}) {
  return {
    name: row.name,
    email: row.email ?? "",
    avatar: row.avatar || row.name.trim().charAt(0).toUpperCase() || "M",
    monthlyGoalHours: row.monthly_goal_hours,
    exp: row.exp,
    role: (row.role === "admin" ? "admin" : "user") as "user" | "admin",
  };
}

function mapSession(row: {
  id: string;
  started_at: string;
  minutes: number;
  completed: boolean;
}): Session {
  return {
    id: row.id,
    startedAt: row.started_at,
    minutes: row.minutes,
    completed: row.completed,
  };
}

function mapTask(row: {
  id: string;
  title: string;
  deadline: string | null;
  priority: Priority;
  done: boolean;
  created_at: string;
}): Task {
  return {
    id: row.id,
    title: row.title,
    ...(row.deadline ? { deadline: row.deadline } : {}),
    priority: row.priority,
    done: row.done,
    createdAt: row.created_at,
  };
}

function mapReflection(row: {
  id: string;
  rating: number;
  reasons: string[];
  created_at: string;
}): Reflection {
  return {
    id: row.id,
    at: row.created_at,
    rating: row.rating,
    reasons: row.reasons ?? [],
  };
}

function mapTree(row: {
  id: string;
  species: string;
  planted_at: string;
  minutes: number;
}): TreeRecord {
  return {
    id: row.id,
    species: row.species,
    plantedAt: row.planted_at,
    minutes: row.minutes,
  };
}

/* ------------------------------- derivations ------------------------------ */

export function focusScore(state: MindSeedState, day = dayKey(new Date())) {
  const todays = state.sessions.filter((s) => dayKey(s.startedAt) === day);
  const done = todays.filter((s) => s.completed);
  const minutes = done.reduce((a, s) => a + s.minutes, 0);
  const tasksDone = state.tasks.filter((t) => t.done).length;
  const dropRate = todays.length ? (todays.length - done.length) / todays.length : 1;

  const timeScore = Math.min(minutes / 120, 1) * 40;
  const sessionScore = Math.min(done.length / 4, 1) * 20;
  const taskScore = Math.min(tasksDone / 3, 1) * 15;
  const dropScore = (1 - dropRate) * 15;
  const streakScore = Math.min(streakOf(state) / 7, 1) * 10;
  return Math.round(timeScore + sessionScore + taskScore + dropScore + streakScore);
}

export function scoreLabel(score: number) {
  if (score >= 85) return { label: "Excellent", note: "You are in a truly excellent focus state." };
  if (score >= 65)
    return { label: "Good", note: "Your learning rhythm is strong — keep it going." };
  if (score >= 40)
    return { label: "Average", note: "You are doing okay, but there is still room to improve." };
  return { label: "Need Improvement", note: "Start with a gentle 25-minute session." };
}

export function streakOf(state: MindSeedState) {
  const days = new Set(state.sessions.filter((s) => s.completed).map((s) => dayKey(s.startedAt)));
  let streak = 0;
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function stageOf(exp: number) {
  let idx = 0;
  STAGES.forEach((s, i) => {
    if (exp >= s.need) idx = i;
  });
  const next = STAGES[idx + 1];
  const progress = next ? Math.min(100, Math.round((exp / next.need) * 100)) : 100;
  return { index: idx, stage: STAGES[idx]!, next, progress };
}

export function minutesOn(state: MindSeedState, day: string) {
  return state.sessions
    .filter((s) => s.completed && dayKey(s.startedAt) === day)
    .reduce((a, s) => a + s.minutes, 0);
}

/* --------------------------------- context -------------------------------- */

export type AuthOutcome = { tone: "error" | "info"; message?: string };

type Ctx = {
  state: MindSeedState;
  ready: boolean;
  login: (
    name: string,
    email: string,
    password: string,
    register?: boolean,
  ) => Promise<AuthOutcome | null>;
  loginGoogle: () => Promise<AuthOutcome | null>;
  logout: () => Promise<void>;
  addSession: (minutes: number, completed: boolean) => Promise<void>;
  addTask: (t: Omit<Task, "id" | "createdAt" | "done">) => Promise<void>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  addReflection: (rating: number, reasons: string[]) => Promise<void>;
  setGoal: (hours: number) => Promise<void>;
  updateAvatar: (file: File) => Promise<void>;
  updateName: (name: string) => Promise<void>;
};

const EMPTY_STATE: MindSeedState = {
  user: null,
  sessions: [],
  tasks: [],
  reflections: [],
  forest: [],
  exp: 0,
};

const MindSeedContext = createContext<Ctx | null>(null);

export function MindSeedProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MindSeedState>(EMPTY_STATE);
  const [ready, setReady] = useState(false);

  const loadUserData = useCallback(async (userId: string) => {
    const [profileResult, sessionsResult, tasksResult, reflectionsResult, treesResult] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("name,email,avatar,monthly_goal_hours,exp,role")
          .eq("id", userId)
          .single(),
        supabase
          .from("focus_sessions")
          .select("id,started_at,minutes,completed")
          .eq("user_id", userId)
          .order("started_at", { ascending: true }),
        supabase
          .from("tasks")
          .select("id,title,deadline,priority,done,created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("reflections")
          .select("id,rating,reasons,created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("garden_trees")
          .select("id,species,planted_at,minutes")
          .eq("user_id", userId)
          .order("planted_at", { ascending: true }),
      ]);

    const firstError = [
      profileResult.error,
      sessionsResult.error,
      tasksResult.error,
      reflectionsResult.error,
      treesResult.error,
    ].find(Boolean);

    if (firstError) throw firstError;
    if (!profileResult.data) throw new Error("MindSeed profile for this account was not found.");

    const profile = mapProfile(profileResult.data);

    setState({
      user: {
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
        monthlyGoalHours: profile.monthlyGoalHours,
        role: profile.role,
      },
      sessions: (sessionsResult.data ?? []).map(mapSession),
      tasks: (tasksResult.data ?? []).map(mapTask),
      reflections: (reflectionsResult.data ?? []).map(mapReflection),
      forest: (treesResult.data ?? []).map(mapTree),
      exp: profile.exp,
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (data.session?.user) {
          await loadUserData(data.session.user.id);
        } else if (mounted) {
          setState(EMPTY_STATE);
        }
      } catch (error) {
        console.error("[MindSeed] Failed to load session/data:", error);
        if (mounted) setState(EMPTY_STATE);
      } finally {
        if (mounted) setReady(true);
      }
    };

    void bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setState(EMPTY_STATE);
        return;
      }

      if (session?.user) {
        // Avoid doing Supabase queries directly inside the auth callback.
        setTimeout(() => {
          void loadUserData(session.user.id).catch((error) => {
            console.error("[MindSeed] Failed to refresh user data:", error);
          });
        }, 0);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadUserData]);

  const login = useCallback(
    async (name: string, email: string, password: string, register = false) => {
      try {
        if (register) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: name,
                name,
              },
            },
          });

          if (error) throw error;

          if (!data.session) {
            return { tone: "info" as const };
          }
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.user) {
          await loadUserData(sessionData.session.user.id);
        }
        return null;
      } catch (error) {
        console.error("[MindSeed] Login error:", error);
        return {
          tone: "error" as const,
          message: error instanceof Error ? error.message : "Sign in failed.",
        };
      }
    },
    [loadUserData],
  );

  const loginGoogle = useCallback(async () => {
    try {
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/dashboard` : null;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        ...(redirectTo ? { options: { redirectTo } } : {}),
      });
      if (error) throw error;
      return null;
    } catch (error) {
      console.error("[MindSeed] Google login error:", error);
      return {
        tone: "error" as const,
        message: error instanceof Error ? error.message : "Google sign-in failed.",
      };
    }
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setState(EMPTY_STATE);
  }, []);

  const addSession = useCallback(
    async (minutes: number, completed: boolean) => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) throw new Error("You are not signed in.");

      const { data: inserted, error } = await supabase
        .from("focus_sessions")
        .insert({
          user_id: userId,
          started_at: new Date().toISOString(),
          minutes,
          completed,
        })
        .select("id,started_at,minutes,completed")
        .single();

      if (error) throw error;

      const gained = completed ? minutes : Math.round(minutes * 0.2);
      let exp = state.exp + gained;
      const forest = [...state.forest];
      const newTrees: TreeRecord[] = [];

      while (exp >= STAGES[STAGES.length - 1]!.need) {
        exp -= STAGES[STAGES.length - 1]!.need;
        const speciesIdx = Math.min(
          SPECIES.length - 1,
          SPECIES.filter((sp) => forest.length >= sp.unlockAt).length - 1,
        );
        const tree: TreeRecord = {
          id: crypto.randomUUID(),
          species: SPECIES[Math.max(0, speciesIdx)]!.name,
          plantedAt: new Date().toISOString(),
          minutes,
        };
        forest.push(tree);
        newTrees.push(tree);
      }

      const profileUpdate = await supabase.from("profiles").update({ exp }).eq("id", userId);

      if (profileUpdate.error) throw profileUpdate.error;

      if (newTrees.length > 0) {
        const { error: treeError } = await supabase.from("garden_trees").insert(
          newTrees.map((tree) => ({
            id: tree.id,
            user_id: userId,
            species: tree.species,
            planted_at: tree.plantedAt,
            minutes: tree.minutes,
          })),
        );
        if (treeError) throw treeError;
      }

      setState((s) => ({
        ...s,
        exp,
        forest,
        sessions: [...s.sessions, mapSession(inserted)],
      }));
    },
    [state.exp, state.forest],
  );

  const addTask = useCallback(async (t: Omit<Task, "id" | "createdAt" | "done">) => {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) throw new Error("You are not signed in.");

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        title: t.title,
        deadline: t.deadline ?? null,
        priority: t.priority,
        done: false,
      })
      .select("id,title,deadline,priority,done,created_at")
      .single();

    if (error) throw error;
    setState((s) => ({ ...s, tasks: [mapTask(data), ...s.tasks] }));
  }, []);

  const updateTask = useCallback(
    async (id: string, patch: Partial<Task>) => {
      const current = state.tasks.find((task) => task.id === id);
      if (!current) return;

      const dbPatch: {
        title?: string;
        deadline?: string | null;
        priority?: Priority;
        done?: boolean;
      } = {};

      if (patch.title !== undefined) dbPatch.title = patch.title;
      if (patch.deadline !== undefined) dbPatch.deadline = patch.deadline || null;
      if (patch.priority !== undefined) dbPatch.priority = patch.priority;
      if (patch.done !== undefined) dbPatch.done = patch.done;

      const { data, error } = await supabase
        .from("tasks")
        .update(dbPatch)
        .eq("id", id)
        .select("id,title,deadline,priority,done,created_at")
        .single();

      if (error) throw error;

      // Keep the original prototype's +12 EXP behavior, but only when a task
      // actually changes from incomplete -> complete.
      if (patch.done === true && !current.done) {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData.user?.id;
        if (!userId) throw new Error("You are not signed in.");

        const nextExp = state.exp + 12;
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ exp: nextExp })
          .eq("id", userId);
        if (profileError) throw profileError;

        setState((s) => ({
          ...s,
          exp: nextExp,
          tasks: s.tasks.map((task) => (task.id === id ? mapTask(data) : task)),
        }));
        return;
      }

      setState((s) => ({
        ...s,
        tasks: s.tasks.map((task) => (task.id === id ? mapTask(data) : task)),
      }));
    },
    [state.exp, state.tasks],
  );

  const removeTask = useCallback(async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) throw error;
    setState((s) => ({ ...s, tasks: s.tasks.filter((task) => task.id !== id) }));
  }, []);

  const addReflection = useCallback(async (rating: number, reasons: string[]) => {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) throw new Error("You are not signed in.");

    const { data, error } = await supabase
      .from("reflections")
      .insert({ user_id: userId, rating, reasons })
      .select("id,rating,reasons,created_at")
      .single();

    if (error) throw error;
    setState((s) => ({ ...s, reflections: [mapReflection(data), ...s.reflections] }));
  }, []);

  const setGoal = useCallback(async (hours: number) => {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) throw new Error("You are not signed in.");

    const { data, error } = await supabase
      .from("profiles")
      .update({ monthly_goal_hours: hours })
      .eq("id", userId)
      .select("monthly_goal_hours")
      .single();

    if (error) throw error;
    setState((s) =>
      s.user ? { ...s, user: { ...s.user, monthlyGoalHours: data.monthly_goal_hours } } : s,
    );
  }, []);

  const updateAvatar = useCallback(async (file: File) => {
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    const MAX_SIZE = 3 * 1024 * 1024; // 3MB

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error("INVALID_TYPE");
    }
    if (file.size > MAX_SIZE) {
      throw new Error("FILE_TOO_LARGE");
    }

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) throw new Error("You are not signed in.");

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const { error } = await supabase
      .from("profiles")
      .update({ avatar: dataUrl })
      .eq("id", userId);

    if (error) throw error;

    setState((s) =>
      s.user ? { ...s, user: { ...s.user, avatar: dataUrl } } : s,
    );
  }, []);

  const updateName = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 50) throw new Error("INVALID_NAME");

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) throw new Error("You are not signed in.");

    const { error } = await supabase
      .from("profiles")
      .update({ name: trimmed })
      .eq("id", userId);

    if (error) throw error;

    setState((s) =>
      s.user ? { ...s, user: { ...s.user, name: trimmed } } : s,
    );
  }, []);

  const value = useMemo(
    () => ({
      state,
      ready,
      login,
      loginGoogle,
      logout,
      addSession,
      addTask,
      updateTask,
      removeTask,
      addReflection,
      setGoal,
      updateAvatar,
      updateName,
    }),
    [
      state,
      ready,
      login,
      loginGoogle,
      logout,
      addSession,
      addTask,
      updateTask,
      removeTask,
      addReflection,
      setGoal,
      updateAvatar,
      updateName,
    ],
  );

  return <MindSeedContext.Provider value={value}>{children}</MindSeedContext.Provider>;
}

export function useMindSeed() {
  const ctx = useContext(MindSeedContext);
  if (!ctx) throw new Error("useMindSeed must be used inside MindSeedProvider");
  return ctx;
}
