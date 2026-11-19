export interface UserProgressData {
  userId: string;
  completedSteps: string[];
  activeStepId: string;
  progressPercentage: number;
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
    }
  >;
  quiz: {
    best: number | null;
    history: { date: string; score: number }[];
  };
  updatedAt: string;
}

export interface UpdateStepInput {
  stepId: string;
  completed?: boolean;
  score?: number;
  materiSectionId?: string;
}

export interface SyncProgressInput {
  completedSteps?: string[];
  activeStepId?: string;
  progressPercentage?: number;
  materi?: Record<string, any>;
  simulasi?: Record<string, any>;
  troubleshoot?: Record<string, any>;
  quiz?: Record<string, any>;
}
