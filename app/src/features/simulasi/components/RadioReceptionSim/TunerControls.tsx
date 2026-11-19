import React, { useCallback, useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';
import { Card } from '@/shared/ui/Card';
import {
  AM_STATIONS,
  FREQ_MIN_KHZ,
  FREQ_MAX_KHZ,
  RadioStation,
  AtmosphereMode,
} from '../../constants/receptionConstants';

interface TunerControlsProps {
  currentFreqKHz: number;
  onFreqChange: (freq: number) => void;
  matchedStation: RadioStation | null;
  resonanceStrength: number;
  isLocked: boolean;
  atmosphereMode: AtmosphereMode;
  onAtmosphereChange: (mode: AtmosphereMode) => void;
}

export function TunerControls({
  currentFreqKHz,
  onFreqChange,
  matchedStation,
  resonanceStrength,
  isLocked,
  atmosphereMode,
  onAtmosphereChange,
}: TunerControlsProps) {
  const initialRatio = Math.max(
    0,
    Math.min(1, (currentFreqKHz - FREQ_MIN_KHZ) / (FREQ_MAX_KHZ - FREQ_MIN_KHZ))
  );

  const needleProgress = useSharedValue(initialRatio);
  const trackWidthShared = useSharedValue(0);
  const needleRef = useRef(needleProgress);
  const trackWidthRef = useRef(trackWidthShared);
  const [trackWidth, setTrackWidth] = useState<number>(0);

  // Animasi jarum penala saat frekuensi berubah (100% animasi halus di UI-Thread GPU)
  useEffect(() => {
    const targetRatio = Math.max(
      0,
      Math.min(1, (currentFreqKHz - FREQ_MIN_KHZ) / (FREQ_MAX_KHZ - FREQ_MIN_KHZ))
    );
    needleRef.current.value = withTiming(targetRatio, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [currentFreqKHz]);

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const w = e.nativeEvent.layout.width;
      if (w > 0) {
        setTrackWidth(w);
        trackWidthRef.current.value = w;
      }
    },
    []
  );

  // Ubah frekuensi bertahap (+10 / -10 kHz)
  const stepFreq = useCallback(
    (delta: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const nextFreq = Math.min(FREQ_MAX_KHZ, Math.max(FREQ_MIN_KHZ, currentFreqKHz + delta));
      onFreqChange(nextFreq);
    },
    [currentFreqKHz, onFreqChange]
  );

  // Klik langsung pada skala untuk melompatkan jarum ke frekuensi target tanpa perlu digeser
  const handleBarPress = useCallback(
    (evt: GestureResponderEvent) => {
      if (trackWidth <= 0) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const x = evt.nativeEvent.locationX;
      const ratio = Math.max(0, Math.min(1, x / trackWidth));
      const rawFreq = FREQ_MIN_KHZ + ratio * (FREQ_MAX_KHZ - FREQ_MIN_KHZ);
      const roundedFreq = Math.round(rawFreq / 10) * 10;
      const nextFreq = Math.max(FREQ_MIN_KHZ, Math.min(FREQ_MAX_KHZ, roundedFreq));
      onFreqChange(nextFreq);
    },
    [trackWidth, onFreqChange]
  );

  const handleStationPress = useCallback(
    (freq: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onFreqChange(freq);
    },
    [onFreqChange]
  );

  // Style animasi jarum penala dan progress bar
  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: trackWidthShared.value > 0 ? needleProgress.value * trackWidthShared.value : 0,
  }));

  const animatedNeedleStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: trackWidthShared.value > 0 ? needleProgress.value * trackWidthShared.value : 0,
      },
    ],
  }));

  const isNight = atmosphereMode === 'night';

  return (
    <Card style={styles.container}>
      {/* Header Row: Judul Penala + Pill Siang/Malam */}
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <Text variant="titleSmall" style={styles.titleText}>
            Penala Frekuensi
          </Text>
          <Text variant="caption" color={tokens.colors.textMuted}>
            {isNight ? 'Pantulan ionosfer (malam)' : 'Gelombang tanah (siang)'}
          </Text>
        </View>

        {/* Compact Siang/Malam Pill Switch */}
        <View style={styles.atmoSwitch}>
          <Pressable
            style={[styles.atmoBtn, !isNight && styles.atmoBtnActive]}
            onPress={() => onAtmosphereChange('day')}
            accessibilityRole="button"
            accessibilityLabel="Pilih waktu siang"
          >
            <MaterialIcons
              name="wb-sunny"
              size={14}
              color={!isNight ? tokens.colors.text : tokens.colors.textMuted}
            />
            <Text variant="caption" style={[styles.atmoText, !isNight && styles.atmoTextActive]}>
              Siang
            </Text>
          </Pressable>

          <Pressable
            style={[styles.atmoBtn, isNight && styles.atmoBtnActive]}
            onPress={() => onAtmosphereChange('night')}
            accessibilityRole="button"
            accessibilityLabel="Pilih waktu malam"
          >
            <MaterialIcons
              name="nightlight-round"
              size={14}
              color={isNight ? tokens.colors.text : tokens.colors.textMuted}
            />
            <Text variant="caption" style={[styles.atmoText, isNight && styles.atmoTextActive]}>
              Malam
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Preset Stasiun: 3 Tombol Klik Langsung */}
      <View style={styles.stationRow}>
        {AM_STATIONS.map((station) => {
          const isSelected = matchedStation?.id === station.id && isLocked;
          return (
            <Pressable
              key={station.id}
              onPress={() => handleStationPress(station.freqKHz)}
              style={[
                styles.stationChip,
                isSelected && [
                  styles.stationChipSelected,
                  { borderColor: station.color, backgroundColor: station.bgLight },
                ],
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Pilih stasiun ${station.name}`}
            >
              <Text
                variant="caption"
                style={[
                  styles.stationFreqText,
                  isSelected && { color: station.color, fontWeight: '800' },
                ]}
              >
                {station.freqKHz} kHz
              </Text>
              <Text
                variant="caption"
                numberOfLines={1}
                style={[
                  styles.stationNameText,
                  isSelected && { color: tokens.colors.text, fontWeight: '700' },
                ]}
              >
                {station.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Skala Frekuensi Interaktif (Cukup Diklik) */}
      <View style={styles.tuningSection}>
        <Pressable
          style={styles.dialScaleContainer}
          onLayout={handleLayout}
          onPress={handleBarPress}
          accessible={true}
          accessibilityRole="adjustable"
          accessibilityLabel="Skala pita frekuensi AM, klik untuk memilih frekuensi"
          accessibilityValue={{ min: FREQ_MIN_KHZ, max: FREQ_MAX_KHZ, now: currentFreqKHz }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(evt) => {
            if (evt.nativeEvent.actionName === 'increment') stepFreq(10);
            else if (evt.nativeEvent.actionName === 'decrement') stepFreq(-10);
          }}
        >
          {/* Track Bar dengan Jarum Penala */}
          <View style={styles.dialTrack} pointerEvents="none">
            <Animated.View style={[styles.dialProgress, animatedProgressStyle]} />
            <Animated.View style={[styles.dialNeedle, animatedNeedleStyle]} />

            {/* Marker titik stasiun pada skala */}
            {AM_STATIONS.map((station) => {
              const stationRatio = (station.freqKHz - FREQ_MIN_KHZ) / (FREQ_MAX_KHZ - FREQ_MIN_KHZ);
              const isThisStation = matchedStation?.id === station.id && isLocked;
              return (
                <View
                  key={station.id}
                  style={[
                    styles.stationMarker,
                    { left: `${stationRatio * 100}%` },
                    isThisStation && [styles.stationMarkerActive, { backgroundColor: station.color }],
                  ]}
                />
              );
            })}
          </View>

          {/* Label Titik Frekuensi di Bawah Skala */}
          <View style={styles.dialLabelsRow} pointerEvents="none">
            <Text variant="caption" style={styles.scaleEdgeLabel}>
              535k
            </Text>
            <Text
              variant="caption"
              style={[
                styles.scaleStationLabel,
                matchedStation?.id === 'st-630' && isLocked && { color: '#0284C7', fontWeight: '800' },
                { left: `${((630 - FREQ_MIN_KHZ) / (FREQ_MAX_KHZ - FREQ_MIN_KHZ)) * 100}%` },
              ]}
            >
              630
            </Text>
            <Text
              variant="caption"
              style={[
                styles.scaleStationLabel,
                matchedStation?.id === 'st-999' && isLocked && { color: '#16A34A', fontWeight: '800' },
                { left: `${((999 - FREQ_MIN_KHZ) / (FREQ_MAX_KHZ - FREQ_MIN_KHZ)) * 100}%` },
              ]}
            >
              999
            </Text>
            <Text
              variant="caption"
              style={[
                styles.scaleStationLabel,
                matchedStation?.id === 'st-1440' && isLocked && { color: '#EA580C', fontWeight: '800' },
                { left: `${((1440 - FREQ_MIN_KHZ) / (FREQ_MAX_KHZ - FREQ_MIN_KHZ)) * 100}%` },
              ]}
            >
              1440
            </Text>
            <Text variant="caption" style={styles.scaleEdgeLabel}>
              1605k
            </Text>
          </View>
        </Pressable>

        {/* Baris Stepper Penala Frekuensi: [-10k] [Frekuensi] [+10k] */}
        <View style={styles.tuningButtonsRow}>
          <Pressable
            style={({ pressed }) => [styles.stepBtn, pressed && styles.stepBtnPressed]}
            onPress={() => stepFreq(-10)}
            accessibilityRole="button"
            accessibilityLabel="Kurangi frekuensi 10 kHz"
          >
            <MaterialIcons name="remove" size={18} color={tokens.colors.text} />
            <Text variant="caption" style={styles.stepBtnText}>-10 kHz</Text>
          </Pressable>

          {/* Tampilan Frekuensi Tengah Besar */}
          <View style={styles.freqDisplayCenter}>
            <Text variant="titleMedium" style={styles.freqDisplayValue}>
              {currentFreqKHz}
            </Text>
            <Text variant="caption" color={tokens.colors.textMuted} style={styles.freqDisplayUnit}>
              kHz AM
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.stepBtn, pressed && styles.stepBtnPressed]}
            onPress={() => stepFreq(10)}
            accessibilityRole="button"
            accessibilityLabel="Tambah frekuensi 10 kHz"
          >
            <MaterialIcons name="add" size={18} color={tokens.colors.text} />
            <Text variant="caption" style={styles.stepBtnText}>+10 kHz</Text>
          </Pressable>
        </View>
      </View>

      {/* Status Output Audio / Feedback Sinyal (1 Baris Bersih) */}
      <View
        style={[
          styles.statusBox,
          isLocked ? styles.statusBoxLocked : styles.statusBoxIdle,
        ]}
      >
        <MaterialIcons
          name={isLocked ? 'volume-up' : resonanceStrength > 0.2 ? 'hearing' : 'radio'}
          size={18}
          color={isLocked ? tokens.colors.primaryDarkText : tokens.colors.textMuted}
        />
        <Text
          variant="caption"
          numberOfLines={1}
          style={[
            styles.statusMessage,
            isLocked && styles.statusMessageLocked,
          ]}
        >
          {isLocked
            ? `${matchedStation?.name}: "${matchedStation?.audioContent}"`
            : resonanceStrength > 0.2
            ? `Sinyal terdeteksi di sekitar ${matchedStation?.freqKHz} kHz`
            : 'Desis statis. Pilih stasiun di atas untuk mendengarkan.'}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.surface,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleColumn: {
    gap: 1,
  },
  titleText: {
    fontWeight: '800',
    color: tokens.colors.text,
  },
  atmoSwitch: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.surfaceContainerLow,
    borderRadius: tokens.radii.full,
    padding: 2,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  atmoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: tokens.radii.full,
  },
  atmoBtnActive: {
    backgroundColor: tokens.colors.surface,
    elevation: 1,
  },
  atmoText: {
    fontSize: 11,
    color: tokens.colors.textMuted,
    fontWeight: '600',
  },
  atmoTextActive: {
    color: tokens.colors.text,
    fontWeight: '700',
  },
  stationRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stationChip: {
    flex: 1,
    backgroundColor: tokens.colors.surfaceContainerLow,
    borderRadius: tokens.radii.md,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    alignItems: 'center',
    gap: 1,
  },
  stationChipSelected: {
    backgroundColor: tokens.colors.surface,
    borderColor: tokens.colors.primary,
    borderWidth: 2,
  },
  stationFreqText: {
    fontWeight: '700',
    fontSize: 12,
    color: tokens.colors.text,
  },
  stationFreqTextSelected: {
    color: tokens.colors.primaryDarkText,
    fontWeight: '800',
  },
  stationNameText: {
    fontSize: 10,
    color: tokens.colors.textMuted,
  },
  stationNameTextSelected: {
    color: tokens.colors.text,
    fontWeight: '600',
  },
  tuningSection: {
    gap: 6,
  },
  dialScaleContainer: {
    paddingVertical: 6,
    justifyContent: 'center',
  },
  dialTrack: {
    height: 8,
    backgroundColor: tokens.colors.border,
    borderRadius: 4,
    position: 'relative',
    justifyContent: 'center',
  },
  dialProgress: {
    height: '100%',
    backgroundColor: tokens.colors.primaryLight,
    borderRadius: 4,
  },
  dialNeedle: {
    position: 'absolute',
    left: 0,
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: tokens.colors.primary,
    marginLeft: -2,
    top: -4,
    elevation: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  stationMarker: {
    position: 'absolute',
    top: 1,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
    marginLeft: -3,
  },
  stationMarkerActive: {
    backgroundColor: tokens.colors.primary,
    transform: [{ scale: 1.3 }],
  },
  dialLabelsRow: {
    position: 'relative',
    height: 14,
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleEdgeLabel: {
    fontSize: 9.5,
    color: tokens.colors.textMuted,
    fontWeight: '600',
  },
  scaleStationLabel: {
    position: 'absolute',
    top: 0,
    width: 44,
    marginLeft: -22,
    textAlign: 'center',
    fontSize: 9.5,
    color: tokens.colors.textMuted,
    fontWeight: '700',
  },
  scaleStationLabelActive: {
    color: tokens.colors.primaryDarkText,
    fontWeight: '900',
  },
  tuningButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  stepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surfaceContainerLow,
    gap: 4,
  },
  stepBtnPressed: {
    backgroundColor: tokens.colors.border,
  },
  stepBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.text,
  },
  freqDisplayCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  freqDisplayValue: {
    fontSize: 20,
    fontWeight: '900',
    color: tokens.colors.text,
    lineHeight: 24,
  },
  freqDisplayUnit: {
    fontSize: 9.5,
    fontWeight: '600',
    color: tokens.colors.textMuted,
    lineHeight: 12,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
  },
  statusBoxIdle: {
    backgroundColor: tokens.colors.surfaceContainerLow,
    borderColor: tokens.colors.border,
  },
  statusBoxLocked: {
    backgroundColor: tokens.colors.primaryLight,
    borderColor: tokens.colors.primaryBorderActive,
  },
  statusMessage: {
    flex: 1,
    color: tokens.colors.textMuted,
    fontSize: 11.5,
  },
  statusMessageLocked: {
    color: tokens.colors.primaryDarkText,
    fontWeight: '700',
  },
});
