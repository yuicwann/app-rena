# ARCHITECTURE_BACKEND — SinyalLab API (Hono + Bun)

Pendamping `PRD_SinyalLab.md`, `ARCHITECTURE.md` (mobile), dan `DATABASE.md`.
Dokumen ini menjelaskan **bagaimana backend dibangun**: struktur kode, aturan lapisan, autentikasi, API, sinkronisasi, keamanan, pengujian, dan cara kerja agent AI di dalamnya.

> **Keputusan baru yang menggantikan `DATABASE.md`:** backend ditulis sendiri dengan **Hono di runtime Bun**, **bukan Supabase**.
>
> - D1 di `DATABASE.md` (Supabase) → diganti PostgreSQL biasa + API Hono.
> - Edge Functions di `DATABASE.md` §5.2 → menjadi endpoint Hono (Bagian 7).
> - Row Level Security dan `auth.users` Supabase → diganti **otorisasi di lapisan aplikasi** dan tabel kredensial sendiri (Bagian 10 memuat perubahan SQL yang harus diterapkan).
> - Aturan sinkronisasi (`DATABASE.md` §6), privasi (§8), dan isi tabel progres **tetap berlaku**.

**Prinsip:** sederhana, tipe-aman dari ujung ke ujung, mudah dites, aman secara default. Jangan menambah infrastruktur (Redis, antrean, microservice) sebelum ada kebutuhan yang terukur.

---

## 1. Stack

| Area           | Pilihan                                                                                         | Catatan                                                                                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime        | **Bun** (versi stabil terbaru, kunci di `package.json` → `engines` dan Dockerfile)              | Bun tidak melakukan typecheck, jadi `tsc --noEmit` wajib di CI                                                                                                                            |
| Framework HTTP | **Hono** v4                                                                                     | Web-standard API, ringan, RPC bertipe                                                                                                                                                     |
| Bahasa         | TypeScript `strict`, `noUncheckedIndexedAccess`                                                 |                                                                                                                                                                                           |
| Database       | PostgreSQL 15+                                                                                  | Skema dari `DATABASE.md` (dengan perubahan Bagian 10)                                                                                                                                     |
| Akses DB       | **Kysely** + driver `pg`, tipe dibuat otomatis dengan `kysely-codegen`                          | **SQL-first**: file migrasi `.sql` adalah sumber kebenaran skema; tipe TS diturunkan dari DB, bukan sebaliknya. Drizzle boleh dipakai jika agent memutuskan lain, catat di `DECISIONS.md` |
| Migrasi        | File SQL berurutan di `apps/api/migrations` + runner kecil (`scripts/migrate.ts`) atau `dbmate` | Tabel `schema_migrations`                                                                                                                                                                 |
| Validasi       | **Zod** (di `packages/contracts`) + `@hono/zod-validator`                                       | Skema yang sama dipakai app mobile                                                                                                                                                        |
| Auth           | JWT akses pendek (`hono/jwt`, HS256) + refresh token opaque di DB                               | Bagian 6                                                                                                                                                                                  |
| Hash password  | `Bun.password` (argon2id)                                                                       | Tanpa library tambahan                                                                                                                                                                    |
| Test           | `bun test` + Postgres sungguhan (Docker) + `app.request()` milik Hono                           | Bagian 12                                                                                                                                                                                 |
| Lint/format    | ESLint + Prettier + `eslint-plugin-boundaries` (sama dengan mobile)                             |                                                                                                                                                                                           |
| Kontainer      | Docker (`oven/bun`), Docker Compose untuk dev                                                   | Bagian 13                                                                                                                                                                                 |

**Tidak dipakai di MVP:** Redis, message queue, GraphQL, ORM berat, microservice, WebSocket/realtime, serverless. Satu proses API + satu PostgreSQL cukup untuk ±1.000 siswa.

---

## 2. Struktur Repositori (Monorepo Bun Workspaces)

Agar skema Zod, fungsi `normalizeKey`, dan tipe API **dipakai bersama** oleh mobile dan backend (menghapus risiko "klien dan server menormalkan kunci dengan cara berbeda", lihat `DATABASE.md` §11), repositori dijadikan monorepo.

```
/                              # root repo
  package.json                 # "workspaces": ["apps/*", "packages/*"]
  bun.lock                     # WAJIB di-commit
  AGENTS.md                    # panduan untuk agent AI (Bagian 14)
  docs/                        # PRD_SinyalLab.md, ARCHITECTURE.md, ARCHITECTURE_BACKEND.md, DATABASE.md, DECISIONS.md
  docker-compose.yml           # postgres (dev & test) + api
  /apps
    /mobile                    # aplikasi Expo (struktur di ARCHITECTURE.md; semua path-nya kini relatif ke apps/mobile)
    /api
      /src
        index.ts               # ENTRY: baca env → bangun deps → Bun.serve
        app.ts                 # createApp(deps): susun middleware + route
        env.ts                 # validasi environment dengan Zod (fail fast)
        deps.ts                # COMPOSITION ROOT: satu-satunya tempat membuat instance
        /modules
          /auth                # routes.ts  service.ts  repo.ts  tokens.ts  password.ts  *.test.ts
          /me                  # profil sendiri, settings, reset progres
          /classes             # CRUD kelas (guru/admin)
          /students            # buat siswa (massal), reset password, nonaktifkan
          /sync                # push & pull progres
            /events            # satu file per tipe event: xp.ts, simulasi.ts, troubleshoot.ts, quiz.ts, badge.ts, ...
          /admin               # kelola guru
          /health              # /health, /ready
        /domain                # LOGIKA MURNI (tanpa Hono, tanpa DB): xpRules.ts, streak.ts, mergeRules.ts, loginPolicy.ts
        /db
          client.ts            # pool + instance Kysely
          tx.ts                # helper transaksi
          types.generated.ts   # keluaran kysely-codegen (jangan diedit tangan)
        /middleware            # auth.ts, roles.ts, rateLimit.ts, errorHandler.ts, logger.ts
        /shared                # errors.ts, logger.ts, semaphore.ts, clock.ts, ids.ts, ip.ts
      /migrations              # 0001_init.sql, 0002_...
      /scripts                 # migrate.ts, create-admin.ts, seed-dev.ts
      /tests
        /integration           # tes API + DB nyata
        /helpers               # buatApp(), buatSiswa(), loginSebagai(), resetDb()
      Dockerfile
      package.json  tsconfig.json
  /packages
    /contracts                 # dipakai API & mobile
      /src
        schemas/               # Zod: auth, classes, students, sync (event union), me
        keys.ts                # classKey(), usernameKey()
        constants.ts           # tabel XP (PRD §7.1), id blok, id badge, kode error
        index.ts
    /config                    # tsconfig dasar, preset ESLint
```

