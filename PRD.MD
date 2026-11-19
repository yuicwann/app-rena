# PRD — SinyalLab (nama kerja)
**Aplikasi pembelajaran mobile: Penerima Radio AM/FM (Superheterodyne) dengan gamifikasi ala Duolingo**

Versi: 1.0 (MVP) · Bahasa UI: Indonesia · Platform utama: Android (HP)

---

## 0. Cara Memakai Dokumen Ini (untuk Agent Pengembang)

1. Baca seluruh dokumen sebelum menulis kode. Bagian 3 (Asumsi) dan Bagian 5 (Tech Stack) menentukan keputusan teknis.
2. Kerjakan **berurutan per milestone** (Bagian 17). Satu milestone = satu set commit yang bisa dijalankan dan dites.
3. Setiap fitur punya **Acceptance Criteria (AC)**. Fitur dianggap selesai hanya jika semua AC terpenuhi dan test lulus.
4. **Semua konten edukasi** (teks materi, soal, kasus) disimpan sebagai file JSON di `/content`, bukan hard-code di komponen UI. Tujuannya supaya guru bisa merevisi tanpa mengubah kode.
5. Jangan memakai aset berhak cipta (karakter, ilustrasi, suara) dari aplikasi lain, termasuk Duolingo. Terinspirasi dari mekanik gamifikasinya boleh, meniru merek/karakter tidak boleh. Maskot dan ikon harus **orisinal**.
6. Jika ada ambiguitas yang tidak dijawab dokumen ini, ambil keputusan paling sederhana, catat di `DECISIONS.md`, lalu lanjut. Jangan berhenti kecuali benar-benar terblokir.
7. Konten teknis (nilai frekuensi, rumus, jawaban kuis) di dokumen ini adalah **sumber kebenaran**. Jangan "mengoreksi" dari memori sendiri. Jika menurut kamu ada yang salah, tulis di `DECISIONS.md` sebagai catatan untuk ditinjau manusia.

---

## 1. Ringkasan Produk

**Masalah:** Siswa kesulitan membayangkan jalur sinyal di penerima radio dan cara mencari kerusakannya, karena buku teks hanya berisi teks dan diagram statis.

**Solusi:** Aplikasi HP dengan 4 menu utama:

| # | Menu | Tujuan belajar |
|---|------|----------------|
| 1 | **Materi** | Memahami teori: diagram blok AM/FM, konversi IF (455 kHz & 10,7 MHz), fungsi Limiter, standar frekuensi AM |
| 2 | **Simulasi Alur Sinyal** | Melihat wujud sinyal di tiap blok pada kondisi radio **normal** |
| 3 | **Troubleshooting** | Melacak blok rusak lewat pengukuran (tap) dan memilih biang kerok |
| 4 | **Evaluasi** | Kuis pilihan ganda dengan penilaian otomatis dan umpan balik |

**Pengalaman inti:** belajar dalam potongan kecil (±3–7 menit), ada XP, streak, badge, dan animasi yang memberi umpan balik, supaya siswa mau kembali tiap hari.

### Tujuan terukur (MVP)
- Siswa bisa menyelesaikan 1 sesi (1 section Materi, 1 simulasi, atau 1 kasus troubleshooting) dalam ≤ 7 menit.
- ≥ 80% siswa uji coba bisa menyelesaikan kasus troubleshooting pertama tanpa bantuan guru.
- Aplikasi berjalan lancar (≥ 50 fps) di HP Android entry-level (RAM 3 GB).

---

## 2. Pengguna & Konteks Pemakaian

- **Pengguna utama:** siswa SMK (Teknik Audio Video / Elektronika) atau mahasiswa vokasi, umur 15–22 tahun.
- **Pengguna sekunder:** guru yang memakai aplikasi sebagai alat peraga di kelas dan meninjau hasil siswa (dashboard guru **di luar MVP**, lihat Bagian 19).
- **Konteks:** dipakai di HP sendiri (portrait, satu tangan), di kelas atau di rumah, **sering dengan koneksi internet buruk**. Maka aplikasi harus **offline-first**.
- **Bahasa:** Indonesia semi-santai (jelas, tidak kaku). Istilah teknis tetap baku (mixer, limiter, detector) dengan padanan Indonesia di glosarium.

---

## 3. Asumsi & Keputusan yang Perlu Dikonfirmasi

Asumsi ini dipakai agar pengembangan tidak terblokir. Pemilik produk bisa mengubahnya.

| # | Asumsi | Alasan |
|---|--------|--------|
| A1 | Aplikasi native lintas-platform dengan **Expo (React Native) + TypeScript**, target utama Android | Satu codebase, animasi SVG bagus, mudah dibagikan sebagai APK |
| A2 | **Tanpa login dan tanpa backend** di MVP. Progres disimpan lokal di perangkat | Siswa tidak perlu akun, bisa offline, tidak ada isu privasi data pelajar |
| A3 | **Tidak ada penguncian ketat**: semua menu bisa dibuka kapan saja, tapi ada kartu "Rekomendasi berikutnya" | Guru bisa memakai menu apa pun saat mengajar |
| A4 | Sistem **nyawa (hearts) ada di kode tapi default MATI** (`hearts_enabled=false`) | Di konteks kelas, nyawa yang habis bisa membuat siswa frustrasi |
| A5 | Sinyal di simulasi adalah **model sintetis yang disederhanakan** (bukan hasil perhitungan fisika penuh), dengan label "ilustrasi, bukan skala sebenarnya" | Tujuannya membangun intuisi, bukan presisi |
| A6 | Pembahasan Limiter mengacu pada **mode FM**. Pada mode AM, blok Limiter ditampilkan abu-abu "tidak dipakai (bypass)" | Secara teknis AM tidak memakai limiter. Ini sekaligus materi pembelajaran |
| A7 | Soal kuis awal (12 soal) ada di Lampiran B. Sisa bank soal (target 20+) dibuat agent dengan skema sama dan ditandai `"needs_review": true` | Konten harus diverifikasi guru sebelum rilis |

---

## 4. Prinsip Produk

1. **Visual dulu, teks belakangan.** Tiap kartu materi punya visual atau animasi. Maksimal ±40 kata per kartu.
2. **Belajar dengan melakukan.** Sentuh, geser, dan ukur. Hindari layar yang hanya dibaca.
3. **Umpan balik instan.** Tiap aksi menghasilkan respons (warna, animasi, getar halus, suara opsional).
4. **Salah itu wajar.** Jawaban salah selalu disertai penjelasan *kenapa*, tidak hanya "salah".
5. **Ringan.** Bisa dipakai offline, di HP murah, dan satu tangan.

---

## 5. Tech Stack & Arsitektur

| Area | Pilihan |
|------|---------|
| Framework | Expo (SDK terbaru stabil), React Native, TypeScript (strict) |
| Navigasi | `expo-router` (tab bar bawah, 4 tab) |
| Grafis & animasi | `react-native-svg` + `react-native-reanimated` (opsional `@shopify/react-native-skia` untuk osiloskop jika SVG terlalu berat) |
| Gestur swipe | `react-native-gesture-handler` + pager (`react-native-pager-view` atau FlatList horizontal dengan snap) |
| State | Zustand (+ persist middleware) |
| Penyimpanan lokal | `react-native-mmkv` (atau AsyncStorage jika MMKV bermasalah) |
| Haptik & suara | `expo-haptics`, `expo-audio` (efek suara pendek, bisa dimatikan) |
| Validasi konten | Zod: semua JSON di `/content` divalidasi saat build/test |
| Test | Jest + React Native Testing Library; satu e2e smoke test (Maestro atau Detox) |
| Build | EAS Build (APK untuk sebar langsung, AAB untuk Play Store) |

