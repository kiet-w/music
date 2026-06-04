# Frontend Plan: Realtime Chat

## 1. Context & Objectives
Build the UI for the chat feature, including the navigation entry point, the main chat interface, and local state management for real-time updates.

## 2. Granular Tasks

- [ ] **Task 1: Create Chat Store**
  - **Action:** Create `frontend/src/store/useChatStore.ts` using Zustand to manage `messages`, `activeReceiverId`, and `isSubscribed` state.
  - **Verification:** Store can be imported and state is accessible.
- [ ] **Task 2: Add Message Icon to Navbar**
  - **Action:** Import `MessageCircle` from `lucide-react` and add it to `frontend/src/components/molecules/Navbar/Navbar.tsx`.
  - **Verification:** Navbar shows the icon and links to `/messages`.
- [ ] **Task 3: Add i18n Translations**
  - **Action:** Add "Messages", "Type a message...", "No conversations yet" to `frontend/src/messages/en.json` and `vi.json`.
  - **Verification:** `useTranslations` hook returns the correct strings in both languages.
- [ ] **Task 4: Create Messages Page Layout**
  - **Action:** Create `frontend/src/app/[locale]/messages/page.tsx` with a responsive sidebar for user list and a main area for the chat window.
  - **Verification:** Navigating to `/messages` shows the layout structure.
- [ ] **Task 5: Build User List Component**
  - **Action:** Create `frontend/src/components/molecules/Chat/UserList.tsx` to list available users (or recent conversations).
  - **Verification:** Component displays a list of dummy users correctly.
- [ ] **Task 6: Build Chat Window Component**
  - **Action:** Create `frontend/src/components/molecules/Chat/ChatWindow.tsx` to display message bubbles (sent vs received styling).
  - **Verification:** Component renders a list of messages with appropriate alignment.
- [ ] **Task 7: Build Chat Input Component**
  - **Action:** Create `frontend/src/components/molecules/Chat/ChatInput.tsx` with a text area/input and a send button.
  - **Verification:** Typing in the input updates local state; clicking send triggers a placeholder log.
- [ ] **Task 8: Integrate Components into Page**
  - **Action:** Assemble `UserList`, `ChatWindow`, and `ChatInput` into the `/messages` page.
  - **Verification:** Full UI is visible and interactive.
