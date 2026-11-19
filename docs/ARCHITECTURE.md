# ARCHITECTURE — SinyalLab

Dokumen ini adalah pendamping `PRD_SinyalLab.md`. **PRD menjawab "apa yang dibangun", dokumen ini menjawab "bagaimana susunannya".**
Jika ada konflik: struktur folder, aturan dependensi, dan pola kode mengikuti dokumen ini. Isi produk dan konten mengikuti PRD. Dokumen ini **menggantikan Bagian 16 PRD** (struktur repositori).

Aturan pegangan: **feature-first, logika murni terpisah dari UI, sesederhana mungkin.** Jangan menambah abstraksi yang belum dibutuhkan.

---

## 1. Fondasi Teknis

| Area | Keputusan |
|------|-----------|
| Framework | Expo (managed workflow, SDK stabil terbaru), React Native, **TypeScript strict** |
| Runtime | Hermes + New Architecture (default pada SDK terbaru). Verifikasi tiap library kompatibel sebelum dipakai |
| Navigasi | `expo-router` (file-based) |
| Animasi | `react-native-reanimated` (UI thread) + `react-native-svg`. `@shopify/react-native-skia` hanya jika profil performa menuntut |
| Gestur | `react-native-gesture-handler` |
| State global | Zustand (+ `persist` middleware) |
| Penyimpanan | `react-native-mmkv` (fallback: AsyncStorage) |
| Validasi data | Zod |
| Haptik / suara | `expo-haptics`, `expo-audio` |
| Test | Jest, React Native Testing Library, Maestro (e2e) |
| Build/CI | EAS Build, GitHub Actions (lint, typecheck, test) |

Tidak dipakai di MVP: Redux, backend/BaaS, TanStack Query (belum ada data server), DI container, arsitektur use-case/repository penuh. Semuanya overkill untuk lingkup ini.

---

## 2. Struktur Folder (Feature-First)

```
/app                          # ROUTE SAJA. Tipis: impor screen dari features lalu render
  _layout.tsx                 # root layout, provider, error boundary
  onboarding.tsx
  profil.tsx
  (tabs)/
    _layout.tsx               # tab bar 4 menu
    materi.tsx
    simulasi.tsx
    troubleshoot.tsx
    evaluasi.tsx

/src
  /features
    /materi
      /components             # CardPager, SectionPath, QuickCheck, ...
      /visuals                # BlockDiagram, MixerAnimation, LimiterClipAnimation, ... (khusus materi)
      /domain                 # progresMateri.ts (hitung % selesai, kartu terlihat)
      /data                   # loadMateri.ts (baca + validasi content/materi.json)
      MateriScreen.tsx
      SectionScreen.tsx
      index.ts                # PUBLIC API fitur (satu-satunya pintu masuk dari luar)
    /simulasi
      /components             # SignalFlowDiagram, MiniScope, StationDial, ...
      /domain                 # signal.ts (generator gelombang), stations.ts, frequencies.ts (fLO, image)
      SimulasiScreen.tsx
      index.ts
    /troubleshoot
      /components             # CaseModal, BlockDiagramTappable, ReadingSheet, ResultView
      /domain                 # troubleshootScoring.ts, caseRules.ts (aturan blok-pertama-abnormal)
      /data                   # loadCases.ts
      TroubleshootListScreen.tsx
      DiagnoseScreen.tsx
      index.ts
    /evaluasi
      /components             # QuestionCard, ResultSummary, ReviewList
      /domain                 # quizScoring.ts, quizSession.ts (acak soal & opsi), topicBreakdown.ts
      /data                   # loadQuestions.ts
      EvaluasiScreen.tsx
      index.ts
    /gamification
      /components             # XpBadge, StreakFlame, BadgeGrid, LevelUpOverlay, Mascot
      /domain                 # xp.ts, level.ts, streak.ts, badges.ts, hearts.ts
      index.ts
    /profil
      /components
      ProfilScreen.tsx
      index.ts
    /onboarding
      OnboardingScreen.tsx
      index.ts

  /shared
    /ui                       # Button, Card, ProgressBar, Modal, BottomSheet, Text, Icon
    /hooks                    # useReducedMotion, useHaptics, useSound, useAppState
    /theme                    # tokens.ts (warna, spacing, radius, tipografi), useTheme.ts
    /lib                      # date.ts, random.ts (seeded), clamp.ts, assert.ts
    /content                  # schema Zod untuk SEMUA konten + helper loader generik
    /components-visual        # primitif SVG yang dipakai >1 fitur (WaveformPath, Arrow, BlockBox)

  /store                      # store global saja (lihat Bagian 5)
    progressStore.ts
    settingsStore.ts
    xpStore.ts
    migrations.ts
    storage.ts                # wrapper MMKV

  /i18n
    id.json
    index.ts

/content                      # JSON konten (diedit guru): materi.json, troubleshoot.json, quiz.json
/assets                       # fonts, images, sounds (orisinal/CC0)
/__tests__                    # test lintas fitur & e2e (test unit fitur ditaruh di samping kodenya)
/docs                         # PRD_SinyalLab.md, ARCHITECTURE.md, DECISIONS.md, ASSETS.md
```

