import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/shared/theme/tokens';

export interface DuoTextInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export function DuoTextInput({
  label,
  error,
  helperText,
  leftIcon,
  isPassword = false,
  containerStyle,
  value,
  onChangeText,
  placeholder,
  ...rest
}: DuoTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasError = Boolean(error);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focusedContainer,
          hasError && styles.errorContainer,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={
              hasError
                ? tokens.colors.error
                : isFocused
                ? tokens.colors.primaryDark
                : tokens.colors.textMuted
            }
            style={styles.leftIcon}
          />
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={tokens.colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={styles.input}
          accessibilityLabel={label || placeholder}
          {...rest}
        />

        {isPassword && (
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={8}
            style={styles.eyeButton}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={tokens.colors.textMuted}
            />
          </Pressable>
        )}
      </View>

      {hasError ? (
        <View style={styles.messageRow}>
          <Ionicons name="alert-circle" size={14} color={tokens.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: tokens.colors.textSecondary,
    letterSpacing: 0.2,
    marginLeft: 2,
  },
  inputContainer: {
    minHeight: 50,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radii.lg,
    borderWidth: 2,
    borderColor: tokens.colors.border,
    borderBottomWidth: 3.5,
    borderBottomColor: tokens.colors.borderDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
  },
  focusedContainer: {
    borderColor: tokens.colors.primary,
    borderBottomColor: tokens.colors.primaryDark,
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    borderColor: tokens.colors.error,
    borderBottomColor: '#93000A',
    backgroundColor: '#FFF8F8',
  },
  leftIcon: {
    marginRight: tokens.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: tokens.colors.text,
    paddingVertical: 10,
  },
  eyeButton: {
    padding: 6,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginLeft: 2,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.error,
  },
  helperText: {
    fontSize: 12,
    color: tokens.colors.textMuted,
    marginLeft: 2,
  },
});
