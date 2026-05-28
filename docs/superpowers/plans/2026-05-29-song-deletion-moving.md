# Song Deletion and Movement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement backend endpoints for deleting songs and moving songs between albums.

**Architecture:** Add `remove` and `moveToAlbum` methods to `SongService`, which utilize the `SongRepository`. Expose these via `DELETE` and `PATCH` endpoints in `SongController`.

**Tech Stack:** NestJS, Prisma, Jest.

---

### Task 1: Update SongService and Unit Tests

**Files:**
- Modify: `backend/src/songs/song.service.ts`
- Test: `backend/src/songs/song.service.spec.ts`

- [ ] **Step 1: Write failing tests for `remove` and `moveToAlbum`**

Add these tests to `backend/src/songs/song.service.spec.ts`:

```typescript
  describe('remove', () => {
    it('should delete a song if it exists', async () => {
      const songId = 'song-123';
      mockSongRepository.findUnique.mockResolvedValue({ id: songId });
      mockSongRepository.delete.mockResolvedValue({ id: songId });

      await service.remove(songId);

      expect(songRepository.findUnique).toHaveBeenCalledWith({ where: { id: songId } });
      expect(songRepository.delete).toHaveBeenCalledWith({ where: { id: songId } });
    });

    it('should throw NotFoundException if song does not exist', async () => {
      const songId = 'non-existent';
      mockSongRepository.findUnique.mockResolvedValue(null);

      await expect(service.remove(songId)).rejects.toThrow('Song not found');
    });
  });

  describe('moveToAlbum', () => {
    it('should update the albumId of a song', async () => {
      const songId = 'song-123';
      const albumId = 'new-album-123';
      const updatedSong = { id: songId, albumId };

      mockSongRepository.findUnique.mockResolvedValue({ id: songId });
      mockSongRepository.update.mockResolvedValue(updatedSong);

      const result = await service.moveToAlbum(songId, albumId);

      expect(result).toEqual(updatedSong);
      expect(songRepository.update).toHaveBeenCalledWith({
        where: { id: songId },
        data: { albumId },
      });
    });

    it('should throw NotFoundException if song does not exist', async () => {
      const songId = 'non-existent';
      const albumId = 'album-123';
      mockSongRepository.findUnique.mockResolvedValue(null);

      await expect(service.moveToAlbum(songId, albumId)).rejects.toThrow('Song not found');
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `rtk npm test backend/src/songs/song.service.spec.ts`
Expected: FAIL (methods not defined)

- [ ] **Step 3: Implement `remove` and `moveToAlbum` in `SongService`**

Modify `backend/src/songs/song.service.ts`:

```typescript
  async remove(id: string) {
    const song = await this.songRepository.findUnique({ where: { id } });
    if (!song) {
      throw new NotFoundException('Song not found');
    }
    return this.songRepository.delete({ where: { id } });
  }

  async moveToAlbum(id: string, albumId: string) {
    const song = await this.songRepository.findUnique({ where: { id } });
    if (!song) {
      throw new NotFoundException('Song not found');
    }
    return this.songRepository.update({
      where: { id },
      data: { albumId },
    });
  }
```
*Note: Make sure to import `NotFoundException` from `@nestjs/common`.*

- [ ] **Step 4: Run tests to verify they pass**

Run: `rtk npm test backend/src/songs/song.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/songs/song.service.ts backend/src/songs/song.service.spec.ts
git commit -m "feat(backend): implement song deletion and moving logic in service"
```

### Task 2: Update SongController and E2E Tests

**Files:**
- Modify: `backend/src/songs/song.controller.ts`
- Test: `backend/test/songs.e2e-spec.ts`

- [ ] **Step 1: Write failing E2E tests for `DELETE` and `PATCH` endpoints**

Add these tests to `backend/test/songs.e2e-spec.ts`:

```typescript
  it('/songs/:id (DELETE) - should delete a song', async () => {
    const songId = 'song-1';
    mockPrismaService.track.findUnique.mockResolvedValue({ id: songId });
    mockPrismaService.track.delete.mockResolvedValue({ id: songId });

    return request(app.getHttpServer())
      .delete(`/songs/${songId}`)
      .expect(204);
  });

  it('/songs/:id/move (PATCH) - should move a song to a different album', async () => {
    const songId = 'song-1';
    const albumId = 'new-album-id';
    const updatedSong = { id: songId, albumId };

    mockPrismaService.track.findUnique.mockResolvedValue({ id: songId });
    mockPrismaService.track.update.mockResolvedValue(updatedSong);

    return request(app.getHttpServer())
      .patch(`/songs/${songId}/move`)
      .send({ albumId })
      .expect(200)
      .expect((res) => {
        expect(res.body.albumId).toBe(albumId);
      });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `rtk npm test backend/test/songs.e2e-spec.ts`
Expected: FAIL (404 Not Found as endpoints don't exist)

- [ ] **Step 3: Implement endpoints in `SongController`**

Modify `backend/src/songs/song.controller.ts`:

```typescript
  @ApiOperation({ summary: 'Delete a song' })
  @ApiResponse({ status: 204, description: 'Song deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Song not found.' })
  @HttpCode(204)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.songService.remove(id);
  }

  @ApiOperation({ summary: 'Move a song to another album' })
  @ApiResponse({
    status: 200,
    description: 'Song moved successfully.',
    type: SongResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Song not found.' })
  @Patch(':id/move')
  async moveToAlbum(
    @Param('id') id: string,
    @Body('albumId') albumId: string,
  ): Promise<SongResponseDto> {
    const song = await this.songService.moveToAlbum(id, albumId);
    return plainToInstance(SongResponseDto, song, {
      excludeExtraneousValues: true,
    });
  }
```
*Note: Make sure to import `Delete`, `Patch`, `Param`, `HttpCode` from `@nestjs/common`.*

- [ ] **Step 4: Run tests to verify they pass**

Run: `rtk npm test backend/test/songs.e2e-spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/songs/song.controller.ts backend/test/songs.e2e-spec.ts
git commit -m "feat(backend): expose song deletion and moving endpoints"
```
