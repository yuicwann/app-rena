import React from 'react';
import { Text as RNText, StyleSheet, TextStyle, StyleProp } from 'react-native';
import { tokens } from '@/shared/theme/tokens';

export interface TextProps {
  children: React.ReactNode;
  variant?: 'caption' | 'bodySmall' | 'body' | 'titleSmall' | 'titleMedium' | 'titleLarge';
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

export function Text({
  children,
  variant = 'body',
  color = tokens.colors.text,
  style,
  numberOfLines,
}: TextProps) {
  return (
    <RNText
      numberOfLines={numberOfLines}
      style={[styles.base, tokens.typography[variant], { color }, style]}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    color: tokens.colors.text,
  },
});
