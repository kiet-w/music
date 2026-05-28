# Design Doc: Song Deletion and Moving

## 1. Overview
This specification details the implementation of backend endpoints for deleting songs and moving songs between albums in the music application.

## 2. Requirements
- Implement a method to delete a song by ID.
- Implement a method to move a song to a different album by updating its `albumId`.
- Expose these operations via a RESTful API.

## 3. Architecture & Components

### 3.1 Backend (NestJS)

#### `SongService`
- `remove(id: string)`:
  - Check if the song exists.
  - If not, throw `NotFoundException`.
  - Call `this.songRepository.delete({ where: { id } })`.
- `moveToAlbum(id: string, albumId: string)`:
  - Check if the song exists.
  - If not, throw `NotFoundException`.
  - Call `this.songRepository.update({ where: { id }, data: { albumId } })`.

#### `SongController`
- `DELETE /songs/:id`:
  - Endpoint for song deletion.
  - Returns 204 No Content on success.
- `PATCH /songs/:id/move`:
  - Endpoint for moving a song.
  - Expects `{ "albumId": "string" }` in the request body.
  - Returns the updated song.

## 4. Data Flow
1. **Deletion:** `SongController.remove` -> `SongService.remove` -> `SongRepository.delete`.
2. **Moving:** `SongController.moveToAlbum` -> `SongService.moveToAlbum` -> `SongRepository.update`.

## 5. Error Handling
- `NotFoundException`: Thrown when the song ID provided does not exist.
- Prisma errors (e.g., foreign key constraint) will be allowed to bubble up (or handled by global filters) if the `albumId` is invalid.

## 6. Verification Plan
- **Unit Tests:** Add tests for the new service methods in `song.service.spec.ts`.
- **E2E Tests:** Add a test case in `songs.e2e-spec.ts` (if it exists) or use `curl` to verify the endpoints manually.
