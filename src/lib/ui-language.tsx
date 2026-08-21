import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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

/* EN → VI dictionary keyed by the English copy used across pages. */
const VI_DICTIONARY: Record<string, string> = {
  Home: "Trang chủ",
  "Focus Garden": "Khu vườn tập trung",
  "Focus Timer": "Hẹn giờ tập trung",
  Tasks: "Nhiệm vụ",
  Insight: "Phân tích",
  Profile: "Hồ sơ",
  "Light mode": "Chế độ sáng",
  "Dark mode": "Chế độ tối",
  "Log out": "Đăng xuất",
  Language: "Ngôn ngữ",
  Dashboard: "Bảng điều khiển",
  "Good morning": "Chào buổi sáng",
  "Total focus time today": "Tổng thời gian tập trung hôm nay",
  "Daily goal: 120 minutes": "Mục tiêu ngày: 120 phút",
  "Start a study session": "Bắt đầu phiên học",
  "Trees planted": "Cây đã trồng",
  "Current EXP": "EXP hiện tại",
  Species: "Loài cây",
  "Forest history": "Lịch sử khu rừng",
  "Focus Insight": "Phân tích tập trung",
  "Your last 7-day focus report.": "Báo cáo tập trung 7 ngày qua.",
  "Focus time by day": "Thời gian tập trung theo ngày",
  "Study windows": "Khung giờ học",
  "4-week trend": "Xu hướng 4 tuần",
  "MindSeed analysis": "Phân tích MindSeed",
  "Monthly goal": "Mục tiêu tháng",
  "Focus journal": "Nhật ký tập trung",
  "What needs your attention today?": "Điều gì cần bạn chú ý hôm nay?",
  "High priority": "Ưu tiên cao",
  "Medium priority": "Ưu tiên vừa",
  "Low priority": "Ưu tiên thấp",
  "Mark complete": "Đánh dấu hoàn thành",
  "How focused are you today?": "Hôm nay bạn tập trung đến đâu?",
  "What pulled your attention away?": "Điều gì đã làm bạn mất tập trung?",
  Ready: "Sẵn sàng",
  Pause: "Tạm dừng",
  Resume: "Tiếp tục",
  Start: "Bắt đầu",
  End: "Kết thúc",
  "In focus…": "Đang tập trung…",
};

/** Translate an English string using the active language. */
export function useT() {
  const { lang } = useUiLanguage();
  return (text: string) => (lang === "vi" ? (VI_DICTIONARY[text] ?? text) : text);
}
