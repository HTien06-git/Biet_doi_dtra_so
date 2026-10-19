# BÁO CÁO TIẾN ĐỘ: KHẮC PHỤC TRIỆT ĐỂ LỖI CHỒNG ĐÈ GIAO DIỆN HIỆN TRƯỜNG TRÊN DI ĐỘNG

- **Ngày thực hiện:** 20-10-2026 (02:15)
- **Tác giả:** Antigravity AI Assistant
- **Phạm vi tác động:** Toàn bộ 20 trạm điều tra thuộc 4 hồ sơ vụ án (`StationCanvas.tsx` và `PlayingScreen.tsx`).

---

## 1. VẤN ĐỀ PHÁT HIỆN QUA ẢNH CHỤP THỰC TẾ

Qua ảnh chụp màn hình điện thoại từ người dùng:
1. **Lỗi đè chữ nghiêm trọng giữa Thẻ Manh Mối và Bong Bóng Thoại:**
   - Bong bóng thoại nhân vật (`MINH • Nạn nhân bị đe dọa` / `Họ tự xưng là cán bộ điều tra C02...`) được ghim tại góc trên bên trái (`left-16 sm:left-24 top-2`).
   - Cụm 3 nút Manh mối tương tác (`MANH MỐI (3)` / `Nhật ký cuộc gọi lạ`, `Tin nhắn Telegram`, `Cảnh báo cô lập`) lại được ghim tại góc trên bên phải (`right-2 top-2`).
   - Trên màn hình điện thoại di động (chiều rộng khả dụng của khung hình chỉ khoảng 270px - 320px do có thêm khay gỗ bên trái), chiều rộng của hai khối cộng lại lên tới gần 400px khiến cụm thẻ manh mối đè thẳng lên mặt chữ của bong bóng thoại, che khuất hoàn toàn nội dung lời thoại của nhân vật.
2. **Tính chất ảnh hưởng:** Lỗi này xảy ra trên **tất cả 20 trạm** của cả 4 vụ án vì tất cả đều sử dụng chung động cơ kết xuất hiện trường `StationCanvas.tsx`.

---

## 2. GIẢI PHÁP THIẾT KẾ & TÁI PHÂN BỐ KHÔNG GIAN (ZERO-COLLISION LAYOUT)

Để đảm bảo không bao giờ xảy ra hiện tượng đè lên nhau trên bất kỳ độ phân giải di động nào (kể cả màn hình siêu hẹp như iPhone SE 320px):

### 2.1. Phân Tách Tuyệt Đối 3 Vùng Không Gian Riêng Biệt (Trên Di Động)

| Vùng Hiển Thị | Tọa Độ & Kích Thước | Phần Tử Bố Trí | Hiệu Ứng Trải Nghiệm |
| :--- | :--- | :--- | :--- |
| **VÙNG TRÊN (Top Zone)** | `top-2 left-2 right-2` (rộng toàn dải trên di động) | **Bong bóng thoại nhân vật (Comic Dialogue)** | Chiếm trọn bề ngang phía trên, chữ hiển thị 2-3 dòng thoáng đãng, dễ đọc 100%, đuôi thoại chỉ thẳng xuống đầu nhân vật bên dưới. |
| **VÙNG DƯỚI-TRÁI (Bottom-Left Zone)** | `bottom-0 left-2` | **Sprite Nhân vật Biểu Cảm 2D (DynamicCharacterSprite)** | Thu gọn nhẹ nhàng xuống `w-20 h-32` trên điện thoại, đứng gọn gàng sát góc trái, không lấn sang vùng khác. |
| **VÙNG DƯỚI-PHẢI (Bottom-Right Zone)** | `bottom-2 right-2` (trên PC tự động chuyển về `sm:top-3 sm:right-3.5`) | **Cụm Nút Manh Mối Tương Tác (Interactive Clues)** | Chuyển hẳn xuống góc dưới bên phải - nơi là khoảng sàn trống trong tất cả các khung cảnh hiện trường. |

### 2.2. Chi Tiết Kỹ Thuật Đã Tinh Chỉnh

1. **`StationCanvas.tsx`:**
   - **Tăng chiều cao tối thiểu an toàn:** `min-h-[320px] sm:min-h-[360px]` để đảm bảo khoảng trống theo chiều dọc giữa bong bóng thoại phía trên và cụm thẻ manh mối phía dưới luôn cách nhau hơn 100px.
   - **Bong bóng thoại:**
     ```tsx
     className="absolute left-2 sm:left-24 top-2 sm:top-3 right-2 sm:right-auto z-25 sm:max-w-[240px] md:max-w-[270px]"
     ```
     Đuôi bong bóng thoại định vị tại `left-6 sm:left-4` hướng đúng tâm đỉnh đầu nhân vật.
   - **Cụm thẻ manh mối tương tác:**
     ```tsx
     className="absolute right-2 sm:right-3.5 bottom-2 sm:top-3 sm:bottom-auto z-25 flex flex-col gap-1 sm:gap-1.5 items-end"
     ```
     Kích thước nút được tinh chỉnh `max-w-[130px] sm:max-w-[175px]` và chữ `text-[9px] sm:text-[11px]` siêu gọn gàng.
   - **Nhân vật:**
     ```tsx
     className="w-20 sm:w-32 h-32 sm:h-44 relative"
     ```
     Giảm độ choán chỗ trên di động xuống 80px bề ngang, tạo hành lang an toàn hơn 45px với cụm thẻ manh mối.

2. **`PlayingScreen.tsx`:**
   - Tối ưu lề trang trên di động từ `px-4 pt-4` sang `px-2 sm:px-4 pt-2 sm:pt-4`, tăng thêm 16px bề ngang cho sàn chơi game.
   - Tinh chỉnh khay gỗ chứa kính lúp bên trái: `w-12 sm:w-16` (thay vì cố định 56px), nhường thêm 8px cho khung canvas.

---

## 3. KẾT QUẢ KIỂM THỬ

- **Build Next.js:** Đạt chứng chỉ biên dịch hoàn hảo (`Compiled successfully`, TypeScript pass 100%).
- **Kiểm tra trực quan đa trạm:**
  - Áp dụng thành công cho **toàn bộ 20 trạm của 4 vụ án**.
  - Không còn bất kỳ sự chồng chéo nào giữa chữ thoại và thẻ manh mối.
  - Người chơi trên điện thoại có thể đọc rõ từng câu thoại và bấm soi manh mối dễ dàng bằng ngón tay cái ở góc dưới bên phải màn hình.
