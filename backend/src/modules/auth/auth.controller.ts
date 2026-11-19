import { Context } from 'hono';
import { AuthService } from './auth.service';
import { IpBlockerService } from '../../services/ipBlocker';
import { SessionService } from '../../services/betterAuth';
import { getClientIp } from '../../shared/ip';
import { validationFailedError, tokenInvalidError } from '../../shared/errors';
import { sendSuccess, sendSuccessMessage } from '../../shared/response';
import {
  loginSchema,
  registerStudentSchema,
  registerClassSchema,
  refreshTokenSchema,
} from './auth.schema';

export class AuthController {
  constructor(
    private authService: AuthService,
    private ipBlocker: IpBlockerService,
    private sessionService: SessionService
  ) {}

  login = async (c: Context) => {
    const ip = getClientIp(c);
    const body = await c.req.json().catch(() => ({}));

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      await this.ipBlocker.recordFailure(ip, 'Input login tidak valid');
      throw validationFailedError(parsed.error.flatten(), 'Format input login tidak valid.');
    }

    const result = await this.authService.login(ip, parsed.data);
    return sendSuccess(c, result, 200);
  };

  registerStudent = async (c: Context) => {
    const ip = getClientIp(c);
    const body = await c.req.json().catch(() => ({}));

    const parsed = registerStudentSchema.safeParse(body);
    if (!parsed.success) {
      await this.ipBlocker.recordFailure(ip, 'Input pendaftaran murid tidak valid');
      throw validationFailedError(parsed.error.flatten(), 'Format pendaftaran murid tidak valid.');
    }

    const result = await this.authService.registerStudent(ip, parsed.data);
    return sendSuccess(c, result, 201);
  };

  registerClass = async (c: Context) => {
    const ip = getClientIp(c);
    const body = await c.req.json().catch(() => ({}));

    const parsed = registerClassSchema.safeParse(body);
    if (!parsed.success) {
      await this.ipBlocker.recordFailure(ip, 'Input pendaftaran kelas tidak valid');
      throw validationFailedError(parsed.error.flatten(), 'Format pendaftaran kelas tidak valid.');
    }

    const createdClass = await this.authService.registerClass(ip, parsed.data);
    return sendSuccess(c, createdClass, 201);
  };

  listClasses = async (c: Context) => {
    const classes = await this.authService.listClasses();
    return sendSuccess(c, { classes }, 200);
  };

  refresh = async (c: Context) => {
    const body = await c.req.json().catch(() => ({}));

    const parsed = refreshTokenSchema.safeParse(body);
    if (!parsed.success) {
      throw validationFailedError(
        parsed.error.flatten(),
        'Refresh token tidak disertakan atau tidak valid.'
      );
    }

    const tokens = await this.authService.refreshToken(parsed.data);
    return sendSuccess(c, { tokens }, 200);
  };

  logout = async (c: Context) => {
    const body = await c.req.json().catch(() => ({}));

    const authHeader = c.req.header('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : undefined;
    const sessionToken = (body as Record<string, unknown>)?.sessionToken as string | undefined || bearerToken;

    const parsed = refreshTokenSchema.safeParse(body);
    if (parsed.success) {
      await this.authService.logout(parsed.data, sessionToken);
    } else if (sessionToken) {
      await this.sessionService.revokeSession(sessionToken);
    }

    return sendSuccessMessage(c, 'Sesi berhasil diakhiri.', 200);
  };

  me = async (c: Context) => {
    const auth = (c.get as (key: string) => { userId: string } | undefined)('auth');
    if (!auth?.userId) {
      throw tokenInvalidError('Autentikasi diperlukan.');
    }

    const user = await this.authService.getMe(auth.userId);
    return sendSuccess(c, { user }, 200);
  };
}
