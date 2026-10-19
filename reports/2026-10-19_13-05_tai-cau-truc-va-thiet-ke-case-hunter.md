# BÁO CÁO TIẾN ĐỘ: TÁI CẤU TRÚC DỰ ÁN & THIẾT KẾ LẠI GIAO DIỆN CHUẨN CASE HUNTER
*Thời gian thực hiện: 19/10/2026 13:05 (Giờ địa phương)*

---

## 1. Mục Tiêu & Yêu Cầu Thay Đổi
- **Khắc phục**: Giao diện cũ sử dụng phong cách Dark Gradient / Glassmorphism chưa đúng với hình ảnh hoạt hình 2D tươi sáng của Case Hunter.
- **Tái cấu trúc**:
  1. Phân chia độc lập 3 thư mục: `frontend/`, `backend/`, `reports/`.
  2. Bổ sung `backend/api/` với các Serverless API Routes: `cases.ts`, `verify-answer.ts`, `sessions.ts`, `leaderboard.ts`.
  3. Bổ sung `backend/db/schema.sql` và kết nối Supabase với cơ chế fallback tự động.
  4. Cấu hình `vercel.json` phục vụ deploy đồng thời cả client và serverless functions.
  5. Thiết kế lại toàn bộ CSS, SVG illustration và các màn hình theo chuẩn 2D Comic/Cartoon Case Hunter (nét viền đen đậm, màu sắc hoạt hình tươi sáng, nút bấm 3D comic, bóng đổ góc cạnh, khung tranh truyện).

---

## 2. Chi Tiết Thực Hiện

### A. Phân tách Cấu Trúc Mã Nguồn
- **`backend/`**:
  - `package.json`: Khai báo thư viện độc lập `@supabase/supabase-js`, `typescript`.
  - `db/schema.sql`: Khởi tạo bảng `player_sessions`, indexes và views xếp hạng.
  - `db/supabase.ts`: Kết nối Supabase với bộ nhớ memory fallback cho local dev.
  - `data/casesData.ts`: Lưu trữ kịch bản 4 vụ án và 20 trạm thi đấu.
  - `api/cases.ts`: API cung cấp danh mục hồ sơ và tình huống trạm.
  - `api/verify-answer.ts`: API thẩm định đáp án, tính điểm và cấp manh mối bảo mật.
  - `api/sessions.ts`: API lưu/tải tiến trình người chơi.
  - `api/leaderboard.ts`: API xếp hạng và xác thực mã BTC.

### B. Thiết Kế Lại Giao Diện 2D Cartoon "Case Hunter" (Frontend)
- **`frontend/src/styles/case-hunter.css`**:
  - Nền kem giấy hoạt hình `#FFF9E6` và `#FFFDF5`.
  - Nét viền đậm `border: 3px solid #1A1A1A`.
  - Nút bấm hoạt hình Comic 3D với hiệu ứng nén (`box-shadow: 0 5px 0 #1A1A1A`, khi active chuyển thành `0 1px 0 #1A1A1A`).
  - Khung thoại Comic Speech Bubbles với đuôi nhọn.
  - Băng rôn câu hỏi vàng viền đen đặc trưng của Case Hunter.
- **`frontend/src/assets/`**:
  - Thư viện hình vẽ vector SVG hoạt hình sinh động: Nhân vật Thám tử điều tra viên áo choàng cam/vàng cầm kính lúp, Nạn nhân hoảng hốt trước máy tính/điện thoại, Màn hình tin nhắn giả mạo công an, Bằng chứng dấu vân tay và con dấu phá án đỏ SOLVED.
- **`frontend/src/hooks/useGameApi.ts`**:
  - Custom hook kết nối mượt mà tới các endpoint backend `/api/*` với fallback offline thông minh.
- **`frontend/src/components/`**:
  - Chuyển đổi toàn diện các màn hình `WelcomeScreen`, `LobbyScreen`, `StationsScreen`, `PlayingScreen`, `SummaryScreen`, `LeaderboardModal` sang phong cách hoạt hình 2D rực rỡ, vui nhộn.

---

## 3. Kết Quả Kiểm Định Toàn Diện (End-to-End Verification)
- **Biên dịch mã nguồn (`npm run build`)**: 
  - Đạt mã thoát `0`. 100% không có lỗi TypeScript hay CSS.
  - Turbopack tạo thành công cả Static pages và 4 Dynamic Serverless API routes:
    - `/api/cases`
    - `/api/verify-answer`
    - `/api/sessions`
    - `/api/leaderboard`
- **Kiểm thử tự động trên trình duyệt (`Browser Subagent`)**:
  - Đã thực hiện kiểm thử thực tế từ màn hình Chào mừng -> Sảnh hồ sơ vụ án -> Lộ trình 5 trạm -> Hiện trường vụ án -> Phá án thành công.
  - Vượt qua trọn vẹn cả 5 trạm của Vụ án #2 (*Cuộc gọi tự xưng công an*).
  - Đạt điểm tuyệt đối: **100/100 Điểm**.
  - Thu thập đầy đủ: **5/5 Manh Mối**.
  - Đạt danh hiệu cao quý nhất: **Hạng SSS – ĐẠI THÁM TỬ HUYỀN THOẠI 👑**.
  - Tạo thành công mã xác thực cho Ban Tổ Chức: `DTS-26DAE6A`.
  - Hệ thống âm thanh tổng hợp Web Audio API và kính lúp soi bằng chứng hoạt động trơn tru.

---

## 4. Cấu Trúc Dự Án Sau Tái Cấu Trúc
```text
Biet_doi_dtra_so/
├── frontend/                  # Ứng dụng giao diện người chơi (Next.js 16 + React 19)
│   ├── src/
│   │   ├── app/               # Next.js App Router & API Route Handlers
│   │   ├── components/        # Màn hình 2D Comic: Welcome, Lobby, Stations, Playing, Summary, Leaderboard
│   │   ├── assets/            # Vector SVG hoạt hình 2D: Detective, Victim, Scam, Solved Stamp
│   │   ├── hooks/             # Hook useGameApi kết nối backend API
│   │   ├── styles/            # case-hunter.css (2D Comic design system)
│   │   ├── lib/               # gameStore, sounds (Web Audio API), supabase fallback
│   │   └── data/              # Dữ liệu 4 vụ án và 20 trạm
│   └── package.json
├── backend/                   # Hệ thống API Serverless & Kết nối CSDL
│   ├── api/                   # Serverless routes: cases.ts, verify-answer.ts, sessions.ts, leaderboard.ts
│   ├── data/                  # casesData.ts (Dữ liệu gốc bảo mật)
│   ├── db/                    # schema.sql (PostgreSQL Supabase) & supabase.ts
│   └── package.json
├── reports/                   # Thư mục lưu trữ báo cáo tự động
│   ├── INDEX.md               # Mục lục tổng hợp
│   └── 2026-10-19_13-05_tai-cau-truc-va-thiet-ke-case-hunter.md
└── vercel.json                # Định tuyến đồng thời frontend Next.js và backend serverless functions
```