---

## 3. Arsitektur Berlapis

```
HTTP request
   │
   ▼
 middleware  (request-id, log, secure headers, body limit, rate limit, auth, roles)
   │
   ▼
 routes.ts   ← tipis: validasi input (Zod), panggil service, bentuk respons
   │
   ▼
 service.ts  ← ATURAN BISNIS & otorisasi tingkat sumber daya, mengatur transaksi
   │      ╲
   ▼       ▼
 repo.ts   domain/   ← repo = SQL saja; domain = fungsi murni
   │
   ▼
 PostgreSQL
```

### Aturan Dependensi (Ditegakkan Lint)

1. **`routes.ts`** boleh memakai: service (lewat `deps`), `packages/contracts`, `middleware`, `shared`. **Tidak boleh** mengimpor `repo` atau `db`.
2. **`service.ts`** boleh memakai: repo modulnya sendiri, `domain`, `shared`, `contracts`, tipe `Clock`/`Logger`. **Tidak boleh mengimpor `hono`** dan tidak tahu apa itu `Context`, status HTTP, atau header.
3. **`repo.ts`** hanya bicara ke `db`. Berisi query, **tanpa aturan bisnis**. Mengembalikan objek biasa (camelCase), bukan baris mentah. Menerjemahkan galat DB (mis. kode `23505` unique violation) menjadi `AppError('CONFLICT')`.
4. **`domain/`** fungsi murni TypeScript: tanpa `hono`, `kysely`, `Bun`, `process.env`, `Date.now()` langsung (waktu masuk lewat parameter atau `Clock`).
5. Modul **tidak mengimpor repo modul lain**. Butuh data modul lain → panggil **service**-nya (lewat `deps`), atau pindahkan logikanya ke `domain`.
6. **Hanya `deps.ts`** yang boleh membuat instance (`new`) service, repo, pool DB, logger. Selain itu semuanya menerima dependensi lewat parameter.
7. Alias: `@api/*` → `apps/api/src/*`, `@contracts` → `packages/contracts`.

### Pola Hono yang Dipakai

- **Tidak ada "controller" ala Rails.** Handler ditulis langsung setelah definisi path supaya tipe parameter dan hasil validasi terinferensi dengan benar. Logika panjang dipindah ke service.
- Tiap modul mengekspor **fungsi pembuat route**: `export const authRoutes = (deps: Deps) => new Hono<AppEnv>().post(...)`. Rantai `.post().get()` dijaga agar tipe RPC (`AppType`) tetap lengkap.
- **`createApp(deps)` adalah fungsi**, bukan singleton global. Tes membuat app dengan dependensi palsu atau DB uji.
- Ekspor `export type AppType = ReturnType<typeof createApp>` untuk klien `hc<AppType>()` di mobile (`shared/api`). Jika kompilasi tipe melambat akibat banyak route, jaga modul tetap kecil dan jangan menyatukan semua route dalam satu tipe raksasa tanpa perlu.

---

## 4. Kerangka Kode Inti (Acuan Gaya, Bukan Salin-Tempel Buta)

> Verifikasi nama opsi terhadap versi Hono/Bun yang terpasang (API kecil sering berubah antar minor).

**`env.ts`**

```ts
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32), // acak, ≥ 32 byte
  ACCESS_TOKEN_TTL_SEC: z.coerce.number().int().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().default(30),
  CORS_ORIGINS: z.string().default(""), // dipisah koma; kosong = tanpa CORS
  TRUSTED_PROXY_HOPS: z.coerce.number().int().min(0).default(1),
  ARGON_MEMORY_KIB: z.coerce.number().int().default(19456),
  ARGON_TIME_COST: z.coerce.number().int().default(2),
  HASH_CONCURRENCY: z.coerce.number().int().min(1).default(4),
  ENFORCE_XP_RULES: z.coerce.boolean().default(true),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Env = z.infer<typeof schema>;
export const loadEnv = (
  src: Record<string, string | undefined> = process.env,
): Env => schema.parse(src);
```

Catatan: `z.coerce.boolean()` mengubah string `"false"` menjadi `true`. Gunakan transform eksplisit (`v === "true"`) untuk variabel boolean.

**`index.ts`**

```ts
import { loadEnv } from "./env";
import { buildDeps } from "./deps";
import { createApp } from "./app";

const env = loadEnv();
const deps = await buildDeps(env);
const app = createApp(deps);

const server = Bun.serve({ port: env.PORT, fetch: app.fetch });
deps.logger.info({ port: server.port }, "api started");

const shutdown = async () => {
  server.stop(); // berhenti menerima koneksi baru
  await deps.db.destroy(); // tutup pool
  process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```

**`app.ts`** (susunan middleware: urutan penting)

