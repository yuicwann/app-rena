import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { appStorage } from './storage';
import { CURRENT_SCHEMA_VERSION, migrateState } from './migrations';

export interface SettingsState {
  nickname: string;
  onboardingCompleted: boolean;
  sound: boolean;
  haptics: boolean;
  fontScale: 'S' | 'M' | 'L';
  quizFeedbackMode: 'perQuestion' | 'end';
  heartsEnabled: boolean;
  setNickname: (nickname: string) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setSound: (enabled: boolean) => void;
  setHaptics: (enabled: boolean) => void;
  setFontScale: (scale: 'S' | 'M' | 'L') => void;
  setQuizFeedbackMode: (mode: 'perQuestion' | 'end') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      nickname: 'Siswa Radio',
      onboardingCompleted: false,
      sound: true,
      haptics: true,
      fontScale: 'M',
      quizFeedbackMode: 'perQuestion',
      heartsEnabled: false,
      setNickname: (nickname: string) => set({ nickname }),
      setOnboardingCompleted: (onboardingCompleted: boolean) => set({ onboardingCompleted }),
      setSound: (sound: boolean) => set({ sound }),
      setHaptics: (haptics: boolean) => set({ haptics }),
      setFontScale: (fontScale: 'S' | 'M' | 'L') => set({ fontScale }),
      setQuizFeedbackMode: (quizFeedbackMode: 'perQuestion' | 'end') => set({ quizFeedbackMode }),
    }),
    {
      name: 'sinyallab-settings-storage',
      storage: createJSONStorage(() => appStorage),
      version: CURRENT_SCHEMA_VERSION,
      migrate: migrateState,
    }
  )
);
