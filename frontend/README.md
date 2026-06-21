# Music App Frontend

## 📌 Overview
This is the frontend client for the Music App. It is built using **Next.js**, **React**, and **Tailwind CSS**, with a modern UI powered by **shadcn/ui**. It also features native mobile cross-platform support via **Capacitor**.

## 🚀 Technologies
- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS + shadcn/ui
- **Mobile Environment:** Capacitor (`capacitor.config.ts`)
- **Language:** TypeScript

## ⚙️ Getting Started
```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev

# 3. Build for production
npm run build
```

## 📱 Mobile Build (Capacitor)
This project uses Capacitor to compile the web app into a native mobile application.
To sync your web code to the native mobile project (Android/iOS):
```bash
npm run build
npx cap sync
npx cap open android  # or ios
```

## 🔒 Production Hardening & UI/UX Improvements

*   **Capacitor Preferences Storage**: Automatically detects native platform deployments and uses `@capacitor/preferences` to persist auth sessions safely. Fallback to standard `localStorage` is maintained for web platforms.
*   **Global 401 Unauthorized Routing**: Integrated intercepting hooks inside `customFetch` in `api.ts` to globally reset authentication state and redirect to `/[locale]/login` upon receiving `401` unauthorized HTTP statuses.
*   **Modern Modals & Alerts**: Removed raw browser alert popups, replacing them with custom styled glassmorphic confirm modals (for track deletions) and dropdown selector grids (for moving tracks between albums).
*   **Toast Notifications**: Built in the `sonner` notification package to display success/error updates in a non-blocking toast overlay.
*   **Instant Playback on Cache Hit**: Integrates with the backend's duplicate track detection (YouTube video ID cache). If a song has been previously converted, the frontend retrieves the public URL immediately, bypassing the conversion loading state.
*   **Docker Containerization**: Provided a multi-stage optimized `Dockerfile` leveraging Next.js standalone outputs to compile and host the web app efficiently in containerized environments (Kubernetes/Swarm/VPS). Run local builds using:
    ```bash
    docker build -t music-frontend:latest ./frontend
    ```
