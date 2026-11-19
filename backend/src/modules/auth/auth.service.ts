import { AuthRepository } from './auth.repository';
import { Hasher } from '../../services/hasher';
import { IpBlockerService } from '../../services/ipBlocker';
import { TokenService, SessionResult } from '../../services/tokens';
import { SessionService } from '../../services/betterAuth';
import { LoginInput, RegisterStudentInput, RegisterClassInput, RefreshTokenInput } from './auth.schema';
import { AuthUserResponse, LoginResult, ClassResponse } from './auth.types';
import { buildLoginKeys, buildInternalEmail, LoginKeys, normalizeKey } from '../../shared/strings';
import {
  rateLimitedError,
  invalidCredentialsError,
  accountDisabledError,
  conflictError,
} from '../../shared/errors';

export class AuthService {
  constructor(
    private repo: AuthRepository,
    private hasher: Hasher,
    private tokenService: TokenService,
    private ipBlocker: IpBlockerService,
    private sessionService: SessionService
  ) {}

  /**
   * Use Case: Login murid dengan nama kelas, nama murid, dan password akun murid
   */
  async login(ip: string, input: LoginInput): Promise<LoginResult> {
    await this.assertIpNotBlocked(ip);

    const keys = buildLoginKeys(input);
    const classRecord = await this.findActiveClass(ip, keys);

    const studentName = input.username?.trim();
    if (!studentName) {
      // Fallback jika hanya menggunakan kelas
      await this.assertValidPassword(ip, classRecord, input.password, keys);
      await this.recordLoginSuccess(ip, classRecord, keys);
      const user = await this.findOrCreateStudent(classRecord);
      return this.issueSession(user, classRecord, ip);
    }

    const studentUserKey = normalizeKey(studentName);
    const student = await this.repo.findStudentInClass(classRecord.id, studentUserKey);

    if (student) {
      if (student.isActive === false) {
        throw accountDisabledError();
      }

      // Verifikasi password murid pribadi (fallback ke password kelas jika user lama belum punya hash)
      const hashToVerify = student.passwordHash || classRecord.passwordHash;
      const isPasswordValid = await this.hasher.verify(input.password, hashToVerify);
      if (!isPasswordValid) {
        return this.failLogin(
          ip,
          keys,
          'Password salah. Silakan periksa kembali password akunmu.',
          classRecord.id
        );
      }

      await this.recordLoginSuccess(ip, classRecord, keys);
      const updatedStudent = await this.findOrCreateStudent(classRecord, studentName);
      return this.issueSession(updatedStudent, classRecord, ip);
    }

    // Murid belum ada di kelas ini: simpan password murid baru dan buat akun
    const userPasswordHash = await this.hasher.hash(input.password);
    await this.recordLoginSuccess(ip, classRecord, keys);
    const newStudent = await this.findOrCreateStudent(classRecord, studentName, userPasswordHash);
    return this.issueSession(newStudent, classRecord, ip);
  }

  /**
   * Use Case: Pendaftaran murid baru ke dalam kelas dengan password akun murid sendiri
   */
  async registerStudent(ip: string, input: RegisterStudentInput): Promise<LoginResult> {
    await this.assertIpNotBlocked(ip);

    const keys = buildLoginKeys(input);
    const classRecord = await this.findActiveClass(ip, keys);

    const displayName = input.username.trim();
    const studentUserKey = normalizeKey(displayName);

    const existingStudent = await this.repo.findStudentInClass(classRecord.id, studentUserKey);
    if (existingStudent) {
      throw conflictError(
        `Murid '${displayName}' sudah terdaftar di kelas ${classRecord.name}. Silakan langsung masuk dengan password kamu.`
      );
    }

    // Hash password pribadi murid
    const userPasswordHash = await this.hasher.hash(input.password);

    await this.recordLoginSuccess(ip, classRecord, keys);

    const user = await this.findOrCreateStudent(classRecord, displayName, userPasswordHash);
    return this.issueSession(user, classRecord, ip);
  }

  /**
   * Use Case: Pendaftaran kelas baru
   */
  async registerClass(ip: string, input: RegisterClassInput): Promise<ClassResponse> {
    await this.assertIpNotBlocked(ip);

    const cleanName = input.name.trim();
    const key = normalizeKey(cleanName);

    await this.assertClassNotExists(cleanName, key);

    const passwordHash = await this.hasher.hash(input.password);
    return this.repo.createClass({
      name: cleanName,
      key,
      passwordHash,
    });
  }

  /**
   * Use Case: Rotasi refresh token
   */
  async refreshToken(input: RefreshTokenInput): Promise<SessionResult> {
    return this.tokenService.rotateRefreshToken(input.refreshToken);
  }

