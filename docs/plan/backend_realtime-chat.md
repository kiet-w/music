# Backend Plan: Realtime Chat

## 1. Context & Objectives
This part of the plan focuses on the database schema and the NestJS API endpoints required to store and retrieve chat messages. While the real-time delivery happens via Supabase, the backend ensures persistence and provides historical data.

## 2. Granular Tasks

- [ ] **Task 1: Update Prisma Schema**
  - **Action:** Add the `Message` model to `backend/prisma/schema.prisma` and establish relations with the `User` model.
  - **Verification:** Run `npx prisma validate` and ensure no errors.
- [ ] **Task 2: Database Migration**
  - **Action:** Execute `npx prisma migrate dev --name add_message_model`.
  - **Verification:** Check the database (or `init_migration.sql` equivalent) to see the new `Message` table.
- [ ] **Task 3: Generate Messages Module**
  - **Action:** Run `nest generate module messages`, `nest generate service messages`, and `nest generate controller messages` in the `backend/src` directory.
  - **Verification:** Files created in `backend/src/messages/`.
- [ ] **Task 4: Create Message DTOs**
  - **Action:** Define `CreateMessageDto` (content, receiverId) and `MessageResponseDto` in `backend/src/messages/dto/`.
  - **Verification:** DTO files exist and use `class-validator` for content length.
- [ ] **Task 5: Implement Messages Repository**
  - **Action:** Create `MessageRepository` extending `BaseRepository` in `backend/src/messages/messages.repository.ts`.
  - **Verification:** Repository injected into `MessagesService`.
- [ ] **Task 6: Implement MessagesService - Create**
  - **Action:** Add `create` method to `MessagesService` to save a message and return the created record.
  - **Verification:** Unit test for `create` method passes.
- [ ] **Task 7: Implement MessagesService - Fetch History**
  - **Action:** Add `findAllByConversation` method to `MessagesService` to get messages between two users, ordered by `createdAt`.
  - **Verification:** Unit test for `findAllByConversation` passes.
- [ ] **Task 8: Implement MessagesController Endpoints**
  - **Action:** Add `POST /messages` (authenticated) and `GET /messages/:userId` (authenticated) to `MessagesController`.
  - **Verification:** E2E test using `supertest` for both endpoints returns 201/200 respectively.
- [ ] **Task 9: Global Module Registration**
  - **Action:** Ensure `MessagesModule` is imported in `backend/src/app.module.ts`.
  - **Verification:** Backend starts successfully without dependency errors.