**Aturan arsitektur**
- Pisahkan **konten** (`/content/*.json`), **logika** (`/src/domain`: scoring, XP, streak, signal model), dan **UI** (`/src/ui`, `/app`).
- Logika bersifat *pure function* sehingga mudah dites (scoring kuis, perhitungan XP, penentuan kasus troubleshooting, generator gelombang).
- Seluruh teks UI lewat file i18n (`/src/i18n/id.json`), tidak ada string hard-code di komponen.
- Ukuran APK target ≤ 50 MB. Tidak ada video. Animasi pakai SVG/kode, bukan file besar.

---

## 6. Arsitektur Informasi & Navigasi

**Tab bar bawah (4 tab):** `Materi` · `Simulasi` · `Troubleshoot` · `Evaluasi`

**Header global (semua layar):** avatar/nama kecil → buka *Profil*; ikon 🔥 streak; ikon ⚡ XP hari ini.
Ikon wajib orisinal (boleh dari set ikon open-source berlisensi bebas).

**Layar tambahan:**
- *Onboarding* (sekali): sambutan maskot, isi nama panggilan, pilih target harian (20/30/50 XP).
- *Profil & Progres*: level, total XP, streak, badge, ringkasan nilai kuis terbaik, tombol reset progres, pengaturan (suara, getar, ukuran font).
- *Beranda ringan di atas tab Materi*: kartu **"Lanjutkan belajar"** (menu terakhir yang dibuka) dan **"Rekomendasi berikutnya"** (urutan saran: Materi → Simulasi → Troubleshoot → Evaluasi).

**AC Navigasi**
- [ ] Perpindahan tab ≤ 100 ms, state tiap tab (posisi swipe, kasus aktif) dipertahankan saat berpindah tab.
- [ ] Tombol *Back* Android bekerja wajar di semua layar, dengan konfirmasi saat keluar di tengah kuis atau kasus yang sedang berjalan.
- [ ] Aplikasi bisa dipakai penuh dalam mode offline (tanpa permintaan jaringan sama sekali).

---

## 7. Sistem Gamifikasi (Ala Duolingo, Versi Orisinal)

### 7.1 XP

| Aksi | XP |
|------|----|
| Menyelesaikan 1 kartu materi (geser sampai akhir kartu) | +2 (sekali per kartu) |
| Menjawab *Cek Cepat* di akhir section dengan benar (percobaan pertama) | +10 |
| Menyelesaikan 1 section Materi | +20 |
| Menyelesaikan 1 simulasi (menjalankan alur sampai suara keluar + 3 blok diinspeksi) | +15 (maks 1× per hari per mode agar tidak bisa dipakai farming) |
| Troubleshooting: kasus benar | +100 dasar, ditambah bonus efisiensi (lihat 10.5) |
| Kuis: tiap jawaban benar | +5 |
| Kuis: lulus (≥ KKM) | +20 bonus |

### 7.2 Level
Naik level tiap 200 XP (Level 1 = 0–199, Level 2 = 200–399, dst). Saat naik level: animasi perayaan singkat (≤ 2 detik, bisa di-skip).

### 7.3 Streak & Target Harian
- Target harian default 30 XP (pilihan 20/30/50).
- Streak bertambah 1 jika target harian tercapai pada hari tersebut (zona waktu perangkat).
- Streak putus jika satu hari terlewat. Ada **1 "streak freeze" gratis per minggu** (otomatis terpakai).
- Notifikasi lokal pengingat harian: **opsional**, default mati, diminta izin saat pengguna mengaktifkan di Pengaturan.

### 7.4 Badge (awal, 10 buah, ikon orisinal)
1. *Langkah Pertama* — selesai onboarding + 1 kartu materi
2. *Penjelajah Blok* — selesai section 1 (Diagram Blok)
3. *Si Konversi* — selesai section IF
4. *Penjinak Noise* — selesai section Limiter
5. *Operator Sinyal* — jalankan simulasi AM dan FM
6. *Detektif Sinyal* — 1 kasus troubleshooting benar dengan ≤ 3 pengukuran
7. *Teknisi Handal* — semua 8 kasus troubleshooting selesai
8. *Nilai Sempurna* — kuis 100
9. *Rajin 3 Hari* — streak 3
10. *Seminggu Penuh* — streak 7

### 7.5 Nyawa (Hearts) — opsional
Flag `hearts_enabled` (default **false**). Jika true: 5 nyawa, salah di kuis/troubleshooting −1, pulih 1 nyawa tiap 30 menit atau setelah menyelesaikan 1 kartu materi. Wajib tersedia di kode dan test, tapi tidak tampil di UI jika flag mati.

### 7.6 Maskot
Satu karakter **orisinal** (misalnya makhluk kecil berbentuk gelombang/antena) yang tampil di onboarding, perayaan, dan pesan penyemangat. Dibuat sebagai SVG sederhana dengan 3 ekspresi: senang, berpikir, sedih-menyemangati. **Dilarang meniru rupa maskot aplikasi lain.**

---

## 8. FITUR 1 — Menu Materi (Teori Konseptual)

### 8.1 Deskripsi
Materi dikemas per **section** yang bisa **di-swipe** horizontal per **kartu**. Tiap kartu = satu ide + satu visual/animasi. Di akhir tiap section ada **Cek Cepat** (1 soal pilihan ganda ringan).

Layar Materi menampilkan daftar section sebagai **jalur vertikal berbentuk node** (gaya jalur belajar): node selesai = berwarna penuh + centang, node berikutnya = menyala, node lain = tetap bisa dibuka (lihat A3).

### 8.2 Daftar Section & Isi Wajib

**Section 1 — Peta Besar: Diagram Blok Penerima Radio**
- Kartu 1: Apa tugas penerima radio? (menangkap → memilih satu stasiun → memperkuat → mengambil suara → mengeraskan). Visual: gelombang masuk dari antena, suara keluar dari speaker.
- Kartu 2: Diagram blok **AM**: Antena → Tuner (RF + Mixer + Osilator Lokal) → Penguat IF (455 kHz) → Detektor AM (+AGC) → Penguat Audio → Speaker. Animasi: blok menyala berurutan.
- Kartu 3: Diagram blok **FM**: Antena → Tuner → Penguat IF (10,7 MHz) → **Limiter** → Detektor FM → Penguat Audio → Speaker.
- Kartu 4: **Beda AM vs FM** (tabel visual 2 kolom: informasi ada di amplitudo vs frekuensi; ada/tidak ada limiter; frekuensi IF). Toggle AM/FM mengganti diagram.
- Kartu 5: Mengapa disebut *superheterodyne*? (mengubah semua stasiun ke satu frekuensi tetap = IF).
- Cek Cepat: "Pada urutan blok penerima FM, Limiter berada di antara…"

