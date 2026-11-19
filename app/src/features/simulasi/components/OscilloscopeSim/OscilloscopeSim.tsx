import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '@/shared/theme/tokens';
import {
  ModulationMode,
  SignalInspectionStage,
} from '../../constants/oscilloscopeConstants';
import { OscilloscopeCanvas } from './OscilloscopeCanvas';
import { OscilloscopeControls } from './OscilloscopeControls';
import { SuperheterodyneDiagram } from './SuperheterodyneDiagram';

interface OscilloscopeSimProps {
  isFocused: boolean;
}

export function OscilloscopeSim({ isFocused }: OscilloscopeSimProps) {
  const [mode, setMode] = useState<ModulationMode>('AM');
  const [stage, setStage] = useState<SignalInspectionStage>('rf');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [timeDivScale, setTimeDivScale] = useState<number>(1.0);
  const [voltDivScale, setVoltDivScale] = useState<number>(1.0);

  return (
    <View style={styles.container}>
      {/* 1. CRT Oscilloscope Screen */}
      <OscilloscopeCanvas
        mode={mode}
        stage={stage}
        isPlaying={isPlaying}
        isFocused={isFocused}
        timeDivScale={timeDivScale}
        voltDivScale={voltDivScale}
      />

      {/* 2. Oscilloscope Knobs & Signal Test Point Controls */}
      <OscilloscopeControls
        mode={mode}
        onModeChange={setMode}
        stage={stage}
        onStageChange={setStage}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((prev) => !prev)}
        timeDivScale={timeDivScale}
        onTimeDivChange={setTimeDivScale}
        voltDivScale={voltDivScale}
        onVoltDivChange={setVoltDivScale}
      />

      {/* 3. Superheterodyne Architecture Explanation */}
      <SuperheterodyneDiagram mode={mode} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: tokens.spacing.md,
  },
});
