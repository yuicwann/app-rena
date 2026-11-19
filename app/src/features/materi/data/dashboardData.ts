import { LearningModule, StudentProfile } from '../types/dashboard';

export const defaultStudent: StudentProfile = {
  name: 'Aris Pratama',
  progressPercentage: 0,
  program: 'SMK Jurusan Audio Video (TAV)',
  semester: 'Sem. Ganjil',
  initials: 'AP',
};

export const modulesData: LearningModule[] = [
  {
    id: 'modul-1',
    moduleNumber: 1,
    title: 'Dasar Sistem Penerima Radio & Resonansi LC',
    description:
      'Pelajari konsep perambatan gelombang radio, selektivitas frekuensi penalaan LC, dan rangkaian penerima superheterodyne dasar.',
    status: 'in_progress',
    progressPercentage: 0,
    steps: [
      {
        id: 'm1-s1',
        stepNumber: 1,
        type: 'material',
        status: 'active',
        title: 'Perjalanan Sinyal Radio & Blok Diagram',
        description: 'Alur penerima superheterodyne FM/AM, fungsi limiter pemotong derau, dan detektor.',
        buttonLabel: 'Buka Materi Ajar',
      },
      {
        id: 'm1-s2',
        stepNumber: 2,
        type: 'quiz',
        status: 'locked',
        title: 'Latihan Soal Resonansi LC',
        description: 'Latihan perhitungan frekuensi resonansi LC dan respon filter frekuensi.',
        conditionText: 'Syarat: Selesaikan Tahap 1 terlebih dahulu',
        buttonLabel: 'Mulai Latihan Soal',
      },
      {
        id: 'm1-s3',
        stepNumber: 3,
        type: 'troubleshoot',
        status: 'locked',
        title: 'Studi Kasus Troubleshooting Gangguan Noise Siaran',
        description:
          'Analisis interferensi frekuensi berdekatan dan rasio sinyal terhadap derau (SNR).',
        conditionText: 'Syarat: Selesaikan kuis Tahap 2 dengan nilai ≥ 70%',
        buttonLabel: 'Mulai Kasus Troubleshooting',
      },
      {
        id: 'm1-s4',
        stepNumber: 4,
        type: 'practical',
        status: 'locked',
        title: 'Simulasi Virtual Osiloskop & Rangkaian LC',
        description:
          'Eksperimen virtual osiloskop, mengamati kurva respon frekuensi dan resonansi.',
        conditionText: 'Terbuka setelah Tahap 3 diselesaikan',
        buttonLabel: 'Mulai Simulasi Osiloskop',
      },
    ],
  },
  {
    id: 'modul-2',
    moduleNumber: 2,
    title: 'Penguat RF, IF & Demodulator FM/AM',
    description:
      'Pelajari penguatan sinyal frekuensi radio, pencampuran mixer frekuensi menengah (IF), dan deteksi modulasi suara.',
    status: 'ready',
    progressPercentage: 0,
    steps: [
      {
        id: 'm2-s1',
        stepNumber: 1,
        type: 'material',
        status: 'active',
        title: 'Teori Penguat Frekuensi Tinggi & Mixer',
        description: 'Prinsip penguatan sinyal RF, pencampuran frekuensi, dan osilator lokal.',
        buttonLabel: 'Mulai Baca Modul',
      },
      {
        id: 'm2-s2',
        stepNumber: 2,
        type: 'quiz',
        status: 'locked',
        title: 'Latihan Soal Filter IF & Selektivitas',
        description: 'Kalkulasi bandwidth IF, faktor kualitas (Q), dan selektivitas penala.',
        conditionText: 'Terbuka setelah Tahap 1 diselesaikan',
        buttonLabel: 'Mulai Latihan Soal',
      },
      {
        id: 'm2-s3',
        stepNumber: 3,
        type: 'troubleshoot',
        status: 'locked',
        title: 'Studi Kasus Penurunan Distorsi Sinyal',
        description: 'Analisis distorsi harmonik dan perbaikan respon demodulator FM.',
        conditionText: 'Terbuka setelah Tahap 2 diselesaikan',
        buttonLabel: 'Mulai Kasus Troubleshooting',
      },
      {
        id: 'm2-s4',
        stepNumber: 4,
        type: 'practical',
        status: 'locked',
        title: 'Praktik Virtual Demodulasi Audio',
        description:
          'Simulasi sinyal demodulator FM dan visualisasi keluaran suara audio.',
        conditionText: 'Terbuka setelah Tahap 3 diselesaikan',
        buttonLabel: 'Mulai Praktik Audio',
      },
    ],
  },
];
