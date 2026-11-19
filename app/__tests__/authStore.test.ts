import { useAuthStore } from '../src/store/authStore';
import { useSettingsStore } from '../src/store/settingsStore';

describe('Auth Store & State Management', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('initializes with unauthenticated guest state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
  });

  it('handles guestLogin successfully and synchronizes nickname', () => {
    useAuthStore.getState().guestLogin('Aris Pratama');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.username).toBe('Aris Pratama');
    expect(state.user?.role).toBe('student');
    expect(state.user?.class?.name).toBe('Kelas TAV Terbuka');

    const nickname = useSettingsStore.getState().nickname;
    expect(nickname).toBe('Aris Pratama');
  });

  it('handles logout properly', () => {
    useAuthStore.getState().guestLogin('Siswa Uji');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
  });

  it('clears error correctly', () => {
    useAuthStore.setState({ error: 'Terjadi kesalahan uji' });
    expect(useAuthStore.getState().error).toBe('Terjadi kesalahan uji');

    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });
});
