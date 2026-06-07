# Integration Plan: Realtime Chat

## 1. Context & Objectives
Wire the Frontend to the Backend API and establish the Supabase Realtime subscription to enable live messaging between users.

## 2. Granular Tasks

- [x] **Task 1: Update API Client**
  - **Action:** Add `sendMessage(token, receiverId, content)` and `fetchChatHistory(token, userId)` to `frontend/src/lib/api.ts`.
  - **Verification:** E2E tests in `backend/test/messages.e2e-spec.ts` pass.
- [x] **Task 2: Setup Supabase Realtime Subscription**
  - **Action:** In `useChatStore`, implement a function that uses `supabase.channel('messages').on('postgres_changes', ...)` to listen for `INSERT` on the `Message` table.
  - **Verification:** Verified code in `useChatStore.ts` follows the standard Supabase Realtime pattern.
- [x] **Task 3: Implement Message Sending Flow**
  - **Action:** Connect `ChatInput` to `sendMessage` API. Update `useChatStore` immediately (optimistic update) or upon API success.
  - **Verification:** `MessagesPage.tsx` correctly handles sending and state updates.
- [x] **Task 4: Implement Real-time Receiving Flow**
  - **Action:** Update `useChatStore` state when a Supabase Realtime event is received (if it belongs to the active conversation).
  - **Verification:** Subscription logic in `useChatStore.ts` handles incoming messages and marks them as unread if necessary. Added unread indicators to `UserList.tsx`.
- [x] **Task 5: Fetch Initial History on Conversation Select**
  - **Action:** When a user is selected from `UserList`, call `fetchChatHistory` and update the store.
  - **Verification:** `setActiveReceiverId` in `useChatStore.ts` correctly fetches history.
- [ ] **Task 6: End-to-End Verification**
  - **Action:** Perform a full cycle: Log in as User A, open chat with User B, send message, verify User B receives it in real-time.
  - **Verification:** Requires live environment with Supabase Realtime enabled for the `Message` table.
