import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/shared/theme/tokens';

export interface DuoAlertProps {
  message: string;
  variant?: 'error' | 'warning' | 'info' | 'success';
  style?: StyleProp<ViewStyle>;
  onClose?: () => void;
}

export function DuoAlert({
  message,
  variant = 'error',
  style,
}: DuoAlertProps) {
  const isError = variant === 'error';
  const isWarning = variant === 'warning';
  const isSuccess = variant === 'success';

  const iconName: keyof typeof Ionicons.glyphMap = isError
    ? 'alert-circle'
    : isWarning
    ? 'warning'
    : isSuccess
    ? 'checkmark-circle'
    : 'information-circle';

  return (
    <View style={[styles.container, styles[variant], style]}>
      <Ionicons
        name={iconName}
        size={20}
        color={
          isError
            ? tokens.colors.error
            : isWarning
            ? tokens.colors.accentDark
            : isSuccess
            ? tokens.colors.primaryDarkText
            : tokens.colors.secondaryDark
        }
        style={styles.icon}
      />
      <Text style={[styles.text, styles[`${variant}Text` as keyof typeof styles]]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm + 2,
    borderRadius: tokens.radii.md,
    borderWidth: 1.5,
    borderBottomWidth: 3,
  },
  icon: {
    marginRight: tokens.spacing.sm,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  error: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FFCDD2',
    borderBottomColor: '#EF9A9A',
  },
  errorText: {
    color: '#B71C1C',
  },
  warning: {
    backgroundColor: '#FFFDE7',
    borderColor: '#FFF59D',
    borderBottomColor: '#FFEE58',
  },
  warningText: {
    color: '#F57F17',
  },
  success: {
    backgroundColor: tokens.colors.primaryLight,
    borderColor: '#C6F0B4',
    borderBottomColor: '#A5ED6E',
  },
  successText: {
    color: tokens.colors.primaryDarkText,
  },
  info: {
    backgroundColor: tokens.colors.secondaryLight,
    borderColor: '#B3E5FC',
    borderBottomColor: '#81D4FA',
  },
  infoText: {
    color: '#01579B',
  },
});
