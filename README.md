# MindSeed — Grow Your Focus

> Nền tảng giúp cải thiện khả năng tập trung, xây dựng thói quen học tập bền vững và giảm thiểu hội chứng "Popcorn Brain" (não bỏng ngô) cho học sinh, sinh viên và người học.

Triết lý: *"Ươm mầm sự tập trung thay vì ép buộc người dùng ngừng sử dụng điện thoại."*

---

## ✨ Tính năng chính

| Module                   | Mô tả                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------- |
| 🔐 **Đăng nhập**         | Google / Email / Đăng ký                                                                                |
| 🏠 **Dashboard**         | Lời chào cá nhân, 4 thẻ tổng quan (Garden, Focus Time, Tasks, Score), nút "Start a focus session"      |
| 🌳 **Focus Garden**      | Hạt giống ➔ Cây non ➔ Cây trưởng thành ➔ Khu rừng; cây sau tốn nhiều EXP hơn cây trước (120, 180, 280…) |
| ⏱️ **Focus Timer**       | 25/30/45/60 phút + tùy chỉnh 5–180, mốc tiến trình 20/40/60/80/100%, báo EXP nhận được ngay khi xong    |
| 📋 **Task Manager**      | Thêm/sửa/xóa nhiệm vụ, hạn ngày + giờ (mặt đồng hồ 24h), độ ưu tiên, quá hạn tự sang Completed và khóa |
| 📊 **Focus Insight**     | Báo cáo 7 ngày, xu hướng 4 tuần, khung giờ hiệu quả, Pie/Line/Bar chart (tính cả phiên dở dang)        |
| 🔔 **Smart Reminder**    | Nhắc giữ chuỗi (streak), nhắc việc theo ưu tiên (High 1h / Medium 2h / Low 3h), nhắc trước/sau deadline |
| 📝 **Reflection**        | Đánh giá 1–5 sao sau mỗi phiên, ghi nhận nguyên nhân xao nhãng                                          |
| 👤 **Profile**           | Avatar, tên, streak, tổng cây/giờ học, mục tiêu tháng                                                  |
| 🧑‍🤝‍🧑 **Study Rooms**  | Phòng học chung (mã mời, timer dùng chung, nhắn tin, mật khẩu, hiện diện trực tiếp)                    |

**Kinh tế EXP:**

| Phiên học | EXP |
| --------- | --- |
| 5 phút    | 10  |
| 10 phút   | 20  |
| 25 phút   | 45  |
| 45 phút   | 90  |
| Mốc khác  | ×2 số phút |

Xong phiên nhận full; bấm End sớm nhận theo số mốc đã qua (mỗi mốc = 1/5). Xong nhiệm vụ +12 EXP. Trồng cây tốn EXP tăng dần theo số cây đã có.

**Focus Score (0–100):** tính từ thời gian tập trung, số phiên & nhiệm vụ hoàn thành, tỉ lệ bỏ dở và streak. Xếp loại: Excellent → Good → Average → Need Improvement.

---

## 🎨 Thiết kế

- Cảm hứng: Apple, Notion, Forest App, Material Design 3
- Bo góc lớn, spacing thoáng, glassmorphism nhẹ, bóng đổ mềm, responsive mọi kích thước
- Font: **Plus Jakarta Sans** · Primary: `#4CAF50` · Background: `#F6FFF8` · Accent: `#FFD54F`
- Song ngữ Việt – Anh (đổi trong app)

---

## 🛠️ Công nghệ

- **UI:** React 19, TanStack Router / Start, TypeScript
- **Styling:** TailwindCSS v4, shadcn/ui, Lucide
- **Animation / Charts:** Motion, Recharts
- **Backend:** Supabase (Auth, Database, Realtime, RLS + RPC `SECURITY DEFINER` tính EXP server-side)
- **Deploy:** Netlify (`Nitro` preset `netlify`)

---

## 🚀 Bắt đầu

### Yêu cầu

Node.js ≥ 24 & npm

### Cài đặt

```sh
git clone https://github.com/atn1108/mind-seed.git
cd mind-seed
npm install
cp .env.example .env   # điền giá trị Supabase
npm run dev
```
---

## 📁 Cấu trúc dự án

```
src/
├── components/     # UI components (shadcn/ui, layout, DateTimePicker, reminders...)
├── hooks/          # Custom hooks
├── integrations/   # Kết nối Supabase (client, server)
├── lib/            # Store dùng chung (mindseed-store, timer-store...)
├── locales/        # Bản địa hóa vi/en
├── routes/         # TanStack Router routes
├── router.tsx      # Khởi tạo router
├── server.ts       # Entry server (dev)
├── start.ts        # Entry server (SSR)
└── styles.css      # Tailwind + design tokens
```
