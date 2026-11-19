# Backend Design Pattern

Panduan arsitektur backend: layered architecture (Route → Controller → Service → Repository) dengan fokus pada **fungsi yang reusable** dan **satu tanggung jawab per fungsi**.

---

## 1. Prinsip Utama

1. **Satu fungsi, satu tugas.** Kalau nama fungsi butuh kata "dan", pecah.
2. **Tidak ada duplikasi.** Kode yang sama muncul 2x → jadikan helper.
3. **Layer hanya boleh bicara ke layer di bawahnya.** Tidak boleh loncat atau mundur.
4. **Logika bisnis hanya di service.** Controller dan repository tidak boleh punya keputusan bisnis.
5. **Dependency di-inject lewat constructor**, bukan di-import langsung, supaya mudah dites dan diganti.
6. **Jangan over-engineer.** Mulai sederhana, pecah saat benar-benar terasa sakit.

---

## 2. Alur Layer

```
Request
  │
  ▼
Route        → mendefinisikan endpoint + middleware
  │
  ▼
Controller   → ambil input, validasi (schema), panggil service, kirim response
  │
  ▼
Service      → logika bisnis (aturan, keputusan, orkestrasi)
  │
  ▼
Repository   → akses database (Prisma), tanpa logika bisnis
  │
  ▼
Database
```

| Layer      | Boleh                                               | Tidak boleh                          |
| ---------- | --------------------------------------------------- | ------------------------------------ |
| Route      | Daftarkan path, pasang middleware                   | Logika apa pun                       |
| Controller | Parse request, panggil service, format response     | Query DB, logika bisnis              |
| Service    | Aturan bisnis, orkestrasi banyak repository/service | Akses `req`/`res`, format HTTP       |
| Repository | Query Prisma                                        | Keputusan bisnis, throw error bisnis |

---

## 3. Struktur Folder

Kelompokkan per **domain/fitur**, bukan per tipe file.

```
src/
├── modules/
│   └── auth/
│       ├── auth.routes.ts        # definisi endpoint
│       ├── auth.controller.ts    # handler HTTP
│       ├── auth.service.ts       # logika bisnis
│       ├── auth.repository.ts    # query database
│       ├── auth.schema.ts        # validasi input (zod)
│       └── auth.types.ts         # tipe request/response
│
├── services/                     # service lintas modul (reusable)
│   ├── hasher.ts
│   ├── tokens.ts
│   ├── ipBlocker.ts
│   └── betterAuth.ts
│
├── shared/                       # utilitas murni tanpa state
│   ├── errors.ts                 # AppError + kode error
│   ├── response.ts               # helper format response
│   ├── time.ts                   # helper tanggal/durasi
│   └── strings.ts                # normalisasi string
│
├── db/
│   └── client.ts                 # instance Prisma
│
└── app.ts                        # wiring semua dependency
```

**Aturan penempatan:**

- Dipakai satu modul saja → taruh di dalam modul itu.
- Dipakai banyak modul dan punya dependency (DB, config) → `services/`.
- Dipakai banyak modul dan murni (input → output) → `shared/`.

---

## 4. Tanggung Jawab Tiap Layer

### 4.1 Route

Hanya mendaftarkan endpoint. Tidak ada logika.

```ts
export function authRoutes(controller: AuthController) {
  const router = Router();
  router.post("/login", controller.login);
  router.post("/refresh", controller.refresh);
  return router;
}
```

### 4.2 Controller

Tipis. Tugasnya: ambil input → validasi → panggil service → kirim response.

```ts
export class AuthController {
  constructor(private authService: AuthService) {}

  login = async (req: Request, res: Response) => {
    const input = loginSchema.parse(req.body);
    const result = await this.authService.login(req.ip, input);
    return sendSuccess(res, result);
  };
}
```

### 4.3 Service

Tempat semua aturan bisnis. Method publik = use case. Detail dipecah ke **private method**.

```ts
export class AuthService {
  constructor(
    private repo: AuthRepository,
    private hasher: Hasher,
    private tokenService: TokenService,
    private ipBlocker: IpBlockerService,
    private sessionService: SessionService,
  ) {}

  async login(ip: string, input: LoginInput): Promise<LoginResult> {
    await this.assertIpNotBlocked(ip);

    const keys = buildLoginKeys(input);
    const classRecord = await this.findActiveClass(ip, keys);
    await this.assertValidPassword(ip, classRecord, input.password, keys);

    await this.onLoginSuccess(ip, classRecord, keys);

    const user = await this.findOrCreateStudent(classRecord, input.username);
    return this.issueSession(user, classRecord, ip);
  }

  // private methods: satu tugas masing-masing
}
```

`login()` harus bisa dibaca seperti daftar langkah. Detail ada di method private.

### 4.4 Repository

Hanya query. Tidak tahu apa-apa tentang aturan bisnis.

