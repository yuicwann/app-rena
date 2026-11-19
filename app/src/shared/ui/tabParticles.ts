import { tokens } from '@/shared/theme/tokens';

export interface ParticleConfig {
  id: number;
  angle: number; // in radians
  distance: number; // in dp
  size: number; // in dp
  color: string;
}

export interface ParticleOffset {
  dx: number;
  dy: number;
}

export function calculateParticleOffset(angle: number, distance: number): ParticleOffset {
  return {
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance,
  };
}

// 6 delicate, small micro-particles radiating outwards (not thick, light & airy)
export const PARTICLE_CONFIGS: ParticleConfig[] = [
  { id: 0, angle: (30 * Math.PI) / 180, distance: 20, size: 3.5, color: tokens.colors.primary }, // #58CC02
  { id: 1, angle: (90 * Math.PI) / 180, distance: 18, size: 3, color: tokens.colors.primaryFixed }, // #87FE45
  { id: 2, angle: (150 * Math.PI) / 180, distance: 21, size: 3.5, color: tokens.colors.accent }, // #FFC800
  { id: 3, angle: (210 * Math.PI) / 180, distance: 19, size: 3, color: tokens.colors.primary }, // #58CC02
  { id: 4, angle: (270 * Math.PI) / 180, distance: 18, size: 3.5, color: tokens.colors.secondary }, // #1CB0F6
  { id: 5, angle: (330 * Math.PI) / 180, distance: 21, size: 3, color: tokens.colors.primaryFixed }, // #87FE45
];