**Section 2 — Tuner: Memilih Stasiun**
- Kartu 1: Fungsi tuner: penguat RF (memilih rentang + menguatkan), mixer, osilator lokal.
- Kartu 2: **Animasi pencampuran (mixer):** dua gelombang (RF dan LO) masuk → keluar selisihnya (IF). Slider "putar dial" menggeser frekuensi RF dan LO bersama, dan **selisih tetap**.
- Kartu 3: Rumus **fLO = fRF + fIF** (injeksi atas / *high-side*) dengan contoh hitung interaktif (pilih stasiun → tampil hasil LO).
- Kartu 4: Contoh AM: stasiun 900 kHz → LO 1355 kHz → IF 455 kHz. Contoh FM: 98,0 MHz → LO 108,7 MHz → IF 10,7 MHz.
- Cek Cepat: hitung fLO untuk satu stasiun.

**Section 3 — Konversi Frekuensi IF (455 kHz & 10,7 MHz)**
- Kartu 1: Apa itu IF dan kenapa **tetap**? Visual: filter/penguat IF "dikunci" di satu frekuensi sementara stasiun berubah-ubah (animasi stasiun berbeda "digeser" masuk ke jendela IF).
- Kartu 2: **IF AM = 455 kHz**, **IF FM = 10,7 MHz**. Mengapa FM lebih tinggi? (lebar kanal FM ±75 kHz deviasi, ≈ 200 kHz per kanal, jadi butuh IF lebih tinggi agar bandwidth relatif lebih mudah dicapai.) Visual: dua "jendela" lebar berbeda.
- Kartu 3: Keuntungan IF tetap: penguatan tinggi dan stabil, selektivitas baik (filter tetap, tidak perlu disetel ulang).
- Kartu 4: **Frekuensi bayangan (image)** = fRF + 2·fIF. Visual: sumbu frekuensi menampilkan stasiun, LO, dan bayangan. Penjelasan singkat: sebab-akibat siulan/interferensi. (Contoh: FM 98,0 MHz → bayangan 119,4 MHz.)
- Cek Cepat: menentukan IF yang benar untuk AM/FM.

**Section 4 — Limiter: Penjaga Amplitudo FM**
- Kartu 1: Masalah: noise (petir, mesin, listrik) merusak **amplitudo**. Pada FM, informasi ada di frekuensi, jadi amplitudo boleh "dirapikan".
- Kartu 2: **Animasi gelombang:** sebelum limiter (amplitudo naik-turun karena noise) vs sesudah limiter (amplitudo rata, frekuensi tetap). Slider "tingkat noise".
- Kartu 3: Cara kerja ringkas: penguat dengan penguatan sangat tinggi yang dibatasi (*clipping*), sehingga keluarannya konstan di atas ambang. Ada **ambang limiting** (sinyal terlalu lemah tidak terpotong, noise lolos).
- Kartu 4: Letak: **setelah penguat IF, sebelum detektor FM**.
- Kartu 5: **Kenapa AM tidak pakai limiter?** Karena informasi AM ada di amplitudo, limiter akan menghapus suaranya. AM memakai **AGC** untuk menstabilkan penguatan, bukan memotong amplitudo.
- Cek Cepat: fungsi limiter.

**Section 5 — Standar Frekuensi AM (dan FM sebagai pembanding)**
- Kartu 1: Pita siaran AM (gelombang menengah/MW): sekitar **530–1600 kHz**. Visual: penggaris frekuensi dengan stasiun.
- Kartu 2: **Spasi kanal 9 kHz** (Indonesia mengikuti ITU Wilayah 3; Amerika memakai 10 kHz). Contoh pembawa: 531, 540, 549 … 1602 kHz. Konsekuensi: audio dibatasi ±4,5 kHz.
- Kartu 3: Lebar pita AM ≈ 2 × frekuensi audio tertinggi (visual spektrum: pembawa + sideband atas dan bawah).
- Kartu 4: Pembanding FM: **87,5–108 MHz**, spasi kanal **200 kHz**, deviasi maksimum **±75 kHz**.
- Cek Cepat: spasi kanal AM Indonesia.

**Section 6 — Detektor & Penguat Audio (Penutup Jalur)**
- Kartu 1: Detektor AM = *envelope detector* (dioda + RC) mengambil "bungkus" amplitudo. Animasi: bungkus muncul dari gelombang AM.
- Kartu 2: Detektor FM (diskriminator/rasio/PLL) mengubah **perubahan frekuensi → tegangan audio**. Visual: kurva-S sederhana.
- Kartu 3: Penguat audio menguatkan tegangan lemah sehingga mampu menggerakkan speaker. Animasi kerucut speaker bergetar.
- Cek Cepat: fungsi detektor.

### 8.3 Spesifikasi Kartu & UI

- **Skema konten** (`/content/materi.json`, divalidasi Zod):
```json
{
  "sections": [{
    "id": "s3-if",
    "title": "Konversi Frekuensi IF",
    "objective": "Menjelaskan alasan IF tetap dan nilainya (455 kHz & 10,7 MHz)",
    "cards": [{
      "id": "s3-c2",
      "title": "Dua angka penting",
      "body": "AM memakai IF 455 kHz. FM memakai IF 10,7 MHz.",
      "visual": { "component": "IFWindowCompare", "props": { } },
      "interaction": "tap-to-play"
    }],
    "quickCheck": {
      "question": "...", "options": ["..."], "correctIndex": 0, "explanation": "..."
    }
  }]
}
```
- Tiap kartu: judul (≤ 6 kata), isi (≤ 40 kata), 1 visual. Teks utama ≥ 16 sp.
- Indikator halaman (titik) di bawah, geser kiri/kanan, tombol "Lanjut" besar di kartu terakhir.
- **Komponen visual yang harus dibuat** (reusable, di `/src/ui/visuals`): `BlockDiagram` (mode AM/FM, bisa menyorot blok), `MixerAnimation`, `IFWindowCompare`, `ImageFrequencyAxis`, `LimiterClipAnimation`, `AmBandRuler`, `FmBandRuler`, `SpectrumAM`, `EnvelopeDetectorAnimation`, `DiscriminatorCurve`, `SpeakerCone`.
- Animasi **tidak otomatis berjalan terus-menerus**: jalan saat kartu tampil dan ada tombol "Ulangi ▶". Hormati pengaturan "Kurangi gerak" OS (tampilkan versi statis).
- Semua visual punya teks alternatif (`accessibilityLabel`).

### 8.4 Acceptance Criteria Materi
- [ ] 6 section, total ≥ 28 kartu, seluruhnya terbaca dari JSON.
- [ ] Setiap kartu menampilkan visual/animasi, tidak ada kartu "hanya teks".
- [ ] Swipe antar kartu mulus (≥ 50 fps pada HP target), indikator halaman akurat.
- [ ] Progres per kartu dan per section tersimpan, dan section yang selesai menampilkan centang.
- [ ] Toggle AM/FM pada Section 1 dan 4 benar-benar mengganti diagram, dan Limiter tampil sebagai "bypass" saat AM.
- [ ] Semua nilai teknis cocok dengan Lampiran A.
- [ ] Cek Cepat memberi umpan balik benar/salah dengan penjelasan, XP hanya diberikan pada percobaan pertama.

