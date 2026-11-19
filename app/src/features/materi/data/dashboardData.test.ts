import { modulesData, defaultStudent } from './dashboardData';

describe('Dashboard curriculum data integrity', () => {
  it('validates default student structure', () => {
    expect(defaultStudent.name).toBe('Aris Pratama');
    expect(defaultStudent.progressPercentage).toBeGreaterThanOrEqual(0);
    expect(defaultStudent.progressPercentage).toBeLessThanOrEqual(100);
    expect(defaultStudent.program).toContain('TAV');
    expect(defaultStudent.initials).toBe('AP');
  });

  it('contains valid learning modules', () => {
    expect(modulesData.length).toBeGreaterThanOrEqual(2);

    for (const mod of modulesData) {
      expect(mod.id).toBeTruthy();
      expect(mod.moduleNumber).toBeGreaterThan(0);
      expect(mod.title.length).toBeGreaterThan(0);
      expect(mod.description.length).toBeGreaterThan(0);
      expect(mod.steps.length).toBeGreaterThan(0);

      // Verify steps sequential numbering
      mod.steps.forEach((step, idx) => {
        expect(step.stepNumber).toBe(idx + 1);
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.description.length).toBeGreaterThan(0);
        expect(['completed', 'active', 'locked']).toContain(step.status);

        if (step.status === 'locked') {
          expect(step.conditionText).toBeDefined();
        }
      });
    }
  });
});
