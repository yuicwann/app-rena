import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';
import { Header } from '@/features/gamification';
import { t } from '@/i18n';
import { SimulasiTabBar, SimulationTab } from './components/SimulasiTabBar';
import { RadioReceptionSim } from './components/RadioReceptionSim';
import { OscilloscopeSim } from './components/OscilloscopeSim';

export function SimulasiScreen() {
  const [activeTab, setActiveTab] = useState<SimulationTab>('reception');
  const [isFocused, setIsFocused] = useState<boolean>(true);

  // Hentikan animasi saat layar tidak fokus / user berpindah tab
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => {
        setIsFocused(false);
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title Bersih */}
        <View style={styles.headerBanner}>
          <Text variant="titleMedium" style={styles.title}>
            {t('simulasi.title')}
          </Text>
          <Text variant="caption" color={tokens.colors.textMuted}>
            {activeTab === 'reception'
              ? 'Standar AM & Fisika Penalaan Antena'
              : 'Analisis Sinyal Superheterodyne & Osiloskop CRT'}
          </Text>
        </View>

        {/* Tab Switcher */}
        <SimulasiTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Simulasi 1: Penerimaan Gelombang Radio */}
        {activeTab === 'reception' && <RadioReceptionSim isFocused={isFocused} />}

        {/* Simulasi 2: Superheterodyne & Mini Osiloskop */}
        {activeTab === 'oscilloscope' && <OscilloscopeSim isFocused={isFocused} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  scrollContent: {
    padding: tokens.spacing.md,
    paddingBottom: 100,
    gap: tokens.spacing.md,
  },
  headerBanner: {
    gap: 2,
  },
  title: {
    fontWeight: '800',
    color: tokens.colors.text,
  },
});