```ts
export function createApp(deps: Deps) {
  const app = new Hono<AppEnv>();

  app.use(requestId());
  app.use(accessLog(deps.logger));
  app.use(secureHeaders());
  app.use(
    "/v1/*",
    bodyLimit({ maxSize: 256 * 1024, onError: (c) => tooLarge(c) }),
  );
  if (deps.env.CORS_ORIGINS)
    app.use("/v1/*", cors({ origin: deps.env.CORS_ORIGINS.split(",") }));

  app.onError(errorHandler(deps.logger));
  app.notFound((c) =>
    c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Endpoint tidak ditemukan.",
          requestId: c.get("requestId"),
        },
      },
      404,
    ),
  );

  return app
    .route("/", healthRoutes(deps))
    .route("/v1/auth", authRoutes(deps))
    .route("/v1/me", meRoutes(deps))
    .route("/v1/sync", syncRoutes(deps))
    .route("/v1/classes", classRoutes(deps))
    .route("/v1/students", studentRoutes(deps))
    .route("/v1/admin", adminRoutes(deps));
}
export type AppType = ReturnType<typeof createApp>;
```

**Route tipis (contoh `auth/routes.ts`)**

```ts
export const authRoutes = (deps: Deps) =>
  new Hono<AppEnv>()
    .post(
      "/student/login",
      rateLimit(deps.limits.loginIp),
      validate("json", studentLoginSchema),
      async (c) => {
        const body = c.req.valid("json");
        const result = await deps.auth.studentLogin(body, {
          ip: clientIp(c, deps.env),
        });
        c.header("Cache-Control", "no-store");
        return c.json(result, 200);
      },
    )
    .post("/refresh", validate("json", refreshSchema), async (c) => {
      const result = await deps.auth.refresh(c.req.valid("json").refreshToken);
      c.header("Cache-Control", "no-store");
      return c.json(result, 200);
    });
```

`validate()` membungkus `zValidator` dan melempar `AppError("VALIDATION_FAILED", 422, …)` agar format galat seragam.

**Service (aturan bisnis, tanpa Hono)**

```ts
export function createAuthService(d: {
  repo: AuthRepo;
  hasher: Hasher;
  tokens: Tokens;
  clock: Clock;
  policy: LoginPolicy;
}) {
  return {
    async studentLogin(input: StudentLoginInput, ctx: { ip: string }) {
      const classKey = toClassKey(input.className);
      const usernameKey = toUsernameKey(input.username);

      await d.repo.assertNotLocked(
        classKey,
        usernameKey,
        ctx.ip,
        d.clock.now(),
      ); // hitung dari login_attempts
      const user = await d.repo.findActiveStudent(classKey, usernameKey);

      // selalu lakukan verifikasi (hash tiruan bila user tidak ada) agar waktu respons seragam
      const ok = await d.hasher.verify(
        input.password,
        user?.passwordHash ?? d.hasher.dummyHash,
      );
      await d.repo.recordAttempt({
        classKey,
        usernameKey,
        ip: ctx.ip,
        success: !!user && ok,
      });

      if (!user || !ok)
        throw new AppError(
          "INVALID_CREDENTIALS",
          401,
          "Kelas, nama, atau password salah.",
        );
      const session = await d.tokens.issueSession(user);
      await d.repo.touchLastLogin(user.id);
      return {
        ...session,
        user: toPublicUser(user),
        mustChangePassword: user.mustChangePassword,
      };
    },
    // refresh(), changePassword(), logout() ...
  };
}
```

**Error terpusat**

```ts
export type ErrorCode =
  | "VALIDATION_FAILED"
  | "INVALID_CREDENTIALS"
  | "LOGIN_LOCKED"
  | "RATE_LIMITED"
  | "TOKEN_INVALID"
  | "TOKEN_EXPIRED"
  | "REFRESH_REUSED"
  | "ACCOUNT_DISABLED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "INTERNAL";

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public status: 400 | 401 | 403 | 404 | 409 | 413 | 422 | 429 | 500,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}
```

`errorHandler` mengubah `AppError` menjadi `{ error: { code, message, details?, requestId } }`, galat tak dikenal menjadi `INTERNAL` 500 dengan pesan generik, dan **hanya mencatat stack ke log, tidak ke respons**.

---

## 5. Konvensi API

- **Prefix versi:** `/v1`. Perubahan yang merusak klien lama → `/v2`, jangan mengubah `/v1` diam-diam. Mobile app lama hidup di HP siswa berbulan-bulan.
- **Format:** JSON `camelCase`. Tanggal-waktu ISO 8601 UTC (`2026-11-04T14:30:00Z`). Tanggal lokal `YYYY-MM-DD` (field `localDate`). ID berupa UUID.
- **Galat seragam:** `{ "error": { "code", "message", "details?", "requestId" } }`. Pesan untuk manusia dalam Bahasa Indonesia. Klien bercabang berdasarkan `code`, bukan teks pesan.
- **Status:** 200/201 sukses, 401 belum/invalid autentikasi, 403 tidak berhak, 404 tidak ada **atau tidak boleh dilihat** (jangan bocorkan keberadaan data milik orang lain), 409 konflik, 422 validasi, 429 batas laju.
- **Idempotensi:** semua endpoint tulis dari sinkronisasi memakai `clientEventId`. Tulis ulang yang sama = aman.
- **Paginasi:** berbasis kursor (`?limit=50&cursor=...`) untuk daftar yang bisa panjang. Hindari `OFFSET`.
- **Caching:** respons autentikasi dan data pribadi diberi `Cache-Control: no-store`.
- **Kontrak:** skema request dan response ada di `packages/contracts`. Mengubah kontrak = perubahan di satu tempat, kompilasi mobile dan API sama-sama gagal bila tidak sinkron.

---

## 6. Autentikasi & Otorisasi

### 6.1 Identitas

- Siswa: login dengan (nama kelas, username/no. absen, password). Guru/admin: email + password. Detail bentuk akun: `DATABASE.md` §1 dan perubahan di Bagian 10 dokumen ini.
- Kredensial disimpan di tabel `users` kita sendiri (`password_hash`). **Tidak ada email sintetis lagi.**

### 6.2 Password

