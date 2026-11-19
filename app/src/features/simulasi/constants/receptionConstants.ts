export interface RadioStation {
  id: string;
  name: string;
  freqKHz: number;
  genre: string;
  color: string;
  bgLight: string;
  wavelengthMeters: number;
  audioContent: string;
}

export const AM_STATIONS: RadioStation[] = [
  {
    id: 'st-630',
    name: 'Radio 1',
    freqKHz: 630,
    genre: 'Berita & Sains',
    color: '#0284C7',
    bgLight: '#F0F9FF',
    wavelengthMeters: 476,
    audioContent: 'Warta Sains & Fisika',
  },
  {
    id: 'st-999',
    name: 'Radio 2',
    freqKHz: 999,
    genre: 'Musik Nusantara',
    color: '#16A34A',
    bgLight: '#F0FDF4',
    wavelengthMeters: 300,
    audioContent: 'Melodi Musik Akustik',
  },
  {
    id: 'st-1440',
    name: 'Radio 3',
    freqKHz: 1440,
    genre: 'Dialog Pemuda',
    color: '#EA580C',
    bgLight: '#FFF7ED',
    wavelengthMeters: 208,
    audioContent: 'Dialog & Berita Terkini',
  },
];

export const FREQ_MIN_KHZ = 535;
export const FREQ_MAX_KHZ = 1605;
export const DEFAULT_FREQ_KHZ = 630;
export const TUNER_INDUCTANCE_UH = 100; // 100 microHenry

/**
 * Hitung nilai kapasitor variabel (pF) yang dibutuhkan untuk frekuensi f (kHz)
 * Menggunakan rumus Thomson: f = 1 / (2 * pi * sqrt(L * C))
 * L = 100 uH
 * C (pF) = 1 / (4 * pi^2 * f^2 * L) * 10^12 = 253302959 / (f_kHz)^2
 */
export function calculateCapacitancePf(freqKHz: number, inductanceUh = TUNER_INDUCTANCE_UH): number {
  if (freqKHz <= 0 || inductanceUh <= 0) return 0;
  const fHz = freqKHz * 1000;
  const lH = inductanceUh * 1e-6;
  const cFarad = 1 / (4 * Math.PI * Math.PI * fHz * fHz * lH);
  return Math.round(cFarad * 1e12 * 10) / 10;
}

export type AtmosphereMode = 'day' | 'night';

export interface AtmosphereInfo {
  mode: AtmosphereMode;
  title: string;
  subtitle: string;
  description: string;
  layerHighlight: string;
  rangeKm: string;
}

export const ATMOSPHERE_MODES: Record<AtmosphereMode, AtmosphereInfo> = {
  day: {
    mode: 'day',
    title: 'Siang Hari (Gelombang Tanah)',
    subtitle: 'Lapisan D Menyerap Sinyal AM',
    description:
      'Radiasi ultraviolet matahari membentuk Lapisan D ionosfer yang sangat padat. Lapisan ini menyerap gelombang radio AM. Akibatnya, penerima hanya dapat menangkap gelombang tanah (ground wave) dengan jangkauan terbatas.',
    layerHighlight: 'Lapisan D (60–90 km) Aktif & Menyerap Energi',
    rangeKm: '50 – 150 km',
  },
  night: {
    mode: 'night',
    title: 'Malam Hari (Gelombang Langit / Sky Wave)',
    subtitle: 'Pantulan Ionosfer Lapisan F',
    description:
      'Saat matahari terbenam, Lapisan D lenyap karena rekombinasi elektron. Gelombang radio AM menembus lebih tinggi ke Lapisan F dan dipantulkan kembali ke bumi, melompat ribuan kilometer melintasi pulau!',
    layerHighlight: 'Lapisan F (150–400 km) Memantulkan Gelombang AM',
    rangeKm: '800 – 2.000+ km',
  },
};

export type StageId = 'antena' | 'tuner' | 'amplifier' | 'demodulator' | 'speaker';

export interface StageDefinition {
  id: StageId;
  stepNumber: number;
  title: string;
  shortLabel: string;
  subtitle: string;
  description: string;
  physicsKey: string;
  iconName: string;
}

