import React from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';
import { DuoCard } from '@/shared/ui/DuoCard';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { LearningModule } from '../types/dashboard';

export interface ActiveModuleCardProps {
  module: LearningModule;
  isGuestLocked?: boolean;
}

export function ActiveModuleCard({ module, isGuestLocked = false }: ActiveModuleCardProps) {
  const displayPercentage = isGuestLocked ? 0 : module.progressPercentage;

  return (
    <DuoCard variant="default" style={styles.card}>
      {/* Header Info Row */}
      <View style={styles.headerRow}>
        <Text style={styles.moduleTag}>
          MODUL {module.moduleNumber}
        </Text>
        <Text style={styles.progressText}>
          {isGuestLocked ? 'Terkunci' : `${displayPercentage}% Selesai`}
        </Text>
      </View>

      {/* Module Title */}
      <Text variant="titleSmall" style={styles.title}>
        {module.title}
      </Text>

      {/* Concise Description */}
      <Text variant="bodySmall" style={styles.description} numberOfLines={2}>
        {module.description}
      </Text>

      {/* Smooth Progress Bar */}
      <View style={styles.progressWrapper}>
        <ProgressBar progress={displayPercentage / 100} height={10} />
      </View>
    </DuoCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: tokens.spacing.xl,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  moduleTag: {
    fontSize: 12,
    fontWeight: '900',
    color: tokens.colors.primaryDarkText,
    letterSpacing: 0.8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '800',
    color: tokens.colors.textMuted,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
    color: tokens.colors.text,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: tokens.colors.textSecondary,
    marginBottom: 6,
  },
  progressWrapper: {
    marginTop: 4,
  },
});