- Hash dengan `Bun.password.hash(password, { algorithm: "argon2id", memoryCost: ARGON_MEMORY_KIB, timeCost: ARGON_TIME_COST })`. Default 19 MiB / timeCost 2 mengikuti rekomendasi minimum OWASP. Nilai bisa dinaikkan jika server kuat, **ukur waktunya (target ±100–300 ms per hash)**.
- **Bahaya "serbuan login":** satu kelas (±36 siswa) login bersamaan saat pelajaran dimulai. Argon2 memakan memori besar, sehingga banyak hash paralel bisa menghabiskan RAM. **Batasi konsurensi hashing** dengan `Semaphore` (`HASH_CONCURRENCY`, default 4). Sisanya antre (beberapa detik, dapat diterima) daripada server kehabisan memori.
- Verifikasi dengan `Bun.password.verify` (sudah aman terhadap timing pada perbandingan hash).
- Untuk akun tidak ditemukan, **tetap jalankan `verify` terhadap hash tiruan** yang dibuat saat start dengan parameter yang sama, agar waktu respons tidak membedakan akun ada/tidak.
- Kebijakan password siswa: ≥ 6 karakter, tidak boleh sama dengan username. Guru/admin: ≥ 10 karakter. Validasi di `domain/loginPolicy.ts` + `packages/contracts`.
- **Password tidak pernah masuk log.** Daftar redaksi (`password`, `newPassword`, `refreshToken`, header `authorization`) diterapkan di logger.

### 6.3 Token

| Token       | Bentuk                                                                       | Masa                              | Penyimpanan                                                                                   |
| ----------- | ---------------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------- |
| **Access**  | JWT HS256 (`sub` = user id, `role`, `cls` = class id opsional, `iat`, `exp`) | 15 menit (`ACCESS_TOKEN_TTL_SEC`) | Memori aplikasi                                                                               |
| **Refresh** | 32 byte acak (base64url), **opaque**                                         | 30 hari                           | `expo-secure-store` di HP; di server hanya **hash SHA-256**-nya (`refresh_tokens.token_hash`) |

**Rotasi refresh token:**

1. Tiap `/auth/refresh` valid → tandai token lama `used_at = now()`, buat token baru di `family_id` yang sama.
2. Token lama dipakai lagi → **cabut seluruh family** (`revoked_at`), kembalikan `REFRESH_REUSED`.
3. **Masa toleransi 30 detik:** pemakaian ulang token yang baru saja dirotasi dianggap _retry jaringan_ (respons sebelumnya mungkin hilang di sinyal jelek), bukan pencurian, dan tidak mencabut family. Ini penting untuk pengguna HP dengan koneksi buruk.
4. `refresh` juga memeriksa `users.is_active` dan status kelas. Akun yang dinonaktifkan berhenti bisa memperbarui sesi. Access token yang masih berlaku habis sendiri paling lama 15 menit (diterima).
5. Ganti password / reset oleh guru → cabut semua refresh token pengguna itu.

### 6.4 Middleware

- `authenticate`: baca `Authorization: Bearer`, verifikasi JWT (`alg` dikunci eksplisit ke HS256), isi `c.var.auth = { userId, role, classId }`. Gagal → `TOKEN_INVALID`/`TOKEN_EXPIRED`.
- `requireRole("teacher", "admin")`: periksa `role`.
- **Otorisasi sumber daya di service**, bukan di route: mis. `assertTeacherOfClass(auth, classId)` memeriksa `classes.teacher_id` (admin lolos). Setiap query data siswa memakai `auth.userId` dari token, **tidak pernah** `userId` dari body/query.
- Respons 404 (bukan 403) bila sumber daya ada tapi bukan milik pemanggil.

### 6.5 Pembatasan Laju & Penguncian

| Target                      | Aturan                                         | Mekanisme                                                                                                                        |
| --------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Login per (kelas, username) | ≥ 5 gagal / 15 menit → `LOGIN_LOCKED` 15 menit | Hitung dari `login_attempts` (dicatat untuk kunci **apa pun**, termasuk akun yang tidak ada → tidak membocorkan keberadaan akun) |
| Login per IP                | 30 percobaan / 15 menit                        | Token bucket di memori                                                                                                           |
| Sync push per pengguna      | 60 / menit                                     | Token bucket di memori                                                                                                           |
| Umum per IP                 | 300 / menit                                    | Token bucket di memori                                                                                                           |

Penghitung di memori cukup untuk **satu instance**. Jika kelak lebih dari satu instance, pindahkan ke tabel Postgres atau Redis, dan catat di `DECISIONS.md`.
**IP klien:** hanya percaya `X-Forwarded-For` sejumlah `TRUSTED_PROXY_HOPS` dari reverse proxy kita (`shared/ip.ts`). Jangan percaya mentah, karena penyerang bisa memalsukannya untuk lolos pembatasan.

---

## 7. Daftar Endpoint (v1)

Format: `METODE path` → siapa → keterangan. Skema detail di `packages/contracts`.

### Auth

| Endpoint                        | Pemanggil         | Keterangan                                                                                      |
| ------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------- |
| `POST /v1/auth/student/login`   | Publik (dibatasi) | `{ className, username, password }` → `{ accessToken, refreshToken, user, mustChangePassword }` |
| `POST /v1/auth/staff/login`     | Publik (dibatasi) | `{ email, password }` (guru/admin)                                                              |
| `POST /v1/auth/refresh`         | Publik            | `{ refreshToken }` → sesi baru (rotasi)                                                         |
| `POST /v1/auth/logout`          | Terautentikasi    | Cabut family refresh token                                                                      |
| `POST /v1/auth/change-password` | Terautentikasi    | `{ currentPassword?, newPassword }`. Wajib saat `mustChangePassword`. Cabut token lain          |

### Diri sendiri (siswa)

| Endpoint                     | Keterangan                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| `GET /v1/me`                 | Profil + kelas + `user_stats` + `user_settings`                                                 |
| `PATCH /v1/me/settings`      | Ubah pengaturan (LWW berdasarkan `updatedAt`)                                                   |
| `POST /v1/me/reset-progress` | Hapus progres sendiri dalam satu transaksi (pengganti `reset_my_progress()`), catat `audit_log` |

### Sinkronisasi (siswa)

