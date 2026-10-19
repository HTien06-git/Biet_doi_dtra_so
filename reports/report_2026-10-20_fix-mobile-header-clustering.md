# BÁO CÁO TIẾN ĐỘ: TỐI ƯU HÓA THANH ĐIỀU HƯỚNG TOPBAR TRÊN THIẾT BỊ DI ĐỘNG (XÓA BỎ DÍNH CHÙM & CHỒNG ĐÈ)

- **Dự án:** Đội Điều Tra Số (Case Hunter 2D Game)
- **Thời gian thực hiện:** 2026-10-20 02:02 (UTC+7)
- **Trạng thái:** Hoàn thành xuất sắc, đã kiểm tra build Next.js pass 100%.

---

## 1. NGUYÊN NHÂN GÂY NÊN LỖI "DÍNH CHÙM VÀ RỐI" TRÊN ĐIỆN THOẠI

Từ ảnh chụp màn hình thực tế trên thiết bị di động (Android / màn hình dọc hẹp):
1. **Chồng đè nút nổi toàn cục từ `page.tsx`:**
   - Trong `frontend/src/app/page.tsx`, khối điều khiển nổi cố định (`fixed top-3 right-3 z-50`) được kích hoạt khi `currentScreen !== 'playing'`. Khi người chơi vào `LobbyScreen`, khối này tạo thêm 2 nút hình tròn màu trắng (Bảng Vàng + Loa) đè trực tiếp lên vị trí của các nút trong thanh Header của `LobbyScreen`.
   - Kết quả: Có tới 2 nút Bảng Vàng và 2 nút Loa nằm chồng lấn lên nhau.
2. **Quá nhiều nút (5 nút) chen chúc trong 1 hàng ngang hẹp:**
   - Trên màn hình điện thoại (chiều rộng 360px - 400px), hàng nút bên phải chứa cùng lúc: Bảng Vàng (vàng), Loa BGM, Cài Đặt (Admin), Reset (chơi lại), và Đổi điều tra viên (đỏ). Tổng chiều rộng vượt quá không gian hiển thị khiến các nút bị ép sát nhau, dính chùm và mất tính thẩm mỹ.
3. **Thanh trượt âm lượng Popover bị ghim cố định trên màn hình:**
   - Thuộc tính `showVolumeSlider={true}` trên thẻ `<AudioController />` khiến khung trượt âm lượng màu đen (`[🎵 ●--- 60%]`) luôn hiển thị thường trực bên dưới nút loa, che khuất một phần nội dung và các thẻ phía dưới.

---

## 2. CÁC NÂNG CẤP & CHỈNH SỬA ĐÃ THỰC HIỆN

### 2.1. Loại Bỏ Nút Nổi Trùng Lặp Trong `page.tsx`
- Giới hạn khối nút nổi `fixed top-3 right-3` chỉ hiển thị **duy nhất tại màn hình Chào Mừng (`WelcomeScreen`)** để người chơi bật/tắt nhạc trước khi đăng nhập.
- Khi đã vào `LobbyScreen`, `StationsScreen`, `PlayingScreen` hoặc `SummaryScreen`, toàn bộ điều khiển được tích hợp đồng bộ vào thanh Header chính của màn hình đó, chấm dứt hoàn toàn tình trạng đè nút.

### 2.2. Thiết Kế Lại Topbar `LobbyScreen` Chuẩn Mobile-First
- **Trên Điện Thoại (Màn hình nhỏ < 640px):**
  - Rút gọn chỉ còn **3 nút chuẩn mực, phân bổ khoảng cách thoáng đãng và đẹp mắt:**
    1. 🏆 **Nút Bảng Vàng:** Nút vàng nổi bật, bo góc mượt mà, chữ in hoa rõ ràng.
    2. 🔊 **Nút Âm Thanh BGM:** Tắt/bật nhạc nền Conan với hiệu ứng sóng âm hoạt họa sống động.
    3. ⋮ **Nút Menu Tuỳ Chọn (`MoreVertical`):** Gom toàn bộ các tính năng phụ ít dùng (Quản trị Admin, Chơi lại từ đầu, Đổi điều tra viên) vào một menu thả xuống (Dropdown Popover) sang trọng, tự động đóng khi chạm bên ngoài.
- **Trên Máy Tính / Tablet (Màn hình lớn >= 640px):**
  - Giữ nguyên các nút thao tác nhanh riêng biệt để tận dụng tối đa không gian màn hình rộng.

### 2.3. Tối Ưu Hóa Bộ Điều Khiển Âm Thanh (`AudioController.tsx`)
- Xóa bỏ việc popover trượt âm lượng tự ý hiện thường trực trên di động.
- Thanh trượt chỉ xuất hiện khi rê chuột trên màn hình máy tính (`hidden sm:flex`), đảm bảo trên điện thoại chạm vào nút loa sẽ bật/tắt tức thì mà không có bất kỳ popover nào chắn tầm nhìn.

---

## 3. KẾT QUẢ KIỂM THỬ
- Lệnh biên dịch: `npm run build` (Next.js 16.4.2 Turbopack)
- Kết quả: `Compiled successfully in 1329ms`, toàn bộ 11 route hợp lệ, 0 lỗi cú pháp / type error.
