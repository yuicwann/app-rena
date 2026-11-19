import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/shared/theme/tokens';
import { StepStatus, StepType } from '../types/dashboard';

export interface TimelineStepNodeProps {
  status: StepStatus;
  type: StepType;
  isGuestLocked?: boolean;
}

export function TimelineStepNode({ status, type, isGuestLocked = false }: TimelineStepNodeProps) {
  if (isGuestLocked) {
    return (
      <View style={[styles.nodeBase, styles.lockedNode]}>
        <Ionicons name="lock-closed" size={18} color={tokens.colors.textDisabled} />
      </View>
    );
  }

  if (status === 'completed') {
    return (
      <View style={[styles.nodeBase, styles.completedNode]}>
        <Ionicons name="checkmark" size={24} color="#FFFFFF" />
      </View>
    );
  }

  if (status === 'active') {
    return (
      <View style={styles.activeRingWrapper}>
        <View style={[styles.nodeBase, styles.activeNode]}>
          <Ionicons
            name={type === 'material' ? 'book' : 'document-text'}
            size={20}
            color="#FFFFFF"
          />
        </View>
      </View>
    );
  }

  // Locked
  return (
    <View style={[styles.nodeBase, styles.lockedNode]}>
      <Ionicons
        name={type === 'practical' ? 'options' : 'lock-closed'}
        size={18}
        color={tokens.colors.textDisabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  nodeBase: {
    width: 44,
    height: 44,
    borderRadius: tokens.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  completedNode: {
    backgroundColor: tokens.colors.primary,
    borderBottomWidth: 4,
    borderBottomColor: tokens.colors.primaryDark,
  },
  activeRingWrapper: {
    width: 44,
    height: 44,
    borderRadius: tokens.radii.lg,
    padding: 2,
    borderWidth: 3,
    borderColor: tokens.colors.primaryStorybook,
    backgroundColor: tokens.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  activeNode: {
    width: 38,
    height: 38,
    backgroundColor: tokens.colors.primary,
    borderBottomWidth: 3,
    borderBottomColor: tokens.colors.primaryDark,
  },
  lockedNode: {
    backgroundColor: tokens.colors.surface,
    borderWidth: 2,
    borderColor: tokens.colors.border,
    borderBottomWidth: 4,
    borderBottomColor: tokens.colors.borderDark,
  },
});