| Endpoint             | Keterangan                                                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `POST /v1/sync/push` | Kirim batch event (maks. 100 event, body ≤ 256 KB). Idempoten. Respons per event: `accepted` · `duplicate` · `rejected` (+ alasan) |
| `GET /v1/sync/pull`  | Snapshot: `stats`, `settings`, `materiProgress`, `badges`, `troubleshootProgress`, `quizBest` + 20 attempt kuis terakhir           |

**Bentuk event (`packages/contracts`, discriminated union pada `type`):**

```ts
{ clientEventId: uuid, type: "xp" | "simulasi_run" | "troubleshoot_attempt"
                          | "quiz_attempt" | "badge_unlock" | "materi_progress" | "stats",
  occurredAt: ISO, localDate: "YYYY-MM-DD", payload: {...sesuai type} }
```

Aturan pemrosesan (`modules/sync/service.ts`):

1. Validasi envelope dan semua event (Zod). Gagal bentuk → **422 untuk seluruh batch** (klien memperbaiki bug, bukan mengulang).
2. Proses seluruh event dalam **satu transaksi**. Setiap tipe event punya handler sendiri di `sync/events/*.ts` (daftar `Record<EventType, Handler>`). Menambah tipe event = tambah file + daftar + skema kontrak + tes.
3. Insert append-only memakai `ON CONFLICT (user_id, client_event_id) DO NOTHING`. Baris yang tidak ter-insert dilaporkan `duplicate`.
4. **Penolakan semantik** (mis. `amount` XP tidak sesuai tabel XP `contracts/constants.ts` ketika `ENFORCE_XP_RULES`) menandai event `rejected` dengan alasan, tanpa menggagalkan event lain.
5. Galat DB tak terduga → rollback seluruh batch, 500. Klien mengulang batch yang sama (aman karena idempoten).
6. State bergaya "gabungan" (`materi_progress`, `stats`, badge) memakai fungsi murni di `domain/mergeRules.ts` yang aturannya persis `DATABASE.md` §6.2 (union kartu, OR selesai, badge ambil `unlocked_at` paling awal, streak pilih tanggal terbaru, dll.).
7. `user_stats.xp_total` diperbarui lewat trigger DB `apply_xp_event` (tetap dipertahankan dari `DATABASE.md`).

### Guru / Admin