export const RECEPTION_STAGES: StageDefinition[] = [
  {
    id: 'antena',
    stepNumber: 1,
    title: 'Batang Antena',
    shortLabel: '1. Antena',
    subtitle: 'Penangkap Semua Gelombang Bebas',
    description:
      'Menangkap seluruh gelombang elektromagnetik radio di udara dan mengubahnya menjadi arus bolak-balik mikro.',
    physicsKey: 'Medan listrik gelombang radio mendorong elektron bebas (e⁻) bergerak bolak-balik di dalam logam antena.',
    iconName: 'radio',
  },
  {
    id: 'tuner',
    stepNumber: 2,
    title: 'Tuner Resonansi LC',
    shortLabel: '2. Tuner LC',
    subtitle: 'Penyaring Frekuensi Resonansi',
    description:
      'Menyaring satu frekuensi stasiun radio yang dipilih dan meredam seluruh stasiun lainnya menggunakan rangkaian resonansi LC.',
    physicsKey: 'Kombinasi induktor dan kapasitor menghasilkan impedansi minimum hanya pada frekuensi stasiun yang dituju.',
    iconName: 'tune',
  },
  {
    id: 'amplifier',
    stepNumber: 3,
    title: 'Amplifier (Penguat RF)',
    shortLabel: '3. Amplifier',
    subtitle: 'Peningkat Amplitudo Lemah',
    description:
      'Memperkuat amplitudo sinyal radio mikrovolt yang lolos dari tuner agar cukup kuat untuk dideteksi.',
    physicsKey: 'Transistor penguat menaikkan level tegangan sinyal agar melampaui ambang batas konduksi dioda detektor.',
    iconName: 'trending-up',
  },
  {
    id: 'demodulator',
    stepNumber: 4,
    title: 'Detektor (Demodulator Dioda)',
    shortLabel: '4. Detektor',
    subtitle: 'Pemisah Suara & Carrier RF',
    description:
      'Memisahkan sinyal suara asli dari gelombang pembawa frekuensi tinggi menggunakan dioda penyearah dan filter RC.',
    physicsKey: 'Frekuensi pembawa disaring ke ground, menyisakan amplop gelombang suara audio asli.',
    iconName: 'filter-alt',
  },
  {
    id: 'speaker',
    stepNumber: 5,
    title: 'Speaker Konus',
    shortLabel: '5. Speaker',
    subtitle: 'Pengubah Sinyal Menjadi Suara',
    description:
      'Mengubah arus listrik audio menjadi getaran membran yang menghasilkan gelombang suara akustik di udara.',
    physicsKey: 'Gaya magnetik menggerakkan konus maju-mundur, menggetarkan partikel udara menjadi bunyi yang kita dengar.',
    iconName: 'volume-up',
  },
];

/**
 * Menghitung tingkat resonansi (0 s/d 1) terhadap stasiun terdekat
 */
export function getResonanceMatch(currentFreqKHz: number): {
  matchedStation: RadioStation | null;
  resonanceStrength: number; // 0 (noise murni) s/d 1 (lock penuh)
  isLocked: boolean;
  deltaFreqKHz: number;
} {
  let closestStation: RadioStation | null = null;
  let minDelta = Infinity;

  for (const st of AM_STATIONS) {
    const delta = Math.abs(currentFreqKHz - st.freqKHz);
    if (delta < minDelta) {
      minDelta = delta;
      closestStation = st;
    }
  }

  // Bandwidth resonansi: <= 12 kHz dianggap locked, 12 - 35 kHz melemah, > 35 kHz tidak ada sinyal
  const MAX_RESONANCE_BANDWIDTH = 32;
  const LOCKED_BANDWIDTH = 12;

  if (minDelta > MAX_RESONANCE_BANDWIDTH) {
    return {
      matchedStation: null,
      resonanceStrength: 0,
      isLocked: false,
      deltaFreqKHz: minDelta,
    };
  }

  const strength = Math.max(0, 1 - minDelta / MAX_RESONANCE_BANDWIDTH);
  const isLocked = minDelta <= LOCKED_BANDWIDTH;

  return {
    matchedStation: closestStation,
    resonanceStrength: Math.round(strength * 100) / 100,
    isLocked,
    deltaFreqKHz: minDelta,
  };
}
