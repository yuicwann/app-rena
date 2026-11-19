import { z } from 'zod';

export const UpdateStepProgressSchema = z.object({
  stepId: z.string().min(1, 'stepId tidak boleh kosong.'),
  completed: z.boolean().default(true),
  score: z.number().min(0).max(100).optional(),
  materiSectionId: z.string().optional(),
});

export const SyncProgressSchema = z.object({
  completedSteps: z.array(z.string()).optional(),
  activeStepId: z.string().optional(),
  progressPercentage: z.number().min(0).max(100).optional(),
  materi: z.record(z.string(), z.any()).optional(),
  simulasi: z.record(z.string(), z.any()).optional(),
  troubleshoot: z.record(z.string(), z.any()).optional(),
  quiz: z.record(z.string(), z.any()).optional(),
});

export type UpdateStepProgressBody = z.infer<typeof UpdateStepProgressSchema>;
export type SyncProgressBody = z.infer<typeof SyncProgressSchema>;
