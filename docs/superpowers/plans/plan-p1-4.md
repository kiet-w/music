# Plan: Audit XSS surface (JWT in localStorage)

## Goal
Conduct a thorough audit of the frontend's XSS (Cross-Site Scripting) attack surface. Since the application stores the user's JSON Web Token (JWT) `accessToken` in `localStorage` on the web platform (or `@capacitor/preferences` on mobile platforms), any XSS vulnerability would allow an attacker to read the token and hijack the user session. We need to identify, verify, and resolve potential XSS entry/rendering points.

## Audit Strategy
1. **Identify JWT Storage**: Find out how and where the JWT is stored and accessed.
   - Identified storage key: `music.auth` inside `localStorage` (or Capacitor Preferences).
   - Located in: `frontend/src/store/useAuthStore.ts`.
2. **Scan for Unsafe HTML Insertion**:
   - Scan for `dangerouslySetInnerHTML` in `.ts`, `.tsx`, `.js`, `.jsx` files.
   - Scan for raw `innerHTML`, `outerHTML`, `document.write`, or `insertAdjacentHTML` usage in client-side code.
3. **Scan for Dangerous Attributes**:
   - Audit dynamic `href` bindings in `<a href={...}>` and Next.js `<Link href={...}>` to prevent `javascript:` and data URL injection.
   - Audit dynamic `src` bindings in `<iframe src={...}>` or `<img src={...}>`.
4. **Identify and Sanitize User Inputs**:
   - Audit where inputs like filenames from Google Drive, track titles, album names, user names, and chat message contents are rendered.
   - Determine if DOMPurify is needed to sanitize any dynamic HTML content.
   - Implement custom validation/sanitization rules for external URLs (e.g., YouTube/SoundCloud URLs, status endpoints, etc.).

## Detailed Steps & Verification
1. **Checkout Branch**: Checkout to `feat/p1-4`. (Done)
2. **Create Plan**: Write `docs/superpowers/plans/plan-p1-4.md`. (Done)
3. **Review Vulnerable Components**:
   - Review how filenames from Google Drive are retrieved and displayed in `frontend/src/components/molecules/Drive/DrivePicker.tsx` and related hooks/components.
   - Review track titles, album names, and playlist inputs.
   - Review chat inputs and outputs in `ChatWindow.tsx` and `ChatInput.tsx`.
   - Implement `isSafeUrl` or sanitize checks on dynamic URLs like `downloadUrl` in `frontend/src/app/[locale]/youtube/page.tsx`.
4. **Install DOMPurify & Sanitize Unsafe Data**:
   - If dynamic raw HTML is rendered, install `dompurify` and `@types/dompurify`, and use it to clean inputs.
   - If React default text interpolation handles all user input safely and there is no raw HTML parsing, verify and document it.
5. **Document Audit Findings**: Create `docs/superpowers/plans/readme-p1-4.md`.
6. **Commit and Merge**:
   - Commit all changes to `feat/p1-4`.
   - Merge `feat/p1-4` into `main` and push to origin.
