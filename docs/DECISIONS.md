# Architectural Decisions Log — SinyalLab

Dokumen ini mencatat setiap keputusan teknis atau deviasi dari `Architecture.MD` dan `PRD_SinyalLab.md`.

## [2026-11-03] Inisialisasi Proyek SinyalLab (M0)
- **Status:** Diterima
- **Keputusan:**
  - Inisialisasi menggunakan Expo SDK 58 stabil terbaru dengan React Native 0.88.1, Hermes engine, dan New Architecture.
  - Navigasi file-based menggunakan `expo-router` v58 pada folder `src/app/`.
  - Animasi menggunakan `react-native-reanimated` v4.7.1 dan grafis vektor `react-native-svg` v15.16.0.
  - State management menggunakan `zustand` v5 dan persistensi menggunakan `@react-native-async-storage/async-storage` sebagai storage wrapper di `src/store/storage.ts`.
  - Validasi schema konten menggunakan `zod` v4 dan unit test validasi skema otomatis di `__tests__/content.test.ts`.
  - Setup pengujian unit & integrasi menggunakan `jest`, `jest-expo`, dan `@testing-library/react-native`.
  - Penegakan arsitektur feature-first melalui path aliases dan ESLint import boundaries.

## [2026-11-04] Pemisahan Folder Proyek: Mobile App & Backend Hono Bun (B0/B1)
- **Status:** Diterima
- **Keputusan:**
  - Repositori ditata menjadi 2 folder utama di root: `app/` (aplikasi React Native / Expo) dan `backend/` (API service menggunakan Bun runtime + Hono framework) sesuai `be.md` (ARCHITECTURE_BACKEND).
  - Inisialisasi dasar backend (Milestone B0/B1):
    - Runtime Bun v1.3.x + framework Hono v4.
    - Validasi environment fail-fast di `backend/src/env.ts` berbasis Zod.
    - Pola arsitektur berlapis: `deps.ts` sebagai composition root, `app.ts` sebagai builder aplikasi Hono, middleware logging terstruktur JSON, request ID, secure headers, dan error handling terpusat.
    - Modul `/health` (liveness) dan `/ready` (readiness) telah aktif dan teruji dengan `bun test` serta pengujian live request pada port 3000.
    - Seluruh pengujian mobile app di `app/` tetap berjalan hijau (7 test suites, 24 tests passed).

## [2026-11-07] Resolusi Konektivitas Backend & Multi-Environment Server Config
- **Status:** Diterima
- **Masalah:**
  - Aplikasi gagal terhubung ke backend pada mode browser web (CORS blocked) dan gagal mengenali backend lokal (port 3000) karena URL di-hardcode ke `https://backend.hayyu.online`.
  - Hono backend tidak merespons request preflight `OPTIONS` dari web client (mengembalikan HTTP 404).
- **Keputusan & Perbaikan:**
  - Memasang middleware CORS global di root Hono (`backend/src/app.ts`) yang mendukung preflight `OPTIONS` (HTTP 204) dan wildcard origin.
  - Mengaktifkan `CORS_ORIGINS=*` pada `backend/.env`.
  - Mengintegrasikan `EXPO_PUBLIC_API_URL` pada `app/src/shared/api/config.ts` serta membuat file `app/.env`.
  - Mengalirkan `apiBaseUrl` dinamis pada pemanggilan `authApi.getClasses(apiBaseUrl)` di `LoginForm.tsx`.
  - Menambahkan komponen modal pengaturan server (`ServerConfigModal.tsx`) dan badge status koneksi interaktif pada `LoginScreen.tsx` dengan fitur live ping healthcheck (`testServerConnection`).
  - Seluruh pengujian unit (73 tests across 15 files) dan linting `expo lint` lulus 100%.
