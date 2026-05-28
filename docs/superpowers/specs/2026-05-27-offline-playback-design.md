# Design Spec - Offline Music Playback

This document outlines the design for implementing robust offline music playback in the mobile application using Capacitor Filesystem.

## 1. Problem Statement
Users need to be able to listen to imported music without an active internet connection. The app must allow downloading songs directly to the device's persistent storage and seamlessly play them back when offline.

## 2. Proposed Solution
Use `@capacitor/filesystem` to securely download and store audio files on the device. Implement a caching layer in the player store that intercepts playback requests: if a local file exists, play it; otherwise, stream from the remote URL.

### 2.1 Key Features
- **Download Action:** A button on each track in the library to trigger a download.
- **Persistent Storage:** Files are saved to the device's `Data` directory, ensuring they are not purged by the OS during space cleanup (unlike web cache).
- **Seamless Playback:** The audio player (`Howler.js`) automatically routes to the local `capacitor://` URI if the song is downloaded.
- **Offline Indication:** UI badges to show which songs are available offline.
- **Storage Management:** Ability to remove downloaded songs to free up space.

## 3. Architecture

### 3.1 Dependencies
- `@capacitor/filesystem`: For reading/writing binary data to the device.
- `@capacitor/core`: For Capacitor utility functions (e.g., converting file paths).

### 3.2 Offline Storage Manager (Frontend)
Create a utility service or custom hook (`useOfflineStorage`) responsible for:
- `downloadTrack(trackId, remoteUrl)`: Fetches the blob and writes it to `Filesystem.Directory.Data` as `<trackId>.mp3`.
- `removeTrack(trackId)`: Deletes the file from the filesystem.
- `checkIfDownloaded(trackId)`: Returns `true` if the file exists locally.
- `getLocalUri(trackId)`: Returns the playable local URI (e.g., using `Capacitor.convertFileSrc`).

### 3.3 State Management (`usePlayerStore`)
- Add an `offlineTracks` array to the store to keep track of downloaded IDs.
- Modify the `play` function:
  1. Check if `trackId` is in `offlineTracks`.
  2. If yes, get the local URI from the Offline Storage Manager.
  3. If no, use the remote `track.url`.
  4. Pass the resolved URI to `Howler`.

### 3.4 Data Flow (Download)
1. User clicks "Download" on a track.
2. UI shows a loading state.
3. `OfflineStorageManager` fetches the audio data using `fetch()` and gets the `blob`.
4. The blob is converted to base64.
5. `Filesystem.writeFile` saves the base64 string to the local disk.
6. The `trackId` is added to the `offlineTracks` list in the global store.
7. UI updates to show a "Downloaded" icon.

## 4. UI/UX Design
- **Track List:** Add a "Download" icon next to the options menu for each track.
- **Status Icons:** 
  - 📥 (Cloud Download): Available to download.
  - ⏳ (Spinner): Downloading.
  - ✅ (Check/Phone): Downloaded and available offline.
- **Player Bar:** No changes needed; playback routing is invisible to the user.

## 5. Constraints & Considerations
- **Web Fallback:** `@capacitor/filesystem` uses IndexedDB on the web. This allows us to test the logic in the browser before building the APK, though true persistence is only guaranteed on mobile.
- **File Size:** Audio files can be large. We need to handle base64 conversion carefully or use a specialized Capacitor download plugin if base64 conversion causes memory issues on older devices.
- **Storage Permission:** Android/iOS may require explicit storage permissions depending on where we save the files. Using `Directory.Data` usually avoids the need for explicit user prompts compared to `Directory.Documents`.

## 6. Implementation Plan (High-Level)
1. **Phase 1 (Setup):** Install `@capacitor/filesystem` and set up the `OfflineStorageManager` utility.
2. **Phase 2 (State):** Update `usePlayerStore` to track and persist the list of offline track IDs.
3. **Phase 3 (UI):** Add download buttons and status indicators to the `Library` component.
4. **Phase 4 (Playback):** Modify the playback logic to intercept remote URLs and replace them with local URIs when applicable.
