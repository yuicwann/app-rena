import { Context } from 'hono';
import { ProgressService } from './progress.service';
import { UpdateStepProgressSchema, SyncProgressSchema } from './progress.schema';
import { validationFailedError, tokenInvalidError } from '../../shared/errors';
import { sendSuccess } from '../../shared/response';

export class ProgressController {
  constructor(private progressService: ProgressService) {}

  get = async (c: Context) => {
    const auth = c.get('auth');
    if (!auth?.userId) {
      throw tokenInvalidError('Siswa harus login untuk mengakses data progress.');
    }

    const progress = await this.progressService.getProgress(auth.userId);
    return sendSuccess(c, progress, 200);
  };

  updateStep = async (c: Context) => {
    const auth = c.get('auth');
    if (!auth?.userId) {
      throw tokenInvalidError('Siswa harus login untuk memperbarui progress.');
    }

    const body = await c.req.json().catch(() => ({}));
    const parsed = UpdateStepProgressSchema.safeParse(body);
    if (!parsed.success) {
      throw validationFailedError(
        parsed.error.flatten(),
        'Format data tahapan progress tidak valid.'
      );
    }

    const updated = await this.progressService.recordStep(auth.userId, parsed.data);
    return sendSuccess(c, updated, 200);
  };

  sync = async (c: Context) => {
    const auth = c.get('auth');
    if (!auth?.userId) {
      throw tokenInvalidError('Siswa harus login untuk sinkronisasi progress.');
    }

    const body = await c.req.json().catch(() => ({}));
    const parsed = SyncProgressSchema.safeParse(body);
    if (!parsed.success) {
      throw validationFailedError(
        parsed.error.flatten(),
        'Format data sinkronisasi progress tidak valid.'
      );
    }

    const synced = await this.progressService.syncProgress(auth.userId, parsed.data);
    return sendSuccess(c, synced, 200);
  };

  reset = async (c: Context) => {
    const auth = c.get('auth');
    if (!auth?.userId) {
      throw tokenInvalidError('Siswa harus login untuk mereset progress.');
    }

    const resetData = await this.progressService.resetProgress(auth.userId);
    return sendSuccess(c, resetData, 200);
  };
}
