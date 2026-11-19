import React from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '@/shared/theme/tokens';

export interface TimelineConnectorProps {
  isGreen?: boolean;
}

export function TimelineConnector({ isGreen = false }: TimelineConnectorProps) {
  return (
    <View
      style={[
        styles.connector,
        isGreen ? styles.greenConnector : styles.grayConnector,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  connector: {
    position: 'absolute',
    left: 20,
    top: 22, // Starts from center of the current icon
    bottom: -22, // Extends all the way to center of the next icon
    width: 4,
    borderRadius: 9999,
    zIndex: 0,
  },
  greenConnector: {
    backgroundColor: tokens.colors.primaryFixed,
  },
  grayConnector: {
    backgroundColor: tokens.colors.border,
  },
});
