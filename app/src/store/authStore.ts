import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { appStorage } from './storage';
import { useSettingsStore } from './settingsStore';
import {
  authApi,
  getApiErrorMessage,
  AuthUser,
  AuthTokens,
  LoginPayload,
  RegisterStudentPayload,
  RegisterClassPayload,
} from '@/shared/api';

export type { AuthUser, AuthTokens };

export interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  error: string | null;

  clearError: () => void;
  login: (params: LoginPayload) => Promise<{ success: boolean; error?: string }>;
  registerStudent: (params: RegisterStudentPayload) => Promise<{ success: boolean; error?: string }>;
  registerClass: (params: RegisterClassPayload) => Promise<{ success: boolean; error?: string }>;
  guestLogin: (nickname?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isGuest: false,
      isLoading: false,
      error: null,

      clearError: () => set({ error: null }),

      login: async ({ className, password, username }: LoginPayload) => {
        set({ isLoading: true, error: null });

        try {
          const data = await authApi.login({ className, password, username });

          const resolvedUsername = data.user?.username || username;
          const userWithUsername = data.user
            ? { ...data.user, username: resolvedUsername || data.user.username }
            : data.user;

          // 1. Reset progress lokal terlebih dahulu agar data user sebelumnya langsung dibersihkan
          const { useProgressStore } = await import('./progressStore');
          useProgressStore.getState().resetProgress(data.user?.id || null);

          set({
            user: userWithUsername,
            tokens: data.tokens,
            isAuthenticated: true,
            isGuest: false,
            isLoading: false,
            error: null,
          });

          // Sinkronisasi nickname siswa dengan settingsStore
          if (resolvedUsername) {
            useSettingsStore.getState().setNickname(resolvedUsername);
          }

          // Sinkronisasi data progres riil siswa dari server
          try {
            await useProgressStore.getState().syncWithServer(data.tokens.accessToken, data.user?.id);
          } catch {
            // Best-effort sinkronisasi
          }

          return { success: true };
        } catch (err: unknown) {
          const userFriendlyError = getApiErrorMessage(err);
          set({ error: userFriendlyError, isLoading: false });
          return { success: false, error: userFriendlyError };
        }
      },

      registerStudent: async ({ className, password, username }: RegisterStudentPayload) => {
        set({ isLoading: true, error: null });

        try {
          const data = await authApi.registerStudent({ className, password, username });

          const resolvedUsername = data.user?.username || username;
          const userWithUsername = data.user
            ? { ...data.user, username: resolvedUsername || data.user.username }
            : data.user;

          // Akun murid baru: pastikan progress lokal direset bersih ke 0%
          const { useProgressStore } = await import('./progressStore');
          useProgressStore.getState().resetProgress(data.user?.id || null);

          set({
            user: userWithUsername,
            tokens: data.tokens,
            isAuthenticated: true,
            isGuest: false,
            isLoading: false,
            error: null,
          });

          // Sinkronisasi nickname siswa dengan settingsStore
          if (resolvedUsername) {
            useSettingsStore.getState().setNickname(resolvedUsername);
          }

          // Sinkronisasi data progres riil siswa dari server
          try {
            await useProgressStore.getState().syncWithServer(data.tokens.accessToken, data.user?.id);
          } catch {
            // Best-effort sinkronisasi
          }

          return { success: true };
        } catch (err: unknown) {
          const userFriendlyError = getApiErrorMessage(err);
          set({ error: userFriendlyError, isLoading: false });
          return { success: false, error: userFriendlyError };
        }
      },

      registerClass: async ({ name, password, creatorName }: RegisterClassPayload) => {
        set({ isLoading: true, error: null });

        try {
          await authApi.registerClass({ name, password, creatorName });

          set({ isLoading: false, error: null });
          return { success: true };
        } catch (err: unknown) {
          const userFriendlyError = getApiErrorMessage(err);
          set({ error: userFriendlyError, isLoading: false });
          return { success: false, error: userFriendlyError };
        }
      },

      guestLogin: (nickname = 'Siswa Tamu') => {
        const guestUser: AuthUser = {
          id: `guest-${Date.now()}`,
          username: nickname,
          role: 'student',
          class: {
            id: 'demo-class',
            name: 'Kelas TAV Terbuka',
          },
        };

        set({
          user: guestUser,
          tokens: null,
          isAuthenticated: true,
          isGuest: true,
          isLoading: false,
          error: null,
        });

        useSettingsStore.getState().setNickname(nickname);

        import('./progressStore')
          .then(({ useProgressStore }) => {
            useProgressStore.getState().resetProgress('guest');
          })
          .catch(() => {});
      },

      logout: () => {
        const currentTokens = get().tokens;

        // Best effort revoke sesi di backend
        if (currentTokens?.refreshToken || currentTokens?.sessionToken) {
          authApi.logout({
            refreshToken: currentTokens.refreshToken,
            sessionToken: currentTokens.sessionToken,
          });
        }

        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isGuest: false,
          isLoading: false,
          error: null,
        });

        import('./progressStore')
          .then(({ useProgressStore }) => {
            useProgressStore.getState().resetProgress(null);
          })
          .catch(() => {});
      },
    }),
    {
      name: 'sinyallab-auth-storage',
      storage: createJSONStorage(() => appStorage),
      version: 2,
      migrate: (persistedState: unknown) => {
        if (persistedState && typeof persistedState === 'object') {
          const stateObj = persistedState as Record<string, unknown>;
          delete stateObj.apiBaseUrl;
          return stateObj;
        }
        return persistedState;
      },
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest,
      }),
    }
  )
);
