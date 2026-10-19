# BÁO CÁO TIẾN ĐỘ: ĐỒNG BỘ 1 NGƯỜI CHƠI DUY NHẤT, NÂNG CẤP RESET TỰ ĐỘNG ĐĂNG XUẤT THIẾT BỊ VÀ ĐÁNH SỐ LẠI 4 HỒ SƠ TỪ 1 ĐẾN 4

- **Dự án:** Đội Điều Tra Số (Case Hunter 2D Game)
- **Thời gian thực hiện:** 2026-10-20 01:38 (UTC+7)
- **Trạng thái:** Hoàn thành xuất sắc, đã kiểm tra build Next.js & TypeScript pass 100%.

---

## 1. TỔNG QUAN VẤN ĐỀ & YÊU CẦU ĐẶT RA

Từ ảnh chụp thực tế màn hình Admin Dashboard (`https://biet-doi-dtra-so.vercel.app/admin`), người dùng ghi nhận 4 điểm then chốt cần khắc phục:

1. **Giao diện hiển thị 4 người chơi dù chỉ có 1 người chơi thực tế:**
   - **Nguyên nhân cốt lõi:** Cơ sở dữ liệu và API quản lý phiên theo cặp `(player_name, team_code, case_id)`. Khi điều tra viên *"Tôi là con chó nhé"* (đội *"CON BÒ BIẾT CỌP"*) vào thử nghiệm các vụ án (Vụ #2, Vụ #3, Vụ #4, Vụ #5), hệ thống ghi nhận 4 bản ghi phiên thi đấu (sessions). Ở phiên bản trên Vercel, giao diện Admin thống kê đếm tổng số dòng session (`sessions.length = 4`) và hiển thị cả 4 dòng trong bảng, khiến quản trị viên hiểu nhầm là hệ thống "đẻ ra 4 người chơi".
   - **Giải pháp:** Nhóm theo định danh duy nhất của điều tra viên (`player_name` & `team_code`). Thẻ thống kê hiển thị số lượng điều tra viên thực tế (1 người). Bảng người tham gia mặc định gom 1 dòng duy nhất cho mỗi thí sinh, hiển thị huy hiệu các vụ án đã tham gia (`Vụ #1`, `Vụ #2`, `Vụ #3`, `Vụ #4`), điểm tích lũy và trạng thái thi đấu hiện tại.

2. **Nút Reset chưa tự động đăng xuất và xóa sạch dữ liệu trên thiết bị người chơi:**
   - **Nguyên nhân cốt lõi:** Nút "Dọn Sạch Bảng" trước đó chỉ xóa dữ liệu trên Server/Supabase. Thiết bị người chơi (điện thoại di động, máy tính) vẫn còn lưu cache trong `localStorage` (`dts_game_state`, `dts_player_sessions`), và cơ chế tự động lưu (auto-save mỗi 1 giây) lại tiếp tục gửi dữ liệu cũ lên server khiến bảng bị ghi đè lại.
   - **Giải pháp:** Xây dựng cơ chế **Remote Force Reset & Logout Đa Tầng**:
     - Admin bấm Reset: Gọi API `/api/admin/sessions` (xóa DB, lưu mốc `__DTS_SYSTEM_RESET_AT__`).
     - Phát sóng sự kiện toàn cầu `multiplayerSync.broadcastSystemReset()` qua 3 kênh đồng thời: Global MQTT Broker (`TOPIC_SYSTEM`), BroadcastChannel nội bộ, và Supabase Realtime channel.
     - Thiết bị người chơi bắt sự kiện: Xóa toàn bộ `localStorage`, reset `gameStore` về ban đầu (`isLoggedIn: false`), đưa về màn hình chào đón `WelcomeScreen`, và hiển thị thông báo rõ ràng cho thí sinh.
     - Kiểm soát API: Nếu thiết bị có độ trễ gửi yêu cầu lưu sau mốc Reset, server từ chối và trả về cờ `force_logout: true`.

3. **Chỉnh lại thứ tự hồ sơ chỉ có 4 hồ sơ đánh số từ 1 đến 4:**
   - **Nguyên nhân cốt lõi:** Trước đó các vụ án được gán mã `02`, `03`, `04`, `05` (thiếu vụ 01).
   - **Giải pháp:** Chuẩn hóa toàn diện cả Frontend và Backend:
     - **Vụ 1 (Mã 01):** *Cuộc gọi tự xưng công an* (`id: 1`)
     - **Vụ 2 (Mã 02):** *Bức ảnh riêng tư lan truyền* (`id: 2`)
     - **Vụ 3 (Mã 03):** *Bẫy cộng tác viên chốt đơn* (`id: 3`)
     - **Vụ 4 (Mã 04):** *Ứng dụng đầu tư sinh lời mỗi ngày* (`id: 4`)
     - Đồng bộ lại toàn bộ 20 trạm thử thách trong `stationConfigs.ts` (`case_01_1` đến `case_04_5`), cấu hình kính lúp minh họa, và logic tạo mã xác nhận BTC `DTS-1-XXXX`.

4. **Lưu tiến trình chỉnh sửa:** Lưu đầy đủ vào thư mục `reports/` và cập nhật mục lục `INDEX.md`.

---

## 2. CHI TIẾT CÁC TỆP ĐÃ THAY ĐỔI

### 2.1. Cấu Trúc Dữ Liệu 4 Vụ Án (1 Đến 4)
- **`frontend/src/data/casesData.ts` & `backend/data/casesData.ts`**:
  - Đổi `GAME_CONFIG.totalCases = 4`.
  - Đánh số lại 4 vụ án tuần tự từ 1 đến 4 với `caseNumber: "01", "02", "03", "04"` và `id: 1, 2, 3, 4`.
- **`frontend/src/data/stationConfigs.ts`**:
  - Chuyển đổi toàn bộ 20 trạm điều tra tương tác 2D sang khóa mới:
    - `case_01_1` .. `case_01_5` (Vụ 1: 5 trạm)
    - `case_02_1` .. `case_02_5` (Vụ 2: 5 trạm)
    - `case_03_1` .. `case_03_5` (Vụ 3: 5 trạm)
    - `case_04_1` .. `case_04_5` (Vụ 4: 5 trạm)
  - Bổ sung cơ chế fallback trong `getStationConfig` để tự động tương thích ngược nếu có thiết bị cũ truy vấn mã 5.
- **`frontend/src/assets/illustrations.tsx`**:
  - Cập nhật hiển thị SOS cho vụ 1 và 2: `(caseId === 1 || caseId === 2)`.
- **`frontend/src/components/LobbyScreen.tsx`**:
  - Cập nhật hàm chọn icon vụ án `getCaseIconType` hỗ trợ đầy đủ 1 đến 4 (`phone`, `alert`, `shopping`, `trending`).

### 2.2. Cơ Chế Reset & Tự Động Đăng Xuất Toàn Bộ Thiết Bị
- **`frontend/src/lib/multiplayerSync.ts`**:
  - Khai báo chủ đề MQTT mới: `TOPIC_SYSTEM = 'dts/v1/system'`.
  - Thêm kênh lắng nghe `systemResetListeners` và phương thức `onSystemReset()`.
  - Thêm phương thức phát thanh khẩn cấp `broadcastSystemReset()`:
    1. Gửi bản tin qua MQTT Broker công cộng.
    2. Gửi qua HTML5 `BroadcastChannel` cho các tab trình duyệt cùng máy.
    3. Gửi qua Supabase Realtime channel `dts-live-telemetry`.
    4. Xóa sạch danh sách thiết bị đang online trong RAM.
- **`frontend/src/lib/gameStore.tsx`**:
  - Lắng nghe sự kiện `multiplayerSync.onSystemReset()`:
    - Xóa `dts_game_state` và `dts_player_sessions` khỏi `localStorage`.
    - Gọi dispatch action `LOGOUT`.
    - Bật thông báo cho người chơi biết ban tổ chức đã reset và tự động đăng xuất thiết bị.
  - Cập nhật action `LOGOUT` dọn sạch toàn bộ cache.
- **`frontend/src/lib/supabase.ts`**:
  - Khi lưu phiên (`savePlayerSession`), nếu API phản hồi cờ `force_logout: true`, ngay lập tức kích hoạt `multiplayerSync.broadcastSystemReset()`.
  - Cập nhật `generateConfirmationCode` mặc định vụ 1: `DTS-1-XXXX`.
- **`frontend/src/app/api/admin/sessions/route.ts` & `backend/api/admin-sessions.ts`**:
  - Khi nhận `action === 'clear'`:
    - Lưu mốc thời gian hệ thống `globalThis.__DTS_SYSTEM_RESET_AT__ = Date.now()`.
    - Xóa sạch session trong RAM server và Supabase PostgreSQL.
- **`frontend/src/app/api/sessions/route.ts` & `backend/api/sessions.ts`**:
  - Khi nhận yêu cầu lưu phiên từ client, kiểm tra nếu `start_time` của phiên nhỏ hơn mốc `__DTS_SYSTEM_RESET_AT__` thì từ chối và gửi cờ `force_logout: true`.

### 2.3. Bảng Quản Trị Admin (`frontend/src/app/admin/page.tsx`)
- **Nút "Dọn Sạch Bảng & Đăng Xuất (Reset)":**
  - Khi bấm xác nhận: Gọi API xóa dữ liệu trên server, đồng thời gọi `multiplayerSync.broadcastSystemReset()`.
  - Dọn sạch danh bạ thiết bị online, danh sách sự kiện telemetry trên giao diện Admin.
- **Thẻ thống kê "Tổng Người Chơi":**
  - Hiển thị theo `stats.totalParticipants = uniquePlayers.size` (số điều tra viên độc lập, 1 người chơi hiển thị đúng số 1).
  - Phụ đề làm rõ: *"Số điều tra viên đăng ký (Độc lập, không trùng lặp)"*.
- **Tab 2 "Tổng Hợp Người Tham Gia":**
  - Đếm theo số thí sinh duy nhất `uniqueParticipants.length`.
  - Mặc định bảng hiển thị `participantViewMode === 'unique'`, mỗi thí sinh chỉ chiếm 1 dòng duy nhất.
  - Cột *"Các Vụ Án Đã Tham Gia"* hiển thị trực quan các huy hiệu `Vụ #1`, `Vụ #2`, `Vụ #3`, `Vụ #4`, cho biết thí sinh này đã tham gia những vụ án nào mà không bị phân mảnh thành nhiều dòng.

---

## 3. KẾT QUẢ KIỂM THỬ

1. **Kiểm thử biên dịch Next.js (Production Build):**
   ```bash
   npm run build (frontend)
   ```
   - **Kết quả:** `Compiled successfully in 2.5s`
   - **TypeScript:** Hoàn thành trong 3.5s, không có bất kỳ lỗi linter/type error nào.
   - Toàn bộ 11 route tĩnh & động tạo thành công.

2. **Kiểm thử biên dịch Backend (TypeScript):**
   ```bash
   npm run build (backend)
   ```
   - **Kết quả:** `tsc` biên dịch thành công 100% với exit code 0.

---

## 4. BƯỚC TIẾP THEO

- Tiến hành commit và push mã nguồn lên nhánh `main` của GitHub để Vercel tự động kích hoạt tiến trình triển khai bản cập nhật mới nhất lên trang `https://biet-doi-dtra-so.vercel.app/`.