---

## 9. FITUR 2 — Menu Simulasi Alur Sinyal

### 9.1 Deskripsi
Peraga visual **real-time (animasi berjalan terus)** yang menunjukkan perjalanan sinyal pada radio **kondisi normal**:

`Antena → Tuner → IF → Limiter → Detector → Audio Amplifier → Speaker`

Tiap blok menampilkan **mini-osiloskop** berisi bentuk gelombang di titik keluarnya, ditambah label frekuensi dan amplitudo relatif. Titik-titik sinyal bergerak sepanjang jalur antar blok sehingga terlihat "mengalir".

### 9.2 Kontrol
- **Mode:** toggle `AM | FM`.
- **Pilih stasiun:** slider/dial dengan stasiun fiktif.
  - AM (spasi 9 kHz): 576, 693, 828, 1008, 1134, 1269 kHz.
  - FM (spasi 200 kHz): 88,0 · 91,2 · 98,0 · 101,4 · 105,8 MHz.
  - Nama stasiun fiktif, mis. "Radio Edukasi AM 828". **Jangan memakai nama stasiun asli.**
- **Play / Pause** dan **kecepatan** (0,5× / 1× / 2×).
- **Ketuk blok** untuk membuka kartu detail (zoom osiloskop, nama blok, fungsi, frekuensi masuk → keluar).
- **Suara** (opsional, default mati): memutar nada/musik pendek **orisinal atau berlisensi bebas** saat sinyal sampai speaker. Volume mengikuti pengaturan.

### 9.3 Model Sinyal (Disederhanakan, Murni Visual)
Semua gelombang digenerate dari fungsi di `/src/domain/signal.ts` (pure function, bisa dites). Frekuensi **diskalakan** agar terlihat di layar. Tampilkan label jujur "ilustrasi, tidak sesuai skala".

| Blok | Tampilan gelombang | Label |
|------|--------------------|-------|
| **Antena** | Beberapa gelombang acak + sinyal stasiun terpilih kecil, ada sedikit noise | "Sinyal RF lemah (µV–mV), banyak stasiun bercampur" |
| **Tuner** | Hanya stasiun terpilih; ditampilkan sebelum dan sesudah mixer. Setelah mixer frekuensinya jauh lebih rendah (IF) | AM: "fRF → 455 kHz", FM: "fRF → 10,7 MHz", plus label fLO = fRF + fIF |
| **Penguat IF** | Gelombang IF yang amplitudonya **membesar**, bersih | "IF diperkuat" |
| **Limiter** (FM) | Amplitudo **rata** (terpotong rapi), frekuensi masih bervariasi mengikuti suara | "Amplitudo dibuat konstan". Pada AM: blok abu-abu bertanda "Bypass (AM tidak memakai limiter)" |
| **Detektor** | Gelombang **audio** (AM: bungkus amplitudo; FM: variasi frekuensi menjadi tegangan) | "Sinyal audio kecil" |
| **Penguat Audio** | Gelombang audio yang **lebih besar** | "Daya audio ke speaker" |
| **Speaker** | Kerucut speaker bergetar sinkron amplitudo audio | — |

Pada mode AM, sinyal setelah IF langsung ke Detektor, dan blok Limiter dilewati dengan jalur lengkung bertanda "bypass".

### 9.4 Layout (Portrait)
- Atas: kontrol mode + stasiun + play/pause.
- Tengah: diagram blok vertikal (Antena di atas → Speaker di bawah). Garis penghubung beranimasi (titik mengalir). Di kanan tiap blok: mini-osiloskop.
- Bawah: panel "Apa yang kamu lihat?" berisi penjelasan 1–2 kalimat yang berubah saat blok diketuk.
- Layar dapat di-scroll vertikal. Mini-osiloskop tidak boleh lebih kecil dari 96×48 dp.

### 9.5 Acceptance Criteria Simulasi
- [ ] Animasi berjalan kontinu (≥ 50 fps pada HP target) dan bisa di-pause. Jeda tidak mengubah state lain.
- [ ] Mode AM/FM mengubah IF (455 kHz vs 10,7 MHz), rumus LO, dan status blok Limiter.
- [ ] Mengganti stasiun mengubah fRF dan fLO yang tampil, sementara fIF **tetap**.
- [ ] Mengetuk blok membuka detail dengan nilai frekuensi masuk/keluar yang benar sesuai rumus fLO = fRF + fIF.
- [ ] Menyelesaikan simulasi (alur dijalankan sampai Speaker + minimal 3 blok diinspeksi) memberi XP sesuai 7.1.
- [ ] Mode "Kurangi gerak" menampilkan gelombang statis dengan tombol "Mainkan".
- [ ] Tidak ada elemen yang bergantung pada jaringan.

---

## 10. FITUR 3 — Menu Troubleshooting (Cari Biang Kerok)

### 10.1 Prinsip Edukasi
Mengajarkan **signal tracing**: ikuti sinyal dari awal ke akhir, **blok rusak = blok pertama yang keluarannya abnormal padahal masukannya (keluaran blok sebelumnya) normal.** Aturan ini harus muncul di penjelasan setiap kasus.

### 10.2 Alur Interaksi (Wajib Persis)

1. **Daftar kasus** → siswa memilih satu kasus (atau tombol "Kasus berikutnya").
2. **Pop-up studi kasus** (modal): judul "Kasus N", **gejala** (mis. "Radio mendesis keras tapi nggak ada siaran"), maskot, tombol "Mulai Diagnosa". Opsional: tombol 🔊 memutar efek suara gejala (desis, hening, pecah) dari aset orisinal/sintetis.
3. **Layar diagnosa:** diagram blok radio utuh (vertikal), blok tappable: Antena, Tuner, IF, Limiter, Detector, Audio Amp (Speaker sebagai indikator saja). Di atas: gejala (ringkas, bisa dibuka lagi), penghitung "Pengukuran: n", tombol "Petunjuk".
4. **Tap blok = mengukur.** Muncul animasi probe menyentuh titik keluaran blok, lalu **bottom sheet hasil ukur**: status (ikon + warna + teks), teks pembacaan (mis. "Sinyal normal", "Sinyal hilang"), mini-osiloskop, dan tegangan teks (mis. "≈ 2,1 Vpp"). Blok berubah warna setelah diukur: hijau (normal), merah (abnormal), kuning (lemah/dicurigai). **Jangan hanya warna**: selalu ada ikon dan teks.
5. Pengukuran ulang blok yang sama gratis dan tidak menambah hitungan.
6. Di bottom sheet ada dua tombol: **"Ukur blok lain"** (tutup sheet) dan **"Ini biang keroknya!"** (menebak blok tersebut). Menebak hanya bisa dari blok yang sudah diukur.
7. Konfirmasi singkat: "Yakin blok ini yang rusak?" → Ya / Batal.
8. **Hasil tebakan:**
   - **Benar:** animasi sukses + notif "Mantap! Biang keroknya: [blok]", XP dan bintang, lalu layar **Pembahasan** (jalur sinyal dengan blok rusak disorot, alasan, 1 kalimat aturan signal tracing).
   - **Salah:** getar + animasi goyang + pesan penyemangat dengan petunjuk arah ("Cek lagi: blok ini masukannya sudah bermasalah/sudah normal…"), `wrongGuesses += 1`. Siswa boleh mencoba lagi.
   - **Salah 2 kali:** jawaban benar ditampilkan beserta pembahasan, XP partisipasi +10, kasus ditandai "belum sempurna" dan bisa diulang.
