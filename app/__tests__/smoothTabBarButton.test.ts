import {
  PARTICLE_CONFIGS,
  calculateParticleOffset,
} from '../src/shared/ui/tabParticles';
import { tokens } from '../src/shared/theme/tokens';

describe('SmoothTabBarButton Particle Mechanics & Aesthetics', () => {
  it('defines 6 delicate micro-particles for a lightweight burst', () => {
    expect(PARTICLE_CONFIGS.length).toBe(6);
  });

  it('guarantees particle size is delicate and never thick (<= 3.5dp)', () => {
    PARTICLE_CONFIGS.forEach((p) => {
      expect(p.size).toBeGreaterThanOrEqual(3);
      expect(p.size).toBeLessThanOrEqual(3.5);
    });
  });

  it('restricts travel distance to compact tab boundary (18dp to 22dp)', () => {
    PARTICLE_CONFIGS.forEach((p) => {
      expect(p.distance).toBeGreaterThanOrEqual(18);
      expect(p.distance).toBeLessThanOrEqual(22);
    });
  });

  it('uses brand design tokens for playful Duolingo classroom palette', () => {
    const validColors = [
      tokens.colors.primary,
      tokens.colors.primaryFixed,
      tokens.colors.accent,
      tokens.colors.secondary,
    ];

    PARTICLE_CONFIGS.forEach((p) => {
      expect(validColors).toContain(p.color as any);
    });
  });

  it('distributes particles evenly across 360-degree radial circle', () => {
    const angles = PARTICLE_CONFIGS.map((p) => Math.round((p.angle * 180) / Math.PI));
    expect(angles).toEqual([30, 90, 150, 210, 270, 330]);
  });

  it('calculates radial coordinate offsets accurately', () => {
    const angle90 = Math.PI / 2;
    const offset90 = calculateParticleOffset(angle90, 20);
    expect(Math.abs(offset90.dx)).toBeLessThan(0.0001);
    expect(offset90.dy).toBeCloseTo(20, 3);

    const angle180 = Math.PI;
    const offset180 = calculateParticleOffset(angle180, 20);
    expect(offset180.dx).toBeCloseTo(-20, 3);
    expect(Math.abs(offset180.dy)).toBeLessThan(0.0001);
  });
});
