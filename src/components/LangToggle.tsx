import { cn } from "@/lib/utils";
import { useUiLanguage, type Lang } from "@/lib/ui-language";

const OPTIONS = ["en", "vi"] as const;

export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useUiLanguage();

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-border bg-muted/50 p-0.5 text-[11px]",
        className,
      )}
      role="group"
      aria-label="Switch language"
    >
      {OPTIONS.map((option: Lang) => (
        <button
          key={option}
          type="button"
          onClick={() => setLang(option)}
          aria-pressed={lang === option}
          className={`cursor-pointer rounded-full px-2 py-0.5 transition-colors ${
            lang === option
              ? "bg-background font-semibold text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
