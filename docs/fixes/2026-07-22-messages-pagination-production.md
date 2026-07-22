# 🛠️ Fixes – 2026-07-22: Messages UI, Pagination & Production Bugs

> **Ngày:** 22/07/2026
> **Môi trường:** NestJS (Backend) + Next.js 15 (Frontend)
> **Phạm vi:** Chat Messages, WebSocket Presence, Scroll Pagination

---

## 1. Runtime TypeError: `tracks.filter is not a function`

**File:** `frontend/src/components/molecules/Library/Library.tsx`

**Triệu chứng:**
```
TypeError: tracks.filter is not a function
  at Library.useMemo (Library.tsx:226:32)
```

**Nguyên nhân:**
`TransformInterceptor` của NestJS bọc response thành `{ statusCode, message, data }`. Với paginated endpoints, `data` lại là `{ data: [...], total, page }` → lồng 2 tầng. Hàm `fetchTracks` cũ chỉ unwrap 1 tầng nên trả về Object thay vì Array, khiến `tracks.filter` bị lỗi.

**Fix:**
```typescript
// frontend/src/lib/api.ts
function extractArrayData(result: any): any[] {
  if (Array.isArray(result?.data?.data)) return result.data.data; // ← double-wrap check
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result)) return result;
  // ... fallback checks
  return [];
}
```
Thêm guard `Array.isArray(tracks) ? tracks : []` trong `Library.tsx`.

---

## 2. Album List không hiển thị

**File:** `frontend/src/lib/api.ts` → `fetchAlbums`

**Triệu chứng:** Trang Albums luôn hiển thị "No albums yet" dù backend đã có dữ liệu.

**Nguyên nhân:** Cùng vấn đề double-nested response như lỗi #1. `fetchAlbums` trả về `{ data: [...], total: 21 }` (object) thay vì `[...]`.

**Fix:** `extractArrayData` kiểm tra `result?.data?.data` trước `result?.data`.

---

## 3. Ẩn nút Invite khi đang chat (UI)

**File:** `frontend/src/app/[locale]/messages/page.tsx`

**Yêu cầu:** Nút "Nhận lời mời" & "Invite Friend" chỉ hiện ở màn danh sách, ẩn đi khi đang trong cuộc trò chuyện trên mobile.

**Fix:**
```tsx
<div className={cn("flex items-center gap-1.5 shrink-0", activeReceiverId && "hidden md:flex")}>
```

---

## 4. Online/Offline User Presence

**Files:**
- `backend/src/messages/messages.gateway.ts`
- `frontend/src/lib/userStatus.ts` *(mới tạo)*
- `frontend/src/components/molecules/Chat/UserList.tsx`
- `frontend/src/app/[locale]/messages/page.tsx`

**Tính năng thêm mới:**
- Backend WebSocket track socket-to-user mapping, emit `userPresenceChanged` khi connect/disconnect.
- Frontend hiển thị:
  - 🟢 `Online` khi đang kết nối.
  - `Hoạt động X phút trước` (dưới 1 giờ).
  - `Hoạt động X giờ trước` (làm tròn xuống theo giờ, ví dụ 1h30m → "1 giờ").
  - `Hoạt động X ngày trước` (từ 24h+).
- Ticker interval 30s tự động cập nhật UI mà không reload.

**Utility:**
```typescript
// frontend/src/lib/userStatus.ts
export function getUserStatusText(isOnline, lastSeen) { ... }
```

---

## 5. Message Pagination (Infinite Scroll Up)

**Files:**
- `backend/src/messages/repositories/message.repository.ts`
- `backend/src/messages/messages.service.ts`
- `backend/src/messages/messages.controller.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/store/useChatStore.ts`
- `frontend/src/components/molecules/Chat/ChatWindow.tsx`

**Tính năng:**
- API `GET /messages/:userId?before=TIMESTAMP&limit=30` — cursor-based pagination.
- Tải 30 tin nhắn mới nhất khi mở chat.
- Khi cuộn lên đến `scrollTop <= 50px`, tự động fetch 30 tin cũ hơn.
- Scroll position được giữ nguyên sau khi prepend (không giật màn hình).
- Hiển thị spinner khi đang tải và "Đầu cuộc trò chuyện" khi hết data.

**Backend query:**
```typescript
// Lấy 30 tin cũ hơn cursor, desc rồi reverse về asc
const messages = await this.prisma.message.findMany({
  where: { ...conversationWhere, createdAt: { lt: beforeDate } },
  orderBy: { createdAt: 'desc' },
  take: limit,
});
return messages.reverse();
```

---

## 6. 🔴 Production Bug: Gateway Memory Leak (`static` Maps)

**File:** `backend/src/messages/messages.gateway.ts`

**Severity:** HIGH — memory leak, production crash tiềm năng

**Lỗi:** `userSockets` và `userLastSeen` được khai báo là `static` → không bao giờ bị reset khi process restart (trong container), tích lũy vô hạn entry từ các socket cũ.

**Fix:**
```typescript
// Trước (SAI)
private static readonly userSockets = new Map<string, Set<string>>();

// Sau (ĐÚNG) – instance map, reset sạch khi restart
private readonly userSockets = new Map<string, Set<string>>();
```

