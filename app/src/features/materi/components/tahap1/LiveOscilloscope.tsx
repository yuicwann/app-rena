import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Path as SvgPath } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/shared/ui/Text';
import { STAGE_COLORS, getDiagramNode } from './tahap1Data';

interface LiveOscilloscopeProps {
  activeIndex: number;
  mode: 'fm' | 'am';
  isPaused?: boolean;
}

const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function mkPath(fn: (x: number) => number, w = 340, n = 90): string {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const x = i / n;
    d += (i ? ' L ' : 'M ') + (x * w).toFixed(1) + ' ' + fn(x).toFixed(1);
  }
  return d;
}

export function LiveOscilloscope({
  activeIndex,
  mode,
  isPaused = false,
}: LiveOscilloscopeProps) {
  const node = getDiagramNode(activeIndex);
  const stageId = node.id;
  const isFM = mode === 'fm';
  const strokeColor = STAGE_COLORS[stageId] || '#2fb8ff';

  const [pathD, setPathD] = useState<string>('');
  const timeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let lastTimestamp = performance.now();

    const loop = () => {
      const now = performance.now();
      const delta = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      if (!isPaused) {
        timeRef.current += delta;
      }

      const t = timeRef.current;
      const au = (x: number) => Math.sin(TAU * (1.3 * x - 0.5 * t));
      const bump = (x: number) => 1.6 * Math.exp(-Math.pow((x - ((t * 0.22) % 1)) * 22, 2));

      const scopeFn = (x: number) => {
        let v: number;
        if (stageId === 'det' || stageId === 'af') {
          v = 0.65 * au(x);
          if (!isFM) v += bump(x) * 0.45 * Math.sin(TAU * 36 * x);
          if (stageId === 'af') v *= 1.25 + 0.1 * Math.sin(t * 8);
        } else {
          const cyc = (stageId === 'ant' || stageId === 'rf') ? 28 : 14;
          const hasLimiter = (stageId === 'lim');
          const nb = (hasLimiter && isFM) ? 0 : bump(x);
          const ph = TAU * (cyc * x - 3.2 * t);

          if (isFM) {
            // FM: variasi frekuensi (kerapatan gelombang)
            v = 0.52 * (1 + nb * 0.8) * Math.sin(ph + 3.2 * Math.sin(TAU * (1.4 * x - 0.5 * t)));
            if (hasLimiter) {
              // Limiter memotong puncak amplitudo
              v = clamp(v, -0.42, 0.42) * 1.25;
            }
          } else {
            // AM: variasi amplitudo
            v = 0.5 * (1 + 0.6 * au(x)) * (1 + nb) * Math.sin(ph);
          }
          if (stageId === 'ant') v += 0.08 * Math.sin(TAU * 88 * x + t * 5);
        }
        return 35 - clamp(v, -1.15, 1.15) * 28;
      };

      setPathD(mkPath(scopeFn, 340, 90));
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [stageId, isFM, isPaused]);

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="pulse" size={15} color="#7cd5ff" />
          <Text style={styles.headerLeftText}>Sinyal pada Titik:</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {node.t} ({node.s})
          </Text>
        </View>
      </View>

      {/* Oscilloscope Screen */}
      <View style={styles.screenWrapper}>
        <Svg viewBox="0 0 340 70" style={styles.svg}>
          {/* Center reference grid line */}
          <Line
            x1="0"
            y1="35"
            x2="340"
            y2="35"
            stroke="#163242"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
          {/* Animated signal waveform path */}
          {!!pathD && (
            <SvgPath
              d={pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#09151c',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1b3240',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerLeftText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7cd5ff',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffc800',
  },
  screenWrapper: {
    width: '100%',
    height: 76,
    justifyContent: 'center',
  },
  svg: {
    width: '100%',
    height: '100%',
  },
});
