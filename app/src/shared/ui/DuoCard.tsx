import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Pressable } from 'react-native';
import { tokens } from '@/shared/theme/tokens';

export interface DuoCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'active' | 'subtle';
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function DuoCard({
  children,
  variant = 'default',
  style,
  onPress,
  accessibilityLabel,
}: DuoCardProps) {
  const cardStyle = [
    styles.base,
    styles[variant],
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [
          cardStyle,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
  },
  default: {
    borderWidth: 2,
    borderColor: tokens.colors.border,
    borderBottomWidth: 4,
    borderBottomColor: tokens.colors.border,
  },
  active: {
    borderWidth: 2,
    borderColor: tokens.colors.primary,
    borderBottomWidth: 4,
    borderBottomColor: tokens.colors.primaryBorderActive,
  },
  subtle: {
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    borderBottomWidth: 2,
    borderBottomColor: tokens.colors.borderDark,
  },
  pressed: {
    transform: [{ translateY: 1 }],
  },
});