| Endpoint                               | Peran                | Keterangan                                                                                                                                                                                                                                                                            |
| -------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /v1/classes`                      | guru, admin          | Kelas yang dimiliki (admin: semua)                                                                                                                                                                                                                                                    |
| `POST /v1/classes`                     | guru, admin          | Buat kelas                                                                                                                                                                                                                                                                            |
| `POST /v1/classes/:id/deactivate`      | pemilik, admin       | Nonaktifkan kelas (akhir tahun ajaran)                                                                                                                                                                                                                                                |
| `GET /v1/classes/:id/overview`         | pemilik, admin       | Data `class_overview` (paginasi kursor)                                                                                                                                                                                                                                               |
| `POST /v1/classes/:id/students`        | pemilik, admin       | Buat siswa massal (maks. 60/panggilan, satu transaksi). Password kosong → dibuat acak (6–8 karakter, tanpa `0/O/1/l/I`, memakai `crypto.getRandomValues`), dikembalikan **sekali** dalam respons `no-store`, tidak disimpan/di-log. Bentrok username → 409 dengan daftar yang bentrok |
| `POST /v1/students/:id/reset-password` | guru kelasnya, admin | Password baru + `must_change_password = true` + cabut token + `audit_log`                                                                                                                                                                                                             |
| `POST /v1/students/:id/deactivate`     | guru kelasnya, admin | Nonaktifkan akun                                                                                                                                                                                                                                                                      |
| `POST /v1/admin/teachers`              | admin                | Buat akun guru (password sementara)                                                                                                                                                                                                                                                   |

### Operasional

| Endpoint      | Keterangan                             |
| ------------- | -------------------------------------- |
| `GET /health` | _Liveness_: proses hidup (tanpa DB)    |
| `GET /ready`  | _Readiness_: `select 1` ke DB berhasil |

**Admin pertama** dibuat lewat skrip `bun run scripts/create-admin.ts` (membaca email dan password dari prompt/env), **tidak ada** endpoint publik pembuatan admin.

---

## 8. Akses Database

- **SQL-first.** Edit skema hanya lewat file migrasi baru, lalu jalankan `bun run db:migrate` dan `bun run db:codegen`. Jangan mengedit `types.generated.ts`.
- **Migrasi:** file `NNNN_deskripsi.sql`, berurutan, tiap file dalam transaksi bila memungkinkan. **Sebelum rilis pertama** boleh mengedit `0001_init.sql`. **Setelah ada data produksi, migrasi yang sudah berjalan tidak boleh diubah**, tulis migrasi baru.
- **Hanya query berparameter** (Kysely otomatis). Dilarang menyusun SQL dengan string interpolation dari input pengguna.
- **Transaksi:** `withTx(db, async (trx) => ...)` di service untuk operasi multi-tabel (buat siswa massal, push sinkronisasi, reset progres, rotasi token). Repo menerima `db | trx`.
- **Peran DB berbeda:** `app_user` (hak SELECT/INSERT/UPDATE terbatas, **bukan** superuser, tanpa DDL) untuk API, `migrator` untuk menjalankan migrasi.
- **Pool:** `max` 10–20, `statement_timeout` (mis. 5 detik), `idle_in_transaction_session_timeout`.
- **Tabel append-only** (`xp_events`, `simulasi_runs`, `troubleshoot_attempts`, `quiz_attempts`, `user_badges`): tidak ada kode update/delete dari API, kecuali reset progres dan jalur penghapusan data atas permintaan sekolah.
- **Waktu & ID** masuk lewat `Clock`/`ids.ts` (bisa dipalsukan di tes).

---

## 9. Keamanan (Daftar Wajib)

- [ ] HTTPS saja (TLS di reverse proxy). `secureHeaders()` aktif (termasuk HSTS di produksi).
- [ ] Semua input divalidasi Zod di batas HTTP. Batas ukuran body (256 KB) aktif, panjang string dibatasi di skema.
- [ ] Hanya query berparameter. Tidak ada `eval`/eksekusi dinamis dari input.
- [ ] Rahasia (`JWT_SECRET`, `DATABASE_URL`) hanya dari environment, tidak masuk repo atau log. `.env.example` tanpa nilai asli. Rencana rotasi `JWT_SECRET` dicatat (rotasi memaksa semua access token baru; refresh token tetap bisa menerbitkan ulang).
- [ ] Pesan galat login generik. Tidak ada perbedaan waktu atau teks antara "akun tidak ada" dan "password salah".
- [ ] Penguncian + pembatas laju aktif dan diuji (Bagian 6.5).
- [ ] CORS: kosong untuk klien native (tidak diperlukan). Allowlist ketat bila nanti ada web admin.
- [ ] `username` dibatasi pola `^[A-Za-z0-9 ._-]{1,30}$` di kontrak (menghindari selisih normalisasi Unicode antara JS dan Postgres).
- [ ] Respons berisi data pribadi/password awal: `Cache-Control: no-store`, tidak di-log.
- [ ] Log tidak memuat body request mentah. Redaksi field sensitif.
- [ ] Peran DB `app_user` terbatas. Backup harian dan pernah diuji pulih.
- [ ] Audit dependensi di CI (mis. `bun audit` atau setara), `bun.lock` di-commit, versi dikunci. Tambah dependensi baru = catat alasan di `DECISIONS.md`.
- [ ] Matriks otorisasi punya tes otomatis (Bagian 12), pengganti RLS.

> Opsional jika ingin pertahanan berlapis: tetap aktifkan RLS di Postgres dengan `SET LOCAL app.user_id` per transaksi. Tidak wajib di MVP, kompleksitasnya tidak sebanding dengan tes otorisasi yang ketat.

---

## 10. Perubahan Skema terhadap `DATABASE.md` (Wajib Diterapkan di `0001_init.sql`)

Belum ada data produksi, jadi **edit langsung `0001_init.sql`** dari `DATABASE.md` §4 dengan perubahan berikut.

**Hapus:**

- Semua `alter table ... enable row level security` dan seluruh `create policy`.
- Fungsi `auth_role()`, `teaches_student()`, dan `reset_my_progress()` (logikanya pindah ke service TypeScript).
- Referensi ke `auth.users` dan `auth.uid()`.
- Fitur "email sintetis" pada §5.1 `DATABASE.md`.

**Ganti definisi `users`:**

```sql
create table users (
  id                   uuid primary key default gen_random_uuid(),
  role                 user_role not null,
  class_id             uuid references classes(id) on delete restrict,
  username             text not null check (length(btrim(username)) between 1 and 30),
  username_key         text generated always as (lower(btrim(username))) stored,
  display_name         text not null check (length(btrim(display_name)) between 1 and 60),
  email                text,                       -- hanya guru/admin
  password_hash        text not null,              -- keluaran Bun.password.hash (argon2id)
  password_changed_at  timestamptz,
  is_active            boolean not null default true,
  must_change_password boolean not null default true,
  created_by           uuid references users(id) on delete set null,
  last_login_at        timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint student_needs_class check (role <> 'student' or class_id is not null),
  constraint email_by_role check (
    (role = 'student' and email is null) or (role <> 'student' and email is not null)
  )
);
create unique index users_class_username_uq on users (class_id, username_key) where role = 'student';
create unique index users_email_uq on users (lower(email)) where email is not null;
create index users_class_idx on users (class_id);
```

**Tambah tabel refresh token:**

```sql
create table refresh_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  family_id    uuid not null,                     -- satu "rantai" rotasi per login
  token_hash   text not null unique,              -- SHA-256 hex dari token mentah
  issued_at    timestamptz not null default now(),
  expires_at   timestamptz not null,
  used_at      timestamptz,                       -- diisi saat dirotasi
  replaced_by  uuid references refresh_tokens(id),
  revoked_at   timestamptz
);
create index refresh_tokens_user_idx   on refresh_tokens (user_id);
create index refresh_tokens_family_idx on refresh_tokens (family_id);
create index refresh_tokens_expiry_idx on refresh_tokens (expires_at);
```

Tambahkan pekerjaan pembersihan terjadwal (skrip kecil/cron di server) yang menghapus token kedaluwarsa > 7 hari.

**Tetap sama:** `classes`, `user_stats`, `user_settings`, `xp_events` + trigger `apply_xp_event`, `materi_progress`, `simulasi_runs`, `troubleshoot_attempts`, `quiz_attempts`, `quiz_answers`, `user_badges`, `login_attempts`, `audit_log`, dan semua view (`troubleshoot_progress`, `quiz_best`, `class_overview`). Pada view, opsi `security_invoker` boleh dihapus (tanpa RLS tidak berefek).
Trigger `init_user_rows` tetap (membuat `user_stats` dan `user_settings`), tetapi tidak perlu `security definer`.

---

## 11. Logging, Observabilitas, Operasional

- **Log terstruktur JSON** ke stdout (satu baris per kejadian): `time`, `level`, `msg`, `requestId`, `method`, `path`, `status`, `durationMs`, `userId` (jika ada). Redaksi field sensitif. Peladen log diurus platform (Docker/VPS), bukan aplikasi.
- **Request ID:** `hono/request-id`, dikembalikan di header respons dan di body galat, sehingga siswa/guru bisa melapor "kode galat" yang bisa dilacak.
- **Health:** `/health` (liveness) dan `/ready` (cek DB) untuk orkestrasi/monitor.
- **Graceful shutdown:** tangani `SIGTERM` (Bagian 4 `index.ts`).
- **Metrik minimal** (opsional MVP): jumlah login gagal/menit, latensi push sinkronisasi, ukuran pool. Cukup dari log lebih dulu.
- **Peringatan:** monitor uptime eksternal pada `/ready` + notifikasi saat down.

### Target Kinerja (±1.000 siswa, satu instance)

| Operasi                              | Target                                          |
| ------------------------------------ | ----------------------------------------------- |
| `sync/push` 50 event                 | p95 < 300 ms                                    |
| `sync/pull`                          | p95 < 300 ms                                    |
| Login (40 bersamaan, awal pelajaran) | semua selesai < 5 detik, tanpa kehabisan memori |
| Memori API                           | < 512 MB pada beban normal                      |

---

## 12. Strategi Pengujian

| Lapisan                       | Alat                                           | Wajib mencakup                                                                                                                              |
| ----------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Domain**                    | `bun test`                                     | `xpRules`, `streak`, `mergeRules` (semua aturan gabung), `loginPolicy`, `classKey/usernameKey` (kesamaan dengan SQL)                        |
| **Service**                   | `bun test` + repo palsu/DB uji                 | Login (benar, salah, terkunci, akun nonaktif), rotasi refresh + deteksi pemakaian ulang + toleransi 30 detik, reset password mencabut token |
| **Integrasi API**             | `bun test` + Postgres Docker + `app.request()` | Semua endpoint, termasuk bentuk galat. Tiap tes membersihkan/meng-_rollback_ data                                                           |
| **Otorisasi (pengganti RLS)** | Integrasi                                      | **Matriks wajib** di bawah                                                                                                                  |
| **Kontrak**                   | Integrasi                                      | Respons nyata lolos validasi skema respons di `contracts`                                                                                   |
| **Beban ringan**              | k6 atau skrip sederhana                        | 40 login serentak, 20 klien `sync/push` bersamaan                                                                                           |

**Matriks otorisasi (semua harus ada sebagai tes otomatis):**

- [ ] Tanpa token → 401 di semua endpoint `/v1` selain login/refresh.
- [ ] Siswa A tidak bisa membaca/menulis data siswa B (lewat `sync/pull` maupun manipulasi `userId` di body).
- [ ] Siswa tidak bisa memanggil endpoint guru/admin (403).
- [ ] Guru kelas A bisa melihat `overview` kelas A, **tidak bisa** kelas B (404).
- [ ] Guru kelas A tidak bisa reset password siswa kelas B.
- [ ] Guru tidak bisa menulis progres siswa.
- [ ] Admin bisa membaca semua, tetapi pembuatan admin tidak lewat API.
- [ ] Akun/kelas nonaktif: login ditolak, refresh ditolak.

**Tes sinkronisasi:** event sama dikirim dua kali → satu baris, respons `duplicate`. XP total tidak berlipat. Batch dengan satu event `rejected` tetap memproses event lain. Batch > 100 ditolak. Dua perangkat satu akun → hasil gabungan sesuai `DATABASE.md` §6.2.

**Perintah standar:** `bun run check` = `typecheck` + `lint` + `test`. Harus lulus sebelum commit selesai dianggap rampung.

---

## 13. Build, Deploy, CI

**Dockerfile (multi-stage, pengguna non-root):** tahap `deps` (`bun install --frozen-lockfile`), tahap runtime berbasis `oven/bun` (kunci versi tag), jalankan sebagai pengguna non-root, `CMD ["bun", "run", "apps/api/src/index.ts"]`. Tanpa `devDependencies` di image akhir bila memungkinkan.

**Docker Compose (dev):** `postgres:15+` (volume, healthcheck) + `api` (hot reload via `bun --watch`). Database terpisah untuk tes (`sinyallab_test`).

**Produksi (usulan):** satu VPS (region dekat Indonesia) menjalankan reverse proxy (Caddy/Nginx, TLS otomatis) → API (Docker) → PostgreSQL (kontainer dengan backup, atau layanan terkelola). Keputusan lokasi data mengikuti jawaban pertanyaan privasi di `DATABASE.md` §13.

**CI (GitHub Actions):** `bun install --frozen-lockfile` → service Postgres → `typecheck` → `lint` (termasuk aturan batas modul) → `migrate` ke DB uji → `test` → audit dependensi → build image. Gagal di langkah mana pun menghalangi merge. Deploy manual/terjadwal untuk milestone rilis.

**Konfigurasi:** satu `.env.example` terdokumentasi. Variabel baru wajib masuk `env.ts` + `.env.example` + README.

---

## 14. Panduan untuk Agent AI

### 14.1 `AGENTS.md` (buat di root; ringkas, bisa dieksekusi)

Isi minimal:

```
# Panduan Agent — SinyalLab
Baca: docs/PRD_SinyalLab.md, docs/ARCHITECTURE.md, docs/ARCHITECTURE_BACKEND.md, docs/DATABASE.md.
Perintah:
  bun install --frozen-lockfile
  bun run db:up           # docker compose up -d postgres
  bun run db:migrate      # jalankan migrasi
  bun run db:codegen      # regenerasi tipe dari DB
  bun run dev:api         # server dev (watch)
  bun run check           # typecheck + lint + test  (WAJIB hijau sebelum selesai)
