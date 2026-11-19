import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, {
  Rect,
  Path,
  Line,
  G,
  Text as SvgText,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';
import {
  StageId,
  AtmosphereMode,
  RadioStation,
} from '../../constants/receptionConstants';

interface RadioReceptionCanvasProps {
  currentFreqKHz: number;
  activeStage: StageId;
  onSelectStage: (stage: StageId) => void;
  atmosphereMode: AtmosphereMode;
  isFocused: boolean;
  resonanceStrength: number;
  isLocked: boolean;
  matchedStation: RadioStation | null;
}

const VIEWBOX_WIDTH = 360;
const VIEWBOX_HEIGHT = 210;

// Kelipatan Persekutuan Terkecil KPK(36, 24, 18) = 72px untuk perulangan mulus tanpa patahan
const AIR_WAVE_PERIOD = 72;
const AIR_WAVE_TOTAL_WIDTH = 220;

// Periode gelombang sinyal sirkuit (2 siklus 12px = 24px)
const CIRCUIT_WAVE_PERIOD = 24;
const CIRCUIT_WAVE_WIDTH = 48;

/**
 * Generator lintasan gelombang sinus mulus matematis.
 */
function buildSinePath(
  startX: number,
  endX: number,
  centerY: number,
  amplitude: number,
  period: number
): string {
  let d = `M ${startX} ${centerY}`;
  let curX = startX;
  while (curX < endX) {
    const q1x = curX + period / 4;
    const q1y = centerY - amplitude;
    const midX = curX + period / 2;
    const q2x = curX + (3 * period) / 4;
    const q2y = centerY + amplitude;
    const nextX = curX + period;
    d += ` Q ${q1x.toFixed(1)} ${q1y.toFixed(1)} ${midX.toFixed(1)} ${centerY} Q ${q2x.toFixed(1)} ${q2y.toFixed(1)} ${nextX.toFixed(1)} ${centerY}`;
    curX = nextX;
  }
  return d;
}

export function RadioReceptionCanvas({
  currentFreqKHz,
  activeStage,
  onSelectStage,
  atmosphereMode,
  isFocused,
  resonanceStrength: _resonanceStrength,
  isLocked,
  matchedStation,
}: RadioReceptionCanvasProps) {
  const [canvasWidth, setCanvasWidth] = useState<number>(VIEWBOX_WIDTH);
  const scale = canvasWidth / VIEWBOX_WIDTH;

  // Warna khas stasiun radio aktif (Radio 1: Cyan, Radio 2: Hijau Emerald, Radio 3: Oranye Amber)
  const stationFlowColor = useMemo(() => {
    if (matchedStation?.id === 'st-999') return '#4ADE80';
    if (matchedStation?.id === 'st-1440') return '#FB923C';
    return '#38BDF8';
  }, [matchedStation]);

  // Reanimated shared values (Hanya menggerakkan Hardware Views via GPU, 0 Svg Invalidation)
  const electronY = useSharedValue(0);
  const waveTravel = useSharedValue(0);
  const circuitWaveTravel = useSharedValue(0);
  const speakerVibe = useSharedValue(0);
  const soundWavePulse = useSharedValue(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && Math.abs(width - canvasWidth) > 1) {
      setCanvasWidth(width);
    }
  };

  // 1. Osilasi elektron & gelombang udara bebas (Selalu aktif saat layar fokus)
  useEffect(() => {
    if (!isFocused) {
      cancelAnimation(electronY);
      cancelAnimation(waveTravel);
      return;
    }

    // Reset dan jalankan osilasi elektron di batang antena agar tidak macet/diem
    cancelAnimation(electronY);
    electronY.value = -10;
    electronY.value = withRepeat(
      withTiming(10, { duration: 420, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    // Perambatan gelombang radio di udara menuju antena
    const travelDistance = AIR_WAVE_PERIOD * scale;
    cancelAnimation(waveTravel);
    waveTravel.value = -travelDistance;
    waveTravel.value = withRepeat(
      withTiming(0, { duration: 1800, easing: Easing.linear }),
      -1,
      false
    );

    return () => {
      cancelAnimation(electronY);
      cancelAnimation(waveTravel);
    };
  }, [isFocused, scale, electronY, waveTravel]);

  // 2. Aliran gelombang aktif dalam sirkuit & getaran speaker (Hanya saat terkunci)
  useEffect(() => {
    if (!isFocused || !isLocked) {
      circuitWaveTravel.value = 0;
      speakerVibe.value = withTiming(0, { duration: 150 });
      soundWavePulse.value = withTiming(0, { duration: 150 });
      cancelAnimation(circuitWaveTravel);
      cancelAnimation(speakerVibe);
      cancelAnimation(soundWavePulse);
      return;
    }

    const circuitDistance = CIRCUIT_WAVE_PERIOD * scale;
    circuitWaveTravel.value = -circuitDistance;
    circuitWaveTravel.value = withRepeat(
      withTiming(0, { duration: 600, easing: Easing.linear }),
      -1,
      false
    );

    speakerVibe.value = withRepeat(
      withTiming(2.5, { duration: 120, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    soundWavePulse.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) }),
      -1,
      false
    );

    return () => {
      cancelAnimation(circuitWaveTravel);
      cancelAnimation(speakerVibe);
      cancelAnimation(soundWavePulse);
    };
  }, [isFocused, isLocked, scale, circuitWaveTravel, speakerVibe, soundWavePulse]);

  // Style animasi UI-Thread GPU untuk gelombang di udara
  const airWaveAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: waveTravel.value }],
  }));

  // Style animasi aliran gelombang mikro di dalam sirkuit
  const circuitWaveAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: circuitWaveTravel.value }],
  }));

  // Style animasi osilasi elektron batang antena
  const electronStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: electronY.value * scale }],
  }));
  const electronStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: -electronY.value * scale }],
  }));
  const electronStyle3 = useAnimatedStyle(() => ({
    transform: [{ translateY: electronY.value * scale }],
  }));
  const electronStyle4 = useAnimatedStyle(() => ({
    transform: [{ translateY: -electronY.value * scale }],
  }));

  // Style animasi getaran membran speaker
  const speakerConeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: speakerVibe.value * scale }],
  }));

  // Style animasi riak suara speaker
  const soundArcStyle1 = useAnimatedStyle(() => ({
    opacity: Math.max(0, 0.95 - soundWavePulse.value * 0.8),
    transform: [{ scale: 0.9 + soundWavePulse.value * 0.2 }],
  }));
  const soundArcStyle2 = useAnimatedStyle(() => ({
    opacity: Math.max(0, soundWavePulse.value * 0.85),
    transform: [{ scale: 0.9 + soundWavePulse.value * 0.28 }],
  }));

  // Pre-calculated lintasan gelombang sinus udara (100% periodik eksak, KPK = 72px)
  const sine630 = useMemo(() => buildSinePath(0, AIR_WAVE_TOTAL_WIDTH, 26, 6, 36), []);
  const sine999 = useMemo(() => buildSinePath(0, AIR_WAVE_TOTAL_WIDTH, 76, 5, 24), []);
  const sine1440 = useMemo(() => buildSinePath(0, AIR_WAVE_TOTAL_WIDTH, 116, 4, 18), []);

  // Pre-calculated lintasan gelombang mikro dalam sirkuit (periode 12px dan 24px)
  const tunedRfWave = useMemo(() => buildSinePath(0, CIRCUIT_WAVE_WIDTH, 8, 3.5, 12), []);
  const amplifiedRfWave = useMemo(() => buildSinePath(0, CIRCUIT_WAVE_WIDTH, 12, 8, 12), []);
  const audioDemodWave = useMemo(() => buildSinePath(0, CIRCUIT_WAVE_WIDTH, 9, 5, 24), []);

  const isNight = atmosphereMode === 'night';

  // Ukuran dimensi layout responsif (gelombang udara berhenti tepat di tepi kiri antena di x=85)
  const airWaveWindowStyle = {
    left: 2 * scale,
    top: 20 * scale,
    width: 83 * scale,
    height: 140 * scale,
  };
  const airWaveTrackWidth = AIR_WAVE_TOTAL_WIDTH * scale;
  const circuitTrackWidth = CIRCUIT_WAVE_WIDTH * scale;

  return (
    <View style={styles.container}>
      {/* Header Info Sirkuit Bersih & Rapi */}
      <View style={styles.topInfoBar}>
        <Text variant="caption" style={styles.circuitTitle}>
          Sirkuit Penerima AM
        </Text>
        <Text variant="caption" color={tokens.colors.textMuted}>
          Sentuh komponen untuk pelajari
        </Text>
      </View>

      {/* Canvas Wrapper */}
      <View style={styles.canvasWrapper} onLayout={handleLayout}>
        {/* Layer 1: Background & Komponen Sirkuit SVG (100% STATIK, 0 RE-RENDER/FRAME) */}
        <Svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} style={styles.svg}>
          {/* Background Canvas Box */}
          <Rect
            x="2"
            y="2"
            width="356"
            height="206"
            rx="14"
            fill="#0F172A"
            stroke="#1E293B"
            strokeWidth="1.5"
          />

          {/* Efek Garis Propagasi Langit (Tipis & Tenang) */}
          {isNight ? (
            <Path
              d="M 12 18 Q 180 8 348 18"
              stroke="#0284C7"
              strokeWidth="1.2"
              strokeDasharray="4 4"
              fill="none"
              opacity={0.5}
            />
          ) : (
            <Line
              x1="12"
              y1="18"
              x2="348"
              y2="18"
              stroke="#475569"
              strokeWidth="1"
              strokeDasharray="2 4"
              opacity={0.4}
            />
          )}

          {/* Label Frekuensi Gelombang Bebas di Udara (Warna khas masing-masing stasiun) */}
          <SvgText
            x="6"
            y="44"
            fill={matchedStation?.id === 'st-630' ? '#38BDF8' : '#7DD3FC'}
            opacity={matchedStation?.id === 'st-630' ? 1.0 : 0.65}
            fontSize="7.5"
            fontWeight="700"
          >
            630k
          </SvgText>
          <SvgText
            x="6"
            y="94"
            fill={matchedStation?.id === 'st-999' ? '#4ADE80' : '#86EFAC'}
            opacity={matchedStation?.id === 'st-999' ? 1.0 : 0.65}
            fontSize="7.5"
            fontWeight="700"
          >
            999k
          </SvgText>
          <SvgText
            x="6"
            y="134"
            fill={matchedStation?.id === 'st-1440' ? '#FB923C' : '#FDBA74'}
            opacity={matchedStation?.id === 'st-1440' ? 1.0 : 0.65}
            fontSize="7.5"
            fontWeight="700"
          >
            1440k
          </SvgText>

          {/* ========================================== */}
          {/* KOMPONEN 1: BATANG ANTENA                  */}
          {/* ========================================== */}
          <G onPress={() => onSelectStage('antena')}>
            {/* Ujung Atas Antena (T-bar Dipole Tip) */}
            <Line
              x1="82"
              y1="28"
              x2="102"
              y2="28"
              stroke={activeStage === 'antena' ? tokens.colors.primary : '#64748B'}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Batang Antena Logam Menangkap Sinyal Atas Hingga Bawah */}
            <Rect
              x="85"
              y="28"
              width="14"
              height="120"
              rx="7"
              fill="#1E293B"
              stroke={activeStage === 'antena' ? tokens.colors.primary : isLocked ? stationFlowColor : '#334155'}
              strokeWidth={activeStage === 'antena' ? 2 : isLocked ? 1.5 : 1}
            />

            {/* Label Nama Komponen: ANTENA */}
            <SvgText
              x="92"
              y="164"
              fill={activeStage === 'antena' ? tokens.colors.primary : '#CBD5E1'}
              fontSize="8"
              fontWeight="bold"
              textAnchor="middle"
            >
              ANTENA
            </SvgText>
          </G>

          {/* Kawat Antena -> Tuner (Hanya tampil garis statis jika belum lock) */}
          {!isLocked && (
            <Line x1="99" y1="96" x2="114" y2="96" stroke="#475569" strokeWidth="1.2" strokeDasharray="2 2" />
          )}

          {/* ========================================== */}
          {/* KOMPONEN 2: TUNER LC                       */}
          {/* ========================================== */}
          <G onPress={() => onSelectStage('tuner')}>
            <Rect
              x="114"
              y="56"
              width="46"
              height="80"
              rx="6"
              fill="#1E293B"
              stroke={activeStage === 'tuner' ? tokens.colors.primary : isLocked ? stationFlowColor : '#334155'}
              strokeWidth={activeStage === 'tuner' ? 2 : 1.2}
            />
            {/* Simbol Induktor L */}
            <Path
              d="M 124 72 Q 128 66 132 72 Q 136 66 140 72 Q 144 66 148 72"
              stroke={isLocked ? stationFlowColor : '#94A3B8'}
              strokeWidth="1.8"
              fill="none"
            />
            <SvgText x="153" y="74" fill={isLocked ? stationFlowColor : '#94A3B8'} fontSize="7" fontWeight="bold">L</SvgText>

            {/* Simbol Kapasitor Variabel C */}
            <Line x1="124" y1="96" x2="148" y2="96" stroke={isLocked ? stationFlowColor : '#94A3B8'} strokeWidth="2" />
            <Line x1="124" y1="102" x2="148" y2="102" stroke={isLocked ? stationFlowColor : '#94A3B8'} strokeWidth="2" />
            <Line x1="121" y1="110" x2="151" y2="88" stroke={isLocked ? stationFlowColor : '#38BDF8'} strokeWidth="1.5" />
            <SvgText x="153" y="102" fill={isLocked ? stationFlowColor : '#94A3B8'} fontSize="7" fontWeight="bold">C</SvgText>

            {/* Label Nama Komponen: TUNER LC */}
            <SvgText
              x="137"
              y="150"
              fill={activeStage === 'tuner' ? tokens.colors.primary : '#CBD5E1'}
              fontSize="8.5"
              fontWeight="bold"
              textAnchor="middle"
            >
              TUNER LC
            </SvgText>
          </G>

          {/* Kawat Statis Tuner -> RF Amp (Hanya muncul jika belum lock) */}
          {!isLocked && (
            <Line x1="160" y1="96" x2="176" y2="96" stroke="#475569" strokeWidth="1.2" strokeDasharray="2 2" />
          )}

          {/* ========================================== */}
          {/* KOMPONEN 3: AMPLIFIER (PENGUAT RF)        */}
          {/* ========================================== */}
          <G onPress={() => onSelectStage('amplifier')}>
            <Path
              d="M 176 71 L 210 96 L 176 121 Z"
              fill="#1E293B"
              stroke={activeStage === 'amplifier' ? tokens.colors.primary : isLocked ? stationFlowColor : '#334155'}
              strokeWidth={activeStage === 'amplifier' ? 2 : 1.2}
            />
            {/* Simbol Penguatan Segitiga */}
            <SvgText x="187" y="100" fill={isLocked ? stationFlowColor : '#94A3B8'} fontSize="9" fontWeight="bold">
              ▶
            </SvgText>

            {/* Label Nama Komponen: AMPLIFIER */}
            <SvgText
              x="193"
              y="150"
              fill={activeStage === 'amplifier' ? tokens.colors.primary : '#CBD5E1'}
              fontSize="8.5"
              fontWeight="bold"
              textAnchor="middle"
            >
              AMPLIFIER
            </SvgText>
          </G>

          {/* Kawat Statis Amp -> Detektor (Hanya muncul jika belum lock) */}
          {!isLocked && (
            <Line x1="210" y1="96" x2="226" y2="96" stroke="#475569" strokeWidth="1.2" strokeDasharray="2 2" />
          )}

          {/* ========================================== */}
          {/* KOMPONEN 4: DETEKTOR (DEMODULATOR DIODA)  */}
          {/* ========================================== */}
          <G onPress={() => onSelectStage('demodulator')}>
            <Rect
              x="226"
              y="63"
              width="46"
              height="66"
              rx="6"
              fill="#1E293B"
              stroke={activeStage === 'demodulator' ? tokens.colors.primary : isLocked ? stationFlowColor : '#334155'}
              strokeWidth={activeStage === 'demodulator' ? 2 : 1.2}
            />
            {/* Simbol Dioda Penyearah */}
            <Path d="M 235 96 L 247 87 L 247 105 Z" fill={isLocked ? stationFlowColor : '#94A3B8'} stroke={isLocked ? stationFlowColor : '#94A3B8'} strokeWidth="1" />
            <Line x1="235" y1="85" x2="235" y2="107" stroke={isLocked ? stationFlowColor : '#94A3B8'} strokeWidth="1.8" />

            {/* Label Nama Komponen: DETEKTOR */}
            <SvgText
              x="249"
              y="150"
              fill={activeStage === 'demodulator' ? tokens.colors.primary : '#CBD5E1'}
              fontSize="8.5"
              fontWeight="bold"
              textAnchor="middle"
            >
              DETEKTOR
            </SvgText>
          </G>

          {/* Kawat Statis Detektor -> Speaker (Hanya muncul jika belum lock) */}
          {!isLocked && (
            <Line x1="272" y1="96" x2="294" y2="96" stroke="#475569" strokeWidth="1.2" strokeDasharray="2 2" />
          )}

          {/* ========================================== */}
          {/* KOMPONEN 5: SPEAKER (BASE & VOICE COIL)    */}
          {/* ========================================== */}
          <G onPress={() => onSelectStage('speaker')}>
            {/* Kumparan Suara (Voice Coil) */}
            <Rect
              x="294"
              y="85"
              width="8"
              height="22"
              rx="2"
              fill={isLocked ? '#475569' : '#334155'}
            />

            {/* Label Nama Komponen: SPEAKER */}
            <SvgText
              x="312"
              y="150"
              fill={activeStage === 'speaker' ? '#38BDF8' : '#CBD5E1'}
              fontSize="8.5"
              fontWeight="bold"
              textAnchor="middle"
            >
              SPEAKER
            </SvgText>
          </G>
        </Svg>

        {/* Layer 2: Gelombang Udara Merambat Bebas (Akselerasi GPU Native View, 1x Texture Raster) */}
        <View style={[styles.airWaveWindow, airWaveWindowStyle]} pointerEvents="none">
          <Animated.View style={[{ width: airWaveTrackWidth, height: '100%' }, airWaveAnimatedStyle]}>
            <Svg width={airWaveTrackWidth} height="100%" viewBox={`0 0 ${AIR_WAVE_TOTAL_WIDTH} 140`} preserveAspectRatio="none">
              {/* Gelombang 1: 630 kHz (Cyan) */}
              <Path
                d={sine630}
                stroke={matchedStation?.id === 'st-630' ? '#38BDF8' : 'rgba(56, 189, 248, 0.35)'}
                strokeWidth={matchedStation?.id === 'st-630' ? 2.8 : 1.3}
                fill="none"
                opacity={matchedStation?.id === 'st-630' ? 1.0 : 0.45}
              />
              {/* Gelombang 2: 999 kHz (Emerald Green) */}
              <Path
                d={sine999}
                stroke={matchedStation?.id === 'st-999' ? '#4ADE80' : 'rgba(74, 222, 128, 0.35)'}
                strokeWidth={matchedStation?.id === 'st-999' ? 2.8 : 1.3}
                fill="none"
                opacity={matchedStation?.id === 'st-999' ? 1.0 : 0.45}
              />
              {/* Gelombang 3: 1440 kHz (Amber Orange) */}
              <Path
                d={sine1440}
                stroke={matchedStation?.id === 'st-1440' ? '#FB923C' : 'rgba(251, 146, 60, 0.35)'}
                strokeWidth={matchedStation?.id === 'st-1440' ? 2.8 : 1.3}
                fill="none"
                opacity={matchedStation?.id === 'st-1440' ? 1.0 : 0.45}
              />
            </Svg>
          </Animated.View>
        </View>

        {/* Layer 3: Elektron Bebas & Polaritas Antena (Hardware RenderNode Views, 0 Bitmap allocation) */}
        <View
          style={[
            styles.electronTrack,
            { left: 88 * scale, top: 36 * scale, width: 8 * scale, height: 104 * scale },
          ]}
          pointerEvents="none"
        >
          <Animated.View style={[styles.electronDot, { top: 6 * scale, backgroundColor: isLocked ? stationFlowColor : '#38BDF8' }, electronStyle1]} />
          <Animated.View style={[styles.electronDot, { top: 34 * scale, backgroundColor: isLocked ? stationFlowColor : '#38BDF8' }, electronStyle2]} />
          <Animated.View style={[styles.electronDot, { top: 62 * scale, backgroundColor: isLocked ? stationFlowColor : '#38BDF8' }, electronStyle3]} />
          <Animated.View style={[styles.electronDot, { top: 90 * scale, backgroundColor: isLocked ? stationFlowColor : '#38BDF8' }, electronStyle4]} />
        </View>

        {/* Indikator Polaritas Listrik Dipol Antena (+ dan -) */}
        <View style={[styles.poleBadge, { left: 87 * scale, top: 14 * scale }]} pointerEvents="none">
          <Text style={styles.poleText}>+</Text>
        </View>
        <View style={[styles.poleBadge, { left: 87 * scale, top: 150 * scale }]} pointerEvents="none">
          <Text style={styles.poleText}>−</Text>
        </View>

        {/* Layer 4: Aliran Gelombang Aktif di Dalam Sirkuit (Hanya saat Terkunci) */}
        {isLocked && (
          <>
            {/* Bridge 0: Kawat Antena -> Tuner LC (Sinyal Frekuensi Masuk ke Penala) */}
            <View
              style={[
                styles.circuitBridge,
                { left: 99 * scale, top: 88 * scale, width: 15 * scale, height: 16 * scale },
              ]}
              pointerEvents="none"
            >
              <Animated.View style={[{ width: circuitTrackWidth, height: '100%' }, circuitWaveAnimatedStyle]}>
                <Svg width={circuitTrackWidth} height="100%" viewBox={`0 0 ${CIRCUIT_WAVE_WIDTH} 16`}>
                  <Path d={tunedRfWave} stroke={stationFlowColor} strokeWidth="2.2" fill="none" />
                </Svg>
              </Animated.View>
            </View>

            {/* Bridge 1: Kawat Tuner -> RF Amp (Gelombang RF Terpilih) */}
            <View
              style={[
                styles.circuitBridge,
                { left: 160 * scale, top: 88 * scale, width: 16 * scale, height: 16 * scale },
              ]}
              pointerEvents="none"
            >
              <Animated.View style={[{ width: circuitTrackWidth, height: '100%' }, circuitWaveAnimatedStyle]}>
                <Svg width={circuitTrackWidth} height="100%" viewBox={`0 0 ${CIRCUIT_WAVE_WIDTH} 16`}>
                  <Path d={tunedRfWave} stroke={stationFlowColor} strokeWidth="2.2" fill="none" />
                </Svg>
              </Animated.View>
            </View>

            {/* Bridge 2: Kawat RF Amp -> Detektor (Gelombang Teramplifikasi 2.5x) */}
            <View
              style={[
                styles.circuitBridge,
                { left: 210 * scale, top: 84 * scale, width: 16 * scale, height: 24 * scale },
              ]}
              pointerEvents="none"
            >
              <Animated.View style={[{ width: circuitTrackWidth, height: '100%' }, circuitWaveAnimatedStyle]}>
                <Svg width={circuitTrackWidth} height="100%" viewBox={`0 0 ${CIRCUIT_WAVE_WIDTH} 24`}>
                  <Path d={amplifiedRfWave} stroke={stationFlowColor} strokeWidth="2.8" fill="none" />
                </Svg>
              </Animated.View>
            </View>

            {/* Bridge 3: Kawat Detektor -> Speaker (Gelombang Suara Audio Murni) */}
            <View
              style={[
                styles.circuitBridge,
                { left: 272 * scale, top: 87 * scale, width: 22 * scale, height: 18 * scale },
              ]}
              pointerEvents="none"
            >
              <Animated.View style={[{ width: circuitTrackWidth, height: '100%' }, circuitWaveAnimatedStyle]}>
                <Svg width={circuitTrackWidth} height="100%" viewBox={`0 0 ${CIRCUIT_WAVE_WIDTH} 18`}>
                  <Path d={audioDemodWave} stroke="#4ADE80" strokeWidth="2.5" fill="none" />
                </Svg>
              </Animated.View>
            </View>
          </>
        )}

        {/* Layer 5: Membran Konus Speaker & Riak Suara Akustik */}
        <Animated.View
          style={[
            styles.speakerConeWrapper,
            { left: 302 * scale, top: 67 * scale, width: 20 * scale, height: 58 * scale },
            speakerConeStyle,
          ]}
          pointerEvents="none"
        >
          <Svg width="100%" height="100%" viewBox="0 0 20 58">
            <Path
              d="M 0 18 L 20 0 L 20 58 L 0 40 Z"
              fill="#1E293B"
              stroke={isLocked ? stationFlowColor : '#334155'}
              strokeWidth={isLocked ? 1.8 : 1}
            />
          </Svg>
        </Animated.View>

        {/* Riak Gelombang Akustik Memancar ke Ruangan */}
        {isLocked && (
          <View
            style={[
              styles.soundWaveOverlay,
              { left: 325 * scale, top: 76 * scale, width: 28 * scale, height: 40 * scale },
            ]}
            pointerEvents="none"
          >
            <Animated.View style={[styles.soundArc1, { borderColor: stationFlowColor }, soundArcStyle1]} />
            <Animated.View style={[styles.soundArc2, { borderColor: stationFlowColor }, soundArcStyle2]} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: tokens.spacing.xs,
  },
  topInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingBottom: 2,
  },
  circuitTitle: {
    fontWeight: '700',
    color: tokens.colors.text,
  },
  canvasWrapper: {
    width: '100%',
    aspectRatio: VIEWBOX_WIDTH / VIEWBOX_HEIGHT,
    borderRadius: tokens.radii.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  svg: {
    width: '100%',
    height: '100%',
  },
  airWaveWindow: {
    position: 'absolute',
    overflow: 'hidden',
  },
  circuitBridge: {
    position: 'absolute',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  electronTrack: {
    position: 'absolute',
    alignItems: 'center',
  },
  electronDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#38BDF8',
    elevation: 2,
  },
  poleBadge: {
    position: 'absolute',
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poleText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 10,
  },
  speakerConeWrapper: {
    position: 'absolute',
  },
  soundWaveOverlay: {
    position: 'absolute',
    justifyContent: 'center',
  },
  soundArc1: {
    position: 'absolute',
    top: 6,
    left: 2,
    width: 14,
    height: 28,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    borderWidth: 2,
    borderColor: tokens.colors.primary,
    borderLeftWidth: 0,
  },
  soundArc2: {
    position: 'absolute',
    top: 2,
    left: 10,
    width: 18,
    height: 36,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderWidth: 1.5,
    borderColor: tokens.colors.primary,
    borderLeftWidth: 0,
  },
});
