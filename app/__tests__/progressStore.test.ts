import { useProgressStore } from '../src/store/progressStore';
import { useAuthStore } from '../src/store/authStore';
import { progressApi } from '../src/shared/api';

describe('Progress Store & Real Progress Flow', () => {
  beforeEach(() => {
    useProgressStore.getState().resetProgress();
    useAuthStore.getState().logout();
  });

  it('initializes with default zero progress for new users', () => {
    const state = useProgressStore.getState();
    expect(state.completedSteps).toEqual([]);
    expect(state.activeStepId).toBe('m1-s1');
    expect(state.progressPercentage).toBe(0);
  });

  it('blocks progress advancement when user is in guest mode', async () => {
    useAuthStore.getState().guestLogin('Siswa Tamu');
    expect(useAuthStore.getState().isGuest).toBe(true);

    const result = await useProgressStore.getState().completeStep('m1-s1');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Harus login dengan akun kelas valid');

    // Progress remains locked at 0
    const state = useProgressStore.getState();
    expect(state.completedSteps).toEqual([]);
    expect(state.progressPercentage).toBe(0);
  });

  it('allows progress advancement when user is logged in with valid tokens', async () => {
    // Mock user login state with real tokens
    useAuthStore.setState({
      isAuthenticated: true,
      isGuest: false,
      user: {
        id: 'real-user-123',
        username: 'Budi Santoso',
        role: 'student',
        class: { id: 'c1', name: 'XII TAV 1' },
      },
      tokens: {
        accessToken: 'mock-access-token-jwt',
        refreshToken: 'mock-refresh-token',
        sessionToken: 'mock-session-token',
        expiresIn: 900,
      },
    });

    // Mock progressApi updateStep to avoid real network wait during unit test
    const spy = jest.spyOn(progressApi, 'updateStep').mockResolvedValueOnce({
      userId: 'real-user-123',
      completedSteps: ['m1-s1'],
      activeStepId: 'm1-s2',
      progressPercentage: 13,
      materi: { 'modul-1': { cardsSeen: [], completed: true, quickCheckPassedFirstTry: false } },
      simulasi: { runs: [], inspectedBlocks: [] },
      troubleshoot: {},
      quiz: { best: null, history: [] },
      updatedAt: new Date().toISOString(),
    });

    const result = await useProgressStore.getState().completeStep('m1-s1', 95, 'modul-1');

    expect(result.success).toBe(true);
    spy.mockRestore();

    const state = useProgressStore.getState();
    expect(state.completedSteps).toContain('m1-s1');
    expect(state.activeStepId).toBe('m1-s2');
    expect(state.progressPercentage).toBeGreaterThan(0);
    expect(state.materi['modul-1']?.completed).toBe(true);
  });

  it('resets progress correctly with user scoping', () => {
    useProgressStore.setState({
      userId: 'old-user-999',
      completedSteps: ['m1-s1', 'm1-s2'],
      activeStepId: 'm1-s3',
      progressPercentage: 25,
      materi: { 'modul-1': { cardsSeen: ['c1'], completed: true, quickCheckPassedFirstTry: true } },
    });

    useProgressStore.getState().resetProgress('new-user-001');

    const state = useProgressStore.getState();
    expect(state.userId).toBe('new-user-001');
    expect(state.completedSteps).toEqual([]);
    expect(state.activeStepId).toBe('m1-s1');
    expect(state.progressPercentage).toBe(0);
    expect(state.materi).toEqual({});
  });

  it('syncWithServer replaces stale local state completely with server data', async () => {
    // Stale local state from an old user
    useProgressStore.setState({
      userId: 'old-user-999',
      completedSteps: ['m1-s1', 'm1-s2'],
      activeStepId: 'm1-s3',
      progressPercentage: 25,
      materi: { 'modul-1': { cardsSeen: ['c1'], completed: true, quickCheckPassedFirstTry: true } },
    });

    // Mock server returning pristine zero progress for a new user
    const spy = jest.spyOn(progressApi, 'getProgress').mockResolvedValueOnce({
      userId: 'new-user-777',
      completedSteps: [],
      activeStepId: 'm1-s1',
      progressPercentage: 0,
      materi: {},
      simulasi: { runs: [], inspectedBlocks: [] },
      troubleshoot: {},
      quiz: { best: null, history: [] },
      updatedAt: new Date().toISOString(),
    });

    await useProgressStore.getState().syncWithServer('valid-mock-token', 'new-user-777');
    spy.mockRestore();

    const state = useProgressStore.getState();
    expect(state.userId).toBe('new-user-777');
    expect(state.completedSteps).toEqual([]);
    expect(state.activeStepId).toBe('m1-s1');
    expect(state.progressPercentage).toBe(0);
    expect(state.materi).toEqual({});
  });
});
