# 🚀 Plan Chi Tiết: Chuyển Đổi Frontend (Next.js / React Web) Sang React Native (Expo)

Plan này được thiết lập dựa trên kết quả phân tích cấu trúc codebase hiện tại của dự án [frontend](file:///home/baudui/music/frontend), tuân thủ nghiêm ngặt các quy định bảo vệ core trong [AGENTS.md](file:///home/baudui/music/AGENTS.md) và áp dụng triệt để tư duy **Ponytail (Minimalism, YAGNI, Reusability, Zero Bloat)**.

---

## 🎯 1. Tư Tưởng Chủ Đạo & Nguyên Tắc Ponytail

1. **YAGNI (You Aren't Gonna Need It)**: Loại bỏ toàn bộ các tệp và khái niệm chỉ phục vụ Web/Server (`Next.js App Router`, SSR, `middleware.ts`, CSS Modules, DOM APIs, `next-intl` server wrapper, `sentry.server.config.ts`, HTML templates).
2. **Tái sử dụng tối đa (Ladder Rung 2)**: Reuse **100%** tầng Business Logic, API client ([lib/api.ts](file:///home/baudui/music/frontend/src/lib/api.ts)), các Zustand Store trong [src/store](file:///home/baudui/music/frontend/src/store) và các API Calling Hooks trong [src/hooks](file:///home/baudui/music/frontend/src/hooks). Không viết lại bất kỳ logic kết nối nào đã hoạt động ổn định!
3. **Ưu tiên Native Standard (Ladder Rung 4)**: Dùng UI primitives có sẵn của React Native (`View`, `Text`, `Pressable`, `FlatList`, `TextInput`, `StyleSheet`). Không cài đặt thêm các UI Framework cồng kềnh (NativeWind/Tamagui/Gluestack) khi `StyleSheet` chuẩn đã giải quyết mượt mà.
4. **Tệp thư viện tối giản (Minimal Dependencies)**:
   - **Framework / Router**: Expo SDK + `expo-router` (routing dạng file-system tương tự Next App Router).
   - **Audio Player Engine**: `expo-av` (hoặc `react-native-track-player` khi cần điều khiển nhạc background khi khóa màn hình).
   - **Storage Engine**: `@react-native-async-storage/async-storage` (thay cho `localStorage` của trình duyệt).
   - **Realtime**: `socket.io-client` (đã có sẵn trong `package.json`).
   - **Icons**: `@expo/vector-icons` (thay thế cho `lucide-react`).

---

## 🔴 vs 🟢 Phân Loại Thành Phần Theo `AGENTS.md`

| Phân Loại | Thư Mục / File | Chiến Lược Chuyển Đổi (Ponytail Way) |
| :--- | :--- | :--- |
| **🔴 CRITICAL (API Layer)** | [src/lib/api.ts](file:///home/baudui/music/frontend/src/lib/api.ts)<br>[src/lib/api.types.ts](file:///home/baudui/music/frontend/src/lib/api.types.ts) | **Giữ nguyên 100% logic API & types**. Cập nhật duy nhất: đặt `isNative = true`, chuyển auth token storage getter từ `localStorage` sang `AsyncStorage`. |
| **🔴 CRITICAL (State Management)** | [src/store/useAuthStore.ts](file:///home/baudui/music/frontend/src/store/useAuthStore.ts)<br>[src/store/useAlbumStore.ts](file:///home/baudui/music/frontend/src/store/useAlbumStore.ts)<br>[src/store/useChatStore.ts](file:///home/baudui/music/frontend/src/store/useChatStore.ts)<br>[src/store/useDownloadHistoryStore.ts](file:///home/baudui/music/frontend/src/store/useDownloadHistoryStore.ts) | **Giữ nguyên 100% Zustand action & state logic**. Cấu hình Zustand `persist` sang `createJSONStorage(() => AsyncStorage)`. |
| **🔴 CRITICAL (Audio Core State)** | [src/store/usePlayerStore.ts](file:///home/baudui/music/frontend/src/store/usePlayerStore.ts) | **Giữ nguyên State & Queue logic**. Thay thế `Howler.js` (`_howl`) bằng `Audio.Sound` của `expo-av` hoặc `TrackPlayer` nằm bên ngoài Zustand store. |
| **🔴 CRITICAL (Core Logic Hooks)** | [src/hooks/useAlbums.ts](file:///home/baudui/music/frontend/src/hooks/useAlbums.ts)<br>[src/hooks/useAlbumDetail.ts](file:///home/baudui/music/frontend/src/hooks/useAlbumDetail.ts)<br>[src/hooks/useAuthGate.ts](file:///home/baudui/music/frontend/src/hooks/useAuthGate.ts)<br>[src/hooks/useChatSubscription.ts](file:///home/baudui/music/frontend/src/hooks/useChatSubscription.ts)<br>[src/hooks/useFriends.ts](file:///home/baudui/music/frontend/src/hooks/useFriends.ts)<br>[src/hooks/useGoogleDrive.ts](file:///home/baudui/music/frontend/src/hooks/useGoogleDrive.ts)<br>[src/hooks/useYoutubeDownloader.ts](file:///home/baudui/music/frontend/src/hooks/useYoutubeDownloader.ts) | **Giữ nguyên 100% logic gọi API & state sync**. Không chỉnh sửa logic xử lý dữ liệu. |
| **🟢 SAFE TO CONVERT (UI Hooks)** | [src/hooks/useKeyboardMode.ts](file:///home/baudui/music/frontend/src/hooks/useKeyboardMode.ts)<br>[src/hooks/useKeyboardVisible.ts](file:///home/baudui/music/frontend/src/hooks/useKeyboardVisible.ts)<br>[src/hooks/useKeyboardHeight.ts](file:///home/baudui/music/frontend/src/hooks/useKeyboardHeight.ts) | Thay bằng React Native `Keyboard` API chuẩn (`Keyboard.addListener('keyboardDidShow')`). |
| **🟢 SAFE TO CONVERT (UI Components)** | [src/components/atoms/](file:///home/baudui/music/frontend/src/components/atoms)<br>[src/components/molecules/](file:///home/baudui/music/frontend/src/components/molecules)<br>[src/components/features/](file:///home/baudui/music/frontend/src/components/features) | Chuyển đổi DOM (`div`, `span`, `button`, `img`) sang React Native Primitives (`View`, `Text`, `Pressable`, `Image`). |
| **🟢 SAFE TO CONVERT (Routing)** | [src/app/](file:///home/baudui/music/frontend/src/app) | Chuyển toàn bộ routes Next App Router sang `Expo Router` cấu trúc `app/(auth)` và `app/(tabs)`. |

---

## 🗺️ Bảng Mapping Chi Tiết File Web -> React Native

### 1. Core & API Layer (🔴 Preserved)

| Web Source File | React Native Target Path | Thay Đổi Nhẹ (Ponytail Adjustment) |
| :--- | :--- | :--- |
| `src/lib/api.ts` | `src/lib/api.ts` | Thay `localStorage.getItem` -> `AsyncStorage.getItem`. Đặt `isNative = true`. |
| `src/lib/api.types.ts` | `src/lib/api.types.ts` | Giữ nguyên 100%. |
| `src/lib/utils.ts` | `src/lib/utils.ts` | Giữ nguyên 100%. |
| `src/lib/security.ts` | `src/lib/security.ts` | Giữ nguyên 100%. |

### 2. State Stores (🔴 Preserved)

| Web Store File | React Native Target Path | Động Cơ Âm Thanh / Storage |
| :--- | :--- | :--- |
| `useAuthStore.ts` | `src/store/useAuthStore.ts` | `persist` lưu bằng `AsyncStorage`. |
| `usePlayerStore.ts` | `src/store/usePlayerStore.ts` | Thay `Howler.js` bằng `expo-av` (hoặc `react-native-track-player`). GIỮ NGUYÊN queue & reorder logic. |
| `useChatStore.ts` | `src/store/useChatStore.ts` | Giữ nguyên 100% (`socket.io-client` hoạt động mượt mà trên RN). |
| `useAlbumStore.ts` | `src/store/useAlbumStore.ts` | Giữ nguyên 100%. |
| `useDownloadHistoryStore.ts` | `src/store/useDownloadHistoryStore.ts` | Kết hợp `expo-file-system` để lưu nhạc tải về đĩa máy. |

### 3. Navigation & Routing (Expo Router)

| Đường Dẫn Next.js Web | Expo Router File | Giao Diện RN Tương Ứng |
| :--- | :--- | :--- |
| `app/[locale]/login/page.tsx` | `app/(auth)/login.tsx` | Login Screen (`TextInput` + `Pressable`) |
| `app/[locale]/register/page.tsx` | `app/(auth)/register.tsx` | Register Screen |
| `app/[locale]/music/page.tsx` | `app/(tabs)/music.tsx` | Player Screen / Now Playing Screen |
| `app/[locale]/albums/page.tsx` | `app/(tabs)/albums.tsx` | Album Grid (`FlatList` 2 cột) |
| `app/[locale]/albums/detail/page.tsx` | `app/albums/[id].tsx` | Album Detail View + Track List |
| `app/[locale]/messages/page.tsx` | `app/(tabs)/messages.tsx` | Realtime Chat Screen (`FlatList`) |
| `app/[locale]/user/page.tsx` | `app/(tabs)/user.tsx` | User Profile & Settings Screen |
| `app/[locale]/youtube/page.tsx` | `app/(tabs)/youtube.tsx` | YouTube Search & Downloader Screen |

---

## 📁 Cấu Trúc Thư Mục Đề Xuất (Feature-Based chuẩn `AGENTS.md`)

```
frontend-rn/
├── app/                        # 🔴 Routing (Expo Router)
│   ├── _layout.tsx             # Root layout (AuthGate + Global Providers)
│   ├── (auth)/                 # Luồng xác thực
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/                 # Bottom Tabs chính
│   │   ├── _layout.tsx
│   │   ├── music.tsx
│   │   ├── albums.tsx
│   │   ├── messages.tsx
│   │   └── user.tsx
│   └── albums/
│       └── [id].tsx            # Album Detail screen
├── src/
│   ├── lib/                    # 🔴 API & Core Utils
│   │   ├── api.ts              # Reused từ Web
│   │   ├── api.types.ts        # Reused từ Web
│   │   └── utils.ts            # Reused từ Web
│   ├── store/                  # 🔴 Zustand Stores
│   │   ├── useAuthStore.ts     # AsyncStorage persist
│   │   ├── usePlayerStore.ts   # expo-av audio engine
│   │   ├── useChatStore.ts     # Socket.io chat store
│   │   ├── useAlbumStore.ts
│   │   └── useDownloadHistoryStore.ts
│   ├── hooks/                  # Hooks
│   │   ├── api/                # 🔴 API Calling Hooks (Reused 100%)
│   │   │   ├── useAlbums.ts
│   │   │   ├── useAlbumDetail.ts
│   │   │   ├── useAuthGate.ts
│   │   │   ├── useChatSubscription.ts
│   │   │   ├── useFriends.ts
│   │   │   ├── useGoogleDrive.ts
│   │   │   └── useYoutubeDownloader.ts
│   │   └── ui/                 # 🟢 UI Native Hooks
│   │       ├── useAudioPlayer.ts
│   │       ├── useKeyboard.ts
│   │       └── useOfflineStorage.ts
│   └── components/             # 🟢 UI Components
│       ├── ui/                 # Reusable Native Primitives (Button, Input, Card, Modal, Skeleton)
│       └── features/           # Feature Components (music, chat, albums, auth...)
```

---

## 🚀 Quy Trình Thực Hiện An Toàn (5 Giai Đoạn)

### Giai Đoạn 1: Khởi Tạo Dự Án Expo & Cấu Hình Tối Giản (Day 1)
1. Tạo dự án Expo với Expo Router:
   ```bash
   npx create-expo-app@latest frontend-rn --template blank-typescript
   ```
2. Cài đặt các dependencies cốt lõi:
   ```bash
   npx expo install expo-router expo-av @react-native-async-storage/async-storage expo-file-system @expo/vector-icons zustand socket.io-client
   ```
3. Cấu hình TypeScript path alias `@/` trỏ vào `./src`.

### Giai Đoạn 2: Port & Bảo Vệ 🔴 Core Logic (Day 1 - Day 2)
1. **Copy nguyên vẹn** [lib/api.ts](file:///home/baudui/music/frontend/src/lib/api.ts) và bổ sung adapter `AsyncStorage` cho `getAuthHeaders()`.
2. **Copy nguyên vẹn** các Zustand Store vào `src/store/`. Thay adapter `Howler` bằng `expo-av` trong [usePlayerStore.ts](file:///home/baudui/music/frontend/src/store/usePlayerStore.ts).
3. **Copy nguyên vẹn** toàn bộ API Hooks trong [src/hooks](file:///home/baudui/music/frontend/src/hooks) sang `src/hooks/api/`.
4. Run check tự động: Kiểm tra TypeScript compile 0 lỗi logic.

### Giai Đoạn 3: Dựng UI Primitives Nền Tảng (🟢 Safe UI) (Day 2 - Day 3)
1. Xây dựng các UI Atom chuẩn Native đơn giản trong `src/components/ui/`:
   - `Button.tsx` (`Pressable` + `Text` với hiệu ứng active opacity).
   - `Input.tsx` (`TextInput` + border/padding style).
   - `Card.tsx` (`View` + rounded corner + shadow).
   - `TrackSkeleton.tsx` / `AlbumSkeleton.tsx` (`Animated.View`).
2. Thay thế `lucide-react` bằng `@expo/vector-icons` (`Ionicons` / `Feather`).

### Giai Đoạn 4: Dựng Màn Hình & Navigation (Day 3 - Day 4)
1. Thiết lập Bottom Tab Navigator trong `app/(tabs)/_layout.tsx` (Icons: Music, Albums, Messages, Profile).
2. Dựng màn hình **Music Player** (`app/(tabs)/music.tsx`): SeekBar (`Slider`), Controls (Play/Pause/Skip), Track Cover (`Image`).
3. Dựng màn hình **Albums** (`app/(tabs)/albums.tsx`): Dùng `FlatList` với `numColumns={2}` thay cho CSS Grid.
4. Dựng màn hình **Chat** (`app/(tabs)/messages.tsx`): `FlatList` với `inverted` để xem tin nhắn realtime mượt mà.
5. Dựng màn hình **Auth & Dialogs** (`app/(auth)/login.tsx`, `CreateAlbumModal`).

### Giai Đoạn 5: Kiểm Thử Kết Nối Backend (Day 5)
1. Test kết nối với Backend Render (`https://music-backend-cb0i.onrender.com`).
2. Verify luồng đăng nhập -> JWT Token lưu vào `AsyncStorage`.
3. Verify luồng phát nhạc từ nhạc server / Drive qua `expo-av`.
4. Verify luồng chat realtime qua Socket.io.

---

## 📌 Ponytail Audit & Ghi Chú Tối Giản

`[Codebase RN Migration] -> skipped: [Next.js SSR/middleware, Tailwind/NativeWind, Howler.js, complex UI frameworks], add when [Background audio requires LockScreen controls (upgrade to react-native-track-player), or design tokens require multi-theme engine].`

- **Audio Player Engine**: Dùng `expo-av` trước cho ngắn gọn. *Thêm `react-native-track-player` khi cần điều khiển nhạc ngoài LockScreen của iOS/Android.*
- **UI Styling**: Dùng `StyleSheet.create()` chuẩn của React Native. *Bỏ qua Tailwind/NativeWind để giảm overhead build.*
- **Storage**: Dùng `AsyncStorage`. *Thêm `expo-secure-store` khi cần mã hóa sinh trắc học/FaceID.*
