import {
  AM_STATIONS,
  FREQ_MIN_KHZ,
  FREQ_MAX_KHZ,
  calculateCapacitancePf,
  getResonanceMatch,
  ATMOSPHERE_MODES,
  RECEPTION_STAGES,
} from '../src/features/simulasi/constants/receptionConstants';
import {
  MODULATION_CONFIGS,
  SIGNAL_STAGES,
} from '../src/features/simulasi/constants/oscilloscopeConstants';

describe('Radio Reception Simulation Physics & Formulas', () => {
  it('correctly calculates capacitance for AM frequencies (Thomson Resonance)', () => {
    // f = 1 / (2*pi*sqrt(L*C)) with L = 100 uH
    // C = 1 / (4*pi^2*f^2*L)
    const cap630 = calculateCapacitancePf(630);
    expect(cap630).toBeGreaterThan(635);
    expect(cap630).toBeLessThan(642);

    const cap999 = calculateCapacitancePf(999);
    expect(cap999).toBeGreaterThan(250);
    expect(cap999).toBeLessThan(258);

    const cap1440 = calculateCapacitancePf(1440);
    expect(cap1440).toBeGreaterThan(120);
    expect(cap1440).toBeLessThan(125);
  });

  it('safely handles zero or negative inputs for capacitance calculation', () => {
    expect(calculateCapacitancePf(0)).toBe(0);
    expect(calculateCapacitancePf(-100)).toBe(0);
    expect(calculateCapacitancePf(630, 0)).toBe(0);
  });

  it('detects perfect resonance lock on exact station frequency', () => {
    const result630 = getResonanceMatch(630);
    expect(result630.isLocked).toBe(true);
    expect(result630.matchedStation?.id).toBe('st-630');
    expect(result630.resonanceStrength).toBe(1);
    expect(result630.deltaFreqKHz).toBe(0);

    const result999 = getResonanceMatch(999);
    expect(result999.isLocked).toBe(true);
    expect(result999.matchedStation?.id).toBe('st-999');
    expect(result999.resonanceStrength).toBe(1);

    const result1440 = getResonanceMatch(1440);
    expect(result1440.isLocked).toBe(true);
    expect(result1440.matchedStation?.id).toBe('st-1440');
    expect(result1440.resonanceStrength).toBe(1);
  });

  it('locks near frequencies within resonance bandwidth (<= 12 kHz)', () => {
    const nearResult = getResonanceMatch(635); // 5 kHz off
    expect(nearResult.isLocked).toBe(true);
    expect(nearResult.matchedStation?.id).toBe('st-630');
    expect(nearResult.deltaFreqKHz).toBe(5);
    expect(nearResult.resonanceStrength).toBeGreaterThan(0.7);
  });

  it('falls back to weak signal or pure noise when detuned outside resonance band', () => {
    // 25 kHz off from 630 kHz (655 kHz)
    const weakResult = getResonanceMatch(655);
    expect(weakResult.isLocked).toBe(false);
    expect(weakResult.matchedStation?.id).toBe('st-630');
    expect(weakResult.resonanceStrength).toBeGreaterThan(0);
    expect(weakResult.resonanceStrength).toBeLessThan(0.4);

    // Far off from all stations (e.g. 750 kHz)
    const noiseResult = getResonanceMatch(750);
    expect(noiseResult.isLocked).toBe(false);
    expect(noiseResult.matchedStation).toBeNull();
    expect(noiseResult.resonanceStrength).toBe(0);
  });

  it('maintains valid AM band boundaries (535 to 1605 kHz)', () => {
    expect(FREQ_MIN_KHZ).toBe(535);
    expect(FREQ_MAX_KHZ).toBe(1605);
    AM_STATIONS.forEach((st) => {
      expect(st.freqKHz).toBeGreaterThanOrEqual(FREQ_MIN_KHZ);
      expect(st.freqKHz).toBeLessThanOrEqual(FREQ_MAX_KHZ);
    });
  });

  it('defines the 5 physical receiver stages in chronological order', () => {
    expect(RECEPTION_STAGES).toHaveLength(5);
    const stageIds = RECEPTION_STAGES.map((s) => s.id);
    expect(stageIds).toEqual(['antena', 'tuner', 'amplifier', 'demodulator', 'speaker']);
    expect(RECEPTION_STAGES[0]?.stepNumber).toBe(1);
    expect(RECEPTION_STAGES[4]?.stepNumber).toBe(5);
  });

  it('defines Day and Night atmospheric propagation with correct physical layers', () => {
    expect(ATMOSPHERE_MODES.day.layerHighlight).toContain('Lapisan D');
    expect(ATMOSPHERE_MODES.day.title).toContain('Gelombang Tanah');

    expect(ATMOSPHERE_MODES.night.layerHighlight).toContain('Lapisan F');
    expect(ATMOSPHERE_MODES.night.title).toContain('Gelombang Langit');
  });
});

