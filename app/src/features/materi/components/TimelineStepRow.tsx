import React from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '@/shared/theme/tokens';
import { TimelineStepNode } from './TimelineStepNode';
import { TimelineConnector } from './TimelineConnector';
import { TimelineStepCard } from './TimelineStepCard';
import { TimelineStepItem } from '../types/dashboard';

export interface TimelineStepRowProps {
  step: TimelineStepItem;
  isLast: boolean;
  onPressAction?: () => void;
  isGuestLocked?: boolean;
}

export function TimelineStepRow({
  step,
  isLast,
  onPressAction,
  isGuestLocked = false,
}: TimelineStepRowProps) {
  // If current step is completed and not guest-locked, connector is green; otherwise gray
  const isConnectorGreen = !isGuestLocked && step.status === 'completed';

  return (
    <View style={styles.row}>
      {/* Left Column: Node & Connector */}
      <View style={styles.nodeColumn}>
        {!isLast && <TimelineConnector isGreen={isConnectorGreen} />}
        <TimelineStepNode
          status={step.status}
          type={step.type}
          isGuestLocked={isGuestLocked}
        />
      </View>

      {/* Right Column: Step Card */}
      <TimelineStepCard
        step={step}
        onPressAction={onPressAction}
        isGuestLocked={isGuestLocked}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: tokens.spacing.md,
    paddingBottom: tokens.spacing.md,
    overflow: 'visible',
  },
  nodeColumn: {
    alignItems: 'center',
    position: 'relative',
    width: 44,
    overflow: 'visible',
  },
});
