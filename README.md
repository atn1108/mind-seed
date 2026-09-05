# MindSeed — Grow Your Focus

> Nền tảng giúp cải thiện khả năng tập trung, xây dựng thói quen học tập bền vững và giảm thiểu hội chứng "Popcorn Brain" (não bỏng ngô) cho học sinh, sinh viên và người học.

Triết lý: *"Ươm mầm sự tập trung thay vì ép buộc người dùng ngừng sử dụng điện thoại."*

---

## ✨ Tính năng chính

| Module                          | Mô tả                                                                                                                |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 🔐**Đăng nhập**        | Google / Email / Đăng ký                                                                                            |
| 🏠**Dashboard**           | Lời chào cá nhân, 4 thẻ tổng quan (Garden, Focus Time, Tasks, Score), nút "Start a focus session"               |
| 🌳**Focus Garden**        | Tiến trình Hạt giống ➔ Cây non ➔ Cây trưởng thành ➔ Khu rừng; hoàn thành phiên giúp cây phát triển |
| ⏱️**Focus Timer**       | Pomodoro tùy chỉnh (25–60 phút), vòng tiến trình, hiệu ứng confetti                                           |
| 📋**Task Manager**        | Thêm/sửa/xóa nhiệm vụ, deadline, độ ưu tiên, tích lũy EXP                                                   |
| 📊**Focus Insight**       | Báo cáo tuần, phân tích khung giờ hiệu quả, Pie/Line/Bar chart                                                 |
| 🔔**Smart Reminder**      | Nhắc giữ chuỗi (streak), hoàn thành bài học, mục tiêu bỏ dở                                                 |
| 📝**Reflection**          | Đánh giá 1–5 sao sau mỗi phiên, ghi nhận nguyên nhân xao nhãng                                               |
| 👤**Profile**             | Thông tin người dùng, streak, tổng cây/giờ học, điểm trung bình, mục tiêu tháng                          |
| 🧑‍🤝‍🧑**Study Rooms** | Phòng học chung (mã mời, timer dùng chung, nhắn tin, mật khẩu, chủ phòng điều khiển)                      |

**Focus Score (0–100):** tính từ thời gian tập trung, số phiên & nhiệm vụ hoàn thành, tỉ lệ bỏ dở và streak. Xếp loại: Excellent → Good → Average → Need Improvement.

---

## 🎨 Thiết kế

- Cảm hứng: Apple, Notion, Forest App, Material Design 3
- Bo góc lớn, spacing thoáng, glassmorphism nhẹ, bóng đổ mềm, responsive mọi kích thước
- Font: **Plus Jakarta Sans** · Primary: `#4CAF50` · Background: `#F6FFF8` · Accent: `#FFD54F`

---

## 🛠️ Công nghệ

- **UI:** React 19, TanStack Router / Start, TypeScript
- **Styling:** TailwindCSS, shadcn/ui, Lucide
- **Animation / Charts:** Motion, Recharts
- **Backend:** Supabase (Auth, Database, Realtime, RLS)
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

### Biến môi trường

| Biến                             | Mô tả                                                              |
| --------------------------------- | -------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | URL Supabase project                                                 |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Khóa publishable (anon) — public                                   |
| `SUPABASE_SERVICE_ROLE_KEY`     | Khóa service role —**chỉ server, không đưa vào bundle** |

---

## 📁 Cấu trúc dự án

```
src/
├── components/     # UI components (shadcn/ui, layout, module widgets)
├── hooks/          # Custom hooks
├── integrations/   # Kết nối Supabase (client, server)
├── lib/            # Tiện ích dùng chung
├── locales/        # Bản địa hóa / i18n
├── routes/         # TanStack Router routes
├── router.tsx      # Khởi tạo router
├── server.ts       # Entry server (dev)
├── start.ts        # Entry server (SSR)
└── styles.css      # Tailwind + design tokens
```
```
