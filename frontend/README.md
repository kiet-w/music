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
