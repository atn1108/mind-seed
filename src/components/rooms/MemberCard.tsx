import { motion } from "motion/react";
import { Crown } from "lucide-react";

import { STAGES } from "@/lib/mindseed-store";
import { isSafeAvatar } from "@/lib/room-store";
import { useT } from "@/lib/ui-language";

/** Tree grows through the 4 MindSeed stages as the shared session progresses. */
export function stageFor(progressPct: number) {
  const idx = Math.min(3, Math.floor((Math.max(0, Math.min(100, progressPct)) / 100) * 4));
  return STAGES[idx]!;
}

export function MemberCard({
  name,
  avatar,
  isHost,
  isMe,
  progress,
  delay,
  onClick,
}: {
  name: string;
  avatar: string;
  isHost: boolean;
  isMe: boolean;
  progress: number;
  delay: number;
  onClick: () => void;
}) {
  const t = useT();
  const stage = stageFor(progress);
  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className={`cursor-pointer rounded-2xl border p-3 transition-colors hover:border-primary/60 ${
        isMe ? "border-primary/40 bg-primary-soft/50" : "border-border bg-card"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="relative shrink-0">
          <span className="grid size-10 place-items-center overflow-hidden rounded-3xl bg-primary text-sm font-semibold text-primary-foreground">
            {isSafeAvatar(avatar) ? (
              <img src={avatar} alt="Avatar" className="size-full object-cover" />
            ) : (
              avatar || name.trim().charAt(0).toUpperCase() || "?"
            )}
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
