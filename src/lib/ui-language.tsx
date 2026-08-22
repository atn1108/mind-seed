import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import en from "@/locales/en.json";
import vi from "@/locales/vi.json";

export type Lang = "en" | "vi";

type Ctx = { lang: Lang; setLang: (lang: Lang) => void };

const STORAGE_KEY = "mindseed-lang";
const LEGACY_STORAGE_KEY = "mindseed-language";

const UiLanguageContext = createContext<Ctx | null>(null);

function readInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const saved =
      window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
    return saved === "vi" ? "vi" : "en";
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

const dictionaries: Record<Lang, Record<string, string>> = {
  en: en as unknown as Record<string, string>,
  vi: vi as unknown as Record<string, string>,
};

/** Translate an English string using the active language dictionary. */
export function useT() {
  const { lang } = useUiLanguage();
  return (text: string) => dictionaries[lang][text] ?? text;
}

/** Like useT, but also interpolates {var} placeholders: tf("{n} trees", { n: 5 }) */
export function useTf() {
  const t = useT();
  return (template: string, vars?: Record<string, string | number>) => {
    const s = t(template);
    if (!vars) return s;
    return Object.entries(vars).reduce(
      (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
      s,
    );
  };
}
