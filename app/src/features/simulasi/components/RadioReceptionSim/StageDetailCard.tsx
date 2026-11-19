import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';
import { Card } from '@/shared/ui/Card';
import {
  StageId,
  RECEPTION_STAGES,
} from '../../constants/receptionConstants';

interface StageDetailCardProps {
  activeStage: StageId;
  onSelectStage: (stage: StageId) => void;
}

const STAGE_SHORT_NAMES: Record<StageId, string> = {
  antena: 'Antena',
  tuner: 'Penala LC',
  amplifier: 'Penguat',
  demodulator: 'Detektor',
  speaker: 'Speaker',
};

export const StageDetailCard = React.memo(function StageDetailCard({
  activeStage,
  onSelectStage,
}: StageDetailCardProps) {
  const foundIndex = RECEPTION_STAGES.findIndex((s) => s.id === activeStage);
  const currentStageIndex = foundIndex >= 0 ? foundIndex : 0;
  const stage = RECEPTION_STAGES[currentStageIndex] ?? RECEPTION_STAGES[0]!;

  return (
    <Card style={styles.container}>
      {/* Tab Navigasi 5 Tahap Sirkuit */}
      <View style={styles.tabBar}>
        {RECEPTION_STAGES.map((item) => {
          const isActive = item.id === activeStage;
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelectStage(item.id)}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              accessibilityRole="button"
              accessibilityLabel={`Tahap ${item.stepNumber}: ${item.title}`}
            >
              <Text
                variant="caption"
                style={[styles.tabText, isActive && styles.tabTextActive]}
                numberOfLines={1}
              >
                {STAGE_SHORT_NAMES[item.id] ?? item.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Header Info Tahap Terpilih */}
      <View style={styles.headerInfo}>
        <Text variant="titleSmall" style={styles.stageTitle}>
          {stage.stepNumber}. {stage.title}
        </Text>
        <Text variant="caption" color={tokens.colors.textMuted}>
          {stage.subtitle}
        </Text>
      </View>

      {/* Deskripsi Edukasi */}
      <Text variant="caption" color={tokens.colors.textSecondary} style={styles.descriptionText}>
        {stage.description}
      </Text>
    </Card>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.surface,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.surfaceContainerLow,
    borderRadius: tokens.radii.md,
    padding: 3,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    gap: 2,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radii.sm,
  },
  tabItemActive: {
    backgroundColor: tokens.colors.surface,
    elevation: 1,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.colors.textMuted,
  },
  tabTextActive: {
    fontWeight: '700',
    color: tokens.colors.text,
  },
  headerInfo: {
    gap: 2,
  },
  stageTitle: {
    fontWeight: '700',
    color: tokens.colors.text,
  },
  descriptionText: {
    lineHeight: 20,
  },
});
