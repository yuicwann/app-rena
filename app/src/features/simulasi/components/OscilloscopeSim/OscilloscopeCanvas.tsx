import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, {
  G,
  Path,
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
  ModulationMode,
  SignalInspectionStage,
  MODULATION_CONFIGS,
} from '../../constants/oscilloscopeConstants';

interface OscilloscopeCanvasProps {
  mode: ModulationMode;
  stage: SignalInspectionStage;
  isPlaying: boolean;
  isFocused: boolean;
  timeDivScale: number; // 0.8, 1.0, 1.2
  voltDivScale: number; // 0.8, 1.0, 1.2
}

const VIEWBOX_WIDTH = 340;
const VIEWBOX_HEIGHT = 160;
// Periode perulangan matematis eksak (half-width = 170px)
const SEAMLESS_PERIOD = 170;
// Lebar total lintasan gelombang (340 layar + 340 buffer perulangan = 4 periode penuh tanpa patahan)
const TOTAL_WAVE_WIDTH = 680;

export function OscilloscopeCanvas({
  mode,
  stage,
  isPlaying,
  isFocused,
  timeDivScale,
  voltDivScale,
}: OscilloscopeCanvasProps) {
  const [canvasWidth, setCanvasWidth] = useState<number>(VIEWBOX_WIDTH);
  const scale = canvasWidth / VIEWBOX_WIDTH;

  const scrollOffset = useSharedValue(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && Math.abs(width - canvasWidth) > 1) {
      setCanvasWidth(width);
    }
  };

  useEffect(() => {
    if (!isPlaying || !isFocused) {
      cancelAnimation(scrollOffset);
      return;
    }

    const loopDistance = SEAMLESS_PERIOD * scale;
    const duration = Math.round(2400 / timeDivScale);

    // Animasi linear mulus tanpa patahan pada UI Thread GPU
    cancelAnimation(scrollOffset);
    scrollOffset.value = 0;
    scrollOffset.value = withRepeat(
      withTiming(-loopDistance, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    return () => {
      cancelAnimation(scrollOffset);
    };
  }, [isPlaying, isFocused, timeDivScale, scale, scrollOffset]);

  const waveAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scrollOffset.value }],
  }));

  // Generator lintasan gelombang matematis yang 100% periodik mulus tanpa patahan
  const { wavePath, envelopeTopPath, envelopeBottomPath } = useMemo(() => {
    const centerY = 80;
    const baseAmp = 38 * voltDivScale;
    const step = 1.0; // Langkah integer 1px eksak: titik x dan x + 170 tepat 100% identik tanpa patahan

    // Frekuensi sudut fundamental eksak untuk periode SEAMLESS_PERIOD (170px)
    const kBase = (2 * Math.PI) / SEAMLESS_PERIOD;

    let dWave = '';
    let dEnvTop = '';
    let dEnvBottom = '';

    for (let x = 0; x <= TOTAL_WAVE_WIDTH; x += step) {
      let y = centerY;
      let yTop = centerY;
      let yBottom = centerY;

      if (stage === 'audio') {
        // Nada audio dengan harmonik ke-2 (tepat 1 siklus & 2 siklus per 170px)
        const audioVal = Math.sin(x * kBase) + 0.35 * Math.sin(x * 2 * kBase);
        y = centerY - baseAmp * 0.82 * audioVal;
      } else if (stage === 'lo') {
        // Osilator Lokal RF (tepat 10 siklus per 170px)
        const loVal = Math.cos(x * 10 * kBase);
        y = centerY - baseAmp * 0.9 * loVal;
      } else if (stage === 'mixer_if') {
        // Frekuensi Menengah IF (tepat 5 siklus per 170px)
        const ifVal = Math.sin(x * 5 * kBase);
        y = centerY - baseAmp * 0.85 * ifVal;
      } else {
        if (mode === 'AM') {
          // AM: Modulasi selubung audio (1 siklus) + pembawa carrier (15 siklus)
          const env = 1 + 0.48 * Math.sin(x * kBase);
          const carrier = Math.sin(x * 15 * kBase);
          const ampInstant = baseAmp * env * 0.62;

          y = centerY - ampInstant * carrier;
          yTop = centerY - ampInstant;
          yBottom = centerY + ampInstant;

          if (x === 0) {
            dEnvTop = `M ${x} ${yTop.toFixed(1)}`;
            dEnvBottom = `M ${x} ${yBottom.toFixed(1)}`;
          } else {
            dEnvTop += ` L ${x} ${yTop.toFixed(1)}`;
            dEnvBottom += ` L ${x} ${yBottom.toFixed(1)}`;
          }
        } else {
          // FM: Pembawa (12 siklus) dengan deviasi frekuensi modulasi (1 siklus)
          const mod = Math.sin(x * kBase);
          const carrier = Math.sin(x * 12 * kBase + 2.4 * mod);
          y = centerY - baseAmp * 0.9 * carrier;
        }
      }

      if (x === 0) {
        dWave = `M ${x} ${y.toFixed(1)}`;
      } else {
        dWave += ` L ${x} ${y.toFixed(1)}`;
      }
    }

    return {
      wavePath: dWave,
      envelopeTopPath: dEnvTop,
      envelopeBottomPath: dEnvBottom,
    };
  }, [stage, mode, voltDivScale]);

  const config = MODULATION_CONFIGS[mode];
  const phosphorColor =
    stage === 'audio'
      ? '#4ADE80'
      : stage === 'rf'
      ? '#38BDF8'
      : stage === 'lo'
      ? '#FBBF24'
      : '#C084FC';

  const waveSvgWidth = TOTAL_WAVE_WIDTH * scale;

  return (
    <View style={styles.container}>
      {/* Top Info Bar */}
      <View style={styles.topInfo}>
        <Text variant="caption" style={styles.titleText}>
          Osiloskop • {mode} ({stage.toUpperCase()})
        </Text>
        <Text variant="caption" style={styles.stateText}>
          {isPlaying ? 'Aktif' : 'Dijeda'}
        </Text>
      </View>

      {/* CRT Screen Display (Layered hardware views, 0 Svg bitmap stacking) */}
      <View style={styles.crtWrapper} onLayout={handleLayout}>
        {/* Layer 1: Hardware Rendered Grid Lines (Zero Bitmap Allocation) */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Garis Horizontal */}
          <View style={[styles.gridH, { top: '12.5%' }]} />
          <View style={[styles.gridH, { top: '31.25%' }]} />
          <View style={[styles.gridH, styles.gridCenterH, { top: '50%' }]} />
          <View style={[styles.gridH, { top: '68.75%' }]} />
          <View style={[styles.gridH, { top: '87.5%' }]} />

          {/* Garis Vertikal */}
          <View style={[styles.gridV, { left: '25%' }]} />
          <View style={[styles.gridV, styles.gridCenterV, { left: '50%' }]} />
          <View style={[styles.gridV, { left: '75%' }]} />
        </View>

        {/* Layer 2: Single Hardware-Accelerated Waveform (Rendered Once into GPU Texture) */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Animated.View style={[{ width: waveSvgWidth, height: '100%' }, waveAnimatedStyle]}>
            <Svg width={waveSvgWidth} height="100%" viewBox={`0 0 ${TOTAL_WAVE_WIDTH} ${VIEWBOX_HEIGHT}`}>
              {stage === 'rf' && mode === 'AM' && envelopeTopPath !== '' && (
                <G>
                  <Path
                    d={envelopeTopPath}
                    stroke="#FBBF24"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                    fill="none"
                    opacity={0.5}
                  />
                  <Path
                    d={envelopeBottomPath}
                    stroke="#FBBF24"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                    fill="none"
                    opacity={0.5}
                  />
                </G>
              )}

              {/* Phosphor Glow Body */}
              <Path
                d={wavePath}
                stroke={phosphorColor}
                strokeWidth="2.8"
                fill="none"
                opacity={0.7}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Inti Sinar Putih Terang */}
              <Path
                d={wavePath}
                stroke="#FFFFFF"
                strokeWidth="1.2"
                fill="none"
                opacity={0.9}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Animated.View>
        </View>

        {/* Layer 3: Native Text Overlay (Zero SVG, Zero Bitmap Overhead) */}
        <View style={styles.crtFooter} pointerEvents="none">
          <Text variant="caption" style={styles.scaleText}>
            {(1.0 * timeDivScale).toFixed(1)}ms/div • {(0.5 * voltDivScale).toFixed(1)}V/div
          </Text>
          <Text variant="caption" style={styles.scaleText}>
            IF: {config.standardIF}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#060D1F',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: '#1C2D4A',
    gap: tokens.spacing.xs,
  },
  topInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: 2,
  },
  titleText: {
    color: '#E2E8F0',
    fontWeight: '700',
  },
  stateText: {
    color: '#94A3B8',
    fontWeight: '600',
  },
  crtWrapper: {
    width: '100%',
    aspectRatio: VIEWBOX_WIDTH / VIEWBOX_HEIGHT,
    borderRadius: tokens.radii.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#060D1F',
    borderWidth: 1.5,
    borderColor: '#1C2D4A',
  },
  gridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#0F2038',
  },
  gridCenterH: {
    height: 1.2,
    backgroundColor: '#1E3A5F',
  },
  gridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#0F2038',
  },
  gridCenterV: {
    width: 1.2,
    backgroundColor: '#1E3A5F',
  },
  crtFooter: {
    position: 'absolute',
    bottom: 6,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scaleText: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '600',
  },
});
