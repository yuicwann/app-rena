import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { tokens } from '@/shared/theme/tokens';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1.5,
    borderColor: tokens.colors.cardBorder,
    borderBottomWidth: 3,
  },
});
