# SinyalLab Backend API (Hono + Bun + Prisma)

Backend API untuk aplikasi mobile pembelajaran SinyalLab (SMK Jurusan Audio Video / TAV).

---

## 1. Persyaratan & Instalasi

Pastikan runtime [Bun](https://bun.com) telah terpasang:

```bash
cd backend
bun install
```

Sinkronisasi skema database SQLite (Prisma):

```bash
bunx prisma db push
```

Menjalankan server dalam mode development:

```bash
bun run dev
```

---

## 2. Dokumentasi API (Swagger UI) — Akses Internal Terproteksi

Dokumentasi API **tidak dapat diakses oleh publik secara terbuka**. Semua akses ke rute dokumentasi dilindungi oleh **HTTP Basic Authentication** dan kill-switch environment.

### 2.1 URL Akses
- **Swagger UI Interactive:** `http://localhost:3000/docs`
- **OpenAPI Specification (JSON):** `http://localhost:3000/docs/openapi.json`

### 2.2 Kredensial Default (Dapat diubah di `.env`)
Saat membuka URL di atas di browser, browser akan memunculkan dialog otentikasi:
- **Username:** `admin` (konfigurasi via `DOCS_USER`)
- **Password:** `sinyallab-rahasia-2026` (konfigurasi via `DOCS_PASSWORD`)

> [!WARNING]
> Permintaan tanpa kredensial yang sah akan langsung ditolak dengan status **`401 Unauthorized`**.

### 2.3 Mematikan Dokumentasi di Produksi (Kill-switch)
Jika ingin mematikan dokumentasi sama sekali:
```env
ENABLE_DOCS=false
```
Server akan mengembalikan **`404 Not Found`** untuk semua permintaan ke `/docs/*`.

---

## 3. Daftar Endpoint Utama

| Metode | Path | Otorisasi | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Publik | Liveness check (status ok) |
| `GET` | `/ready` | Publik | Readiness check koneksi database |
| `POST` | `/v1/auth/classes` | Publik (IP Monitored) | Mendaftarkan kelas baru & password kelas |
| `POST` | `/v1/auth/login` | Publik (IP Blocker 5 Menit) | Login siswa dengan nama kelas & password |
| `POST` | `/v1/auth/refresh` | Publik | Rotasi refresh token (reuse detection) |
| `POST` | `/v1/auth/logout` | Publik | Cabut sesi refresh token |
| `GET` | `/v1/auth/me` | Bearer Token (JWT) | Mengambil profil user yang sedang aktif |
| `GET` | `/docs` | HTTP Basic Auth | Antarmuka visual Swagger UI |
| `GET` | `/docs/openapi.json` | HTTP Basic Auth | Spesifikasi OpenAPI 3.0.3 (JSON) |

---

## 4. Perintah Pengujian & Typecheck

```bash
# Menjalankan typecheck TypeScript
bun run typecheck

# Menjalankan seluruh test suite (unit & integration)
bun test
```
