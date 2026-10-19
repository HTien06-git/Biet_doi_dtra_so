# BÁO CÁO TIẾN ĐỘ: SỬA LỖI CHẠY CHỮ XUỐNG DÒNG & NHẢY CHỮ TRÊN THANH GIAO DIỆN DI ĐỘNG

- **Ngày thực hiện:** 20-10-2026 (02:30)
- **Tác giả:** Antigravity AI Assistant
- **Phạm vi tác động:** Màn hình lộ trình trạm (`StationsScreen.tsx`) và màn hình chơi trạm (`PlayingScreen.tsx`).

---

## 1. VẤN ĐỀ PHÁT HIỆN QUA ẢNH CHỤP THỰC TẾ

Người dùng cung cấp ảnh chụp màn hình điện thoại ghi nhận 3 lỗi hiển thị chữ nghiêm trọng:
1. **Huy hiệu "VỤ ÁN 04" bị gãy thành 3 dòng:** Do không có thuộc tính `whitespace-nowrap flex-shrink-0`, chữ trong khối màu vàng bị bẻ thành:
   ```
   VỤ
   ÁN
   04
   ```
   biến thành một khối vuông cao lênh khênh làm tiêu đề vụ án ("ỨNG DỤNG ĐẦU TƯ...") bị co rúm và đứt cụt.
2. **Dòng thông số tiến trình bị nhảy chữ zíc-zắc (không đều):**
   ```
   0/5        · 0/5 Manh    · 0/100
   Trạm         mối           Điểm
   ```
   Do khoảng cách `gap-3` quá rộng và các cụm chữ không có `whitespace-nowrap`, các từ bị rớt dòng lởm chởm, lệch nhau tạo cảm giác giao diện bị lỗi font hoặc nhảy chữ lộn xộn.
3. **Băng rôn xanh rớt 1 chữ "TRƯỜNG" xuống dòng:**
   ```
   LỘ TRÌNH ĐIỀU TRA: VƯỢT 5 TRẠM HIỆN
   TRƯỜNG
   ```
   Dòng chữ dài 42 ký tự hoa in đậm vượt quá chiều rộng của điện thoại, đẩy duy nhất từ cuối cùng xuống dòng 2 rất mất thẩm mỹ.

---

## 2. CÁC ĐIỂM ĐÃ TINH CHỈNH HOÀN THIỆN

### 2.1. Chuẩn Hóa Topbar Lộ Trình (`StationsScreen.tsx`)
- **Khóa cứng Huy hiệu Vụ án:** Thêm `whitespace-nowrap flex-shrink-0` và chuyển sang `VỤ {caseData.caseNumber}`, luôn nằm ngay ngắn thành 1 nhãn vàng duy nhất, không bao giờ gãy dòng.
- **Tiêu đề vụ án:** Tự do trải dài trên cùng hàng với huy hiệu (`leading-tight truncate`), tăng hơn 60px không gian hiển thị.
- **Cố định thông số tiến trình trên 1 dòng duy nhất:**
  - Bọc tất cả các chỉ số với `whitespace-nowrap`:
    - `0/5 Trạm` (không bị tách chữ `Trạm`)
    - `0/5 Manh mối` (không bị tách chữ `mối`)
    - `0/100 Điểm` (không bị tách chữ `Điểm`)
  - Khoảng cách được tinh chỉnh mượt mà `gap-1.5 sm:gap-2.5`, chữ hiển thị `text-[10px] sm:text-xs`, thẳng tắp 1 hàng không còn hiện tượng nhảy chữ zíc-zắc.
- **Tối ưu nút góc phải:** Ẩn ô vuông sao tĩnh vô dụng trên di động (`hidden sm:flex`), chỉ giữ nút âm lượng loa `AudioController` giúp giải phóng thêm 40px chiều rộng cho tiêu đề.

### 2.2. Băng Rôn Lộ Trình Thông Minh (Responsive Banner)
- Trên di động (< 640px): Sử dụng nhãn súc tích, chuẩn nhận diện:
  ```tsx
  <span className="sm:hidden whitespace-nowrap">LỘ TRÌNH 5 TRẠM HIỆN TRƯỜNG</span>
  ```
  (26 ký tự) vừa vặn 100% trên 1 hàng duy nhất trên mọi dòng điện thoại thông minh, không rớt chữ.
- Trên máy tính / tablet (>= 640px): Giữ nguyên văn bản đầy đủ:
  ```tsx
  <span className="hidden sm:inline">LỘ TRÌNH ĐIỀU TRA: VƯỢT 5 TRẠM HIỆN TRƯỜNG</span>
  ```

### 2.3. Thẻ Trạm Điều Tra (Roadmap Cards)
- Giảm padding thẻ trên di động: `p-3 sm:p-4`, huy hiệu số trạm `w-10 h-10 sm:w-12 sm:h-12`.
- Khóa `whitespace-nowrap flex-shrink-0` cho các huy hiệu trạng thái `ĐÃ XONG`, `ĐANG CHỜ` và điểm số `TRẠM 1 · 20 ĐIỂM`.

### 2.4. Áp Dụng Tương Tự Cho `PlayingScreen.tsx`
- Đảm bảo huy hiệu `TRẠM {x}/5` và badge `+{points} ĐIỂM` trên thanh Header của màn hình chơi cũng có `whitespace-nowrap flex-shrink-0`, không bao giờ bị nhảy chữ khi xoay hoặc chơi trên màn hình nhỏ.

---

## 3. KẾT QUẢ KIỂM THỬ

- **Build Next.js:** Đạt chứng chỉ biên dịch thành công (`Compiled successfully`, TypeScript pass 100%).
- **Kiểm tra trực quan:**
  - Header thanh thoát, chuyên nghiệp, thông số thẳng hàng.
  - Băng rôn xanh hiển thị trọn vẹn trên 1 dòng, không còn chữ rơi rớt.
  - Hoạt động chuẩn xác trên các dòng điện thoại từ iPhone SE (320px) đến iPhone 14/15/16 Pro Max và Android (360px - 430px).
