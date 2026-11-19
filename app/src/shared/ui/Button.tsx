import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  AccessibilityRole,
} from 'react-native';
import { tokens } from '@/shared/theme/tokens';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityRole = 'button',
}: ButtonProps) {
  const isInteractive = !disabled && !loading;

  return (
    <Pressable
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      accessible={true}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? tokens.colors.primary : '#FFFFFF'} />
      ) : (
        <Text
          style={[
            styles.baseText,
            styles[`${variant}Text` as keyof typeof styles],
            styles[`${size}Text` as keyof typeof styles],
            disabled && styles.disabledText,
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: tokens.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: tokens.spacing.lg,
    borderBottomWidth: 3,
  },
  primary: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primaryDark,
  },
  secondary: {
    backgroundColor: tokens.colors.surface,
    borderColor: tokens.colors.border,
  },
  accent: {
    backgroundColor: tokens.colors.accent,
    borderColor: tokens.colors.accentDark,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: tokens.colors.primary,
    borderWidth: 1.5,
    borderBottomWidth: 1.5,
  },
  danger: {
    backgroundColor: tokens.colors.error,
    borderColor: '#B8282D',
  },
  small: {
    minHeight: 40,
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.md,
  },
  medium: {
    minHeight: 48,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.lg,
  },
  large: {
    minHeight: 54,
    paddingVertical: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.xl,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ translateY: 1 }],
  },
  disabled: {
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
  },
  baseText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: tokens.colors.text,
  },
  accentText: {
    color: '#3A2E00',
  },
  outlineText: {
    color: tokens.colors.primary,
  },
  dangerText: {
    color: '#FFFFFF',
  },
  smallText: {
    fontSize: tokens.typography.bodySmall.fontSize,
  },
  mediumText: {
    fontSize: tokens.typography.body.fontSize,
  },
  largeText: {
    fontSize: tokens.typography.titleSmall.fontSize,
  },
  disabledText: {
    color: tokens.colors.textMuted,
  },
});
