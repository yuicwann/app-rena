import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { appStorage } from './storage';
import { CURRENT_SCHEMA_VERSION, migrateState } from './migrations';
import { progressApi, getApiErrorMessage } from '@/shared/api';
import { useAuthStore } from './authStore';

export interface ProgressState {
  userId: string | null;
  completedSteps: string[];
  activeStepId: string;
  progressPercentage: number;
  isSyncing: boolean;
  syncError: string | null;

  materi: Record<
    string,
    {
      cardsSeen: string[];
      completed: boolean;
      quickCheckPassedFirstTry: boolean;
    }
  >;
  simulasi: {
    runs: { mode: 'AM' | 'FM'; date: string }[];
    inspectedBlocks: string[];
  };
  troubleshoot: Record<
    string,
    {
      solved: boolean;
      bestStars: 0 | 1 | 2 | 3;
      attempts: number;
      lastMeasurements: number;
      lastWrong: number;
    }
  >;
  quiz: {
    best: number | null;
    history: {
      date: string;
      score: number;
      byTopic: Record<string, { correct: number; total: number }>;
    }[];
  };

  markCardSeen: (sectionId: string, cardId: string) => void;
  completeSection: (sectionId: string, passedFirstTry: boolean) => void;
  completeStep: (stepId: string, score?: number, sectionId?: string) => Promise<{ success: boolean; error?: string }>;
  syncWithServer: (token: string, expectedUserId?: string) => Promise<void>;
  recordSimulasiRun: (mode: 'AM' | 'FM', date: string) => void;
  inspectSimulasiBlock: (blockId: string) => void;
  recordTroubleshootResult: (
    caseId: string,
    result: { solved: boolean; stars: 0 | 1 | 2 | 3; measurements: number; wrong: number }
  ) => void;
  recordQuizResult: (
    score: number,
    byTopic: Record<string, { correct: number; total: number }>
  ) => void;
  resetProgress: (newUserId?: string | null) => void;
}

const TOTAL_STEPS = 8;
const STEP_ORDER = ['m1-s1', 'm1-s2', 'm1-s3', 'm1-s4', 'm2-s1', 'm2-s2', 'm2-s3', 'm2-s4'];

