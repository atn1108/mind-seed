import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, Square } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Confetti, ReflectionDialog } from "@/components/ReflectionDialog";
import { TreeVisual } from "@/components/TreeVisual";
import { Button } from "@/components/ui/button";
import { useMindSeed } from "@/lib/mindseed-store";

const OPTIONS = [25, 30, 45, 60];

export const Route = createFileRoute("/timer")({
  head: () => ({
    meta: [
      { title: "Focus Timer — MindSeed" },
      { name: "description", content: "Pomodoro 25/30/45/60 phút với vòng tiến trình và cây lớn lên sau mỗi phiên." },
      { property: "og:title", content: "Focus Timer — MindSeed" },
      { property: "og:description", content: "Một phiên tập trung, một chút trưởng thành cho khu vườn của bạn." },
    ],
  }),
  component: TimerPage,
});

function TimerPage() {
  const { state, addSession } = useMindSeed();
  const [minutes, setMinutes] = useState(25);
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [reflect, setReflect] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (left === 0 && running && !doneRef.current) {
      doneRef.current = true;
      setRunning(false);
      addSession(minutes, true);
      setConfetti(true);
      toast.success("Hoàn thành phiên học! Cây của bạn vừa lớn thêm 🌿");
      setTimeout(() => setConfetti(false), 3000);
      setTimeout(() => setReflect(true), 900);
    }
  }, [left, running, minutes, addSession]);

  const select = (m: number) => {
    setMinutes(m);
    setLeft(m * 60);
    setRunning(false);
    doneRef.current = false;
  };

  const stop = () => {
    if (left < minutes * 60) addSession(minutes, false);
    setRunning(false);
    setLeft(minutes * 60);
    doneRef.current = false;
    toast("Đã dừng phiên học. Không sao cả, hãy thử lại nhé.");
  };

  const total = minutes * 60;
  const progress = ((total - left) / total) * 100;
  const size = 300;
  const r = size / 2 - 16;
  const c = 2 * Math.PI * r;

  return (
    <AppShell>
      <Confetti show={confetti} />
      <ReflectionDialog open={reflect} onOpenChange={setReflect} />

      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Focus Timer</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Chọn độ dài phiên học và để mọi thứ khác lắng xuống.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="surface flex flex-col items-center p-6 sm:p-9">
          <div className="flex flex-wrap justify-center gap-2">
            {OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => select(m)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  m === minutes
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-primary-soft hover:text-primary"
                }`}
              >
                {m} phút
              </button>
            ))}
          </div>

          <div className="relative mt-8 grid place-items-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="14" className="stroke-muted" fill="none" />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                strokeWidth="14"
                strokeLinecap="round"
                className="stroke-primary"
                fill="none"
                strokeDasharray={c}
                animate={{ strokeDashoffset: c - (c * progress) / 100 }}
                transition={{ duration: 0.6, ease: "linear" }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <span className="font-display text-6xl font-semibold tabular-nums tracking-tight">
                {String(Math.floor(left / 60)).padStart(2, "0")}:
                {String(left % 60).padStart(2, "0")}
              </span>
              <span className="mt-1 text-sm text-muted-foreground">
                {running ? "Đang tập trung…" : "Sẵn sàng"}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              className="h-12 rounded-2xl px-8 text-[15px]"
              onClick={() => {
                doneRef.current = false;
                setRunning((v) => !v);
              }}
            >
              {running ? <Pause className="size-4" /> : <Play className="size-4 fill-current" />}
              {running ? "Tạm dừng" : left < total ? "Tiếp tục" : "Bắt đầu"}
            </Button>
            <Button variant="outline" className="h-12 rounded-2xl px-6" onClick={stop}>
              <Square className="size-4" />
              Kết thúc
            </Button>
          </div>
        </div>

        <div className="surface flex flex-col items-center justify-center gap-4 p-7">
          <TreeVisual exp={state.exp} size={180} />
          <p className="text-center text-sm text-muted-foreground">
            Cây sẽ lớn lên khi bạn hoàn thành phiên học. Rời đi giữa chừng, cây chỉ nhận một chút EXP.
          </p>
          <div className="mt-2 grid w-full grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl bg-primary-soft p-4">
              <p className="font-display text-2xl font-semibold">{state.forest.length}</p>
              <p className="text-xs text-muted-foreground">Cây đã trồng</p>
            </div>
            <div className="rounded-2xl bg-accent/25 p-4">
              <p className="font-display text-2xl font-semibold">{state.exp}</p>
              <p className="text-xs text-muted-foreground">EXP hiện tại</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
