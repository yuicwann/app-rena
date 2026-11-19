import React from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';
import { DuoBadge } from '@/shared/ui/DuoBadge';
import { StudentProfile } from '../types/dashboard';

export interface StudentGreetingProps {
  student: StudentProfile;
}

export function StudentGreeting({ student }: StudentGreetingProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text variant="titleMedium" style={styles.greetingTitle}>
          Halo, {student.name}
        </Text>
        <DuoBadge
          label={`${student.progressPercentage}% Progres`}
          variant="amber"
          style={styles.levelBadge}
        />
      </View>
      <Text variant="bodySmall" color={tokens.colors.textMuted} style={styles.programSubtitle}>
        {student.program}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.lg,
    paddingHorizontal: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: tokens.colors.text,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: tokens.radii.full,
  },
  programSubtitle: {
    marginTop: 2,
    fontWeight: '600',
  },
});
