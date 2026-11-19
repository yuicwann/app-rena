export function getOpenApiSpec() {
  return {
    openapi: '3.0.3',
    info: {
      title: 'SinyalLab Backend API',
      version: '1.0.0',
      description: `
### Dokumentasi REST API Internal SinyalLab (SMK TAV)

Dokumentasi ini dilindungi oleh **HTTP Basic Authentication** dan tidak dapat diakses oleh publik secara terbuka.

#### Mekanisme Keamanan Utama:
1. **Autentikasi Siswa**: Siswa melakukan login menggunakan **Nama Kelas** dan **Password Kelas** (opsional menyertakan nama siswa).
2. **Access & Refresh Tokens**:
   - \`accessToken\`: JWT (HS256) berdurasi 15 menit. Dikirimkan melalui header \`Authorization: Bearer <token>\`.
   - \`refreshToken\`: Opaque token 64-karakter (hash SHA-256 tersimpan di server) berdurasi 30 hari dengan deteksi penggunaan ulang (*reuse detection*).
3. **Proteksi IP Blocking (5 Menit)**:
   - Jika suatu IP melakukan **5 kali percobaan salah/mencurigakan dalam rentang 15 menit**, IP tersebut otomatis diblokir selama **5 menit**.
   - Server mengembalikan status HTTP **\`429 Too Many Requests\`** dan header \`Retry-After: 300\`.
      `.trim(),
    },
    servers: [
      {
        url: '/',
        description: 'Server Saat Ini (Lokal / Deployment)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Access Token JWT (HS256). Contoh: Bearer eyJhbGciOi...',
        },
      },
      schemas: {
        ErrorDetail: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              example: 'INVALID_CREDENTIALS',
              description: 'Kode error terstruktur (VALIDATION_FAILED, INVALID_CREDENTIALS, RATE_LIMITED, TOKEN_INVALID, dll)',
            },
            message: {
              type: 'string',
              example: 'Nama kelas atau password salah.',
              description: 'Pesan penjelasan dalam Bahasa Indonesia untuk user.',
            },
            details: {
              type: 'object',
              nullable: true,
              description: 'Detail teknis atau sisa detik penalti pada 429.',
            },
            requestId: {
              type: 'string',
              format: 'uuid',
              example: 'b7b25a3a-23d2-436f-b674-ebfebe616c85',
              description: 'UUID pelacakan request untuk log server.',
            },
          },
          required: ['code', 'message', 'requestId'],
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              $ref: '#/components/schemas/ErrorDetail',
            },
          },
          required: ['error'],
        },
        ClassRegisterRequest: {
          type: 'object',
          required: ['name', 'password'],
          properties: {
            name: {
              type: 'string',
              example: 'XII TAV 1',
              description: 'Nama tampilan kelas (minimal 2 karakter).',
            },
            password: {
              type: 'string',
              example: 'passwordAman123',
              description: 'Password kelas untuk login siswa (minimal 4 karakter).',
            },
          },
        },
        ClassRegisterResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid', example: '410ef9b9-8402-4d71-a09d-dfb7be180d8c' },
                name: { type: 'string', example: 'XII TAV 1' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['className', 'password'],
          properties: {
            className: {
              type: 'string',
              example: 'XII TAV 1',
              description: 'Nama kelas yang terdaftar.',
            },
            password: {
              type: 'string',
              example: 'passwordAman123',
              description: 'Password kelas.',
            },
            username: {
              type: 'string',
              example: 'Aris Pratama',
              description: 'Nama siswa (opsional, jika kosong diisi Siswa <NamaKelas>).',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    username: { type: 'string', example: 'Aris Pratama' },
                    role: { type: 'string', example: 'student' },
                    class: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string', example: 'XII TAV 1' },
                      },
                    },
                  },
                },
                tokens: {
                  type: 'object',
                  properties: {
                    accessToken: {
                      type: 'string',
                      description: 'JWT Bearer token untuk otorisasi endpoint.',
                    },
                    refreshToken: {
                      type: 'string',
                      description: 'Opaque refresh token untuk rotasi sesi.',
                    },
                    expiresIn: {
                      type: 'integer',
                      example: 900,
                      description: 'Masa berlaku access token dalam detik (15 menit).',
                    },
                  },
                },
              },
            },
          },
        },
        RefreshTokenRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              example: 'a68ef7321e074fb3a0c78d052a6a6f69...',
              description: 'Refresh token yang masih valid.',
            },
          },
        },
        RefreshTokenResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: {
              type: 'object',
              properties: {
                tokens: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                    expiresIn: { type: 'integer', example: 900 },
                  },
                },
              },
            },
          },
        },
        MeResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    username: { type: 'string', example: 'Aris Pratama' },
                    role: { type: 'string', example: 'student' },
                    class: {
                      type: 'object',
                      nullable: true,
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string', example: 'XII TAV 1' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Liveness Check',
          description: 'Memeriksa apakah server Bun aktif dan merespons request.',
          responses: {
            '200': {
              description: 'Server aktif dan sehat.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      service: { type: 'string', example: 'sinyallab-backend' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/ready': {
        get: {
          tags: ['System'],
          summary: 'Readiness Check',
          description: 'Memeriksa kesiapan server dan koneksi database.',
          responses: {
            '200': {
              description: 'Database siap melayani koneksi.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ready' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/v1/auth/classes': {
        post: {
          tags: ['Authentication & Class'],
          summary: 'Daftarkan Kelas Baru',
          description: 'Mendaftarkan kelas baru dengan nama dan password kelas untuk login siswa.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ClassRegisterRequest',
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Kelas berhasil didaftarkan.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ClassRegisterResponse',
                  },
                },
              },
            },
            '409': {
              description: 'Nama kelas sudah terdaftar sebelumnya.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            '422': {
              description: 'Format data request tidak valid.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            '429': {
              description: 'IP diblokir sementara selama 5 menit karena aktivitas mencurigakan.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
      '/v1/auth/login': {
        post: {
          tags: ['Authentication & Class'],
          summary: 'Login Siswa',
          description: `
Melakukan autentikasi menggunakan nama kelas dan password kelas.
- Jika gagal 5 kali berturut-turut dalam 15 menit dari IP yang sama, IP akan diblokir otomatis selama **5 menit** (HTTP 429).
- Jika berhasil, mengembalikan \`accessToken\` (15 menit) dan \`refreshToken\` (30 hari).
          `.trim(),
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LoginRequest',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Login berhasil.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/LoginResponse',
                  },
                },
              },
            },
            '401': {
              description: 'Nama kelas atau password salah.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
            '429': {
              description: 'IP klien diblokir selama 5 menit akibat percobaan berulang yang mencurigakan.',
              headers: {
                'Retry-After': {
                  schema: { type: 'integer' },
                  description: 'Sisa detik masa pemblokiran (mis. 300 detik)',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
      '/v1/auth/refresh': {
        post: {
          tags: ['Authentication & Class'],
          summary: 'Rotasi Refresh Token',
          description: 'Memperbarui access token dengan menukarkan refresh token aktif. Deteksi pencurian/reuse token otomatis mencabut seluruh sesi token family.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RefreshTokenRequest',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Sesi berhasil diperbarui.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/RefreshTokenResponse',
                  },
                },
              },
            },
            '401': {
              description: 'Refresh token tidak valid, telah kedaluwarsa, atau terdeteksi penggunaan ulang.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
      '/v1/auth/logout': {
        post: {
          tags: ['Authentication & Class'],
          summary: 'Logout / Cabut Sesi',
          description: 'Mencabut refresh token yang aktif dari server.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RefreshTokenRequest',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Sesi berhasil diakhiri.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      message: { type: 'string', example: 'Sesi berhasil diakhiri.' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/v1/auth/me': {
        get: {
          tags: ['Authentication & Class'],
          summary: 'Ambil Profil Pengguna Aktif',
          description: 'Mengambil data siswa dan kelas yang sedang login.',
          security: [
            {
              bearerAuth: [],
            },
          ],
          responses: {
            '200': {
              description: 'Profil berhasil diambil.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/MeResponse',
                  },
                },
              },
            },
            '401': {
              description: 'Token otorisasi Bearer tidak disertakan atau telah kedaluwarsa.',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
      '/v1/progress': {
        get: {
          tags: ['Progress'],
          summary: 'Ambil Progres Siswa Login',
          description: 'Mengambil data capaian progres belajar siswa yang terautentikasi.',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Data progres siswa berhasil diambil.',
            },
            '401': {
              description: 'Harus login dengan token sah untuk mengakses progres.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/v1/progress/step': {
        post: {
          tags: ['Progress'],
          summary: 'Perbarui Capaian Tahap Belajar',
          description: 'Menandai suatu tahap pembelajaran (stepId) sebagai selesai bagi siswa login.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['stepId'],
                  properties: {
                    stepId: { type: 'string', example: 'm1-s1' },
                    completed: { type: 'boolean', default: true },
                    score: { type: 'number', minimum: 0, maximum: 100, example: 95 },
                    materiSectionId: { type: 'string', example: 'modul-1' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Capaian tahap berhasil diperbarui.',
            },
            '401': {
              description: 'Token login tidak valid atau belum login.',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
    },
  };
}
