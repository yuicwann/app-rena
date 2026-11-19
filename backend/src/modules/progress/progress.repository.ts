import * as fs from 'node:fs';
import * as path from 'node:path';
import { PrismaClient } from '../../db/client';
import { UserProgressData, UpdateStepInput, SyncProgressInput } from './progress.types';

const TOTAL_STEPS = 8;

export class ProgressRepository {
  // Penyimpanan in-memory per userId dengan sinkronisasi persisten ke disk
  private memoryStore = new Map<string, UserProgressData>();
  private filePath: string;

  constructor(private prisma: PrismaClient) {
    const dataDir = path.resolve(process.cwd(), 'data');
    this.filePath = path.resolve(dataDir, 'progress-store.json');
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          for (const [key, value] of Object.entries(parsed)) {
            this.memoryStore.set(key, value as UserProgressData);
          }
        }
      }
    } catch {
      // Abaikan jika belum ada file atau saat unit testing
    }
  }

  private saveToDisk() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = Object.fromEntries(this.memoryStore.entries());
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch {
      // Best-effort persistance
    }
  }

  private createDefaultProgress(userId: string): UserProgressData {
    return {
      userId,
      completedSteps: [],
      activeStepId: 'm1-s1',
      progressPercentage: 0,
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
      updatedAt: new Date().toISOString(),
    };
  }

  async findByUserId(userId: string): Promise<UserProgressData> {
    const existing = this.memoryStore.get(userId);
    if (existing) {
      return existing;
    }

    const defaultProg = this.createDefaultProgress(userId);
    this.memoryStore.set(userId, defaultProg);
    this.saveToDisk();
    return defaultProg;
  }

  async updateStep(userId: string, input: UpdateStepInput): Promise<UserProgressData> {
    const current = await this.findByUserId(userId);

    const isCompleted = input.completed ?? true;
    let completedSteps = [...current.completedSteps];

    if (isCompleted && !completedSteps.includes(input.stepId)) {
      completedSteps.push(input.stepId);
    } else if (!isCompleted && completedSteps.includes(input.stepId)) {
      completedSteps = completedSteps.filter((id) => id !== input.stepId);
    }

    // Hitung persentase progres secara dinamis
    const progressPercentage = Math.min(
      100,
      Math.round((completedSteps.length / TOTAL_STEPS) * 100)
    );

    // Tentukan activeStepId berikutnya
    const stepOrder = ['m1-s1', 'm1-s2', 'm1-s3', 'm1-s4', 'm2-s1', 'm2-s2', 'm2-s3', 'm2-s4'];
    let nextActiveStep = current.activeStepId;
    const currentIdx = stepOrder.indexOf(input.stepId);
    if (isCompleted && currentIdx >= 0 && currentIdx < stepOrder.length - 1) {
      const candidateNext = stepOrder[currentIdx + 1];
      if (candidateNext) {
        nextActiveStep = candidateNext;
      }
    }

    const updatedMateri = { ...current.materi };
    if (input.materiSectionId) {
      const section = updatedMateri[input.materiSectionId] || {
        cardsSeen: [],
        completed: false,
        quickCheckPassedFirstTry: false,
      };
      updatedMateri[input.materiSectionId] = {
        ...section,
        completed: isCompleted,
      };
    }

    const updatedProgress: UserProgressData = {
      ...current,
      completedSteps,
      activeStepId: nextActiveStep,
      progressPercentage,
      materi: updatedMateri,
      updatedAt: new Date().toISOString(),
    };

    this.memoryStore.set(userId, updatedProgress);
    this.saveToDisk();
    return updatedProgress;
  }

  async sync(userId: string, input: SyncProgressInput): Promise<UserProgressData> {
    const current = await this.findByUserId(userId);

    const mergedCompleted = Array.from(
      new Set([...current.completedSteps, ...(input.completedSteps || [])])
    );

    const percentage = input.progressPercentage !== undefined
      ? input.progressPercentage
      : Math.min(100, Math.round((mergedCompleted.length / TOTAL_STEPS) * 100));

    const synced: UserProgressData = {
      ...current,
      completedSteps: mergedCompleted,
      activeStepId: input.activeStepId || current.activeStepId,
      progressPercentage: percentage,
      materi: {
        ...current.materi,
        ...(input.materi || {}),
      },
      simulasi: {
        runs: [...current.simulasi.runs, ...(input.simulasi?.runs || [])],
        inspectedBlocks: Array.from(
          new Set([...current.simulasi.inspectedBlocks, ...(input.simulasi?.inspectedBlocks || [])])
        ),
      },
      troubleshoot: {
        ...current.troubleshoot,
        ...(input.troubleshoot || {}),
      },
      quiz: {
        best: input.quiz?.best !== undefined ? input.quiz.best : current.quiz.best,
        history: [...current.quiz.history, ...(input.quiz?.history || [])],
      },
      updatedAt: new Date().toISOString(),
    };

    this.memoryStore.set(userId, synced);
    this.saveToDisk();
    return synced;
  }

  async reset(userId: string): Promise<UserProgressData> {
    const defaultProg = this.createDefaultProgress(userId);
    this.memoryStore.set(userId, defaultProg);
    this.saveToDisk();
    return defaultProg;
  }
}