**Catatan penempatan test:** unit test fungsi domain ditaruh **di samping file-nya** (`signal.ts` → `signal.test.ts`). Hanya test lintas fitur dan e2e yang masuk `/__tests__`.

---

## 3. Aturan Dependensi (Wajib, Ditegakkan Lint)

```
app  →  features  →  shared
                  ↘  store  →  shared
```

1. `/app` hanya boleh mengimpor dari `src/features/*` (lewat `index.ts`), `shared`, dan `store`. **Tidak ada logika di `/app`.**
2. Sebuah fitur **tidak boleh mengimpor fitur lain** secara langsung. Jika dua fitur butuh hal yang sama, pindahkan ke `shared`. Satu-satunya pengecualian: fitur lain boleh memakai **public API** `gamification` (`index.ts`) untuk memberi XP.
3. `shared` **tidak boleh mengimpor** dari `features` atau `app`.
4. Dalam fitur: `components` boleh memanggil `domain` dan `data`. **`domain` tidak boleh mengimpor React, React Native, store, atau storage.** Murni TypeScript.
5. Hanya `index.ts` fitur yang boleh diimpor dari luar fitur. Jangan mengimpor jalur dalam (`features/materi/components/...`) dari luar.
6. Gunakan alias path: `@/features/*`, `@/shared/*`, `@/store/*`, `@/i18n`.

Tegakkan dengan `eslint-plugin-boundaries` atau `no-restricted-imports`. Pelanggaran = build CI gagal.

---

## 4. Tiga Lapisan di Dalam Fitur

| Lapisan | Isi | Boleh bergantung pada | Cara dites |
|---------|-----|-----------------------|------------|
| **UI** (`components`, `*Screen.tsx`) | Render, gestur, animasi, memanggil hook/store | domain, data, shared, store | RNTL, sedikit |
| **Domain** (`domain/`) | Aturan dan perhitungan: scoring, XP, sinyal, streak, aturan kasus | hanya TypeScript murni + `shared/lib` | **Unit test, banyak (inti kualitas)** |
| **Data** (`data/`) | Memuat dan memvalidasi konten JSON, adaptor ke storage | Zod, `shared/content`, `store` | Test validasi konten |

**Contoh benar:**
```ts
// features/evaluasi/domain/quizScoring.ts  (murni, tanpa React)
export function hitungSkor(benar: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((benar / total) * 100);
}

// features/evaluasi/components/ResultSummary.tsx  (UI: hanya memanggil & menampilkan)
const skor = hitungSkor(benar, total);
```

**Contoh salah:** menghitung skor di dalam `onPress` komponen, atau domain yang memanggil `useProgressStore`.

---

## 5. State Management

Bedakan jenis state, dan jangan mencampur:

| Jenis | Alat | Contoh |
|-------|------|--------|
| State lokal tampilan | `useState` / `useReducer` | sheet terbuka, opsi terpilih, indeks kartu |
| State sesi fitur (hidup selama satu aktivitas) | `useReducer` / store kecil **lokal fitur** | sesi kuis berjalan, kasus troubleshooting yang sedang dimainkan (pengukuran, tebakan salah) |
| State global persisten | Zustand + persist | XP, streak, progres materi, riwayat kuis, pengaturan, badge |

Aturan:
- **Pecah store per domain**, bukan satu store raksasa: `xpStore`, `progressStore`, `settingsStore`.
- Komponen mengambil data dengan **selector** (`useXpStore(s => s.total)`), bukan seluruh store.
- Store hanya menyimpan **data**, dan aksi yang memanggil fungsi domain. **Logika hitung tetap di `domain/`.**
- State sesi (kuis aktif, kasus aktif) **tidak** dipersist. Hanya hasil akhirnya yang ditulis ke store global.
- Penulisan ke storage lewat satu pintu: `store/storage.ts`. UI tidak menyentuh MMKV langsung.