9. Tombol **"Coba lagi"** mengatur ulang pengukuran kasus tersebut.

### 10.3 Petunjuk (Hint)
Tombol "Petunjuk" memakai −10 XP dari bonus (tidak dari XP dasar). Petunjuk 1: "Gejala ini berarti sinyal berhenti/rusak di bagian awal/tengah/akhir jalur." Petunjuk 2: menyarankan blok yang bagus untuk diukur lebih dulu ("coba ukur di tengah jalur"). Maksimum 2 petunjuk per kasus.

### 10.4 Kasus (8 Kasus Awal)

Urutan blok: **ANT → TUN → IF → LIM → DET → AMP**. Mode "FM" kecuali disebut lain. Pembacaan menunjukkan **keluaran** blok tersebut.

Status: ✅ Normal · ⚠️ Lemah · ❌ Hilang · 〰️ Hanya noise · 🌀 Terdistorsi · ⛔ Amplitudo tak konstan · 🎯 Interferensi

| # | Gejala (pop-up) | Biang kerok | ANT | TUN | IF | LIM | DET | AMP |
|---|-----------------|-------------|-----|-----|----|-----|-----|-----|
| 1 (Mudah) | "Radio mendesis keras tapi nggak ada siaran." | **Tuner** (osilator lokal mati, tidak ada konversi ke IF) | ✅ Sinyal RF normal | ❌ Sinyal IF hilang, hanya noise | 〰️ Hanya noise (diperkuat) | 〰️ Hanya noise | 〰️ Desis | 〰️ Desis keras |
| 2 (Mudah) | "Lampu radio nyala, tapi hening total: tidak ada suara, tidak ada desis." | **Penguat Audio** | ✅ | ✅ | ✅ | ✅ | ✅ Audio normal | ❌ Tidak ada keluaran |
| 3 (Mudah) | "Radio hanya mendesis pelan, antena teleskopiknya patah." | **Antena** | ❌ Tidak ada sinyal RF | 〰️ Hanya noise internal | 〰️ Hanya noise | 〰️ | 〰️ | 〰️ Desis pelan |
| 4 (Sedang) | "Siaran terdengar, tapi sangat kecil dan berisik." | **Penguat IF** (penguatan turun) | ✅ | ✅ Sinyal IF normal | ⚠️ Lemah | ⚠️ Lemah (di bawah ambang limiting) | ⚠️ Lemah | ⚠️ Lemah + noise |
| 5 (Sedang) | "Suara FM pecah-pecah/sember, padahal sinyal stasiunnya kuat." | **Detektor FM** (setelan diskriminator melenceng) | ✅ | ✅ | ✅ | ✅ Amplitudo rata | 🌀 Audio terdistorsi | 🌀 Terdistorsi |
| 6 (Sedang) | "Tiap ada motor lewat atau lampu menyala, muncul bunyi 'krek-krek' keras. Noise tidak tertekan." | **Limiter** (tidak membatasi amplitudo) | ✅ | ✅ | ✅ | ⛔ Amplitudo naik-turun, noise ikut | ⛔ Audio bercampur letupan noise | ⛔ Letupan noise diperkeras |
| 7 (Sulit) | "Sambil mendengar satu stasiun, ada siulan nyaring yang ikut terdengar." | **Tuner** (selektivitas RF buruk, sinyal frekuensi bayangan ikut masuk mixer) | ✅ | 🎯 Stasiun + sinyal bayangan ikut terkonversi | 🎯 Dua sinyal | 🎯 | 🎯 Audio + siulan | 🎯 Siulan terdengar |
| 8 (Sedang, **mode AM**) | "Radio AM: stasiun terdengar sangat lemah di semua frekuensi." | **Penguat IF 455 kHz** | ✅ | ✅ Konversi ke 455 kHz normal | ⚠️ Lemah | ➖ (bypass, tidak diukur: tampilkan "Blok ini tidak dipakai pada AM") | ⚠️ Lemah | ⚠️ Lemah |

Catatan implementasi kasus:
- Teks pembacaan tiap sel ditulis di `/content/troubleshoot.json` (field `reading.text` + `reading.voltage` + `reading.scope` preset gelombang).
- Pada kasus 8, blok Limiter abu-abu dan **tidak bisa dijadikan tebakan**. Mengetuknya menampilkan penjelasan "tidak dipakai pada AM".
- Kasus 3 dan kasus 1 bergejala mirip (desis). Pembahasan harus menekankan bahwa **pengukuran di Antena** yang membedakan keduanya.
- Penyebab spesifik hanya dipakai di pembahasan, bukan di gejala.
- Setiap kasus **harus punya tepat satu** blok biang kerok yang konsisten dengan aturan "blok pertama yang keluarannya abnormal". Tulis unit test yang memverifikasinya untuk semua kasus.

**Skema kasus:**
```json
{
  "id": "case-01",
  "difficulty": 1,
  "mode": "FM",
  "title": "Kasus 1",
  "symptom": "Radio mendesis keras tapi nggak ada siaran.",
  "culprit": "TUN",
  "readings": {
    "ANT": { "status": "NORMAL", "text": "Sinyal normal", "voltage": "≈ 0,5 mVpp", "scope": "rf-weak" },
    "TUN": { "status": "LOST", "text": "Sinyal hilang", "voltage": "≈ 0 V (hanya noise)", "scope": "noise-only" }
  },
  "hints": ["...", "..."],
  "explanation": {
    "why": "...",
    "rule": "Blok rusak adalah blok pertama yang keluarannya abnormal padahal masukannya normal.",
    "wrongBlocksNote": { "IF": "...", "AMP": "..." }
  }
}
```
(Semua 6 blok harus punya `readings`, kecuali blok yang tidak dipakai di mode AM.)

### 10.5 Penilaian Troubleshooting

| Komponen | Aturan |
|----------|--------|
| XP dasar | +100 jika tebakan benar |
| Bonus efisiensi | Pengukuran unik ≤ 3: +20 · 4–6: +10 · ≥ 7: +0 |
| Penalti salah tebak | −25 XP dari XP dasar per tebakan salah (minimum dasar 50) |
| Penalti petunjuk | −10 XP per petunjuk (dari bonus, tidak minus) |
| Bintang | ⭐⭐⭐: ≤ 3 pengukuran dan 0 salah · ⭐⭐: ≤ 6 pengukuran atau 1 salah · ⭐: selain itu (tetap benar) |
| XP kasus yang diulang | Hanya diberikan selisih jika bintang naik, agar tidak bisa farming |

Semua perhitungan ada di `/src/domain/troubleshootScoring.ts` sebagai pure function dengan unit test.

