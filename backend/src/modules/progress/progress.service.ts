import { ProgressRepository } from './progress.repository';
import { UserProgressData, UpdateStepInput, SyncProgressInput } from './progress.types';
import { AppError } from '../../shared/errors';

export class ProgressService {
  constructor(private progressRepo: ProgressRepository) {}

  async getProgress(userId: string): Promise<UserProgressData> {
    if (!userId || userId.startsWith('guest-')) {
      throw new AppError(
        'TOKEN_INVALID',
        401,
        'Progres hanya dapat diakses oleh siswa yang sudah login dengan akun kelas valid.'
      );
    }

    return this.progressRepo.findByUserId(userId);
  }

  async recordStep(userId: string, input: UpdateStepInput): Promise<UserProgressData> {
    if (!userId || userId.startsWith('guest-')) {
      throw new AppError(
        'TOKEN_INVALID',
        401,
        'Progres hanya dapat diperbarui oleh siswa yang sudah login dengan akun kelas valid.'
      );
    }

    if (!input.stepId || typeof input.stepId !== 'string') {
      throw new AppError('VALIDATION_FAILED', 400, 'stepId wajib disertakan.');
    }

    return this.progressRepo.updateStep(userId, input);
  }

  async syncProgress(userId: string, input: SyncProgressInput): Promise<UserProgressData> {
    if (!userId || userId.startsWith('guest-')) {
      throw new AppError(
        'TOKEN_INVALID',
        401,
        'Sinkronisasi progres membutuhkan sesi login akun kelas yang valid.'
      );
    }

    return this.progressRepo.sync(userId, input);
  }

  async resetProgress(userId: string): Promise<UserProgressData> {
    if (!userId || userId.startsWith('guest-')) {
      throw new AppError(
        'TOKEN_INVALID',
        401,
        'Progres hanya dapat direset oleh siswa yang sudah login dengan akun kelas valid.'
      );
    }

    return this.progressRepo.reset(userId);
  }
}
