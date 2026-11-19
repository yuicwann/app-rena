import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { tokens } from '@/shared/theme/tokens';
import { clamp } from '@/shared/lib/clamp';

export interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function ProgressBar({
  progress,
  color = tokens.colors.primary,
  height = 12,
  style,
}: ProgressBarProps) {
  const percentage = Math.round(clamp(progress, 0, 1) * 100);

  return (
    <View style={[styles.container, { height }, style]}>
      <View
        style={[
          styles.fill,
          {
            width: `${percentage}%`,
            backgroundColor: color,
          },
        ]}
      >
        {percentage > 10 && <View style={styles.highlight} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E2E8F0',
    borderRadius: tokens.radii.full,
    overflow: 'hidden',
    width: '100%',
    padding: 2,
  },
  fill: {
    height: '100%',
    borderRadius: tokens.radii.full,
    position: 'relative',
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 2,
    left: 8,
    right: 8,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: tokens.radii.full,
  },
});