---

## 7. 🔴 Production Bug: Presence Broadcast lộ userId toàn bộ client

**File:** `backend/src/messages/messages.gateway.ts`

**Severity:** HIGH — security/privacy issue

**Lỗi:** `server.emit('userPresenceChanged', ...)` broadcast userId của người dùng đến TẤT CẢ client đang kết nối, lộ thông tin của mọi user cho nhau.

**Fix:**
```typescript
// Trước (SAI – broadcast toàn bộ)
this.server.emit('userPresenceChanged', { userId, isOnline, lastSeen });

// Sau (ĐÚNG – chỉ emit vào room của user đó)
this.server.to(`user_${userId}`).emit('userPresenceChanged', { userId, isOnline, lastSeen });
```

---

## 8. 🔴 Production Bug: Socket không re-join room sau reconnect

**File:** `frontend/src/store/useChatStore.ts`

**Severity:** HIGH — user ngắt mạng rồi kết nối lại sẽ không nhận được tin nhắn mới

**Lỗi:** Khi socket reconnect, event `joinUserRoom` không được emit lại → server không biết user đang ở room nào → tin nhắn không được deliver.

**Fix:**
```typescript
socket.on('reconnect', () => {
  socket.emit('joinUserRoom', userId);
});
```

---

## 9. 🟡 Bug: `isSubscribed` flag chặn re-subscribe

**File:** `frontend/src/store/useChatStore.ts`

**Lỗi:** Sau khi component unmount (`unsubscribeFromMessages`) rồi mount lại, `isSubscribed` flag vẫn là `false` nhưng socket đã bị disconnect → `subscribeToMessages` không tạo socket mới nếu có race condition.

**Fix:** Kiểm tra `socket?.connected` trực tiếp thay vì chỉ dựa vào `isSubscribed` flag:
```typescript
const existing = get().socket;
if (existing?.connected && get().isSubscribed) return;
if (existing) existing.disconnect(); // cleanup socket cũ nếu có
```

---

## 10. 🟡 Bug: `addMessage` logic unread double-condition thừa

**File:** `frontend/src/store/useChatStore.ts`

**Lỗi:**
```typescript
// Hai điều kiện này là như nhau → dư thừa, gây nhầm lẫn khi đọc code
if (!isFromActiveChat && message.senderId !== state.activeReceiverId) {
```
`isFromActiveChat` đã là `state.activeReceiverId === message.senderId`, nên condition thứ 2 luôn đúng khi thứ 1 đúng.

**Fix:** Giữ 1 điều kiện:
```typescript
if (!isFromActiveChat && !state.unreadMessages.includes(message.senderId)) {
```

---

## 11. 🟡 Bug: ChatWindow `isPrepending` race condition

**File:** `frontend/src/components/molecules/Chat/ChatWindow.tsx`

**Lỗi:** `isPrependingRef.current = true` được set TRƯỚC khi fetch xong. Nếu `useLayoutEffect` chạy trong khi messages chưa được prepend, `delta = el.scrollHeight - prevHeight = 0` → `scrollTop = 0` → màn hình nhảy lên đầu.

**Fix:** Guard thêm điều kiện `messages.length > prevMessagesLengthRef.current` trong nhánh prepend:
```typescript
if (isPrependingRef.current && messages.length > prevMessagesLengthRef.current) {
  el.scrollTop = el.scrollHeight - prevScrollHeightRef.current;
  isPrependingRef.current = false;
}
```

---

## 12. Ẩn Scrollbar toàn bộ Frontend

**File:** `frontend/src/app/globals.css`

**Fix:** Thêm CSS global cho tất cả trình duyệt:
```css
* {
  -ms-overflow-style: none;  /* IE/Edge */
  scrollbar-width: none;     /* Firefox */
}
*::-webkit-scrollbar {
  display: none;             /* Chrome/Safari/Edge */
}
```

---

## Tổng kết

| # | Lỗi | Severity | Trạng thái |
|---|-----|----------|------------|
| 1 | `tracks.filter is not a function` | 🔴 Runtime Error | ✅ Fixed |
| 2 | Album list không hiển thị | 🔴 Runtime Error | ✅ Fixed |
| 3 | Nút Invite hiển thị sai vị trí | 🟡 UI Bug | ✅ Fixed |
| 4 | Không có user presence indicator | 🟡 Feature Missing | ✅ Added |
| 5 | Không có message pagination | 🟡 Feature Missing | ✅ Added |
| 6 | **Gateway `static` Maps memory leak** | 🔴 Production Critical | ✅ Fixed |
| 7 | **Presence broadcast lộ userId** | 🔴 Security Issue | ✅ Fixed |
| 8 | **Socket không re-join sau reconnect** | 🔴 Production Critical | ✅ Fixed |
| 9 | `isSubscribed` flag chặn re-subscribe | 🟡 Logic Bug | ✅ Fixed |
| 10 | `addMessage` double-condition thừa | 🟢 Code Smell | ✅ Fixed |
| 11 | ChatWindow `isPrepending` race condition | 🟡 UI Bug | ✅ Fixed |
| 12 | Scrollbar hiển thị trong frontend | 🟢 UI Polish | ✅ Fixed |
