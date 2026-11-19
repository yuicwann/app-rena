import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { tokens } from '@/shared/theme/tokens';

export interface DuoBadgeProps {
  label: string;
  variant?: 'greenPill' | 'greenWash' | 'amber' | 'slate' | 'neutral';
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function DuoBadge({
  label,
  variant = 'greenPill',
  icon,
  style,
  textStyle,
}: DuoBadgeProps) {
  return (
    <View style={[styles.base, styles[variant], style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.baseText, styles[`${variant}Text` as keyof typeof styles], textStyle]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: tokens.radii.sm,
    gap: 4,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  greenPill: {
    backgroundColor: tokens.colors.primaryPill,
    borderWidth: 1,
    borderColor: '#B8ED9F',
  },
  greenWash: {
    backgroundColor: tokens.colors.primaryLight,
    borderWidth: 1,
    borderColor: tokens.colors.primaryBorderActive,
  },
  amber: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  slate: {
    backgroundColor: tokens.colors.surface,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  neutral: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  baseText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  greenPillText: {
    color: tokens.colors.primaryDarkText,
  },
  greenWashText: {
    color: '#22722B',
  },
  amberText: {
    color: '#92400E',
  },
  slateText: {
    color: tokens.colors.textMuted,
  },
  neutralText: {
    color: tokens.colors.textSecondary,
  },
});
