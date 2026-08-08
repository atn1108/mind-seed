import { motion } from "motion/react";

import { stageOf } from "@/lib/mindseed-store";

export function TreeVisual({ exp, size = 160 }: { exp: number; size?: number }) {
  const { index, stage } = stageOf(exp);
  const scale = [0.5, 0.68, 0.85, 1][index] ?? 1;

  return (
    <div
      className="relative grid place-items-center rounded-3xl bg-primary-soft"
      style={{ width: size, height: size }}
    >
      <motion.div
        key={index}
        initial={{ scale: scale * 0.6, opacity: 0 }}
        animate={{ scale, opacity: 1, y: [0, -4, 0] }}
        transition={{
          scale: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.5 },
          y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
        }}
        style={{ fontSize: size * 0.45 }}
        aria-label={stage.name}
      >
        {stage.emoji}
      </motion.div>
      <span className="absolute bottom-3 rounded-full bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground">
        {stage.name}
      </span>
    </div>
  );
}
