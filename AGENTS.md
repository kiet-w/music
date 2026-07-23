# Devin Agent Rules - Music Project

## 🔴 CRITICAL FILES - KHÔNG SỬA KHÔNG CÓ YÊU CẦU RÕ RÀNG

### API Layer (Mạch máu kết nối frontend-backend)
- `frontend/src/lib/api.ts` - File tuyệt đối không sửa trừ khi user yêu cầu rõ ràng
- `frontend/src/lib/api.types.ts` (nếu có) - Type definitions cho API responses

### State Management (Zustand stores)
- `frontend/src/store/useAuthStore.ts`
- `frontend/src/store/usePlayerStore.ts` 
- `frontend/src/store/useChatStore.ts`
- `frontend/src/store/useAlbumStore.ts`
- `frontend/src/store/useDownloadHistoryStore.ts`

### Core Logic Hooks (API calling hooks)
- `frontend/src/hooks/useAuthGate.ts`
- `frontend/src/hooks/useGoogleDrive.ts`
- `frontend/src/hooks/useGoogleCallback.ts`
- `frontend/src/hooks/useYoutubeDownloader.ts`
- `frontend/src/hooks/useAlbums.ts`
- `frontend/src/hooks/useAlbumDetail.ts`
- `frontend/src/hooks/useChatSubscription.ts`
- `frontend/src/hooks/useFriends.ts`

### Routing & Auth Configuration
- `frontend/src/app/` - Route structure (chỉ sửa khi có yêu cầu rõ ràng)
- Middleware files if any

---

## 🟢 SAFE TO MODIFY - CÓ THỂ VIBE CODE THOẢI MÁI

### UI Components (Style, layout, animation)
- `frontend/src/components/atoms/**/*`
- `frontend/src/components/molecules/**/*`
- `frontend/src/components/organisms/**/*` (nếu có)
- `frontend/src/components/templates/**/*`
- `frontend/src/components/pages/**/*`

### UI-Only Hooks (không gọi API)
- `frontend/src/hooks/useKeyboardMode.ts`
- `frontend/src/hooks/useKeyboardVisible.ts`
- `frontend/src/hooks/useKeyboardHeight.ts`
- `frontend/src/hooks/useOfflineStorage.ts`

### Utility Functions (không liên quan API/network)
- `frontend/src/lib/utils.ts`
- `frontend/src/lib/security.ts`
- `frontend/src/lib/userStatus.ts`
- `frontend/src/lib/inviteCookie.ts`

### Styles & Assets
- `frontend/src/styles/**/*` (nếu có)
- `frontend/public/**/*`

---

## 🔐 QUY TRÌNH LÀM VIỆC AN TOÀN

### Khi user yêu cầu thay đổi UI/style:
1. **CHỈ** sửa files trong vùng 🟢 SAFE TO MODIFY
2. KHÔNG đụng vào API layer, state management, core hooks
3. Test lại UI thay đổi, đảm bảo không ảnh hưởng chức năng khác
4. Commit sau khi UI chạy ổn định

### Khi user yêu cầu thay đổi logic/chức năng:
1. Xác nhận rõ scope: chỉ file cụ thể nào được phép sửa
2. Nếu cần sửa critical files → BẮT BUỘC hỏi user xác nhận trước
3. Test kỹ luồng dữ liệu liên quan
4. Review diff với user trước khi commit

### Khi phát hiện lỗi kết nối/luồng dữ liệu:
1. **DỪNG LẠI** mọi thay đổi UI không liên quan
2. Tập trung vào API layer và core hooks
3. Fix từng bước nhỏ, test sau mỗi bước
4. Không refactor cấu trúc thư mục khi chưa ổn định

---

## 📁 CẤU TRÚC THƯ MỤC ĐỀ XUẤT (CHO TƯƠNG LAI)

Dùng **feature-based thuần**, không trộn lẫn Atomic Design:

```
frontend/src/
├── lib/                    # Critical utilities
│   ├── api.ts             # 🔴 KHÔNG SỬA
│   ├── api.types.ts       # 🔴 KHÔNG SỬA
│   └── utils.ts           # 🟢 An toàn
├── store/                 # 🔴 State management
│   ├── useAuthStore.ts
│   ├── usePlayerStore.ts
│   └── ...
├── hooks/                 # Hooks
│   ├── api/               # 🔴 API calling hooks
│   │   ├── useAuth.ts
│   │   ├── useAlbums.ts
│   │   └── ...
│   └── ui/                # 🟢 UI-only hooks
│       ├── useKeyboardMode.ts
│       └── ...
├── components/            # 🟢 UI components
│   ├── ui/                # Reusable UI components (Button, Input, Modal...)
│   └── features/          # Feature-based components
│       ├── music/
│       │   ├── youtube/
│       │   ├── drive/
│       │   └── player/
│       ├── chat/
│       ├── albums/
│       └── auth/
└── app/                   # 🔴 Next.js routing
```

---

## ⚠️ QUY TẮC QUAN TRỌNG

1. **KHÔNG bao giờ** sửa `lib/api.ts` khi user chỉ yêu cầu "làm đẹp UI"
2. **LUÔN LUÔN** hỏi xác nhận trước khi sửa files trong vùng 🔴
3. **Test kỹ** luồng kết nối backend sau mỗi thay đổi logic
4. **Commit từng bước nhỏ**, không refactor lớn cùng lúc
5. **Respect cấu trúc hiện tại** nếu user chưa yêu cầu refactor

---

## 🚨 KHI GẶP VẤN ĐỀ

Nếu thấy lỗi kết nối API, authentication failure, hoặc luồng dữ liệu bị lỗi:
1. **Dừng ngay** thay đổi đang làm
2. Kiểm tra `lib/api.ts` xem có bị sửa vô tình không
3. Kiểm tra các store hooks xem có bị thay đổi không
4. Report ngay cho user với diff files bị ảnh hưởng

---

## 📝 HISTORY & NOTES

- **2026-07-23**: Created initial rules to protect API layer and state management
- **Backend connection flow**: APK ↔ Render - cần ổn định trước khi refactor UI structure
- **Current state**: Using Atomic Design structure, will migrate to feature-based in future