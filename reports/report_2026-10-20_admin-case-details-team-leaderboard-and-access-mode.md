# BÁO CÁO: CHI TIẾT TRẠM HOÀN THÀNH ADMIN, BẢNG XẾP HẠNG ĐỘI & ĐIỀU CHỈNH CHẾ ĐỘ TRUY CẬP VỤ ÁN

- **Ngày thực hiện:** 20/10/2026 20:45
- **Người thực hiện:** Antigravity AI & Đội ngũ Kỹ thuật "Đội Điều Tra Số"
- **Trạng thái:** ✅ Đã hoàn thành, kiểm thử thành công, sẵn sàng thi đấu.

---

## 1. BỐI CẢNH & YÊU CẦU NÂNG CẤP

Nhằm đáp ứng các tiêu chuẩn tổ chức cuộc thi trực tiếp với quy mô lớn và tính công bằng minh bạch cao, hệ thống nhận được 3 yêu cầu chỉnh sửa trọng tâm:
1. **Trang Admin – Bảng xếp hạng tốc độ hoàn thành**: Nêu rõ thông tin vụ án nào, đã hoàn thành những trạm nào cụ thể (thay vì chỉ ghi số lượng chung chung `5/5 trạm`).
2. **Bảng thành tích giải đấu (Leaderboard Modal & Admin)**:
   - Xếp hạng cá nhân và các thông tin thành tích chi tiết.
   - Bổ sung **Xếp hạng Đội** dựa theo các user trùng tên đội (`team_code`) phá các vụ án, sau đó **tổng điểm tất cả**, so sánh cao thấp các đội trên bảng.
   - Cho phép xem chi tiết giải thích vì sao ra được con số điểm tổng đó (cộng dồn từ user nào, tham gia vụ án nào, bao nhiêu điểm từng trạm).
3. **Cài đặt Chế độ truy cập Vụ án của Admin**:
   - Admin có thể điều chỉnh cho phép user chỉ chọn chơi phá 1 vụ án thôi (Chế độ KHÓA), hoặc cho phá nhiều vụ án (Chế độ TỰ DO).
   - Khi ở chế độ 1 vụ án: các vụ án khác sẽ **tự động khóa không cho truy cập** khi người chơi đã chọn 1 vụ án bất kỳ.

---

## 2. CHI TIẾT CÁC HẠNG MỤC ĐÃ TRIỂN KHAI

### 2.1. Nâng Cấp Bảng Tốc Độ Hoàn Thành Admin – Nêu Rõ Vụ Án & Từng Trạm
- **Cột "Vụ Án & Các Trạm Đã Hoàn Thành":**
  - Hiển thị tên Vụ án sắc nét (`Vụ #X: [Tên Vụ Án]`).
  - Hiển thị trực tiếp danh sách huy hiệu trạng thái từng trạm:
    - Trạm hoàn thành: Huy hiệu xanh `✓ T1: 15đ`, `✓ T2: 15đ`, `✓ T3: 20đ`...
    - Trạm không hoàn thành: Huy hiệu đỏ gạch `✕ T4`.
  - Tóm tắt tiến độ rõ ràng: `Hoàn thành x/5 trạm (y điểm)`.
- **Hàng mở rộng chi tiết (Expanded Row):**
  - Khi click vào bất kỳ hàng nào trên bảng: hiển thị lưới các trạm hoàn thành kèm:
    - Tên trạm thử thách
    - Điểm số đạt được / điểm tối đa của trạm (`+15đ` / `0đ`)
    - Manh mối điều tra: `🔎 Manh mối: [Tiêu đề manh mối]` hoặc `⚠️ Không tìm ra manh mối trạm này`.
    - Trạng thái chữ: `Hoàn thành trạm` / `Chưa hoàn thành`.

### 2.2. Xây Dựng Bảng Xếp Hạng Đội & Minh Bạch Hóa Công Thức Tính Điểm
- **Tại `LeaderboardModal.tsx` (Phía Người Chơi):**
  - Bổ sung thanh chuyển đổi 2 chế độ:
    - `👤 XẾP HẠNG CÁ NHÂN`: Xếp theo thí sinh, xem theo từng vụ hoặc toàn giải.
    - `🛡️ XẾP HẠNG ĐỘI`: Gom tất cả các user cùng mã đội (`team_code`).
  - So sánh cao thấp các đội với huy hiệu Huy chương 🥇 Top 1, 🥈 Top 2, 🥉 Top 3, #4... xếp theo: Tổng điểm Đội -> Số vụ phá xong -> Manh mối.
  - **Minh bạch hóa công thức tổng điểm:**
    - Mỗi thẻ đội có nút xem chi tiết: hiển thị công thức `Tổng điểm 185đ = [User A: 100đ (Vụ #1)] + [User B: 85đ (Vụ #2)]`.
    - Bảng danh sách chi tiết các thành viên đóng góp: Tên thành viên, Vụ án đã tham gia, Trạm hoàn thành, Điểm đóng góp, Manh mối thu thập, Trạng thái.
