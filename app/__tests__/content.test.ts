import materiData from '../content/materi.json';
import troubleshootData from '../content/troubleshoot.json';
import quizData from '../content/quiz.json';
import {
  MateriContentSchema,
  TroubleshootContentSchema,
  QuizContentSchema,
} from '../src/shared/content/schema';

describe('Content Schema Validation (M0)', () => {
  it('validates materi.json against MateriContentSchema', () => {
    const parsed = MateriContentSchema.safeParse(materiData);
    if (!parsed.success) {
      console.error(parsed.error.format());
    }
    expect(parsed.success).toBe(true);
  });

  it('validates troubleshoot.json against TroubleshootContentSchema', () => {
    const parsed = TroubleshootContentSchema.safeParse(troubleshootData);
    if (!parsed.success) {
      console.error(parsed.error.format());
    }
    expect(parsed.success).toBe(true);

    if (parsed.success) {
      for (const c of parsed.data.cases) {
        expect(c.readings[c.culprit]).toBeDefined();
        expect(c.readings[c.culprit]?.status).not.toBe('NORMAL');
      }
    }
  });

  it('validates quiz.json against QuizContentSchema', () => {
    const parsed = QuizContentSchema.safeParse(quizData);
    if (!parsed.success) {
      console.error(parsed.error.format());
    }
    expect(parsed.success).toBe(true);

    if (parsed.success) {
      for (const q of parsed.data.questions) {
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);
        expect(q.options.length).toBe(4);
      }
    }
  });
});
