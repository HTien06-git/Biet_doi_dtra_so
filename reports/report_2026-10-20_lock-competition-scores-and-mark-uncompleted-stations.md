# BÁO CÁO TIẾN ĐỘ: KHÓA ĐIỂM THI ĐẤU KHÔNG CHO CHƠI LẠI & ĐÁNH DẤU TRẠM KHÔNG HOÀN THÀNH

- **Dự án:** Đội Điều Tra Số (Digital Detective Game)
- **Thời gian thực hiện:** 2026-10-20 20:08 (UTC+7)
- **Trạng thái:** Hoàn tất xuất sắc, đã kiểm tra build Next.js & TypeScript pass 100%.

---

## 1. MỤC TIÊU & YÊU CẦU ĐẶT RA

Theo yêu cầu từ ban tổ chức cuộc thi:
> *"vì đây là cuộc thi sau khi chơi xong không cho chơi lại để sửa điểm, các trạm không hoàn thành thì đánh dấu không hoàn thành trạm, không tìm ra được manh mối"*

Hệ thống cần đảm bảo tính công bằng và nghiêm ngặt của giải đấu:
1. **Khóa điểm sau khi chơi xong, tuyệt đối không cho chơi lại để sửa điểm:**
   - Xóa bỏ nút `CHƠI LẠI` tại màn hình tổng kết ([SummaryScreen.tsx](file:///d:/DU_AN/Biet_doi_dtra_so/frontend/src/components/SummaryScreen.tsx)).
   - Tại màn hình danh sách vụ án ([LobbyScreen.tsx](file:///d:/DU_AN/Biet_doi_dtra_so/frontend/src/components/LobbyScreen.tsx)), các vụ án đã hoàn thành (`isCompleted`) sẽ hiển thị huy hiệu `XEM KẾT QUẢ` và dẫn thẳng đến màn hình kết quả phá án; thí sinh không thể vào lại trạm để trả lời lại hay cải thiện điểm.
   - Xóa bỏ nút Reset ("Chơi Lại Từ Đầu") trên giao diện thí sinh nhằm ngăn chặn việc tự ý xóa dữ liệu để thi lại (chỉ quản trị viên tại `/admin` mới có quyền reset hệ thống).
   - Tại màn hình lộ trình trạm ([StationsScreen.tsx](file:///d:/DU_AN/Biet_doi_dtra_so/frontend/src/components/StationsScreen.tsx)), các trạm đã qua hoặc vụ án đã hoàn tất đều bị khóa, không thể bấm vào chơi lại.

2. **Đánh dấu rõ ràng các trạm không hoàn thành và không tìm ra manh mối:**
   - Tại **Sổ tay bằng chứng** ([SummaryScreen.tsx](file:///d:/DU_AN/Biet_doi_dtra_so/frontend/src/components/SummaryScreen.tsx)):
     - Trạm không hoàn thành (`!clueUnlocked`): Hiển thị viền đỏ cảnh báo `border-[#DC2626] bg-[#FEF2F2]`, icon `❌`, huy hiệu `KHÔNG ĐẠT`, dòng trạng thái rõ ràng:
       - **Không hoàn thành trạm**
       - **Không tìm ra được manh mối**
     - Khi bấm vào trạm không hoàn thành, modal thông báo chi tiết: *"Không tìm ra được manh mối: Do điều tra viên không đưa ra đáp án chính xác hoặc chưa vượt qua thử thách tại trạm, manh mối chứng cứ số tại hiện trường không được thu thập (+0 điểm)."*
   - Tại **Lộ trình trạm** ([StationsScreen.tsx](file:///d:/DU_AN/Biet_doi_dtra_so/frontend/src/components/StationsScreen.tsx)):
     - Trạm thất bại được đánh số hiệu `✕` màu đỏ, huy hiệu `KHÔNG HOÀN THÀNH`, hiển thị `+0đ · Không tìm ra manh mối`.

---

## 2. CHI TIẾT CÁC THAY ĐỔI TRONG MÃ NGUỒN

### 2.1. `frontend/src/components/SummaryScreen.tsx`
- **Xóa bỏ nút Chơi Lại:** Xóa hàm `handleReplayCase`, xóa nút `CHƠI LẠI`. Thanh hành động chân trang chỉ còn 2 nút đối xứng: `BẢNG XẾP HẠNG` và `HỒ SƠ VỤ TIẾP THEO` (hoặc `VỀ DANH SÁCH VỤ ÁN`).
- **Thiết kế lại ô trạm không hoàn thành:** Thể hiện rõ ràng biểu tượng `❌`, huy hiệu `KHÔNG ĐẠT`, tiêu đề `Không hoàn thành trạm` và phụ đề `Không tìm ra được manh mối`.
- **Cập nhật Clue Inspector Modal:** Phân nhánh hiển thị riêng biệt khi mở trạm chưa hoàn thành để giải thích lý do không có chứng cứ số.

### 2.2. `frontend/src/components/LobbyScreen.tsx`
- **Khóa vụ án đã phá xong:** Trong `handleSelectCase`, nếu vụ án có `caseProg?.isCompleted = true`, lập tức điều hướng đến màn hình `summary` (Xem kết quả phá án) thay vì cho vào lại trạm giải đố.
- **Hiển thị huy hiệu `XEM KẾT QUẢ`:** Thay thế mũi tên vào chơi bằng huy hiệu xanh lá `XEM KẾT QUẢ` cho các vụ án đã hoàn tất.
- **Xóa tính năng tự Reset:** Loại bỏ hoàn toàn nút "Chơi Lại Từ Đầu" khỏi menu Desktop và Mobile của thí sinh.

### 2.3. `frontend/src/components/StationsScreen.tsx`
- **Trạng thái trạm thất bại (`failed`):** Bổ sung trạng thái `failed` khi trạm đã thử nhưng không mở được manh mối hoặc vụ án đã kết thúc mà trạm chưa qua.
- **Ngăn chặn click lại trạm đã xong/thất bại:** Khi `status === 'completed' || status === 'failed'`, phát âm thanh cảnh báo và không cho vào lại câu hỏi.
- **Nút điều hướng về Summary:** Bổ sung nút `XEM BÁO CÁO PHÁ ÁN (ĐÃ KHÓA ĐIỂM)` ở cuối màn hình lộ trình nếu vụ án đã hoàn tất.

---

## 3. KIỂM THỬ & XÁC NHẬN CHẤT LƯỢNG

- **TypeScript Typecheck (`npx tsc --noEmit`):** Pass 100% không phát sinh lỗi.
- **Next.js Production Build (`npm run build`):** Pass 100%, Turbopack biên dịch thành công toàn bộ 11 static và dynamic routes.
- **Độ tin cậy thi đấu:** Không còn bất kỳ kẽ hở nào cho phép thí sinh tự sửa điểm hoặc thi lại khi chưa có chỉ định reset từ ban tổ chức.
