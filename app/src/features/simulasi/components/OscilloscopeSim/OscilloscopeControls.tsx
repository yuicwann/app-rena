import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';
import { Card } from '@/shared/ui/Card';
import { DuoButton } from '@/shared/ui/DuoButton';
import {
  ModulationMode,
  SignalInspectionStage,
  SIGNAL_STAGES,
} from '../../constants/oscilloscopeConstants';

interface OscilloscopeControlsProps {
  mode: ModulationMode;
  onModeChange: (mode: ModulationMode) => void;
  stage: SignalInspectionStage;
  onStageChange: (stage: SignalInspectionStage) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  timeDivScale: number;
  onTimeDivChange: (scale: number) => void;
  voltDivScale: number;
  onVoltDivChange: (scale: number) => void;
}

export function OscilloscopeControls({
  mode,
  onModeChange,
  stage,
  onStageChange,
  isPlaying,
  onTogglePlay,
  timeDivScale,
  onTimeDivChange,
  voltDivScale,
  onVoltDivChange,
}: OscilloscopeControlsProps) {
  const currentStageInfo = SIGNAL_STAGES.find((s) => s.id === stage) ?? SIGNAL_STAGES[0]!;

  return (
    <Card style={styles.container}>
      {/* Mode Switcher: AM vs FM */}
      <View style={styles.modeContainer}>
        <Pressable
          style={[styles.modeBtn, mode === 'AM' && styles.modeBtnActive]}
          onPress={() => onModeChange('AM')}
          accessibilityRole="button"
          accessibilityLabel="Pilih mode gelombang AM"
        >
          <Text
            variant="bodySmall"
            style={[styles.modeText, mode === 'AM' && styles.modeTextActive]}
          >
            AM (530 – 1600 kHz)
          </Text>
        </Pressable>

        <Pressable
          style={[styles.modeBtn, mode === 'FM' && styles.modeBtnActive]}
          onPress={() => onModeChange('FM')}
          accessibilityRole="button"
          accessibilityLabel="Pilih mode gelombang FM"
        >
          <Text
            variant="bodySmall"
            style={[styles.modeText, mode === 'FM' && styles.modeTextActive]}
          >
            FM (88 – 108 MHz)
          </Text>
        </Pressable>
      </View>

      {/* Signal Stage Selector */}
      <View style={styles.stageTabsRow}>
        {SIGNAL_STAGES.map((s) => {
          const isActive = stage === s.id;
          return (
            <Pressable
              key={s.id}
              style={[styles.stageTab, isActive && styles.stageTabActive]}
              onPress={() => onStageChange(s.id)}
              accessibilityRole="button"
              accessibilityLabel={`Inspeksi sinyal ${s.name}`}
            >
              <Text
                variant="caption"
                style={[styles.stageTabText, isActive && styles.stageTabTextActive]}
              >
                {s.shortName}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Signal Detail: Bersih Tanpa Rumus Menumpuk */}
      <View style={styles.detailBox}>
        <Text variant="bodySmall" style={styles.detailTitle}>
          {currentStageInfo.name}
        </Text>
        <Text variant="caption" color={tokens.colors.textSecondary} style={styles.detailDesc}>
          {currentStageInfo.description}
        </Text>
      </View>

      {/* Skala Time/Div & Volt/Div Ringkas */}
      <View style={styles.scaleRow}>
        <View style={styles.scaleGroup}>
          <Text variant="caption" color={tokens.colors.textMuted} style={styles.scaleLabel}>
            Waktu:
          </Text>
          <View style={styles.scaleButtons}>
            {[0.8, 1.0, 1.2].map((scale) => (
              <Pressable
                key={scale}
                style={[styles.scaleBtn, timeDivScale === scale && styles.scaleBtnActive]}
                onPress={() => onTimeDivChange(scale)}
                accessibilityRole="button"
                accessibilityLabel={`Waktu ${scale}x`}
              >
                <Text
                  variant="caption"
                  style={[styles.scaleBtnText, timeDivScale === scale && styles.scaleBtnTextActive]}
                >
                  {scale}x
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.scaleGroup}>
          <Text variant="caption" color={tokens.colors.textMuted} style={styles.scaleLabel}>
            Amplitudo:
          </Text>
          <View style={styles.scaleButtons}>
            {[0.8, 1.0, 1.2].map((scale) => (
              <Pressable
                key={scale}
                style={[styles.scaleBtn, voltDivScale === scale && styles.scaleBtnActive]}
                onPress={() => onVoltDivChange(scale)}
                accessibilityRole="button"
                accessibilityLabel={`Amplitudo ${scale}x`}
              >
                <Text
                  variant="caption"
                  style={[styles.scaleBtnText, voltDivScale === scale && styles.scaleBtnTextActive]}
                >
                  {scale}x
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Play / Pause Action Button */}
      <DuoButton
        label={isPlaying ? 'Jeda Osiloskop' : 'Jalankan Sinyal'}
        variant={isPlaying ? 'white' : 'green'}
        size="medium"
        onPress={onTogglePlay}
        icon={
          <MaterialIcons
            name={isPlaying ? 'pause' : 'play-arrow'}
            size={18}
            color={isPlaying ? tokens.colors.primary : '#FFFFFF'}
          />
        }
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.surface,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.surfaceContainerLow,
    borderRadius: tokens.radii.md,
    padding: 3,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: tokens.radii.sm,
  },
  modeBtnActive: {
    backgroundColor: tokens.colors.surface,
    elevation: 1,
  },
  modeText: {
    fontWeight: '600',
    color: tokens.colors.textMuted,
    fontSize: 13,
  },
  modeTextActive: {
    fontWeight: '700',
    color: tokens.colors.text,
  },
  stageTabsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stageTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.surfaceContainerLow,
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  stageTabActive: {
    backgroundColor: tokens.colors.surface,
    borderColor: tokens.colors.primary,
    borderWidth: 1.5,
  },
  stageTabText: {
    fontWeight: '600',
    fontSize: 11,
    color: tokens.colors.textMuted,
  },
  stageTabTextActive: {
    color: tokens.colors.primaryDarkText,
    fontWeight: '700',
  },
  detailBox: {
    backgroundColor: tokens.colors.surfaceContainerLow,
    padding: tokens.spacing.sm,
    borderRadius: tokens.radii.md,
    gap: 2,
  },
  detailTitle: {
    fontWeight: '700',
    color: tokens.colors.text,
  },
  detailDesc: {
    lineHeight: 18,
  },
  scaleRow: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    paddingVertical: 2,
  },
  scaleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scaleLabel: {
    fontSize: 11,
  },
  scaleButtons: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
  },
  scaleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
    borderRadius: tokens.radii.sm,
    backgroundColor: tokens.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  scaleBtnActive: {
    backgroundColor: tokens.colors.surface,
    borderColor: tokens.colors.primary,
  },
  scaleBtnText: {
    fontSize: 10,
    color: tokens.colors.textMuted,
    fontWeight: '600',
  },
  scaleBtnTextActive: {
    color: tokens.colors.text,
    fontWeight: '700',
  },
});
