import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "en" | "vi";
const STORAGE_KEY = "mindseed-language";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

/** Shared app language state. Start in English for SSR, then hydrate persisted preference. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "vi") setLanguage("vi");
    } catch {
      // Storage can be unavailable in privacy-restricted browsers; English remains usable.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Language switching still works for this session when storage is unavailable.
    }
  }, [hydrated, language]);

  const value = useMemo(() => ({ language, setLanguage }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}

const VI: Record<string, string> = {
  Home: "Trang chủ", "Focus Garden": "Khu vườn tập trung", "Focus Timer": "Hẹn giờ tập trung", Tasks: "Nhiệm vụ", Insight: "Phân tích", Profile: "Hồ sơ",
  "Light mode": "Chế độ sáng", "Dark mode": "Chế độ tối", "Log out": "Đăng xuất", Language: "Ngôn ngữ",
  Dashboard: "Bảng điều khiển", "Good morning": "Chào buổi sáng", "Total focus time today": "Tổng thời gian tập trung hôm nay", "Daily goal: 120 minutes": "Mục tiêu ngày: 120 phút", "Start a study session": "Bắt đầu phiên học", "Trees planted": "Cây đã trồng", "Current EXP": "EXP hiện tại",
  Species: "Loài cây", "Forest history": "Lịch sử khu rừng", "Focus Insight": "Phân tích tập trung", "Your last 7-day focus report.": "Báo cáo tập trung 7 ngày qua.", "Focus time by day": "Thời gian tập trung theo ngày", "Study windows": "Khung giờ học", "4-week trend": "Xu hướng 4 tuần", "MindSeed analysis": "Phân tích MindSeed", "Profile": "Hồ sơ", "Monthly goal": "Mục tiêu tháng", "Focus journal": "Nhật ký tập trung",
  "What needs your attention today?": "Điều gì cần bạn chú ý hôm nay?", "High priority": "Ưu tiên cao", "Medium priority": "Ưu tiên vừa", "Low priority": "Ưu tiên thấp", "Mark complete": "Đánh dấu hoàn thành", "How focused are you today?": "Hôm nay bạn tập trung đến đâu?", "What pulled your attention away?": "Điều gì đã làm bạn mất tập trung?", "Ready": "Sẵn sàng", "Pause": "Tạm dừng", Resume: "Tiếp tục", Start: "Bắt đầu", End: "Kết thúc", "In focus…": "Đang tập trung…",
};
export function useT() {
  const { language } = useLanguage();
  return useMemo(() => (text: string) => (language === "vi" ? VI[text] ?? text : text), [language]);
}
