export type ModulationMode = 'AM' | 'FM';

export type SignalInspectionStage = 'rf' | 'lo' | 'mixer_if' | 'audio';

export interface SignalStageDefinition {
  id: SignalInspectionStage;
  name: string;
  shortName: string;
  description: string;
}

export const SIGNAL_STAGES: SignalStageDefinition[] = [
  {
    id: 'rf',
    name: 'Sinyal RF (Radio Frequency)',
    shortName: 'RF Input',
    description: 'Gelombang pembawa frekuensi tinggi dari antena yang membawa modulasi informasi suara.',
  },
  {
    id: 'lo',
    name: 'Osilator Lokal (Local Oscillator)',
    shortName: 'Osilator (LO)',
    description: 'Pembangkit frekuensi acuan yang disinkronkan untuk dicampur dengan sinyal stasiun.',
  },
  {
    id: 'mixer_if',
    name: 'Intermediate Frequency (Mixer & IF)',
    shortName: 'Mixer & IF',
    description: 'Pencampuran RF dan LO menghasilkan frekuensi perantara tetap yang mudah difilter secara tajam.',
  },
  {
    id: 'audio',
    name: 'Audio Output (Demodulasi)',
    shortName: 'Audio Out',
    description: 'Sinyal suara asli hasil ekstraksi detektor yang siap dialirkan ke speaker.',
  },
];

export interface ModulationConfig {
  mode: ModulationMode;
  freqRangeText: string;
  standardIF: string;
  standardIFValueKHz: number;
  description: string;
  carrierLabel: string;
}

export const MODULATION_CONFIGS: Record<ModulationMode, ModulationConfig> = {
  AM: {
    mode: 'AM',
    freqRangeText: '530 – 1.600 kHz',
    standardIF: '455 kHz',
    standardIFValueKHz: 455,
    description:
      'Modulasi Amplitudo: Amplitudo gelombang pembawa berubah mengikuti sinyal audio, frekuensi tetap.',
    carrierLabel: 'Gelombang Pembawa Menengah (Medium Wave)',
  },
  FM: {
    mode: 'FM',
    freqRangeText: '88 – 108 MHz',
    standardIF: '10,7 MHz',
    standardIFValueKHz: 10700,
    description:
      'Modulasi Frekuensi: Frekuensi gelombang pembawa bergeser mengikuti sinyal audio, amplitudo tetap.',
    carrierLabel: 'Gelombang Pembawa Sangat Tinggi (VHF Band II)',
  },
};
