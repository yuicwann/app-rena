export interface DiagramNode {
  id: 'ant' | 'rf' | 'mix' | 'if' | 'lim' | 'det' | 'af';
  t: string;
  s: string;
  x: number;
  y: number;
  fill: string;
  tc: string;
  sc: string;
  stroke?: string | null;
}

export const DIAGRAM_NODES: DiagramNode[] = [
  { id: 'ant', t: 'ANTENA', s: '88–108 MHz', x: 8, y: 40, fill: '#e9e8e7', tc: '#4b4b4b', sc: '#777777' },
  { id: 'rf', t: 'RF AMP', s: 'Penguat RF', x: 98, y: 40, fill: '#58cc02', tc: '#ffffff', sc: '#d7ffb8' },
  { id: 'mix', t: 'MIXER', s: 'Pencampur', x: 188, y: 40, fill: '#2fb8ff', tc: '#003a55', sc: '#003a55' },
  { id: 'if', t: 'IF AMP', s: '10.7 MHz', x: 278, y: 40, fill: '#2fb8ff', tc: '#ffffff', sc: '#c8e6ff' },
  { id: 'lim', t: 'LIMITER', s: 'Pemotong Derau', x: 278, y: 120, fill: '#ffc800', tc: '#241a00', sc: '#594400' },
  { id: 'det', t: 'DISKRIM.', s: 'Demodulator FM', x: 188, y: 120, fill: '#a5ed6e', tc: '#1f5100', sc: '#1f5100' },
  { id: 'af', t: 'AF + SPK', s: 'Penguat Audio', x: 98, y: 120, fill: '#4b4b4b', tc: '#ffffff', sc: '#becbb1' },
];

export function getDiagramNode(index: number): DiagramNode {
  return DIAGRAM_NODES[index] || DIAGRAM_NODES[0]!;
}

export const NODE_WIDTH = 74;
export const NODE_HEIGHT = 40;

export const NODE_CAPTIONS: Record<string, { title: string; desc: string }> = {
  ant: {
    title: 'Antena FM',
    desc: 'Antena menerima spektrum frekuensi FM komersial (88–108 MHz). Gelombang masih sangat lemah dan bercampur dengan gangguan lonjakan derau luar.',
  },
  rf: {
    title: 'Penguat RF (Pita FM)',
    desc: 'Memilih frekuensi stasiun yang dituju serta menguatkan sinyal mikrovolt dengan noise figure serendah mungkin.',
  },
  mix: {
    title: 'Mixer + Osilator Lokal (LO)',
    desc: 'Mencampur sinyal RF pemancar dengan osilator lokal (f_LO = f_RF + 10.7 MHz), menghasilkan frekuensi antara (IF) tetap 10.7 MHz.',
  },
  if: {
    title: 'Penguat IF (10.7 MHz)',
    desc: 'Filter kristal/keramik meloloskan hanya pita 10.7 MHz dengan bandwidth lebar ±100 kHz untuk menjaga fidelitas suara stereo tetap bening.',
  },
  lim: {
    title: 'Limiter (Pemotong Derau)',
    desc: 'Limiter meratakan puncak gelombang sehingga derau petir/mesin hilang. Karena informasi sinyal FM tersimpan pada kerapatan frekuensi, audio tetap 100% aman!',
  },
  det: {
    title: 'Diskriminator / Detektor FM',
    desc: 'Mengubah simpangan frekuensi (frequency deviation) sinyal IF menjadi kembali gelombang tegangan sinyal audio suara musik.',
  },
  af: {
    title: 'Penguat Audio + Speaker',
    desc: 'Sinyal suara dikuatkan oleh penguat daya audio (AF) sampai cukup menggetarkan membran speaker hingga terdengar jelas!',
  },
};

export const STAGE_COLORS: Record<string, string> = {
  ant: '#2fb8ff',
  rf: '#58cc02',
  mix: '#2fb8ff',
  if: '#2fb8ff',
  lim: '#ffc800',
  det: '#a5ed6e',
  af: '#ffffff',
};

export const FM_ADVANTAGES = [
  {
    title: 'Frekuensi Antara (IF) 10.7 MHz',
    detail: 'Bandwidth selektif lebar (±100 kHz) untuk siaran stereo fidelitas tinggi.',
  },
  {
    title: 'Limiter Aktif',
    detail: 'Memotong lonjakan amplitudo akibat petir, mesin motor, atau gangguan induksi listrik.',
  },
  {
    title: 'Diskriminator',
    detail: 'Mendeteksi perubahan kerapatan gelombang menjadi audio murni tanpa dengung (noise-free).',
  },
];

export const QUICK_CHECK_DATA = {
  question: 'Pada urutan penerima FM, Limiter berada di antara...',
  options: [
    'Penguat IF dan Detektor FM',
    'Antena dan Tuner',
    'Detektor dan Speaker',
    'Mixer dan Osilator Lokal',
  ],
  correctIndex: 0,
  explanation: 'Limiter ditempatkan persis setelah penguat IF untuk membatasi amplitudo sebelum masuk ke detektor FM.',
};
