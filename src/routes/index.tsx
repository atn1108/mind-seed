import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Mail, Sparkles } from "lucide-react";

import { LogoWordmark } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  const [language, setLanguage] = useState<"en" | "vi">("en");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const copy = {
    en: {
      headline: ["Grow your", "focus", "every day."],
      subheading: "Build a calmer study rhythm instead of forcing distance from your phone.",
      google: "Continue with Google",
      email: "Continue with Email",
      signup: "Need an account? Sign up",
      accountName: "Your name",
      emailInput: "Email",
      password: "Password",
      createAccount: "Create account",
      login: "Log in",
      back: "Back",
      processing: "Processing...",
      footer: "Your data is stored safely with MindSeed.",
    },
    vi: {
      headline: ["Xây dựng", "mức độ tập trung", "mỗi ngày."],
      subheading: "Tạo nhịp học bình yên thay vì cố gắng tách mình khỏi điện thoại.",
      google: "Tiếp tục với Google",
      email: "Tiếp tục bằng Email",
      signup: "Cần tài khoản? Đăng ký",
      accountName: "Tên của bạn",
      emailInput: "Email",
      password: "Mật khẩu",
      createAccount: "Tạo tài khoản",
      login: "Đăng nhập",
      back: "Quay lại",
      processing: "Đang xử lý...",
      footer: "Dữ liệu của bạn được lưu trữ an toàn với MindSeed.",
    },
  };

  const strings = copy[language];

  useEffect(() => {
    if (ready && state.user) navigate({ to: "/dashboard" });
  }, [ready, state.user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const message = await login(
      name.trim() || (language === "vi" ? "Học viên" : "Learner"),
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
    <div className="bg-leaf relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-8 sm:py-12">
      <div className="pointer-events-none absolute -left-32 top-1/4 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 size-96 rounded-full bg-accent/10 blur-3xl" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[430px]"
      >
        <div className="surface p-6 sm:p-9">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center justify-center">
              <LogoWordmark size={52} />
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background px-2 py-1">
              <span className={language === "en" ? "text-[11px] font-semibold text-foreground" : "text-[11px] font-medium text-muted-foreground"}>EN</span>
              <Switch
                aria-label="Switch language"
                checked={language === "vi"}
                onCheckedChange={(checked) => setLanguage(checked ? "vi" : "en")}
              />
              <span className={language === "vi" ? "text-[11px] font-semibold text-foreground" : "text-[11px] font-medium text-muted-foreground"}>VI</span>
            </div>
          </div>

          <h1 className="mt-7 text-center font-display text-2xl font-semibold tracking-tight">
            {strings.headline[0]}
            <span className="text-gradient-leaf"> {strings.headline[1]} </span>
            {strings.headline[2]}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-muted-foreground">{strings.subheading}</p>

          {error && mode === "idle" && (
            <p role="alert" className="mt-7 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
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
                {strings.google}
              </Button>
              <Button
                className="h-12 w-full rounded-2xl text-[15px]"
                onClick={() => setMode("email")}
              >
                <Mail className="size-4" />
                {strings.email}
              </Button>
              <button
                onClick={() => setMode("register")}
                className="w-full pt-1 text-center text-sm font-medium text-primary hover:underline"
              >
                {strings.signup}
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-7 space-y-3">
              {mode === "register" && (
                <Input
                  placeholder={strings.accountName}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-2xl"
                />
              )}
              <Input
                type="email"
                placeholder={strings.emailInput}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-2xl"
              />
              <Input
                type="password"
                placeholder={strings.password}
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
                {submitting ? strings.processing : mode === "register" ? strings.createAccount : strings.login}
              </Button>
              <button
                type="button"
                onClick={() => setMode("idle")}
                className="w-full pt-1 text-center text-sm text-muted-foreground hover:text-foreground"
              >
                {strings.back}
              </button>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">{strings.footer}</p>
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