Aturan keras: lihat bagian "Dilarang" di ARCHITECTURE_BACKEND.md §14.4.
Catat keputusan yang menyimpang di docs/DECISIONS.md.
```

### 14.2 Resep: Menambah Endpoint

Urutan kerja, jangan dilompati:

1. **Kontrak** di `packages/contracts` (skema request + response + kode galat baru bila perlu).
2. **Migrasi SQL** bila butuh perubahan skema → `db:migrate` → `db:codegen`.
3. **Repo**: query (hanya SQL, return objek biasa).
4. **Domain**: fungsi murni bila ada aturan baru (+ tes unit).
5. **Service**: aturan bisnis + otorisasi sumber daya + transaksi.
6. **Route**: validasi, panggil service, bentuk respons. Daftarkan di `app.ts`.
7. **Tes**: unit (domain/service) + integrasi + **baris baru di matriks otorisasi** bila endpoint menyentuh data pengguna.
8. `bun run check` hijau. Perbarui tabel endpoint di dokumen ini bila kontrak publik berubah.

### 14.3 Resep: Menambah Tipe Event Sinkronisasi

Skema payload di `contracts` → tambah ke union → handler `sync/events/<tipe>.ts` → daftarkan di peta handler → tes idempotensi + penolakan semantik → tambahkan ke `sync/pull` bila perlu → beri tahu sisi mobile (`features/sync`).

### 14.4 Dilarang (Cek Sebelum Selesai)

- [ ] `any` tanpa komentar alasan. `as` untuk membungkam galat tipe.
- [ ] SQL dengan string interpolation dari input.
- [ ] `repo` atau `db` diimpor dari `routes.ts`. `hono` diimpor dari `service.ts`/`domain`/`repo`.
- [ ] Modul mengimpor repo modul lain.
- [ ] `new` service/repo di luar `deps.ts`. Singleton global untuk DB/logger.
- [ ] Mengambil `userId` dari body/query untuk data milik sendiri (harus dari token).
- [ ] Logika bisnis di route, atau handler > ±40 baris.
- [ ] Mencatat password, token, atau body request ke log.
- [ ] Mengubah migrasi yang sudah berjalan di produksi.
- [ ] Membaca `process.env` di luar `env.ts`. `Date.now()`/`crypto.randomUUID()` langsung di service (pakai `Clock`/`ids`).
- [ ] Menambah dependensi tanpa catatan di `DECISIONS.md`.
- [ ] Mengembalikan pesan galat internal/stack trace ke klien.
- [ ] Endpoint baru tanpa tes otorisasi.

### 14.5 Definisi Selesai (Per Tugas)

- `bun run check` hijau, tidak ada tes dilewati tanpa alasan tertulis.
- Kontrak, migrasi, dan dokumen sinkron dengan kode.
- Tidak ada `TODO` yang menyembunyikan celah keamanan.
- Perubahan perilaku yang terlihat klien dicatat (ringkas) di `docs/DECISIONS.md` atau changelog.
- Deskripsi commit mengikuti Conventional Commits (`feat(sync): ...`), satu commit = satu perubahan logis.

### 14.6 Kebiasaan yang Membantu Agent

- Jaga file kecil (< ±200 baris) dan nama deskriptif, agar konteks mudah dimuat.
- Satu tanggung jawab per fungsi. Fungsi murni diutamakan, karena paling mudah dites tanpa infrastruktur.
- Saat ragu soal aturan produk, rujuk PRD. Saat PRD diam, ambil keputusan paling sederhana dan catat di `DECISIONS.md`. Jangan berhenti menunggu kecuali terblokir sungguhan.
- Jangan "memperbaiki" nilai atau konten teknis (frekuensi, rumus, jawaban kuis) dari ingatan. Konten dikelola di sisi mobile dan bukan tanggung jawab backend.

---

## 15. Urutan Pengerjaan Backend (Milestone M1b dipecah)

| Langkah | Hasil                                                                                                                                                |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **B0**  | Monorepo Bun, `packages/contracts`, `apps/api` kosong, ESLint + aturan batas, CI dasar, Docker Compose Postgres                                      |
| **B1**  | `0001_init.sql` (dengan perubahan Bagian 10), runner migrasi, codegen, `env.ts`, `deps.ts`, `createApp`, error handler, logger, `/health` + `/ready` |
| **B2**  | Auth: hasher + semaphore, login siswa/staf, token akses + refresh (rotasi), penguncian + pembatas laju, ganti password, `create-admin` + tes lengkap |
| **B3**  | Kelas & siswa: buat kelas, buat siswa massal, reset password, nonaktifkan, matriks otorisasi                                                         |
| **B4**  | Sinkronisasi: `push` (semua tipe event), `pull`, aturan gabung, reset progres, tes idempotensi                                                       |
| **B5**  | `class_overview`, audit log, pembersihan token, uji beban ringan, Dockerfile produksi, panduan deploy + backup                                       |

Mobile terhubung mulai setelah B2 (login) dan B4 (sinkronisasi), melalui `features/auth`, `features/sync`, dan `shared/api` dengan klien `hc<AppType>`.

---

## 16. Dampak ke Dokumen Lain

| Dokumen                    | Perubahan                                                                                                                                                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE.md`              | Tambahkan catatan di bagian atas bahwa D1/§5.2/RLS **digantikan** dokumen ini. Terapkan perubahan SQL Bagian 10. Hapus alur email sintetis                                                                                                    |
| `ARCHITECTURE.md` (mobile) | Path menjadi relatif ke `apps/mobile`. `shared/api` memakai `hc<AppType>` dari paket API dan skema dari `packages/contracts`. `normalizeKey` diimpor dari `contracts`, bukan ditulis ulang. Tambah dependensi `hono` (hanya untuk klien `hc`) |
| `PRD_SinyalLab.md`         | Asumsi A2 diperbarui (login nama kelas + username + password, backend Hono/Bun). Milestone M1b → B0–B5. Kebijakan privasi merujuk `DATABASE.md` §8                                                                                            |

---

## 17. Pertanyaan Terbuka

1. Apakah **monorepo** (mobile + API + contracts dalam satu repo) cocok? Alternatifnya dua repo terpisah dengan paket `contracts` yang diterbitkan, lebih ribet bagi tim kecil.
2. Hosting API dan DB: VPS sendiri, PaaS, atau infrastruktur sekolah/dinas? (Mempengaruhi Docker, backup, dan lokasi data.)
3. Perlu **web admin untuk guru** (buat siswa dari CSV, lihat nilai)? Jika ya, ini jadi klien kedua untuk API yang sama dan CORS/CSRF perlu dirancang.
4. Berapa instance API yang direncanakan? (Satu instance = pembatas laju di memori cukup. Lebih dari satu = butuh penyimpanan bersama.)
5. Apakah pembatasan XP di server (`ENFORCE_XP_RULES`) perlu ketat sejak awal, atau cukup dicatat dulu (mode longgar)?