```ts
export class AuthRepository {
  constructor(private prisma: PrismaClient) {}

  findClassByKey(key: string) {
    return this.prisma.class.findUnique({ where: { key } });
  }

  createLoginAttempt(data: Prisma.LoginAttemptUncheckedCreateInput) {
    return this.prisma.loginAttempt.create({ data });
  }

  upsertStudent(classId: string, usernameKey: string, data: StudentData) {
    return this.prisma.user.upsert({
      where: { classId_usernameKey: { classId, usernameKey } },
      create: { ...data, classId, usernameKey, role: "student" },
      update: { lastLoginAt: new Date() },
    });
  }
}
```

> Repository boleh ditunda dulu pada project kecil. Kalau Prisma masih dipanggil langsung di service, tetap pisahkan query ke method private kecil supaya mudah dipindah nanti.

---

## 5. Aturan Fungsi Reusable

### 5.1 Kapan sebuah kode harus dijadikan fungsi

- Muncul **2 kali atau lebih** (aturan praktis: 3x pasti, 2x pertimbangkan).
- Punya **nama yang jelas** untuk apa yang dilakukannya.
- Bisa **diuji sendiri** tanpa konteks lain.

### 5.2 Ciri fungsi reusable yang baik

| Ciri                           | Contoh baik            | Contoh buruk                  |
| ------------------------------ | ---------------------- | ----------------------------- |
| Satu tugas                     | `normalizeKey(str)`    | `processLoginAndCreateUser()` |
| Input eksplisit                | `isExpired(date, now)` | baca variabel global          |
| Tanpa efek samping tersembunyi | return nilai           | ubah argumen diam-diam        |
| Nama kata kerja                | `findActiveClass`      | `classStuff`                  |
| Return type jelas              | `Promise<User>`        | `any`                         |

### 5.3 Pure helper vs service

- **Pure helper** (di `shared/`): input → output, tanpa DB, tanpa `this`. Mudah dites.
- **Service method**: butuh dependency (DB, hasher, dll).

```ts
// shared/strings.ts  (pure)
export const normalizeKey = (value: string) => value.trim().toLowerCase();

// shared/strings.ts  (pure)
export const buildInternalEmail = (username: string, classKey: string) =>
  `${normalizeKey(username)}.${classKey}@sinyallab.internal`;
```

### 5.4 Contoh menghilangkan duplikasi

**Sebelum:** blok "catat gagal → recordFailure → throw" ditulis berulang di tiap kondisi gagal.

**Sesudah:** satu helper dipakai semua.

```ts
private async failLogin(
  ip: string,
  keys: LoginKeys,
  reason: string,
  classId?: string
): Promise<never> {
  await this.repo.createLoginAttempt({
    ip,
    classId,
    classKey: keys.classKey,
    usernameKey: keys.usernameKey,
    success: false,
  });

  const block = await this.ipBlocker.recordFailure(ip, reason);
  if (block.blocked) {
    throw rateLimitedError(block.remainingSeconds);
  }
  throw invalidCredentialsError();
}
```

Return type `Promise<never>` memberi tahu TypeScript bahwa fungsi ini selalu throw, jadi kode setelahnya aman dari null-check berlebih.

### 5.5 Factory untuk error yang berulang

```ts
// shared/errors.ts
export const rateLimitedError = (retryAfter: number) =>
  new AppError(
    "RATE_LIMITED",
    429,
    "Terlalu banyak percobaan tidak wajar. IP Anda diblokir sementara selama 5 menit.",
    { retryAfter },
  );

export const invalidCredentialsError = () =>
  new AppError("INVALID_CREDENTIALS", 401, "Nama kelas atau password salah.");

export const accountDisabledError = () =>
  new AppError("ACCOUNT_DISABLED", 403, "Kelas ini telah dinonaktifkan.");
```

Pesan error terpusat di satu tempat, jadi mengubah teks cukup sekali.

---

## 6. Penanganan Error

- Semua error bisnis memakai **`AppError`** dengan: `code`, `statusCode`, `message`, `details?`.
- **Service** yang melempar error bisnis. **Repository** tidak.
- **Controller tidak try/catch.** Biarkan error naik ke **error middleware global** yang mengubahnya jadi response.
- Pesan ke user boleh ramah dan umum (jangan bocorkan apakah kelas atau password yang salah).

```ts
// middleware/errorHandler.ts
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }
  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "Terjadi kesalahan pada server.",
    },
  });
}
```

---

## 7. Validasi Input

- Validasi di **controller/boundary** memakai schema (zod), bukan di service.
- Service menerima tipe yang **sudah valid** (`LoginInput`).
- Satu schema = satu sumber kebenaran untuk tipe (`z.infer`).

```ts
export const loginSchema = z.object({
  className: z.string().min(1),
  password: z.string().min(1),
  username: z.string().optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;
```

---

## 8. Dependency Injection

Semua wiring dilakukan **sekali** di `app.ts` (composition root).