### 10.6 Acceptance Criteria Troubleshooting
- [ ] Alur 10.2 langkah 1–9 terpenuhi persis, termasuk pop-up gejala sebelum diagram.
- [ ] Tap blok menampilkan hasil ukur dalam ≤ 300 ms (animasi probe ≤ 600 ms, bisa di-skip dengan tap).
- [ ] Hasil ukur memakai ikon + teks + warna (tidak hanya warna).
- [ ] Menebak hanya bisa dari blok yang sudah diukur.
- [ ] Notifikasi sukses muncul saat tebakan benar, dan XP/bintang sesuai tabel 10.5.
- [ ] Salah 2 kali menampilkan jawaban + pembahasan.
- [ ] Pembahasan selalu memuat aturan signal tracing dan alasan blok lain tidak rusak.
- [ ] 8 kasus tersedia, tervalidasi Zod, lulus unit test konsistensi (tepat satu biang kerok per kasus).
- [ ] Daftar kasus menampilkan status (belum/selesai), bintang, dan tingkat kesulitan.
- [ ] Semua kasus bisa dimainkan berulang (tombol "Coba lagi").

---

## 11. FITUR 4 — Menu Evaluasi (Kuis)

### 11.1 Deskripsi
Kuis pilihan ganda standar untuk menguji pemahaman setelah materi/simulasi. **Auto-scoring**, nilai langsung keluar, dan ada **umpan balik** per soal.

### 11.2 Alur
1. **Layar awal:** judul, jumlah soal (default 10 dari bank), perkiraan waktu, nilai terbaik sebelumnya, KKM (default 75), tombol "Mulai".
2. **Soal satu per satu:** nomor/total, bar progres, teks soal, 4 opsi (A–D), tombol "Periksa" (aktif setelah memilih).
3. **Mode umpan balik:** default **umpan balik di akhir** (gaya ujian). Pengaturan alternatif **"Periksa tiap soal"** (gaya latihan): setelah "Periksa", langsung tampil benar/salah + penjelasan. Default: **periksa tiap soal = ON** agar terasa seperti Duolingo, dengan opsi mode ujian di Pengaturan.
4. **Hasil akhir:** skor (0–100) besar, status LULUS/BELUM LULUS terhadap KKM, jumlah benar/salah, XP didapat, ringkasan **per topik** (Diagram Blok, IF, Limiter, Standar AM, Troubleshooting) dengan bar persen.
5. **Tinjauan jawaban:** daftar semua soal dengan jawaban siswa, jawaban benar (hijau/merah + ikon centang/silang), dan **penjelasan** tiap soal.
6. Tombol: "Ulangi kuis" (soal baru acak), "Latih topik lemah" (kuis dari topik dengan skor < 60%), "Kembali".

### 11.3 Aturan
- Bank soal target **≥ 20 soal** (12 soal awal di Lampiran B). Tiap sesi mengambil 10 soal **acak**, dengan urutan opsi diacak, tanpa soal yang sama dua kali dalam satu sesi.
- **Skor = (jumlah benar ÷ jumlah soal) × 100**, dibulatkan ke bilangan bulat terdekat. Tidak ada nilai negatif.
- Tidak ada batas jumlah percobaan. Disimpan: 20 riwayat terakhir (tanggal, skor, per topik) dan skor terbaik.
- Soal tidak boleh dilewati tanpa menjawab di mode ujian. Keluar di tengah kuis harus konfirmasi, dan progres kuis yang belum selesai **tidak** dihitung.
- Skema soal:
```json
{
  "id": "q-001",
  "topic": "IF",
  "question": "...",
  "options": ["...", "...", "...", "..."],
  "correctIndex": 1,
  "explanation": "...",
  "difficulty": 1,
  "needs_review": false
}
```

### 11.4 Acceptance Criteria Evaluasi
- [ ] Skor dihitung otomatis sesuai 11.3, dan unit test mencakup kasus 0%, 100%, dan pembulatan.
- [ ] Hasil akhir menampilkan skor, status lulus, dan rincian per topik.
- [ ] Tinjauan jawaban menampilkan jawaban siswa vs jawaban benar + penjelasan untuk **semua** soal.
- [ ] Urutan soal dan opsi diacak setiap sesi, dan `correctIndex` tetap benar setelah pengacakan (unit test).
- [ ] "Latih topik lemah" membuat kuis dari topik dengan skor terendah.
- [ ] Riwayat dan skor terbaik tersimpan setelah aplikasi ditutup dan dibuka lagi.
- [ ] XP: +5 per jawaban benar, +20 bila lulus.

---

## 12. Profil & Progres
- Tampilkan: nama panggilan, level + bar XP, total XP, streak saat ini dan terpanjang, target harian + progres hari ini, daftar badge (terkunci/terbuka), nilai kuis terbaik, jumlah kasus troubleshooting selesai + total bintang.
- Pengaturan: suara (on/off), getar (on/off), ukuran font (kecil/sedang/besar), mode kuis (periksa tiap soal/ujian), target harian, pengingat harian (opsional), **reset progres** (dengan konfirmasi dua langkah).
- **Ekspor progres** (opsional, tidak wajib MVP): tombol "Bagikan hasil" menghasilkan gambar ringkasan untuk dikirim ke guru.

---

## 13. Model Data & Penyimpanan Lokal

```ts
type Progress = {
  profile: { nickname: string; dailyGoalXp: 20 | 30 | 50; createdAt: string };
  xp: { total: number; todayDate: string; today: number };
  streak: { current: number; longest: number; lastGoalDate: string | null; freezeUsedWeek: string | null };
  materi: Record<sectionId, { cardsSeen: string[]; completed: boolean; quickCheckPassedFirstTry: boolean }>;
  simulasi: { runs: { mode: "AM" | "FM"; date: string }[]; inspectedBlocks: string[] };
  troubleshoot: Record<caseId, { solved: boolean; bestStars: 0 | 1 | 2 | 3; attempts: number; lastMeasurements: number; lastWrong: number }>;
  quiz: { best: number | null; history: { date: string; score: number; byTopic: Record<string, { correct: number; total: number }> }[] };
  badges: Record<badgeId, string /* ISO date unlocked */>;
  settings: { sound: boolean; haptics: boolean; fontScale: "S" | "M" | "L"; quizFeedbackMode: "perQuestion" | "end"; heartsEnabled: boolean; notifications: boolean };
};
```
- Simpan dengan versi skema (`schemaVersion`) dan fungsi migrasi, agar update aplikasi tidak menghapus progres.
- Penyimpanan hanya di perangkat. **Tidak ada pengumpulan data pribadi atau analitik** di MVP.

---

## 14. Desain Visual & UX

- **Gaya:** cerah, ramah, bersudut membulat, tombol besar dengan "efek timbul", kartu bersih. Tema terang (tema gelap opsional jika waktu cukup).
- **Warna (usulan, bisa disesuaikan):** primer biru-toska `#1CB0C8`, aksen kuning `#FFC800`, sukses hijau `#58CC02`, error merah `#E5484D`, peringatan oranye `#FF9600`, teks `#1F2937`, latar `#F7F9FB`. Pastikan kontras teks ≥ WCAG AA (4,5:1).
- **Tipografi:** satu font sans-serif bulat/ramah berlisensi bebas (mis. Nunito atau Poppins). Teks isi ≥ 16 sp, judul 22–28 sp.
- **Target sentuh** ≥ 48×48 dp. Jarak antar elemen interaktif ≥ 8 dp.
- **Warna semantik blok (troubleshooting):** selalu disertai ikon dan teks.
- **Animasi:** durasi 150–400 ms untuk transisi UI, ≤ 2 detik untuk perayaan. Gunakan Reanimated pada UI thread.
- **Suara:** efek pendek (benar, salah, level naik, tap). Aset orisinal atau berlisensi CC0, dicatat di `ASSETS.md`.
- **Aksesibilitas:** label untuk pembaca layar, dukung *font scaling* OS, hormati "Kurangi gerak".
- **Copywriting:** santai tapi sopan, mendukung. Contoh sukses: "Mantap! Kamu nemu biang keroknya." Contoh salah: "Belum tepat, tapi tenang. Coba cek blok sebelumnya."

