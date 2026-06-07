# Frontend Plan: Friend Invitation System

## 1. Context & Objectives
Xây dựng giao diện trang nhận lời mời, popup xác nhận và tích hợp API để người dùng có thể chấp nhận kết nối.

## 2. Granular Tasks
- [x]
  - **Action:** Thêm các chuỗi dịch cho "Invite", "Accept", "Expired link", "Invite Popup" vào `frontend/src/messages/en.json` và `vi.json`.
  - **Verification:** Kiểm tra các keys mới có trong file JSON.
- [x]
  - **Action:** Thêm `getInviteInfo` và `acceptInvite` vào `frontend/src/lib/api.ts`.
  - **Verification:** Các hàm export đúng kiểu dữ liệu.
- [x]
  - **Action:** Tạo component `InvitePopup` trong `frontend/src/components/molecules/Chat/InvitePopup.tsx` sử dụng shadcn/ui.
  - **Verification:** Hiển thị đúng mockup đã thiết kế trên Visual Companion.
- [x]
  - **Action:** Tạo file `frontend/src/app/[locale]/invite/page.tsx` để xử lý query param `token`.
  - **Verification:** Truy cập `/vi/invite?token=test` hiển thị giao diện loading.
- [x]
  - **Action:** Trong trang Invite, gọi API lấy info và hiển thị Popup hoặc thông báo lỗi nếu link hết hạn.
  - **Verification:** Hiển thị đúng tên người mời từ API.
- [x]
  - **Action:** Khi nhấn Accept, gọi API và điều hướng người dùng về `/messages?u=senderId`.
  - **Verification:** Chuyển trang thành công và mở đúng khung chat.
- [x]
  - **Action:** Bổ sung logic để tự động mở khung chat khi có query param `u` (userId).
  - **Verification:** Load tin nhắn ngay khi redirect từ trang invite.
