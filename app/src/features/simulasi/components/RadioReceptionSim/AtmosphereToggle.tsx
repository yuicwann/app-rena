import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';
import { Card } from '@/shared/ui/Card';
import { AtmosphereMode } from '../../constants/receptionConstants';

interface AtmosphereToggleProps {
  currentMode: AtmosphereMode;
  onModeChange: (mode: AtmosphereMode) => void;
}

export function AtmosphereToggle({
  currentMode,
  onModeChange,
}: AtmosphereToggleProps) {
  const isNight = currentMode === 'night';

  return (
    <Card style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <Text variant="bodySmall" style={styles.titleText}>
            Waktu & Propagasi
          </Text>
          <Text variant="caption" color={tokens.colors.textMuted}>
            {isNight ? 'Lapisan F (Sky Wave)' : 'Lapisan D (Ground Wave)'}
          </Text>
        </View>

        {/* Compact Segmented Switch */}
        <View style={styles.switchContainer}>
          <Pressable
            style={[styles.switchBtn, !isNight && styles.switchBtnActive]}
            onPress={() => onModeChange('day')}
            accessibilityRole="button"
            accessibilityLabel="Pilih waktu siang hari"
          >
            <MaterialIcons
              name="wb-sunny"
              size={14}
              color={!isNight ? tokens.colors.text : tokens.colors.textMuted}
            />
            <Text
              variant="caption"
              style={[styles.switchBtnText, !isNight && styles.switchBtnTextActive]}
            >
              Siang
            </Text>
          </Pressable>

          <Pressable
            style={[styles.switchBtn, isNight && styles.switchBtnActive]}
            onPress={() => onModeChange('night')}
            accessibilityRole="button"
            accessibilityLabel="Pilih waktu malam hari"
          >
            <MaterialIcons
              name="nightlight-round"
              size={14}
              color={isNight ? tokens.colors.text : tokens.colors.textMuted}
            />
            <Text
              variant="caption"
              style={[styles.switchBtnText, isNight && styles.switchBtnTextActive]}
            >
              Malam
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Concise Physics Note */}
      <Text variant="caption" color={tokens.colors.textSecondary} style={styles.descText}>
        {isNight
          ? 'Malam: Lapisan D lenyap, gelombang AM memantul di Lapisan F ionosfer hingga 2.000+ km.'
          : 'Siang: Lapisan D aktif menyerap sinyal AM, jangkauan terbatas pada gelombang tanah (50–150 km).'}
      </Text>
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
    gap: tokens.spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleColumn: {
    gap: 2,
  },
  titleText: {
    fontWeight: '700',
    color: tokens.colors.text,
  },
  switchContainer: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.surfaceContainerLow,
    borderRadius: tokens.radii.full,
    padding: 2,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: tokens.radii.full,
  },
  switchBtnActive: {
    backgroundColor: tokens.colors.surface,
    elevation: 1,
  },
  switchBtnText: {
    fontSize: 11,
    color: tokens.colors.textMuted,
    fontWeight: '600',
  },
  switchBtnTextActive: {
    color: tokens.colors.text,
    fontWeight: '700',
  },
  descText: {
    lineHeight: 18,
    marginTop: 2,
  },
});