```ts
const prisma = new PrismaClient();
const hasher = new Hasher();
const tokenService = new TokenService();
const ipBlocker = new IpBlockerService(prisma);
const sessionService = new SessionService(prisma);

const authRepo = new AuthRepository(prisma);
const authService = new AuthService(
  authRepo,
  hasher,
  tokenService,
  ipBlocker,
  sessionService,
);
const authController = new AuthController(authService);

app.use("/auth", authRoutes(authController));
```

Manfaat: saat tes, tinggal ganti dependency dengan mock.

---

## 9. Format Response Konsisten

Pakai helper agar bentuk response seragam.

```ts
// shared/response.ts
export const sendSuccess = <T>(res: Response, data: T, status = 200) =>
  res.status(status).json({ success: true, data });
```

```json
{ "success": true, "data": { } }
{ "success": false, "error": { "code": "...", "message": "..." } }
```

---

## 10. Penamaan

| Jenis                 | Konvensi                            | Contoh                                  |
| --------------------- | ----------------------------------- | --------------------------------------- |
| File                  | `fitur.layer.ts`                    | `auth.service.ts`                       |
| Class                 | PascalCase + peran                  | `AuthService`, `AuthRepository`         |
| Method service publik | kata kerja use case                 | `login`, `refreshToken`                 |
| Method private        | kata kerja spesifik                 | `assertIpNotBlocked`, `findActiveClass` |
| Awalan                | arti                                |                                         |
| `find…`               | cari, boleh null                    | `findUserByEmail`                       |
| `get…`                | ambil, wajib ada (throw jika tidak) | `getClassOrFail`                        |
| `assert…`             | validasi, throw jika gagal          | `assertValidPassword`                   |
| `create…/update…`     | tulis ke DB                         | `createLoginAttempt`                    |
| `build…`              | bentuk objek/string, pure           | `buildLoginKeys`                        |

---

## 11. Batas Ukuran (Rule of Thumb)

- Method: idealnya **< 30 baris**.
- Parameter: **maksimal 4**. Lebih dari itu, pakai objek.
- Class service: kalau melewati **± 300 baris** atau mengurus banyak topik, pecah (`LoginService`, `RegistrationService`, ...).
- Nesting `if`: maksimal **2 level**. Pakai _early return_ / `assert…`.

---

## 12. Early Return, Hindari Nesting Dalam

```ts
// Hindari
if (classRecord) {
  if (classRecord.isActive) {
    // ...
  }
}

// Lebih baik
if (!classRecord) return this.failLogin(...);
if (!classRecord.isActive) throw accountDisabledError();
// lanjut alur utama
```

---

## 13. Transaksi dan Efek Samping

- Operasi yang harus **berhasil bersama** (mis. buat user + buat session) dibungkus `prisma.$transaction`.
- Efek samping (kirim email, tulis log, panggil API luar) dilakukan **setelah** data utama tersimpan.
- Jangan campur efek samping di dalam helper pure.

---

## 14. Testing

| Yang dites              | Cara                                           |
| ----------------------- | ---------------------------------------------- |
| Pure helper (`shared/`) | Unit test langsung, tanpa mock                 |
| Service                 | Unit test dengan repository/dependency di-mock |
| Repository              | Integration test ke DB test                    |
| Controller/Route        | Test endpoint (supertest)                      |

Karena dependency di-inject, service bisa dites tanpa database sungguhan.

---

## 15. Checklist Sebelum Commit

- [ ] Controller tidak berisi logika bisnis dan tidak query DB
- [ ] Tidak ada blok kode duplikat (cek yang >3 baris)
- [ ] Setiap method punya satu tugas dan namanya menjelaskan tugas itu
- [ ] Error bisnis memakai `AppError` / error factory, bukan string mentah
- [ ] Input sudah divalidasi di boundary
- [ ] Dependency di-inject, tidak di-`new` di dalam service
- [ ] Tidak ada `any` tanpa alasan
- [ ] Fungsi yang dipakai >1 tempat sudah dipindah ke `shared/` atau `services/`

---

## 16. Contoh Refactor `login()` (Ringkasan)

**Sebelum:** satu method ± 150 baris, 3 blok gagal-login duplikat, query DB langsung.

**Sesudah:**

```ts
async login(ip: string, input: LoginInput): Promise<LoginResult> {
  await this.assertIpNotBlocked(ip);

  const keys = buildLoginKeys(input);
  const classRecord = await this.findActiveClass(ip, keys);
  await this.assertValidPassword(ip, classRecord, input.password, keys);

  await this.recordLoginSuccess(ip, classRecord, keys);

  const user = await this.findOrCreateStudent(classRecord, input.username);
  return this.issueSession(user, classRecord, ip);
}
```

Method publik cuma 7 baris dan terbaca seperti alur bisnis. Detail tiap langkah ada di private method yang bisa dites dan dipakai ulang.
