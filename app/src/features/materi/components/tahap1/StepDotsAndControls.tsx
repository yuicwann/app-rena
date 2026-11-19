import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/shared/ui/Text';
import { DIAGRAM_NODES } from './tahap1Data';

interface StepDotsAndControlsProps {
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  isAutoPlaying: boolean;
  onToggleAuto: () => void;
}

export function StepDotsAndControls({
  activeIndex,
  onSelectIndex,
  isAutoPlaying,
  onToggleAuto,
}: StepDotsAndControlsProps) {
  return (
    <View style={styles.container}>
      {/* 7 Step Dots */}
      <View style={styles.dotsRow}>
        {DIAGRAM_NODES.map((_, i) => {
          const isActive = i === activeIndex;
          const isDone = i < activeIndex;

          return (
            <Pressable
              key={i}
              onPress={() => onSelectIndex(i)}
              style={[
                styles.dot,
                isActive && styles.dotActive,
                isDone && styles.dotDone,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Langkah ${i + 1}`}
            />
          );
        })}
      </View>

      {/* Auto Play / Pause Toggle Button */}
      <Pressable
        onPress={onToggleAuto}
        style={({ pressed }) => [
          styles.autoButton,
          isAutoPlaying ? styles.autoButtonActive : styles.autoButtonPaused,
          pressed && styles.buttonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={isAutoPlaying ? 'Jeda otomatis' : 'Putar otomatis'}
      >
        <Ionicons
          name={isAutoPlaying ? 'pause' : 'play'}
          size={14}
          color="#ffffff"
        />
        <Text style={styles.autoButtonText}>
          {isAutoPlaying ? 'Otomatis' : 'Putar'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#e5e5e5',
  },
  dotActive: {
    backgroundColor: '#2fb8ff',
    transform: [{ scale: 1.3 }],
  },
  dotDone: {
    backgroundColor: '#a5ed6e',
  },
  autoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  autoButtonActive: {
    backgroundColor: '#2fb8ff',
    shadowColor: '#1899d6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  autoButtonPaused: {
    backgroundColor: '#777777',
  },
  autoButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
});
