# Integration Plan: Realtime Chat

## 1. Context & Objectives
Wire the Frontend to the Backend API and establish the Supabase Realtime subscription to enable live messaging between users.

## 2. Granular Tasks

- [ ] **Task 1: Update API Client**
  - **Action:** Add `sendMessage(token, receiverId, content)` and `fetchChatHistory(token, userId)` to `frontend/src/lib/api.ts`.
  - **Verification:** Calling these functions returns data from the backend.
- [ ] **Task 2: Setup Supabase Realtime Subscription**
  - **Action:** In `useChatStore`, implement a function that uses `supabase.channel('messages').on('postgres_changes', ...)` to listen for `INSERT` on the `Message` table.
  - **Verification:** Console log shows new message data when a message is inserted manually in the DB or via API.
- [ ] **Task 3: Implement Message Sending Flow**
  - **Action:** Connect `ChatInput` to `sendMessage` API. Update `useChatStore` immediately (optimistic update) or upon API success.
  - **Verification:** Sent messages appear in the `ChatWindow`.
- [ ] **Task 4: Implement Real-time Receiving Flow**
  - **Action:** Update `useChatStore` state when a Supabase Realtime event is received (if it belongs to the active conversation).
  - **Verification:** A message sent from one user/tab appears instantly in another user's tab.
- [ ] **Task 5: Fetch Initial History on Conversation Select**
  - **Action:** When a user is selected from `UserList`, call `fetchChatHistory` and update the store.
  - **Verification:** Selecting a user loads previous messages.
- [ ] **Task 6: End-to-End Verification**
  - **Action:** Perform a full cycle: Log in as User A, open chat with User B, send message, verify User B receives it in real-time.
  - **Verification:** Both users see the message correctly in their respective UIs.
