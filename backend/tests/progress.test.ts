import { describe, it, expect, beforeEach } from 'bun:test';
import { ProgressRepository } from '../src/modules/progress/progress.repository';
import { ProgressService } from '../src/modules/progress/progress.service';
import { ProgressController } from '../src/modules/progress/progress.controller';
import { AppError } from '../src/shared/errors';

describe('Progress Module Unit Tests', () => {
  let repo: ProgressRepository;
  let service: ProgressService;
  let controller: ProgressController;

  const mockPrisma = {} as any;

  beforeEach(() => {
    repo = new ProgressRepository(mockPrisma);
    service = new ProgressService(repo);
    controller = new ProgressController(service);
  });

  it('rejects access for guest user without real login session', async () => {
    const guestId = 'guest-1730000000';

    try {
      await service.getProgress(guestId);
      expect(true).toBe(false); // should not reach
    } catch (err: any) {
      expect(err).toBeInstanceOf(AppError);
      expect(err.status).toBe(401);
      expect(err.message).toContain('hanya dapat diakses oleh siswa yang sudah login');
    }
  });

  it('rejects step update for guest user', async () => {
    const guestId = 'guest-9999';

    try {
      await service.recordStep(guestId, { stepId: 'm1-s1', completed: true });
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err).toBeInstanceOf(AppError);
      expect(err.status).toBe(401);
      expect(err.message).toContain('hanya dapat diperbarui oleh siswa yang sudah login');
    }
  });

  it('returns valid initial progress for authenticated student', async () => {
    const validUserId = 'student-uuid-123';
    const progress = await service.getProgress(validUserId);

    expect(progress.userId).toBe(validUserId);
    expect(progress.completedSteps).toEqual([]);
    expect(progress.activeStepId).toBe('m1-s1');
    expect(progress.progressPercentage).toBe(0);
  });

  it('updates completed step, advances activeStep, and calculates percentage', async () => {
    const validUserId = 'student-uuid-456';

    const updated = await service.recordStep(validUserId, {
      stepId: 'm1-s1',
      completed: true,
      score: 100,
    });

    expect(updated.completedSteps).toContain('m1-s1');
    expect(updated.activeStepId).toBe('m1-s2'); // advances to next step
    expect(updated.progressPercentage).toBeGreaterThan(0); // 1/8 = 13%
  });

  it('controller blocks unauthenticated request without auth context', async () => {
    const mockContext = {
      get: (key: string) => (key === 'auth' ? null : undefined),
      req: {
        json: async () => ({ stepId: 'm1-s1' }),
      },
    } as any;

    try {
      await controller.get(mockContext);
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err).toBeInstanceOf(AppError);
      expect(err.status).toBe(401);
    }
  });

  it('controller updates step successfully when student is authenticated', async () => {
    let responseData: any = null;
    let responseStatus: number = 0;

    const mockContext = {
      get: (key: string) => {
        if (key === 'auth') return { userId: 'real-student-789', role: 'student' };
        if (key === 'requestId') return 'test-req-id';
        return undefined;
      },
      req: {
        json: async () => ({ stepId: 'm1-s1', completed: true }),
      },
      json: (payload: any, status: number) => {
        responseData = payload;
        responseStatus = status;
        return payload;
      },
    } as any;

    await controller.updateStep(mockContext);

    expect(responseStatus).toBe(200);
    expect(responseData.status).toBe('success');
    expect(responseData.data.completedSteps).toContain('m1-s1');
  });
});