### Persistensi & Migrasi
- Setiap store persisten membawa `schemaVersion`.
- `store/migrations.ts` berisi fungsi migrasi berurutan (v1→v2→…). **Update aplikasi tidak boleh menghapus progres siswa.**
- Data hasil baca dari storage divalidasi Zod. Jika korup, fallback ke default dan catat (jangan crash).

---

## 6. Konten Sebagai Data

- Semua konten edukasi di `/content/*.json`, skema di `shared/content/schema.ts` (Zod).
- Loader di `features/*/data/` memanggil validasi **saat start** (dan di test). Konten tidak valid = test gagal, bukan crash di tangan siswa.
- Konten di-bundle dengan aplikasi (offline-first), diimpor statis.
- ID konten (`sectionId`, `caseId`, `questionId`) **stabil dan tidak berubah** karena progres siswa mengacu ke ID tersebut.
- Teks UI (bukan konten edukasi) lewat `i18n/id.json`.

---

## 7. Komponen Visual & Animasi

- Komponen visual yang dipakai **satu fitur** tinggal di `features/<fitur>/visuals`. Yang dipakai **lebih dari satu fitur** (mis. `BlockBox`, `WaveformPath`, `Arrow`) naik ke `shared/components-visual`.
- Animasi berfrekuensi tinggi (gelombang simulasi) memakai **Reanimated shared values dan worklet**. **Dilarang `setState` per frame.**
- Generator gelombang adalah fungsi murni di `simulasi/domain/signal.ts` dengan bentuk: `(params, t) => Float32Array | number[]`. Rendering hanya memetakan hasilnya ke path SVG.
- Hormati `useReducedMotion()`: sediakan versi statis dengan tombol "Mainkan".
- Batasi jumlah node SVG per layar. Jika fps < 50 di perangkat target, turunkan resolusi sampel (mis. 128 → 64 titik) sebelum pindah ke Skia.

---

## 8. Performa (Anggaran)

| Metrik | Target | Cara memeriksa |
|--------|--------|----------------|
| FPS animasi | ≥ 50 pada HP RAM 3 GB | Perf Monitor RN / profiler Reanimated |
| Cold start | ≤ 3 detik | Uji di perangkat rilis (bukan dev mode) |
| Ukuran APK | ≤ 50 MB | Laporan EAS |
| Re-render | Tidak ada re-render seluruh layar karena perubahan kecil | React DevTools Profiler |

Praktik:
- List panjang: `FlatList` dengan `keyExtractor` stabil. Untuk daftar besar (jarang di app ini), FlashList.
- Hindari objek/fungsi inline di prop item list. `useCallback`/`useMemo` hanya setelah terukur perlu.
- Uji performa di build rilis pada perangkat nyata. **Emulator tidak cukup.**
- Aset gambar: SVG/vektor. Tanpa video.

---

## 9. Penanganan Error & Ketahanan

- **Error boundary** di root dan per layar fitur. Fallback ramah ("Ups, ada yang salah. Coba lagi") dengan tombol muat ulang, tanpa menghapus progres.
- Tidak ada panggilan jaringan di MVP. Tidak perlu loading state jaringan.
- Fungsi domain **tidak melempar error** untuk input tak terduga yang masih wajar (mis. total soal 0). Kembalikan nilai aman.
- Tindakan merusak (reset progres) butuh konfirmasi dua langkah.
- Simpan progres **segera setelah** aktivitas selesai (bukan hanya saat app ditutup), sehingga *force close* tidak menghilangkan hasil.

---

## 10. Standar Kode

- **TypeScript:** `strict: true`, `noUncheckedIndexedAccess: true`. Tanpa `any` kecuali ada komentar alasan.
- **Penamaan:** komponen `PascalCase.tsx`, fungsi/variabel `camelCase`, konstanta `SCREAMING_SNAKE_CASE`, file domain `camelCase.ts`. Satu komponen utama per file.
- **Ukuran:** komponen > ±200 baris atau punya > 1 tanggung jawab dipecah.
- **Props:** didefinisikan dengan `type`, tanpa prop-drilling lebih dari 2 tingkat (pakai komposisi atau store).
- **Design tokens:** tidak ada hex/angka spacing hard-code di komponen. Semua dari `shared/theme/tokens.ts`.
- **Teks:** tidak ada string UI hard-code. Semua lewat `i18n`.
- **Aksesibilitas:** setiap elemen interaktif punya `accessibilityLabel` dan `accessibilityRole`. Target sentuh ≥ 48×48 dp.
- **Lint/format:** ESLint (+ `eslint-plugin-boundaries`, `react-hooks`, `@typescript-eslint`) dan Prettier. Pre-commit via lint-staged.
- **Commit:** Conventional Commits (`feat(troubleshoot): ...`), satu commit = satu perubahan logis.