- **Tại `admin/page.tsx`:**
  - Đồng bộ Tab `🏆 Xếp Hạng Đội` với cơ chế tính điểm tương tự, cho phép Admin theo dõi và đối soát dễ dàng.

### 2.3. Điều Chỉnh Chế Độ Truy Cập Vụ Án (Khóa 1 Vụ vs Mở Tất Cả)
- **Hệ thống Server API & Realtime Sync:**
  - Tạo endpoint `/api/admin/config`:
    - `GET`: Trả về `{ caseAccessMode: 'single' | 'multi' }`.
    - `POST`: Lưu trữ cấu hình `caseAccessMode` trên server.
  - Mở rộng `MultiplayerSyncManager` (`multiplayerSync.ts`):
    - Thêm kênh MQTT `dts/v1/config`, BroadcastChannel `__dts_config` và Supabase Realtime broadcast.
    - Phương thức `broadcastGameConfig` và `onGameConfigChange` giúp mọi thiết bị thí sinh cập nhật cấu hình tức thời ngay khi Admin chuyển đổi mà không cần reload trang.
- **Giao diện Admin Dashboard:**
  - Bổ sung Tab 4 `⚙️ CÀI ĐẶT QUẢN TRỊ`: Cho phép chuyển đổi giữa **Chế độ KHÓA (Chỉ 1 vụ án)** và **Chế độ TỰ DO (Tất cả vụ án)**.
- **Giao diện Sảnh Chờ (`LobbyScreen.tsx`):**
  - Hiển thị Banner trạng thái quy chế thi đấu của Admin trên đầu sảnh chờ.
  - Trong **Chế độ KHÓA (1 vụ án)**:
    - Khi người chơi chọn 1 vụ án bất kỳ (ví dụ Vụ 1), vụ đó được ghi nhận là vụ thi đấu của họ.
    - 3 vụ án còn lại (Vụ 2, 3, 4) sẽ **tự động bị khóa 🔒**, chuyển sang trạng thái xám mờ kèm huy hiệu `🔒 ĐÃ KHÓA (CHẾ ĐỘ 1 VỤ ÁN)`.
    - Nếu người chơi click vào vụ án bị khóa: hệ thống phát âm thanh cảnh báo và hiển thị hộp thoại pop-up: *"Theo quy chế giải đấu từ Ban Quản Trị, mỗi điều tra viên chỉ được phép phá 1 VỤ ÁN DUY NHẤT. Bạn đã đăng ký tham gia Vụ án #X..."*.
  - Trong **Chế độ TỰ DO (Tất cả vụ án)**:
    - Tất cả 4 vụ án đều mở tự do, người chơi có thể phá lần lượt từng vụ.

---

## 3. KẾT QUẢ KIỂM THỬ & BUILD

- Lệnh `npm run build` chạy thành công 100% không phát sinh bất kỳ lỗi TypeScript hay xung đột route nào:
  ```
  ▲ Next.js 16.4.2 (Turbopack)
  ✓ Compiled successfully in 2.1s
  Running TypeScript ... Finished TypeScript in 3.9s ...
  ✓ Generating static pages using 13 workers (12/12) in 1074ms
  Route (app)
  ┌ ○ /
  ├ ○ /_not-found
  ├ ○ /admin
  ├ ƒ /api/admin/config
  ├ ƒ /api/admin/sessions
  ├ ƒ /api/cases
  ├ ƒ /api/check-name
  ├ ƒ /api/leaderboard
  ├ ƒ /api/sessions
  └ ƒ /api/verify-answer
  ```

---

## 4. DANH SÁCH TỆP THAY ĐỔI

| Tệp | Mô Tả Thay Đổi |
| :--- | :--- |
| `frontend/src/app/api/admin/config/route.ts` | **(Mới)** API quản lý cấu hình chế độ truy cập vụ án (`single` / `multi`). |
| `frontend/src/lib/multiplayerSync.ts` | Tích hợp kênh phát sóng và lắng nghe cấu hình realtime (`broadcastGameConfig`, `onGameConfigChange`). |
| `frontend/src/app/admin/page.tsx` | Nâng cấp cột thông tin vụ án & trạm hoàn thành, tích hợp API config và giao diện quản trị chế độ truy cập. |
| `frontend/src/components/LeaderboardModal.tsx` | Nâng cấp toàn diện với 2 Tab (Cá nhân & Đội), công thức tổng điểm minh bạch và breakdown chi tiết thành viên. |
| `frontend/src/components/LobbyScreen.tsx` | Tích hợp cơ chế tự động khóa các vụ án còn lại khi ở chế độ 1 vụ án, banner quy chế và popup cảnh báo. |
| `reports/INDEX.md` | Cập nhật mục lục báo cáo tiến độ. |
