# XSS Audit & Hardening Report (P1-4)

This document outlines the findings, vulnerability analysis, and hardening implementations for the Cross-Site Scripting (XSS) audit performed on the Music Player frontend.

## Objective
Audit the frontend codebase for potential XSS surfaces that could allow malicious script execution. Because the application stores the user`s JWT session token (`accessToken`) and user info in `localStorage` under `music.auth` (or Capacitor Preferences on native mobile platforms), any successful XSS attack could result in session hijacking.

---

## 1. Audit Methodology & Findings

### A. Scanning for Raw HTML Injection
We scanned all frontend files (TypeScript, TSX, JavaScript, and JSX) for patterns that bypass React`s default protection mechanisms:
- **`dangerouslySetInnerHTML`**: Found **0 occurrences** in the entire codebase.
- **`innerHTML` / `outerHTML`**: Found **0 occurrences** of direct DOM manipulation using these properties.
- **`document.write` / `insertAdjacentHTML`**: Found **0 occurrences**.

### B. Auditing User Input Rendering
We audited how user-contributed or external data is rendered in the UI:
1. **Google Drive Filenames**: Rendered in `DrivePicker.tsx` (e.g., `{file.name}`).
2. **Track Titles / Album Names**: Rendered in player bars, library views, and grids (e.g., `{currentTrack.title}`, `{album.title}`).
3. **User Names / Chat Messages**: Rendered in chat windows and panels (e.g., `{msg.content}`, `{msg.senderName}`).

**Verdict**: **Safe**. All user-controlled text is interpolated using standard React curly braces (`{expression}`). React converts these values to text nodes using `document.createTextNode`, which automatically escapes HTML tags, scripts, and entities. No custom HTML parsers or markdown rendering libraries are present in the frontend dependencies.

### C. Auditing Dynamic Script Loading
We inspected dynamic script elements in the app:
- Located in: `frontend/src/hooks/useGoogleDrive.ts`
- **Script**: `loadScript("https://apis.google.com/js/api.js")` and `loadScript("https://accounts.google.com/gsi/client")`.
- **Verdict**: **Safe**. The scripts loaded are static, hardcoded, and point to trusted Google CDN domains.

---

## 2. Identified Vulnerabilities & Risks

During the audit, we identified a **DOM-based XSS vulnerability** in the YouTube downloader page:
- **Location**: `frontend/src/app/[locale]/youtube/page.tsx`
- **Vulnerability**:
  - The component fetches status updates from the backend queue manager.
  - Upon completion, the backend returns a `download_url`.
  - The frontend dynamically creates an anchor (`<a>`) element, sets its `href` to the API-returned `data.download_url`, appends it to the document, and programmatically calls `.click()` to trigger the file download.
  - The value is also bound directly to the "Tải lại" link`s `href` attribute.
- **Impact**:
  - If the backend API is compromised or intercepted, or if a malicious video/track can manipulate the download URL to start with `javascript:` (e.g., `javascript:alert(localStorage.getItem("music.auth"))`), programmatically clicking the link executes arbitrary JavaScript immediately in the context of the user`s origin, exposing their session JWT token.

---

## 3. Implemented Fixes & Hardening

We implemented a robust sanitation mechanism to block dynamic `javascript:` or schema-relative URLs.

### A. Created Security Utility Module
We created `frontend/src/lib/security.ts` containing:
- **`isSafeUrl(url)`**: Parses and checks URLs to guarantee they are either a safe relative URL starting with `/` (and not `//`) or a trusted absolute URL protocol (`http:`, `https:`, `blob:`).
- **`sanitizeUrl(url, fallback)`**: Hardens the URL by replacing unsafe URLs with a default safe fallback (`about:blank`).

### B. Applied URL Sanitization in YouTube Page
We updated `frontend/src/app/[locale]/youtube/page.tsx` to:
1. Import `sanitizeUrl` from `@/lib/security`.
2. Wrap `data.download_url` in `sanitizeUrl()` prior to setting the component`s `downloadUrl` state and executing the programmatic click download trigger.
3. Prevent programmatic clicks if the sanitized URL returns the fallback `about:blank`.

This blocks any potential `javascript:` URL injections, preventing token leakage through XSS vectors in the downloader page.