const initialProgress = {
  userId: null as string | null,
  completedSteps: [] as string[],
  activeStepId: 'm1-s1',
  progressPercentage: 0,
  isSyncing: false,
  syncError: null as string | null,
  materi: {},
  simulasi: {
    runs: [],
    inspectedBlocks: [],
  },
  troubleshoot: {},
  quiz: {
    best: null,
    history: [],
  },
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...initialProgress,

      completeStep: async (stepId: string, score?: number, sectionId?: string) => {
        const auth = useAuthStore.getState();

        // Guard: Guest atau user tanpa token valid dilarang menyimpan progress
        if (auth.isGuest || !auth.tokens?.accessToken) {
          return {
            success: false,
            error: 'Harus login dengan akun kelas valid untuk membuka dan menyimpan progress.',
          };
        }

        const state = get();
        let completedSteps = [...state.completedSteps];
        if (!completedSteps.includes(stepId)) {
          completedSteps.push(stepId);
        }

        const curIdx = STEP_ORDER.indexOf(stepId);
        let nextStep = state.activeStepId;
        if (curIdx >= 0 && curIdx < STEP_ORDER.length - 1) {
          const candidate = STEP_ORDER[curIdx + 1];
          if (candidate) {
            nextStep = candidate;
          }
        }

        const progressPercentage = Math.min(
          100,
          Math.round((completedSteps.length / TOTAL_STEPS) * 100)
        );

        const updatedMateri = { ...state.materi };
        if (sectionId) {
          const prev = updatedMateri[sectionId] || {
            cardsSeen: [],
            completed: false,
            quickCheckPassedFirstTry: false,
          };
          updatedMateri[sectionId] = {
            ...prev,
            completed: true,
          };
        }

        set({
          completedSteps,
          activeStepId: nextStep,
          progressPercentage,
          materi: updatedMateri,
        });

        // Upayakan sinkronisasi ke server endpoint progress secara real
        try {
          const serverData = await progressApi.updateStep(
            auth.tokens.accessToken,
            { stepId, completed: true, score, materiSectionId: sectionId }
          );

          if (serverData) {
            set({
              completedSteps: serverData.completedSteps,
              activeStepId: serverData.activeStepId,
              progressPercentage: serverData.progressPercentage,
              syncError: null,
            });
          }

          return { success: true };
        } catch (err: unknown) {
          const msg = getApiErrorMessage(err);
          set({ syncError: msg });
          // Local progress tetap tersimpan
          return { success: true };
        }
      },

      syncWithServer: async (token: string, expectedUserId?: string) => {
        set({ isSyncing: true, syncError: null });

        try {
          const serverData = await progressApi.getProgress(token);
          if (serverData) {
            const normalizedTroubleshoot: ProgressState['troubleshoot'] = {};
            if (serverData.troubleshoot) {
              for (const [k, v] of Object.entries(serverData.troubleshoot)) {
                normalizedTroubleshoot[k] = {
                  solved: v.solved,
                  bestStars: v.bestStars,
                  attempts: v.attempts,
                  lastMeasurements: 0,
                  lastWrong: 0,
                };
              }
            }

            const normalizedQuiz: ProgressState['quiz'] = {
              best: serverData.quiz?.best ?? null,
              history: (serverData.quiz?.history || []).map((h) => ({
                date: h.date,
                score: h.score,
                byTopic: {},
              })),
            };

            set({
              userId: serverData.userId || expectedUserId || null,
              completedSteps: serverData.completedSteps || [],
              activeStepId: serverData.activeStepId || 'm1-s1',
              progressPercentage: serverData.progressPercentage || 0,
              materi: serverData.materi || {},
              simulasi: serverData.simulasi || { runs: [], inspectedBlocks: [] },
              troubleshoot: normalizedTroubleshoot,
              quiz: normalizedQuiz,
              isSyncing: false,
              syncError: null,
            });
          }
        } catch (err: unknown) {
          set({ isSyncing: false, syncError: getApiErrorMessage(err) });
        }
      },

      markCardSeen: (sectionId: string, cardId: string) => {
        const state = get();
        const sectionProgress = state.materi[sectionId] || {
          cardsSeen: [],
          completed: false,
          quickCheckPassedFirstTry: false,
        };
        if (!sectionProgress.cardsSeen.includes(cardId)) {
          set({
            materi: {
              ...state.materi,
              [sectionId]: {
                ...sectionProgress,
                cardsSeen: [...sectionProgress.cardsSeen, cardId],
              },
            },
          });
        }
      },

      completeSection: (sectionId: string, passedFirstTry: boolean) => {
        const state = get();
        const sectionProgress = state.materi[sectionId] || {
          cardsSeen: [],
          completed: false,
          quickCheckPassedFirstTry: false,
        };
        set({
          materi: {
            ...state.materi,
            [sectionId]: {
              ...sectionProgress,
              completed: true,
              quickCheckPassedFirstTry:
                sectionProgress.quickCheckPassedFirstTry || passedFirstTry,
            },
          },
        });
      },

      recordSimulasiRun: (mode: 'AM' | 'FM', date: string) => {
        const state = get();
        set({
          simulasi: {
            ...state.simulasi,
            runs: [...state.simulasi.runs, { mode, date }],
          },
        });
      },

      inspectSimulasiBlock: (blockId: string) => {
        const state = get();
        if (!state.simulasi.inspectedBlocks.includes(blockId)) {
          set({
            simulasi: {
              ...state.simulasi,
              inspectedBlocks: [...state.simulasi.inspectedBlocks, blockId],
            },
          });
        }
      },

      recordTroubleshootResult: (caseId, result) => {
        const state = get();
        const prev = state.troubleshoot[caseId] || {
          solved: false,
          bestStars: 0,
          attempts: 0,
          lastMeasurements: 0,
          lastWrong: 0,
        };
        set({
          troubleshoot: {
            ...state.troubleshoot,
            [caseId]: {
              solved: prev.solved || result.solved,
              bestStars: Math.max(prev.bestStars, result.stars) as 0 | 1 | 2 | 3,
              attempts: prev.attempts + 1,
              lastMeasurements: result.measurements,
              lastWrong: result.wrong,
            },
          },
        });
      },

      recordQuizResult: (score, byTopic) => {
        const state = get();
        const prevBest = state.quiz.best;
        const nextBest = prevBest === null ? score : Math.max(prevBest, score);
        const historyItem = {
          date: new Date().toISOString(),
          score,
          byTopic,
        };
        set({
          quiz: {
            best: nextBest,
            history: [historyItem, ...state.quiz.history.slice(0, 19)],
          },
        });
      },

      resetProgress: (newUserId: string | null = null) => {
        set({
          ...initialProgress,
          userId: newUserId,
        });
        const auth = useAuthStore.getState();
        if (!auth.isGuest && auth.tokens?.accessToken) {
          progressApi.resetProgress(auth.tokens.accessToken).catch(() => {});
        }
      },
    }),
    {
      name: 'sinyallab-progress-storage',
      storage: createJSONStorage(() => appStorage),
      version: CURRENT_SCHEMA_VERSION,
      migrate: migrateState,
    }
  )
);
