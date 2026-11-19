import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';

export type SimulationTab = 'reception' | 'oscilloscope';

interface SimulasiTabBarProps {
  activeTab: SimulationTab;
  onTabChange: (tab: SimulationTab) => void;
}

export function SimulasiTabBar({ activeTab, onTabChange }: SimulasiTabBarProps) {
  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.tabButton, activeTab === 'reception' && styles.tabButtonActive]}
        onPress={() => onTabChange('reception')}
        accessibilityRole="button"
        accessibilityLabel="Pilih simulasi penerimaan gelombang radio"
      >
        <MaterialIcons
          name="settings-input-antenna"
          size={16}
          color={activeTab === 'reception' ? tokens.colors.text : tokens.colors.textMuted}
        />
        <Text
          variant="bodySmall"
          style={[styles.tabText, activeTab === 'reception' && styles.tabTextActive]}
        >
          Penerimaan Radio
        </Text>
      </Pressable>

      <Pressable
        style={[styles.tabButton, activeTab === 'oscilloscope' && styles.tabButtonActive]}
        onPress={() => onTabChange('oscilloscope')}
        accessibilityRole="button"
        accessibilityLabel="Pilih simulasi osiloskop dan superheterodyne"
      >
        <MaterialIcons
          name="graphic-eq"
          size={16}
          color={activeTab === 'oscilloscope' ? tokens.colors.text : tokens.colors.textMuted}
        />
        <Text
          variant="bodySmall"
          style={[styles.tabText, activeTab === 'oscilloscope' && styles.tabTextActive]}
        >
          Osiloskop Sinyal
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.surfaceContainerLow,
    borderRadius: tokens.radii.md,
    padding: 3,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginBottom: tokens.spacing.sm,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: tokens.radii.sm,
  },
  tabButtonActive: {
    backgroundColor: tokens.colors.surface,
    elevation: 1,
  },
  tabText: {
    fontWeight: '600',
    color: tokens.colors.textMuted,
    fontSize: 13,
  },
  tabTextActive: {
    fontWeight: '700',
    color: tokens.colors.text,
  },
});
