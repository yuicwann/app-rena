import { apiClient } from './client';
import { DEFAULT_API_BASE_URL } from './config';

export interface ServerProgressData {
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

export interface UserProgressResponse {
  status: 'success';
  data: ServerProgressData;
}

export interface UpdateStepPayload {
  stepId: string;
  completed?: boolean;
  score?: number;
  materiSectionId?: string;
}

export const progressApi = {
  /**
   * Mengambil data progres riil siswa yang sedang login dari server
   */
  async getProgress(
    token: string,
    baseUrl = DEFAULT_API_BASE_URL
  ): Promise<ServerProgressData> {
    const res = await apiClient<UserProgressResponse>('/v1/progress', {
      method: 'GET',
      token,
      baseUrl,
    });
    return res.data;
  },

  /**
   * Memperbarui status selesai pada tahapan pembelajaran siswa di server
   */
  async updateStep(
    token: string,
    payload: UpdateStepPayload,
    baseUrl = DEFAULT_API_BASE_URL
  ): Promise<ServerProgressData> {
    const res = await apiClient<UserProgressResponse>('/v1/progress/step', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
      baseUrl,
    });
    return res.data;
  },

  /**
   * Sinkronisasi progres lokal siswa ke backend
   */
  async syncProgress(
    token: string,
    payload: Partial<ServerProgressData>,
    baseUrl = DEFAULT_API_BASE_URL
  ): Promise<ServerProgressData> {
    const res = await apiClient<UserProgressResponse>('/v1/progress/sync', {
      method: 'PUT',
      token,
      body: JSON.stringify(payload),
      baseUrl,
    });
    return res.data;
  },

  /**
   * Reset progres pembelajaran siswa di server
   */
  async resetProgress(
    token: string,
    baseUrl = DEFAULT_API_BASE_URL
  ): Promise<ServerProgressData> {
    const res = await apiClient<UserProgressResponse>('/v1/progress/reset', {
      method: 'POST',
      token,
      baseUrl,
    });
    return res.data;
  },
};
