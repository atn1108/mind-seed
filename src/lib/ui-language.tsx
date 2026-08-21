import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "vi";

type Ctx = { lang: Lang; setLang: (lang: Lang) => void };

const STORAGE_KEY = "mindseed-lang";

const UiLanguageContext = createContext<Ctx | null>(null);

function readInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "vi" ? "vi" : "en";
  } catch {
    return "en";
  }
}

export function UiLanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(readInitialLang);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // storage unavailable (private mode) — keep in-memory only
    }
  }, [lang]);

  return (
    <UiLanguageContext.Provider value={{ lang, setLang }}>{children}</UiLanguageContext.Provider>
  );
}

export function useUiLanguage() {
  const ctx = useContext(UiLanguageContext);
  if (!ctx) throw new Error("useUiLanguage must be used within <UiLanguageProvider>");
  return ctx;
}
