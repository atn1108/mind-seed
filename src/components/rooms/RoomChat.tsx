import type { RefObject } from "react";
import { ChevronDown, MessageSquare, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RoomMessage } from "@/lib/room-store";
import { useT, useTf } from "@/lib/ui-language";

/** Formats a message timestamp: time for today, "Yesterday", "N days ago", else a date. */
export function messageTime(t: ReturnType<typeof useT>, tf: ReturnType<typeof useTf>, raw: string) {
  const date = new Date(raw);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMsgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.round((startOfToday - startOfMsgDay) / 86_400_000);
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (dayDiff <= 0) return time;
  if (dayDiff === 1) return `${tf("Yesterday")} · ${time}`;
  if (dayDiff < 7) return `${tf("{n} days ago", { n: dayDiff })} · ${time}`;
  return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${time}`;
}

export function RoomChat({
  messages,
  myId,
  chatInput,
  setChatInput,
  sendingChat,
  onSend,
  chatScrollRef,
  className,
  onClose,
}: {
  messages: RoomMessage[];
  myId: string | null;
  chatInput: string;
  setChatInput: (v: string) => void;
  sendingChat: boolean;
  onSend: (e: React.FormEvent) => void;
  chatScrollRef: RefObject<HTMLDivElement | null>;
  className?: string;
  onClose?: () => void;
}) {
  const t = useT();
  const tf = useTf();
  return (
    <div className={`surface flex min-h-0 flex-col p-6 sm:p-7 ${className ?? "h-[320px]"}`}>
      <div className="flex items-center gap-2">
        <h2 className="flex min-w-0 flex-1 items-center gap-2 font-display text-lg font-semibold">
          <MessageSquare className="size-4 shrink-0 text-primary" />
          <span className="truncate">{t("Room chat")}</span>
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t("Minimize chat")}
            title={t("Minimize chat")}
          >
            <ChevronDown className="size-5" />
          </button>
        )}
      </div>
      <div
        ref={chatScrollRef}
        className="mt-3 flex-1 overflow-y-auto space-y-2.5 pr-1 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-12">
            {t("No messages yet — say hello!")}
          </p>
        ) : (
          messages.map((m) => {
            const isMe = m.user_id === myId;
            return (
              <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <span className="text-[10px] text-muted-foreground px-1 mb-0.5">
                  {m.user_name} · {messageTime(t, tf, m.created_at)}
                </span>
                <div
                  className={`rounded-2xl px-3.5 py-2 max-w-[85%] text-xs leading-relaxed ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={onSend} className="mt-3 flex gap-2 pt-2 border-t border-border">
        <Input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder={t("Type a message...")}
          maxLength={500}
          className="h-10 rounded-xl text-xs"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!chatInput.trim() || sendingChat}
          className="h-10 px-4 rounded-xl cursor-pointer"
        >
          <Send className="size-3.5" />
        </Button>
      </form>
    </div>
  );
}
