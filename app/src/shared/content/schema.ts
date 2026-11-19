import { z } from 'zod';

export const CardSchema = z.object({
  id: z.string(),
  title: z.string().max(60),
  body: z.string().max(300),
  visual: z.object({
    component: z.string(),
    props: z.record(z.string(), z.unknown()).optional(),
  }),
  interaction: z.enum(['tap-to-play', 'slider', 'toggle', 'none']).optional(),
});

export const QuickCheckSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).min(2),
  correctIndex: z.number().int().nonnegative(),
  explanation: z.string(),
});

export const SectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  objective: z.string(),
  cards: z.array(CardSchema).min(1),
  quickCheck: QuickCheckSchema,
});

export const MateriContentSchema = z.object({
  sections: z.array(SectionSchema),
});

export const ReadingItemSchema = z.object({
  status: z.enum([
    'NORMAL',
    'WEAK',
    'LOST',
    'NOISE_ONLY',
    'DISTORTED',
    'UNEVEN_AMPLITUDE',
    'INTERFERENCE',
    'BYPASS',
  ]),
  text: z.string(),
  voltage: z.string(),
  scope: z.string(),
});

export const TroubleshootCaseSchema = z.object({
  id: z.string(),
  difficulty: z.number().int().min(1).max(3),
  mode: z.enum(['AM', 'FM']),
  title: z.string(),
  symptom: z.string(),
  culprit: z.enum(['ANT', 'TUN', 'IF', 'LIM', 'DET', 'AMP']),
  readings: z.record(z.string(), ReadingItemSchema),
  hints: z.array(z.string()),
  explanation: z.object({
    why: z.string(),
    rule: z.string(),
    wrongBlocksNote: z.record(z.string(), z.string()).optional(),
  }),
});

export const TroubleshootContentSchema = z.object({
  cases: z.array(TroubleshootCaseSchema),
});

export const QuizQuestionSchema = z.object({
  id: z.string(),
  topic: z.enum(['Diagram Blok', 'IF', 'Limiter', 'Standar AM', 'Troubleshooting']),
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string(),
  difficulty: z.number().int().min(1).max(3),
  needs_review: z.boolean(),
});

export const QuizContentSchema = z.object({
  questions: z.array(QuizQuestionSchema),
});

export type Card = z.infer<typeof CardSchema>;
export type QuickCheck = z.infer<typeof QuickCheckSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type MateriContent = z.infer<typeof MateriContentSchema>;
export type TroubleshootCase = z.infer<typeof TroubleshootCaseSchema>;
export type TroubleshootContent = z.infer<typeof TroubleshootContentSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type QuizContent = z.infer<typeof QuizContentSchema>;