  /**
   * Use Case: Logout & pencabutan sesi
   */
  async logout(input: RefreshTokenInput, sessionToken?: string): Promise<void> {
    if (sessionToken) {
      await this.sessionService.revokeSession(sessionToken);
    }
    if (input.refreshToken) {
      await this.tokenService.revokeRefreshToken(input.refreshToken);
    }
  }

  /**
   * Use Case: Ambil daftar kelas aktif
   */
  async listClasses(): Promise<Array<{ id: string; name: string; createdAt: Date }>> {
    return await this.repo.listClasses();
  }

  /**
   * Use Case: Ambil profil user saat ini
   */
  async getMe(userId: string): Promise<AuthUserResponse> {
    const user = await this.repo.findUserByIdWithClass(userId);

    if (!user || !user.isActive) {
      throw accountDisabledError('Akun pengguna tidak aktif atau tidak ditemukan.');
    }

    return {
      id: user.id,
      username: user.username || user.name,
      role: user.role,
      class: user.class,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helper methods - Satu tanggung jawab per method
  // ---------------------------------------------------------------------------

  private async assertIpNotBlocked(ip: string): Promise<void> {
    const ipCheck = await this.ipBlocker.checkIp(ip);
    if (ipCheck.blocked) {
      throw rateLimitedError(
        ipCheck.remainingSeconds,
        'IP ini diblokir sementara selama 5 menit karena aktivitas mencurigakan.'
      );
    }
  }

  private async findActiveClass(ip: string, keys: LoginKeys) {
    const classRecord = await this.repo.findClassByKey(keys.classKey);
    if (!classRecord) {
      return this.failLogin(
        ip,
        keys,
        `Percobaan login dengan nama kelas tidak ditemukan: ${keys.className}`
      );
    }

    if (!classRecord.isActive) {
      throw accountDisabledError();
    }

    return classRecord;
  }

  private async assertValidPassword(
    ip: string,
    classRecord: { id: string; name: string; passwordHash: string },
    password: string,
    keys: LoginKeys
  ): Promise<void> {
    const isValid = await this.hasher.verify(password, classRecord.passwordHash);
    if (!isValid) {
      return this.failLogin(
        ip,
        keys,
        `Password salah untuk kelas: ${classRecord.name}`,
        classRecord.id
      );
    }
  }

  private async recordLoginSuccess(
    ip: string,
    classRecord: { id: string },
    keys: LoginKeys
  ): Promise<void> {
    await this.ipBlocker.recordSuccess(ip);
    await this.repo.createLoginAttempt({
      ip,
      classId: classRecord.id,
      classKey: keys.classKey,
      usernameKey: keys.usernameKey,
      success: true,
    });
  }

  private async findOrCreateStudent(
    classRecord: { id: string; name: string; key: string },
    username?: string,
    passwordHash?: string
  ) {
    const displayName = username && username.trim().length > 0
      ? username.trim()
      : `Siswa ${classRecord.name}`;
    const studentUserKey = normalizeKey(displayName);
    const userEmail = buildInternalEmail(studentUserKey, classRecord.key);

    return this.repo.upsertStudent(classRecord.id, {
      displayName,
      userEmail,
      studentUserKey,
      passwordHash,
    });
  }

  private async issueSession(
    user: { id: string; name: string; username: string | null; role: string },
    classRecord: { id: string; name: string },
    ip: string
  ): Promise<LoginResult> {
    const dbSession = await this.sessionService.createSession(user, ip);
    const sessionTokens = await this.tokenService.issueTokens({
      id: user.id,
      role: user.role,
      classId: classRecord.id,
      className: classRecord.name,
      username: user.username || user.name,
    });

    return {
      user: {
        id: user.id,
        username: user.username || user.name,
        role: user.role,
        class: {
          id: classRecord.id,
          name: classRecord.name,
        },
      },
      tokens: {
        ...sessionTokens,
        sessionToken: dbSession.sessionToken,
      },
      session: {
        id: dbSession.id,
        sessionToken: dbSession.sessionToken,
        expiresAt: dbSession.expiresAt,
      },
    };
  }

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

    const blockResult = await this.ipBlocker.recordFailure(ip, reason);
    if (blockResult.blocked) {
      throw rateLimitedError(blockResult.remainingSeconds);
    }

    throw invalidCredentialsError();
  }

  private async assertClassNotExists(name: string, key: string): Promise<void> {
    const existing = await this.repo.findClassByKey(key);
    if (existing) {
      throw conflictError(`Kelas '${name}' sudah terdaftar.`);
    }
  }
}
