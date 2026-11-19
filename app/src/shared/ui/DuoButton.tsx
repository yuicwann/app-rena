import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import { tokens } from '@/shared/theme/tokens';

export interface DuoButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'green' | 'white' | 'blue' | 'accent' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
}

export function DuoButton({
  label,
  onPress,
  variant = 'green',
  size = 'large',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  accessibilityLabel,
}: DuoButtonProps) {
  const isInteractive = !disabled && !loading;

  return (
    <Pressable
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        pressed && styles.pressed,
        pressed && variant === 'green' && styles.greenPressed,
        pressed && variant === 'white' && styles.whitePressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'white' ? tokens.colors.primary : '#FFFFFF'} />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
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
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: tokens.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.xs,
  },
  iconContainer: {
    marginRight: 2,
  },
  // Variants
  green: {
    backgroundColor: tokens.colors.primary,
    borderBottomWidth: 4,
    borderBottomColor: tokens.colors.primaryDark,
  },
  white: {
    backgroundColor: tokens.colors.surface,
    borderWidth: 2,
    borderColor: tokens.colors.border,
    borderBottomWidth: 3,
    borderBottomColor: tokens.colors.borderDark,
  },
  blue: {
    backgroundColor: tokens.colors.secondary,
    borderBottomWidth: 4,
    borderBottomColor: tokens.colors.secondaryDark,
  },
  accent: {
    backgroundColor: tokens.colors.accent,
    borderBottomWidth: 4,
    borderBottomColor: tokens.colors.accentDark,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: tokens.colors.primary,
    borderBottomWidth: 2,
  },
  danger: {
    backgroundColor: tokens.colors.error,
    borderBottomWidth: 4,
    borderBottomColor: '#8E1313',
  },
  // Sizes
  small: {
    minHeight: 36,
    paddingVertical: 6,
    paddingHorizontal: tokens.spacing.md,
  },
  medium: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: tokens.spacing.lg,
  },
  large: {
    minHeight: 50,
    paddingVertical: 12,
    paddingHorizontal: tokens.spacing.xl,
  },
  // Press States
  pressed: {
    transform: [{ translateY: 2 }],
  },
  greenPressed: {
    borderBottomWidth: 2,
  },
  whitePressed: {
    borderBottomWidth: 1,
  },
  disabled: {
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
    borderBottomWidth: 2,
  },
  // Typography
  baseText: {
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  greenText: {
    color: '#FFFFFF',
  },
  whiteText: {
    color: tokens.colors.textSecondary,
  },
  blueText: {
    color: '#FFFFFF',
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
    fontSize: tokens.typography.caption.fontSize,
  },
  mediumText: {
    fontSize: tokens.typography.bodySmall.fontSize,
  },
  largeText: {
    fontSize: tokens.typography.body.fontSize,
  },
  disabledText: {
    color: tokens.colors.textMuted,
  },
});