---

## 11. Strategi Test

| Lapisan | Alat | Cakupan wajib |
|---------|------|---------------|
| Domain | Jest | **Semua fungsi domain**: scoring kuis & troubleshooting, XP, level, streak (hari terlewat, freeze, zona waktu), badge, generator sinyal, `fLO`/frekuensi bayangan, aturan kasus |
| Konten | Jest + Zod | Semua JSON lolos skema. Tiap kasus troubleshooting punya **tepat satu** `culprit` yang konsisten dengan aturan "blok pertama yang keluarannya abnormal". `correctIndex` valid |
| UI | RNTL | Alur kuis penuh; troubleshooting (benar, salah 1×, salah 2×); navigasi tab; state tab tidak hilang |
| E2E | Maestro (1 skenario) | onboarding → satu section materi → simulasi → satu kasus → kuis → profil |
| Manual | HP entry-level | fps animasi, mode pesawat, font besar, force close |

Target cakupan: **domain ≥ 90%**, keseluruhan tidak dijadikan target angka (hindari test kosong demi persentase).

---

## 12. Pipeline CI

Setiap push/PR menjalankan berurutan: `typecheck` → `lint` (termasuk aturan dependensi) → `test` (unit + konten) → `expo-doctor`. Merge diblokir jika ada yang gagal. Build EAS dijalankan manual/terjadwal untuk milestone M6–M7.

---

## 13. Pemetaan Fitur PRD → Modul

| Fitur PRD | Modul | Logika domain utama |
|-----------|-------|---------------------|
| Materi (PRD §8) | `features/materi` | `progresMateri.ts` |
| Simulasi (PRD §9) | `features/simulasi` | `signal.ts`, `frequencies.ts`, `stations.ts` |
| Troubleshooting (PRD §10) | `features/troubleshoot` | `troubleshootScoring.ts`, `caseRules.ts` |
| Evaluasi (PRD §11) | `features/evaluasi` | `quizScoring.ts`, `quizSession.ts`, `topicBreakdown.ts` |
| Gamifikasi (PRD §7) | `features/gamification` | `xp.ts`, `level.ts`, `streak.ts`, `badges.ts`, `hearts.ts` |
| Profil & Progres (PRD §12) | `features/profil` | agregasi dari store |
| Data & penyimpanan (PRD §13) | `store/` | `migrations.ts` |

**Cara fitur memberi XP:** fitur tidak menulis ke `xpStore` secara langsung. Ia memanggil fungsi publik dari `features/gamification` (mis. `awardXp({ source: 'quiz_correct', amount: 5 })`). Dengan begitu aturan batas harian dan anti-farming tinggal di satu tempat.

---

## 14. Urutan Kerja yang Disarankan

1. Setup proyek, alias, lint, aturan dependensi, CI dasar (M0).
2. `shared/theme`, `shared/ui`, `store` + migrasi, `gamification/domain` + test (M1).
3. Satu fitur demi satu: materi → simulasi → troubleshooting → evaluasi (M2–M5), **domain dan test dulu, UI sesudahnya**.
4. Polish, aksesibilitas, profil performa, rilis (M6–M7).

---

## 15. Keputusan yang Dicatat di `DECISIONS.md`

Setiap kali agent menyimpang dari dokumen ini, tulis di `docs/DECISIONS.md`: tanggal, apa yang diubah, alasannya, dan dampaknya. Contoh yang wajar dicatat: pindah dari SVG ke Skia untuk osiloskop, mengganti MMKV dengan AsyncStorage, atau menaikkan komponen visual ke `shared`.

---

## 16. Pelanggaran yang Harus Dihindari (Checklist Review)

- [ ] Logika bisnis (hitung skor/XP/sinyal) di dalam komponen atau di `/app`.
- [ ] `domain/` mengimpor React, store, atau storage.
- [ ] Fitur mengimpor fitur lain (selain public API `gamification`).
- [ ] Mengimpor jalur dalam fitur dari luar (bukan lewat `index.ts`).
- [ ] State animasi per frame lewat `setState`.
- [ ] String UI atau warna hard-code.
- [ ] Menulis ke storage langsung dari komponen.
- [ ] Konten hard-code di TSX, bukan di `/content`.
- [ ] Perubahan skema storage tanpa migrasi.
- [ ] Menambah library besar tanpa mencatat alasan di `DECISIONS.md`.