import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';
import { DuoCard } from '@/shared/ui/DuoCard';
import { LearningModule } from '../types/dashboard';

export interface UpcomingModuleHeaderProps {
  module: LearningModule;
}

export function UpcomingModuleHeader({ module }: UpcomingModuleHeaderProps) {
  return (
    <DuoCard variant="default" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.tagWrapper}>
          <Ionicons name="lock-closed" size={12} color={tokens.colors.textDisabled} />
          <Text style={styles.moduleTag}>
            MODUL {module.moduleNumber} • BERIKUTNYA
          </Text>
        </View>
        <Text style={styles.stepCountText}>
          {module.steps.length} Tahap
        </Text>
      </View>

      <Text variant="titleSmall" style={styles.title}>
        {module.title}
      </Text>

      <Text variant="bodySmall" style={styles.description} numberOfLines={2}>
        {module.description}
      </Text>
    </DuoCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    padding: tokens.spacing.md,
    backgroundColor: '#F8F9FA',
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  tagWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moduleTag: {
    fontSize: 11,
    fontWeight: '800',
    color: tokens.colors.textDisabled,
    letterSpacing: 0.5,
  },
  stepCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.textDisabled,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 21,
    color: tokens.colors.textMuted,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    color: tokens.colors.textDisabled,
  },
});
