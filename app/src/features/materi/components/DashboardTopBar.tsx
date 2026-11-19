import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';
import { DuoBadge } from '@/shared/ui/DuoBadge';
import { getInitials } from '@/shared/lib/initials';
import { StudentProfile } from '../types/dashboard';

export interface DashboardTopBarProps {
  student: StudentProfile;
  isGuest?: boolean;
}

export function DashboardTopBar({ student, isGuest = false }: DashboardTopBarProps) {
  const router = useRouter();
  const initials = student.initials || getInitials(student.name);

  return (
    <View style={styles.container}>
      {/* Left: Warm, clean typography greeting */}
      <View style={styles.greetingCol}>
        <Text variant="titleMedium" style={styles.greetingTitle}>
          Halo, {student.name}
        </Text>
        <Text variant="bodySmall" style={styles.programSubtitle}>
          {student.program}
        </Text>
      </View>

      {/* Right: Progress badge & Profile avatar */}
      <View style={styles.rightSection}>
        <DuoBadge
          label={isGuest ? 'Mode Tamu' : `${student.progressPercentage}%`}
          variant={isGuest ? 'amber' : 'greenWash'}
          textStyle={styles.progressBadgeText}
        />

        <Pressable
          onPress={() => router.push('/profil')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Profil ${student.name}`}
          style={({ pressed }) => [styles.avatarButton, pressed && styles.avatarPressed]}
        >
          <View style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  greetingCol: {
    flex: 1,
    paddingRight: tokens.spacing.sm,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: tokens.colors.text,
    letterSpacing: -0.3,
  },
  programSubtitle: {
    fontSize: 13,
    color: tokens.colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  progressBadgeText: {
    fontSize: 12,
    fontWeight: '900',
  },
  avatarButton: {
    position: 'relative',
  },
  avatarPressed: {
    transform: [{ scale: 0.95 }],
  },
  avatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: tokens.colors.surface,
    borderWidth: 2,
    borderColor: tokens.colors.border,
    borderBottomWidth: 3,
    borderBottomColor: tokens.colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: tokens.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: '900',
    color: tokens.colors.primaryDarkText,
  },
});
