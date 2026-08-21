import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, Eye, EyeOff, ListChecks, Loader2, Mail, Sprout, Timer } from "lucide-react";

import { LogoWordmark } from "@/components/Logo";
import { LangToggle } from "@/components/LangToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMindSeed } from "@/lib/mindseed-store";
<<<<<<< HEAD
import { useLanguage } from "@/lib/language";
=======
import { useUiLanguage } from "@/lib/ui-language";
>>>>>>> 0285da5 (redesign login page, add en/vi switcher, switch font to plus jakarta sans)

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
        content:
          "MindSeed helps learners build focus, reduce scattered attention, and create sustainable study rhythms.",
      },
    ],
  }),
  component: LoginPage,
});
type Mode = "idle" | "email" | "register";

const copy = {
  en: {
    tagline: "Grow Your Focus.",
    eyebrow: "WELCOME TO MINDSEED",
    headlineLead: "Grow your",
    headlineAccent: "focus",
    headlineTail: "every day.",
    subheading:
      "Plant a seed of concentration each session, and watch a calm study habit take root.",
    features: [
      { icon: Timer, text: "Focus timer that grows a tree for every session" },
      { icon: ListChecks, text: "Tasks with gentle deadlines, not guilt trips" },
      { icon: BarChart3, text: "Weekly insight into how your attention flows" },
    ],
    google: "Continue with Google",
    email: "Continue with Email",
    signup: "Need an account? Sign up",
    accountName: "Your name",
    namePlaceholder: "Learner",
    emailLabel: "Email",
    passwordLabel: "Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    createAccount: "Create account",
    login: "Log in",
    back: "Back",
    processing: "Processing...",
    errEmail: "Please enter a valid email address.",
    errPassword: "Password must be at least 6 characters.",
    infoTitle: "Check your inbox",
    infoBody: "We sent you a confirmation link. Confirm your email, then sign in.",
    footer: "Your data is stored safely with MindSeed.",
  },
  vi: {
    tagline: "Nuôi dưỡng sự tập trung.",
    eyebrow: "CHÀO MỪNG ĐẾN VỚI MINDSEED",
    headlineLead: "Nuôi dưỡng",
    headlineAccent: "sự tập trung",
    headlineTail: "mỗi ngày.",
    subheading:
      "Gieo một hạt giống tập trung mỗi phiên học và để thói quen học tập bình tĩnh đơm hoa.",
    features: [
      { icon: Timer, text: "Đồng hồ tập trung, mỗi phiên trồng thêm một cây" },
      { icon: ListChecks, text: "Nhiệm vụ với hạn chót nhẹ nhàng, không áp lực" },
      { icon: BarChart3, text: "Báo cáo tuần về dòng chảy sự chú ý của bạn" },
    ],
    google: "Tiếp tục với Google",
    email: "Tiếp tục bằng Email",
    signup: "Chưa có tài khoản? Đăng ký",
    accountName: "Tên của bạn",
    namePlaceholder: "Học viên",
    emailLabel: "Email",
    passwordLabel: "Mật khẩu",
    showPassword: "Hiện mật khẩu",
    hidePassword: "Ẩn mật khẩu",
    createAccount: "Tạo tài khoản",
    login: "Đăng nhập",
    back: "Quay lại",
    processing: "Đang xử lý...",
    errEmail: "Vui lòng nhập địa chỉ email hợp lệ.",
    errPassword: "Mật khẩu phải có ít nhất 6 ký tự.",
    infoTitle: "Hãy kiểm tra hộp thư",
    infoBody: "Chúng tôi đã gửi liên kết xác nhận. Xác nhận email rồi đăng nhập nhé.",
    footer: "Dữ liệu của bạn được lưu trữ an toàn với MindSeed.",
  },
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
  const { state, ready, login, loginGoogle } = useMindSeed();
  const navigate = useNavigate();
<<<<<<< HEAD
  const [mode, setMode] = useState<"idle" | "email" | "register">("idle");
  const { language } = useLanguage();
=======
  const { lang } = useUiLanguage();
  const [mode, setMode] = useState<Mode>("idle");
>>>>>>> 0285da5 (redesign login page, add en/vi switcher, switch font to plus jakarta sans)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ tone: "error" | "info"; message?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const t = copy[lang];

  useEffect(() => {
    if (ready && state.user) navigate({ to: "/dashboard" });
  }, [ready, state.user, navigate]);

  const validateEmail = (value: string) => {
    if (!EMAIL_RE.test(value.trim())) {
      setEmailError(t.errEmail);
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePassword = (value: string) => {
    if (value.length < 6) {
      setPasswordError(t.errPassword);
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    const emailOk = validateEmail(email);
    const passwordOk = validatePassword(password);
    if (!emailOk || !passwordOk) return;

    setSubmitting(true);
    const outcome = await login(
      name.trim() || t.namePlaceholder,
      email.trim(),
      password,
      mode === "register",
    );
    setSubmitting(false);

    if (outcome?.tone === "info") {
      setAlert({ tone: "info" });
      return;
    }
    if (outcome) {
      setAlert(outcome);
      return;
    }

    navigate({ to: "/dashboard" });
  };

  const handleGoogle = async () => {
    setAlert(null);
    setSubmitting(true);
    const outcome = await loginGoogle();
    setSubmitting(false);
    if (outcome) setAlert(outcome);
  };

  return (
<<<<<<< HEAD
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
          <div className="flex items-center justify-center">
            <LogoWordmark size={52} />
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
=======
    <main className="bg-leaf min-h-screen">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
        {/* Brand panel — desktop only */}
        <section className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex xl:p-14">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -top-16 -left-16 size-72 rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute right-4 bottom-24 size-80 rounded-full bg-accent/15 blur-3xl" />
            <div className="absolute top-1/3 right-10 size-40 rounded-full border border-primary/20" />
          </div>

          <LogoWordmark size={52} />

          <div className="relative max-w-md">
            <p className="text-xs font-semibold tracking-[0.16em] text-primary">{t.eyebrow}</p>
            <h1 className="mt-4 font-display text-4xl leading-tight font-semibold tracking-tight text-foreground xl:text-5xl">
              {t.headlineLead} <span className="text-gradient-leaf">{t.headlineAccent}</span>{" "}
              {t.headlineTail}
            </h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              {t.subheading}
            </p>
>>>>>>> 0285da5 (redesign login page, add en/vi switcher, switch font to plus jakarta sans)

            <ul className="mt-8 space-y-4">
              {t.features.map((f) => (
                <li key={f.text} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <f.icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <span className="text-sm leading-6 text-foreground">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative flex items-center gap-2 text-xs text-muted-foreground">
            <Sprout className="size-3.5 text-primary" aria-hidden="true" />
            {t.tagline}
          </p>
        </section>

        {/* Form panel */}
        <section className="flex items-center justify-center px-4 py-8 sm:px-6">
          <div className="surface w-full max-w-md p-7 sm:p-9">
            {/* Compact header — mobile only */}
            <header className="mb-8 flex items-center justify-between gap-4 lg:hidden">
              <LogoWordmark size={42} />
              <LangToggle />
            </header>
            <header className="mb-8 hidden items-center justify-end lg:flex">
              <LangToggle />
            </header>

            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {mode === "register" ? t.createAccount : mode === "email" ? t.login : t.tagline}
            </h2>

            {alert && (
              <div
                role={alert.tone === "error" ? "alert" : "status"}
                className={`mt-5 rounded-xl px-4 py-3 text-sm ${
                  alert.tone === "error"
                    ? "border border-destructive/20 bg-destructive/5 text-destructive"
                    : "border border-primary/20 bg-primary-soft text-foreground"
                }`}
              >
                {alert.tone === "info" ? (
                  <>
                    <p className="font-semibold">{t.infoTitle}</p>
                    <p className="mt-1">{t.infoBody}</p>
                  </>
                ) : (
                  alert.message
                )}
              </div>
            )}

            <div className="mt-7">
              {mode === "idle" ? (
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="h-12 w-full cursor-pointer justify-center rounded-2xl text-[15px]"
                    onClick={handleGoogle}
                    disabled={submitting}
                    aria-busy={submitting}
                  >
                    <GoogleMark />
                    <span>{t.google}</span>
                  </Button>

                  <Button
                    className="h-12 w-full cursor-pointer justify-center rounded-2xl text-[15px]"
                    onClick={() => setMode("email")}
                  >
                    <Mail className="size-4" />
                    <span>{t.email}</span>
                  </Button>

                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="w-full cursor-pointer pt-1 text-center text-sm font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    {t.signup}
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} noValidate className="mt-5 space-y-4">
                  {mode === "register" && (
                    <Field label={t.accountName} htmlFor="name">
                      <Input
                        id="name"
                        autoComplete="name"
                        placeholder={t.namePlaceholder}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-12 rounded-2xl"
                        autoFocus
                      />
                    </Field>
                  )}

                  <Field label={t.emailLabel} htmlFor="email" error={emailError}>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) validateEmail(e.target.value);
                      }}
                      onBlur={(e) => validateEmail(e.target.value)}
                      aria-invalid={!!emailError || undefined}
                      aria-describedby={emailError ? "email-error" : undefined}
                      className="h-12 rounded-2xl"
                      required
                      autoFocus
                    />
                  </Field>

                  <Field label={t.passwordLabel} htmlFor="password" error={passwordError}>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete={mode === "register" ? "new-password" : "current-password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (passwordError) validatePassword(e.target.value);
                        }}
                        onBlur={(e) => validatePassword(e.target.value)}
                        aria-invalid={!!passwordError || undefined}
                        aria-describedby={passwordError ? "password-error" : undefined}
                        className="h-12 rounded-2xl pr-11"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? t.hidePassword : t.showPassword}
                        aria-pressed={showPassword}
                        className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" aria-hidden="true" />
                        ) : (
                          <Eye className="size-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </Field>

                  <Button
                    type="submit"
                    disabled={submitting}
                    aria-busy={submitting}
                    className="h-12 w-full cursor-pointer justify-center rounded-2xl text-[15px]"
                  >
                    {submitting ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Sprout className="size-4" aria-hidden="true" />
                    )}
                    <span>
                      {submitting ? t.processing : mode === "register" ? t.createAccount : t.login}
                    </span>
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("idle");
                      setAlert(null);
                      setEmailError(null);
                      setPasswordError(null);
                    }}
                    className="w-full cursor-pointer pt-1 text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    ← {t.back}
                  </button>
                </form>
              )}
            </div>

            <footer className="mt-8 border-t border-border/60 pt-4 text-center text-xs text-muted-foreground">
              {t.footer}
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.56-5.17 3.56-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.08.72-2.46 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.96H1.27v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.28v-3.1H1.27a12 12 0 0 0 0 10.76l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.76c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.23 0 12 0A12 12 0 0 0 1.27 6.62l4.01 3.1C6.22 6.87 8.87 4.76 12 4.76Z"
      />
    </svg>
  );
}
