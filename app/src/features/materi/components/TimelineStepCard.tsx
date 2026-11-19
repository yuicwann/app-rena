import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';
import { DuoCard } from '@/shared/ui/DuoCard';
import { DuoBadge } from '@/shared/ui/DuoBadge';
import { DuoButton } from '@/shared/ui/DuoButton';
import { TimelineStepItem } from '../types/dashboard';

export interface TimelineStepCardProps {
  step: TimelineStepItem;
  onPressAction?: () => void;
  isGuestLocked?: boolean;
}

export function TimelineStepCard({
  step,
  onPressAction,
  isGuestLocked = false,
}: TimelineStepCardProps) {
  const isCompleted = !isGuestLocked && step.status === 'completed';
  const isActive = !isGuestLocked && step.status === 'active';

  // 1. ACTIVE STEP: The Hero Focal Point
  if (isActive) {
    return (
      <DuoCard variant="active" style={styles.activeCard}>
        <View style={styles.cardHeader}>
          <View style={styles.activePillTag}>
            <View style={styles.pulsingDot} />
            <Text style={styles.activePillText}>
              {step.type === 'material'
                ? `TAHAP ${step.stepNumber} • MATERI AJAR`
                : `TAHAP ${step.stepNumber} • AKTIF SEKARANG`}
            </Text>
          </View>
        </View>

        <Text variant="titleSmall" style={styles.activeTitle}>
          {step.title}
        </Text>

        <Text variant="bodySmall" style={styles.activeDescription} numberOfLines={2}>
          {step.description}
        </Text>

        <View style={styles.activeButtonWrapper}>
          <DuoButton
            label={step.buttonLabel ?? 'LANJUT BELAJAR'}
            variant="green"
            size="medium"
            icon={<Ionicons name="play" size={16} color="#FFFFFF" />}
            onPress={() => onPressAction?.()}
          />
        </View>
      </DuoCard>
    );
  }

  // 2. COMPLETED STEP: Clean, Rewarded, and Compact
  if (isCompleted) {
    return (
      <Pressable
        onPress={() => onPressAction?.()}
        style={({ pressed }) => [pressed && styles.cardPressed]}
        accessibilityRole="button"
        accessibilityLabel={`Tahap ${step.stepNumber} selesai: ${step.title}`}
      >
        <DuoCard variant="default" style={styles.completedCard}>
          <View style={styles.completedHeader}>
            <Text style={styles.completedTag}>
              {step.type === 'material'
                ? `TAHAP ${step.stepNumber} • MATERI AJAR SELESAI`
                : `TAHAP ${step.stepNumber} • SELESAI`}
            </Text>
            {step.score !== undefined && (
              <DuoBadge
                label={`★ ${step.score}`}
                variant="greenWash"
                textStyle={styles.scoreText}
              />
            )}
          </View>

          <View style={styles.completedContentRow}>
            <Text style={styles.completedTitle} numberOfLines={1}>
              {step.title}
            </Text>
          </View>
        </DuoCard>
      </Pressable>
    );
  }

  // 3. LOCKED STEP (or GUEST LOCKED): Quiet, De-emphasized, Calm
  return (
    <Pressable
      onPress={() => (isGuestLocked ? onPressAction?.() : undefined)}
      disabled={!isGuestLocked}
      style={({ pressed }) => [styles.lockedCard, pressed && isGuestLocked && styles.cardPressed]}
    >
      <View style={styles.lockedHeader}>
        <Text style={styles.lockedTag}>
          TAHAP {step.stepNumber}
        </Text>
        <Ionicons name="lock-closed" size={13} color={tokens.colors.textDisabled} />
      </View>

      <Text style={styles.lockedTitle} numberOfLines={1}>
        {step.title}
      </Text>

      {isGuestLocked ? (
        <Text style={styles.lockedConditionAmber} numberOfLines={1}>
          Masuk akun kelas untuk membuka tahap ini
        </Text>
      ) : step.conditionText ? (
        <Text style={styles.lockedCondition} numberOfLines={1}>
          {step.conditionText}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Active Hero Card
  activeCard: {
    flex: 1,
    padding: tokens.spacing.md,
    gap: 6,
    borderWidth: 2,
    borderColor: tokens.colors.primary,
    backgroundColor: '#FFFFFF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  activePillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: tokens.colors.primary,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '900',
    color: tokens.colors.primaryDarkText,
    letterSpacing: 0.5,
  },
  activeTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    color: tokens.colors.text,
  },
  activeDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: tokens.colors.textSecondary,
    marginBottom: 4,
  },
  activeButtonWrapper: {
    marginTop: 2,
  },

  // Completed Compact Card
  completedCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: tokens.spacing.md,
    gap: 4,
    backgroundColor: '#FFFFFF',
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completedTag: {
    fontSize: 10,
    fontWeight: '900',
    color: tokens.colors.primaryDarkText,
    letterSpacing: 0.5,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '900',
  },
  completedContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.sm,
  },
  completedTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.text,
  },

  // Locked Calm Card
  lockedCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: tokens.radii.lg,
    paddingVertical: 10,
    paddingHorizontal: tokens.spacing.md,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    borderBottomWidth: 3,
    borderBottomColor: tokens.colors.borderDark,
    gap: 2,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  lockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lockedTag: {
    fontSize: 10,
    fontWeight: '800',
    color: tokens.colors.textDisabled,
    letterSpacing: 0.4,
  },
  lockedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.textMuted,
  },
  lockedCondition: {
    fontSize: 11,
    color: tokens.colors.textDisabled,
    fontWeight: '500',
    marginTop: 1,
  },
  lockedConditionAmber: {
    fontSize: 11,
    color: tokens.colors.accentDark,
    fontWeight: '600',
    marginTop: 1,
  },
});
