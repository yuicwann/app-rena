import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '@/shared/theme/tokens';
import {
  DEFAULT_FREQ_KHZ,
  AtmosphereMode,
  StageId,
  getResonanceMatch,
} from '../../constants/receptionConstants';
import { RadioReceptionCanvas } from './RadioReceptionCanvas';
import { TunerControls } from './TunerControls';
import { StageDetailCard } from './StageDetailCard';

interface RadioReceptionSimProps {
  isFocused: boolean;
}

export function RadioReceptionSim({ isFocused }: RadioReceptionSimProps) {
  const [currentFreqKHz, setCurrentFreqKHz] = useState<number>(DEFAULT_FREQ_KHZ);
  const [atmosphereMode, setAtmosphereMode] = useState<AtmosphereMode>('day');
  const [activeStage, setActiveStage] = useState<StageId>('tuner');

  const handleFreqChange = useCallback((freq: number) => {
    setCurrentFreqKHz(freq);
  }, []);

  const handleAtmosphereChange = useCallback((mode: AtmosphereMode) => {
    setAtmosphereMode(mode);
  }, []);

  const handleSelectStage = useCallback((stage: StageId) => {
    setActiveStage(stage);
  }, []);

  const { matchedStation, resonanceStrength, isLocked } = useMemo(
    () => getResonanceMatch(currentFreqKHz),
    [currentFreqKHz]
  );

  return (
    <View style={styles.container}>
      {/* 1. Kanvas Animasi Fisika Bersih */}
      <RadioReceptionCanvas
        currentFreqKHz={currentFreqKHz}
        activeStage={activeStage}
        onSelectStage={handleSelectStage}
        atmosphereMode={atmosphereMode}
        isFocused={isFocused}
        resonanceStrength={resonanceStrength}
        isLocked={isLocked}
        matchedStation={matchedStation}
      />

      {/* 2. Kontrol Penala Frekuensi & Propagasi */}
      <TunerControls
        currentFreqKHz={currentFreqKHz}
        onFreqChange={handleFreqChange}
        matchedStation={matchedStation}
        resonanceStrength={resonanceStrength}
        isLocked={isLocked}
        atmosphereMode={atmosphereMode}
        onAtmosphereChange={handleAtmosphereChange}
      />

      {/* 3. Penjelasan Komponen Terpilih */}
      <StageDetailCard activeStage={activeStage} onSelectStage={handleSelectStage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: tokens.spacing.md,
  },
});
