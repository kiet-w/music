# Design Spec: UI Atoms and i18n Synchronization

**Goal:** Ensure consistent UI layouts (430px width), polished skeletons, and unified i18n labels across all frontend templates.

## 1. i18n Localization
Update `src/messages/en.json` and `src/messages/vi.json` to include unified keys for all page headers and UI actions.

### Unified Keys (Namespace: Music)
- `your_albums`: "Your Albums" / "Album của bạn"
- `albums`: "Albums" / "Album"
- `add_music`: "Add Music" / "Thêm nhạc"
- `collection_count`: "Collection: {count} songs" / "Bộ sưu tập: {count} bài hát"
- `from_youtube`: "From YouTube" / "Từ YouTube"
- `recent`: "Recent" / "Gần đây"
- `create`: "Create" / "Tạo"
- `create_new_album`: "Create New Album" / "Tạo album mới"
- `album_title`: "Album Title" / "Tiêu đề Album"
- `artist_optional`: "Artist (Optional)" / "Nghệ sĩ (Tùy chọn)"
- `no_albums_yet`: "No albums yet." / "Chưa có album nào."
- `create_first_album`: "Create your first album" / "Tạo album đầu tiên"
- `songs`: "songs" / "bài hát"

## 2. UI Atoms Refinement
- **AlbumSkeleton**:
  - Use `rounded-xl` for the image container (matching `AlbumsTemplate`).
  - Keep `aspect-square`.
  - Use `bg-muted` for pulse effect via shadcn `Skeleton`.
- **TrackSkeleton**:
  - Use `rounded-xl` for the 48x48 thumbnail.
  - Match gap sizes from templates.

## 3. Template Standardization
Update all templates to use the standard `MainContainer` component which enforces the `max-w-[430px]` constraint and proper padding.

### Affected Templates:
- `HomePageTemplate.tsx`: Replace `main` with `MainContainer`, use i18n for "Your Albums" and song count. Use `AlbumSkeleton`.
- `AlbumsTemplate.tsx`: Replace `main` with `MainContainer`, use i18n for "Albums", "Create", etc. Use `AlbumSkeleton`.
- `MusicTemplate.tsx`: Replace `main` with `MainContainer`, use i18n for "Thêm Nhạc" -> "Add Music".
- `AlbumDetailClient.tsx`: Replace `main` with `MainContainer` (or adjust `max-w`), use i18n for labels.

## 4. Verification
- Verify that both English and Vietnamese translations work.
- Verify that the layout stays centered and constrained to 430px on larger screens.
- Verify that skeletons match the real UI elements in shape and spacing.