---

## 15. Persyaratan Non-Fungsional

| Aspek | Target |
|-------|--------|
| Performa | ≥ 50 fps pada animasi (HP 3 GB RAM, Android 8+); cold start ≤ 3 detik |
| Ukuran | APK ≤ 50 MB |
| Offline | 100% fitur berjalan tanpa internet |
| Kompatibilitas | Android 8.0+ (iOS opsional via Expo, tidak wajib diuji di MVP) |
| Orientasi | Portrait terkunci |
| Keandalan | Tidak ada crash pada alur utama; progres tidak hilang saat app dimatikan paksa |
| Privasi | Tidak ada akun, tidak ada pelacakan, tidak ada izin selain notifikasi (opsional) |
| Kualitas kode | TypeScript strict, ESLint + Prettier, tanpa `any` tanpa alasan |
| Aksesibilitas | WCAG AA untuk kontras, mode font besar tidak merusak layout |

---

## 16. Struktur Repositori yang Disarankan

```
/app                  # expo-router: (tabs)/materi, simulasi, troubleshoot, evaluasi, profil
/content              # materi.json, troubleshoot.json, quiz.json (+ skema Zod di /src/content/schema.ts)
/src
  /domain             # signal.ts, xp.ts, streak.ts, troubleshootScoring.ts, quizScoring.ts, badges.ts
  /ui                 # komponen umum (Button, Card, ProgressBar, Modal, BottomSheet)
  /ui/visuals         # BlockDiagram, MixerAnimation, LimiterClipAnimation, dst.
  /store              # Zustand + persist + migrasi
  /i18n               # id.json
/assets               # ikon, font, suara (orisinal/CC0)
/__tests__            # unit test domain + validasi konten
DECISIONS.md          # keputusan teknis & catatan koreksi konten
ASSETS.md             # sumber & lisensi aset
README.md             # cara jalan, build APK, cara edit konten
```

---

## 17. Milestone & Checklist Pengerjaan

**M0 — Setup (hari 1)**
- [ ] Proyek Expo + TS + lint + test jalan. Struktur folder sesuai Bagian 16.
- [ ] Skema Zod + 3 file konten kosong tervalidasi lewat test.

**M1 — Fondasi UI & Gamifikasi**
- [ ] Tab bar 4 menu, header (streak, XP), onboarding, profil dasar, tema + komponen dasar.
- [ ] Store persist + migrasi; logika XP, level, streak, badge (unit test).

**M2 — Materi**
- [ ] Mesin render kartu dari JSON + pager swipe + Cek Cepat.
- [ ] Komponen visual Section 1–6; konten 6 section lengkap.
- [ ] AC Bagian 8.4 terpenuhi.

**M3 — Simulasi**
- [ ] `signal.ts` + diagram blok vertikal + mini-osiloskop + animasi aliran.
- [ ] Toggle AM/FM, pilih stasiun, play/pause/kecepatan, detail blok.
- [ ] AC Bagian 9.5 terpenuhi.

**M4 — Troubleshooting**
- [ ] Alur 10.2 lengkap, 8 kasus, scoring, petunjuk, pembahasan.
- [ ] Unit test konsistensi kasus dan scoring. AC Bagian 10.6 terpenuhi.

**M5 — Evaluasi**
- [ ] Bank soal ≥ 20 (12 dari Lampiran B + sisanya `needs_review`), pengacakan, scoring, hasil per topik, tinjauan jawaban, riwayat.
- [ ] AC Bagian 11.4 terpenuhi.

**M6 — Polish & QA**
- [ ] Efek suara + haptik, animasi perayaan, aksesibilitas, mode "Kurangi gerak".
- [ ] Uji di HP/emulator entry-level, profil performa, perbaikan jank.
- [ ] README, `ASSETS.md`, `DECISIONS.md` lengkap.

**M7 — Rilis**
- [ ] Build APK/AAB via EAS, versi 1.0.0, catatan rilis.
- [ ] Daftar "konten perlu ditinjau guru" (semua soal `needs_review: true`) diserahkan ke pemilik produk.

---

## 18. Rencana Pengujian

- **Unit test (wajib):** scoring kuis (0/50/100%, pembulatan, pengacakan opsi), scoring troubleshooting (semua kombinasi pengukuran/salah/petunjuk), XP dan level, streak (hari terlewat, freeze, pergantian zona waktu), generator sinyal (amplitudo dan frekuensi sesuai blok), perhitungan fLO dan frekuensi bayangan.
- **Test validasi konten (wajib):** semua JSON lolos Zod; tiap kasus punya tepat satu `culprit` dan konsisten dengan aturan "blok pertama yang abnormal"; semua `correctIndex` valid.
- **UI test:** alur kuis lengkap, alur troubleshooting (benar, salah sekali, salah dua kali), navigasi tab.
- **E2E smoke (1 skenario):** onboarding → buka satu section materi → jalankan simulasi → selesaikan satu kasus → kerjakan kuis → lihat profil.
- **Uji manual perangkat:** 1 HP Android entry-level, cek fps animasi, mode offline (mode pesawat), font besar, rotasi terkunci.
- **Uji pengguna:** 5 siswa mengerjakan tanpa bantuan. Catat titik bingung (target: ≥ 80% menyelesaikan kasus 1 mandiri).

---

## 19. Di Luar Cakupan MVP, Risiko, & Pertanyaan Terbuka

**Di luar cakupan (v1.1+):**
- Dashboard guru, kelas/kode kelas, sinkronisasi cloud, leaderboard/liga antar siswa.
- Injeksi kerusakan acak dan kasus prosedural, serta simulasi dengan slider noise interaktif penuh.
- Mode pengukuran dengan multimeter/osiloskop virtual bergaya hardware.
- Dukungan bahasa lain, tema gelap penuh, versi tablet khusus.
- Penerimaan SSB/stereo FM (19 kHz pilot), PLL secara mendalam.

**Risiko:**
| Risiko | Mitigasi |
|--------|----------|
| Animasi berat di HP murah | Anggaran fps sejak M2, SVG sederhana, fallback statis, opsi Skia |
| Konten teknis keliru | Lampiran A sebagai sumber kebenaran, semua soal tambahan `needs_review`, guru meninjau sebelum rilis |
| Siswa "farming" XP | Batas XP harian untuk simulasi dan hanya selisih bintang untuk kasus ulang |
| Kebingungan AM vs FM (Limiter) | Toggle jelas, blok bypass diberi penjelasan |
| Lisensi aset | Semua aset orisinal/CC0, dicatat di `ASSETS.md` |