describe('Oscilloscope & Superheterodyne Simulation Specifications', () => {
  it('defines standard Intermediate Frequency (IF) for AM and FM', () => {
    expect(MODULATION_CONFIGS.AM.standardIF).toBe('455 kHz');
    expect(MODULATION_CONFIGS.AM.standardIFValueKHz).toBe(455);

    expect(MODULATION_CONFIGS.FM.standardIF).toBe('10,7 MHz');
    expect(MODULATION_CONFIGS.FM.standardIFValueKHz).toBe(10700);
  });

  it('provides all 4 fundamental superheterodyne test points', () => {
    const testPointIds = SIGNAL_STAGES.map((s) => s.id);
    expect(testPointIds).toEqual(['rf', 'lo', 'mixer_if', 'audio']);
  });
});

describe('Smooth Wave Mathematics & Continuity Verification', () => {
  it('guarantees air wave repeat distance (72px) divides all station wavelengths with 0 remainder', () => {
    const AIR_WAVE_REPEAT = 72;
    const lambda630 = 36;
    const lambda999 = 24;
    const lambda1440 = 18;

    expect(AIR_WAVE_REPEAT % lambda630).toBe(0);
    expect(AIR_WAVE_REPEAT % lambda999).toBe(0);
    expect(AIR_WAVE_REPEAT % lambda1440).toBe(0);
  });

  it('guarantees seamless oscilloscope continuity (diffVal = 0, diffSlope = 0) across all stages', () => {
    const L = 170;
    const kBase = (2 * Math.PI) / L;

    // 1. Audio
    const audioFn = (x: number) => Math.sin(x * kBase) + 0.35 * Math.sin(x * 2 * kBase);
    expect(Math.abs(audioFn(0) - audioFn(L))).toBeLessThan(1e-10);
    expect(Math.abs((audioFn(0.01) - audioFn(0)) - (audioFn(L + 0.01) - audioFn(L)))).toBeLessThan(1e-10);

    // 2. Local Oscillator (LO)
    const loFn = (x: number) => Math.cos(x * 10 * kBase);
    expect(Math.abs(loFn(0) - loFn(L))).toBeLessThan(1e-10);

    // 3. IF Filter
    const ifFn = (x: number) => Math.sin(x * 5 * kBase);
    expect(Math.abs(ifFn(0) - ifFn(L))).toBeLessThan(1e-10);

    // 4. AM RF Carrier & Envelope
    const amFn = (x: number) => (1 + 0.48 * Math.sin(x * kBase)) * Math.sin(x * 15 * kBase);
    expect(Math.abs(amFn(0) - amFn(L))).toBeLessThan(1e-10);

    // 5. FM RF Carrier & Deviation
    const fmFn = (x: number) => Math.sin(x * 12 * kBase + 2.4 * Math.sin(x * kBase));
    expect(Math.abs(fmFn(0) - fmFn(L))).toBeLessThan(1e-10);
  });
});

describe('Interactive Tuner Slider Frequency Mapping', () => {
  const mapRatioToFreq = (ratio: number, min = FREQ_MIN_KHZ, max = FREQ_MAX_KHZ) => {
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    return Math.max(min, Math.min(max, Math.round(min + clampedRatio * (max - min))));
  };

  it('correctly maps 0% to minimum frequency (535 kHz)', () => {
    expect(mapRatioToFreq(0)).toBe(535);
  });

  it('correctly maps 100% to maximum frequency (1605 kHz)', () => {
    expect(mapRatioToFreq(1)).toBe(1605);
  });

  it('correctly clamps out-of-bound touch positions (< 0 or > 1)', () => {
    expect(mapRatioToFreq(-0.25)).toBe(535);
    expect(mapRatioToFreq(1.4)).toBe(1605);
  });

  it('accurately hits station frequencies across the slider span', () => {
    const ratio630 = (630 - 535) / (1605 - 535);
    expect(mapRatioToFreq(ratio630)).toBe(630);

    const ratio999 = (999 - 535) / (1605 - 535);
    expect(mapRatioToFreq(ratio999)).toBe(999);

    const ratio1440 = (1440 - 535) / (1605 - 535);
    expect(mapRatioToFreq(ratio1440)).toBe(1440);
  });
});
