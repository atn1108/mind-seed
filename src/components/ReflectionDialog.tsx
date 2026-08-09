import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DISTRACTIONS, useMindSeed } from "@/lib/mindseed-store";
import { Star } from "lucide-react";

export function ReflectionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { addReflection } = useMindSeed();
  const [rating, setRating] = useState(4);
  const [reasons, setReasons] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setRating(4);
      setReasons([]);
    }
  }, [open]);

  const toggle = (r: string) =>
    setReasons((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">How focused are you today?</DialogTitle>
          <DialogDescription>
            Capture how the session felt so MindSeed can learn from your rhythm.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
              <motion.span whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.92 }} className="block">
                <Star
                  className={`size-8 transition-colors ${
                    n <= rating ? "fill-accent text-accent" : "text-muted-foreground/40"
                  }`}
                />
              </motion.span>
            </button>
          ))}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">What pulled your attention away?</p>
          <div className="flex flex-wrap gap-2">
            {DISTRACTIONS.map((d) => (
              <button
                key={d}
                onClick={() => toggle(d)}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  reasons.includes(d)
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <Button
          className="mt-2 h-11 rounded-2xl"
          onClick={() => {
            addReflection(rating, reasons);
            onOpenChange(false);
          }}
        >
          Save reflection
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function Confetti({ show }: { show: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        x: (i * 37) % 100,
        delay: (i % 12) * 0.06,
        rotate: (i * 47) % 360,
        tone: i % 3,
      })),
    [],
  );
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -40, opacity: 0, rotate: 0 }}
          animate={{ y: "105vh", opacity: [0, 1, 1, 0], rotate: p.rotate }}
          transition={{ duration: 2.6, delay: p.delay, ease: "easeIn" }}
          className={`absolute top-0 size-2.5 rounded-[3px] ${
            p.tone === 0 ? "bg-primary" : p.tone === 1 ? "bg-secondary" : "bg-accent"
          }`}
          style={{ left: `${p.x}%` }}
        />
      ))}
    </div>
  );
}