**Pertanyaan terbuka untuk pemilik produk:**
1. Apakah target platform memang Android dulu (A1)? Perlu iOS atau versi web?
2. Apakah perlu dashboard guru atau setoran nilai (misal ekspor skor) di versi berikutnya?
3. KKM kuis 75 sudah sesuai kurikulum sekolah?
4. Apakah sistem nyawa mau diaktifkan (A4)?
5. Nama aplikasi final dan identitas visual (logo, maskot)?
6. Apakah ada standar buku/silabus tertentu yang jadi rujukan istilah dan nilai frekuensi?

---

## Lampiran A — Referensi Teknis (Sumber Kebenaran Konten)

| Parameter | Nilai |
|-----------|-------|
| IF penerima AM | **455 kHz** |
| IF penerima FM | **10,7 MHz** |
| Rumus osilator lokal (injeksi atas) | **fLO = fRF + fIF** |
| Frekuensi bayangan (image) | **fimage = fRF + 2·fIF** |
| Contoh AM | 900 kHz → fLO = 1355 kHz → IF 455 kHz → bayangan 1810 kHz |
| Contoh FM | 98,0 MHz → fLO = 108,7 MHz → IF 10,7 MHz → bayangan 119,4 MHz |
| Pita siaran AM (MW) | sekitar 530–1600 kHz (pembawa Indonesia/ITU Wilayah 3: 531 s.d. 1602 kHz) |
| Spasi kanal AM | **9 kHz** (Indonesia/ITU Wilayah 3); 10 kHz di Amerika |
| Lebar pita AM | ≈ 2 × frekuensi audio tertinggi (≈ 9 kHz untuk audio ±4,5 kHz) |
| Pita siaran FM | 87,5–108 MHz |
| Spasi kanal FM | 200 kHz |
| Deviasi frekuensi maksimum FM | ±75 kHz |
| Informasi AM berada pada | amplitudo → detektor AM = *envelope detector* |
| Informasi FM berada pada | frekuensi → detektor FM = diskriminator/rasio/PLL |
| Fungsi limiter (FM) | membatasi amplitudo sinyal IF agar konstan, menghilangkan noise amplitudo |
| Letak limiter | setelah penguat IF, sebelum detektor FM |
| AM tidak memakai limiter | karena akan menghapus informasi amplitudo. AM memakai AGC |

> Catatan: beberapa buku menyebut pita AM sebagai 535–1605 kHz (konvensi lama/Amerika). Aplikasi memakai nilai di tabel di atas dan boleh menyebut variasinya di catatan kaki kartu.

## Lampiran B — Bank Soal Awal (12 Soal)

Format: soal · opsi (A–D) · **jawaban** · penjelasan singkat · topik.

1. *IF standar penerima radio AM adalah…* A. 10,7 MHz · **B. 455 kHz** · C. 1,6 MHz · D. 38,9 MHz — IF AM adalah 455 kHz. *(IF)*
2. *IF standar penerima radio FM adalah…* **A. 10,7 MHz** · B. 455 kHz · C. 98 MHz · D. 4,5 MHz — IF FM adalah 10,7 MHz. *(IF)*
3. *Stasiun AM 900 kHz, IF 455 kHz, injeksi atas. Frekuensi osilator lokal?* A. 445 kHz · **B. 1355 kHz** · C. 1810 kHz · D. 455 kHz — fLO = 900 + 455 = 1355 kHz. *(IF)*
4. *Stasiun FM 98,0 MHz, IF 10,7 MHz, injeksi atas. Frekuensi osilator lokal?* A. 87,3 MHz · B. 98,0 MHz · **C. 108,7 MHz** · D. 119,4 MHz — fLO = 98,0 + 10,7 = 108,7 MHz. (119,4 MHz adalah frekuensi bayangan.) *(IF)*
5. *Fungsi limiter pada penerima FM adalah…* A. Menguatkan sinyal audio · **B. Membuat amplitudo sinyal IF konstan sehingga noise amplitudo hilang** · C. Mengubah frekuensi RF menjadi IF · D. Memilih stasiun — Limiter memotong variasi amplitudo. *(Limiter)*
6. *Urutan blok penerima FM yang benar adalah…* A. Antena → IF → Tuner → Limiter → Detektor → Audio · **B. Antena → Tuner → IF → Limiter → Detektor → Penguat Audio** · C. Antena → Tuner → Limiter → IF → Detektor → Audio · D. Antena → Detektor → Tuner → IF → Limiter → Audio *(Diagram Blok)*
7. *Mengapa penerima AM tidak memakai limiter?* A. Karena AM tidak punya noise · **B. Karena informasi AM ada pada amplitudo, sehingga limiter akan menghapus suaranya** · C. Karena AM memakai IF lebih tinggi · D. Karena AM tidak memakai detektor — *(Limiter)*
8. *Spasi kanal stasiun siaran AM di Indonesia adalah…* A. 200 kHz · B. 10 kHz · **C. 9 kHz** · D. 75 kHz *(Standar AM)*
9. *Rentang pita siaran AM (gelombang menengah) kira-kira…* A. 88–108 MHz · **B. 530–1600 kHz** · C. 3–30 MHz · D. 150–300 kHz *(Standar AM)*
10. *Radio FM mendesis keras tanpa siaran. Keluaran antena normal, sedangkan keluaran tuner hanya noise. Blok yang rusak adalah…* **A. Tuner** · B. Penguat IF · C. Detektor · D. Penguat audio — Keluaran blok pertama yang abnormal adalah tuner. *(Troubleshooting)*
11. *Detektor pada penerima AM umumnya berupa…* A. Diskriminator Foster-Seeley · **B. Envelope detector (dioda + RC)** · C. Mixer · D. Osilator lokal *(Diagram Blok)*
12. *Mengapa penerima superheterodyne mengubah semua stasiun ke IF yang tetap?* A. Supaya stasiun lebih jauh jangkauannya · **B. Supaya penguat dan filter IF bisa disetel tetap sehingga penguatan dan selektivitas baik** · C. Supaya tidak perlu antena · D. Supaya tidak ada noise sama sekali *(IF)*

Target distribusi bank soal ≥ 20: Diagram Blok (4), IF (5), Limiter (4), Standar AM (3), Troubleshooting (4). Sisa soal dibuat agent dengan skema yang sama dan ditandai `needs_review: true`.

## Lampiran C — Glosarium

| Istilah | Padanan/penjelasan |
|---------|---------------------|
| Tuner | Penala; bagian penerima yang memilih stasiun (RF + mixer + osilator lokal) |
| Mixer | Pencampur; menghasilkan frekuensi selisih/jumlah dari dua sinyal |
| Osilator lokal (LO) | Pembangkit sinyal di dalam radio untuk konversi ke IF |
| IF (Intermediate Frequency) | Frekuensi antara tetap setelah konversi |
| Limiter | Pembatas amplitudo pada jalur FM |
| Detektor/Demodulator | Pengambil sinyal audio dari sinyal bermodulasi |
| AGC | Pengendali penguatan otomatis |
| Signal tracing | Melacak sinyal blok demi blok untuk menemukan kerusakan |
| Frekuensi bayangan (image) | Frekuensi tak diinginkan yang juga menghasilkan IF yang sama |