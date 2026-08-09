import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Mail, Sparkles } from "lucide-react";

import { LogoWordmark } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMindSeed } from "@/lib/mindseed-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MindSeed — Grow Your Focus" },
      {
        name: "description",
        content:
          "MindSeed helps learners build focus, reduce scattered attention, and create sustainable study rhythms.",
      },
      { property: "og:title", content: "MindSeed — Grow Your Focus" },
      {
        property: "og:description",
        content: "MindSeed helps learners build focus, reduce scattered attention, and create sustainable study rhythms.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { state, ready, login, loginGoogle } = useMindSeed();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"idle" | "email" | "register">("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && state.user) navigate({ to: "/dashboard" });
  }, [ready, state.user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const message = await login(
      name.trim() || "Learner",
      email.trim(),
      password,
      mode === "register",
    );
    setSubmitting(false);

    if (message) {
      setError(message);
      return;
    }

    navigate({ to: "/dashboard" });
  };

  return (
    <div className="bg-leaf grid min-h-screen place-items-center bg-background px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="surface p-7 sm:p-9">
          <div className="flex justify-center">
            <LogoWordmark size={52} />
          </div>

          <h1 className="mt-7 text-center font-display text-2xl font-semibold tracking-tight">
            Grow your
            <span className="text-gradient-leaf"> focus </span>
            every day.
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Build a calmer study rhythm instead of forcing distance from your phone.
          </p>

          {error && mode === "idle" && (
            <p className="mt-7 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
          )}

          {mode === "idle" ? (
            <div className="mt-7 space-y-3">
              <Button
                variant="outline"
                className="h-12 w-full rounded-2xl text-[15px]"
                onClick={async () => {
                  setError(null);
                  setSubmitting(true);
                  const message = await loginGoogle();
                  setSubmitting(false);
                  if (message) setError(message);
                }}
              >
                <GoogleMark />
                Continue with Google
              </Button>
              <Button
                className="h-12 w-full rounded-2xl text-[15px]"
                onClick={() => setMode("email")}
              >
                <Mail className="size-4" />
                Continue with Email
              </Button>
              <button
                onClick={() => setMode("register")}
                className="w-full pt-1 text-center text-sm font-medium text-primary hover:underline"
              >
                Need an account? Sign up
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-7 space-y-3">
              {mode === "register" && (
                <Input
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-2xl"
                />
              )}
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-2xl"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                className="h-12 rounded-2xl"
              />
              {error && (
                <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" disabled={submitting} className="h-12 w-full rounded-2xl text-[15px]">
                <Sparkles className="size-4" />
                {submitting ? "Processing..." : mode === "register" ? "Create account" : "Log in"}
              </Button>
              <button
                type="button"
                onClick={() => setMode("idle")}
                className="w-full pt-1 text-center text-sm text-muted-foreground hover:text-foreground"
              >
                Back
              </button>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Your data is stored safely with MindSeed.
        </p>
      </motion.div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1a6.2 6.2 0 1 1 0-12.4c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3 14.7 2 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4 9.6-9.7 0-.7-.1-1.2-.2-1.7H12Z"
      />
    </svg>
  );
}
