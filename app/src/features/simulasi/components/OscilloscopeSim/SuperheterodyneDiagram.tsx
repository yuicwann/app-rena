import React from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';
import { Card } from '@/shared/ui/Card';
import { ModulationMode, MODULATION_CONFIGS } from '../../constants/oscilloscopeConstants';

interface SuperheterodyneDiagramProps {
  mode: ModulationMode;
}

export function SuperheterodyneDiagram({ mode }: SuperheterodyneDiagramProps) {
  const config = MODULATION_CONFIGS[mode];

  const steps = [
    { num: '1', title: 'RF Amp', desc: 'Penguat sinyal antena' },
    { num: '2', title: 'Mixer + LO', desc: 'Pencampur osilator lokal' },
    { num: '3', title: `IF (${config.standardIF})`, desc: 'Filter selektif frekuensi tetap' },
    { num: '4', title: 'Detektor', desc: 'Ekstraksi suara audio' },
  ];

  return (
    <Card style={styles.container}>
      <View style={styles.headerRow}>
        <Text variant="titleSmall" style={styles.titleText}>
          Arsitektur Superheterodyne
        </Text>
        <Text variant="caption" color={tokens.colors.textMuted}>
          Standar {mode}
        </Text>
      </View>

      <Text variant="bodySmall" color={tokens.colors.textSecondary} style={styles.descText}>
        Sinyal stasiun radio diubah menjadi frekuensi perantara tetap ({config.standardIF}) agar
        mudah disaring dan distabilkan sebelum dideteksi.
      </Text>

      {/* Step Grid (2x2 atau baris rapi) */}
      <View style={styles.stepGrid}>
        {steps.map((s) => (
          <View key={s.num} style={styles.stepItem}>
            <Text variant="caption" style={styles.stepTitle}>
              {s.num}. {s.title}
            </Text>
            <Text variant="caption" color={tokens.colors.textMuted} style={styles.stepDesc}>
              {s.desc}
            </Text>
          </View>
        ))}
      </View>

      {/* Insight Note Bersih */}
      <View style={styles.noteBox}>
        <Text variant="caption" color={tokens.colors.textMuted} style={styles.noteText}>
          <Text variant="caption" style={styles.noteBold}>Keunggulan: </Text>
          Filter IF tidak perlu diatur ulang saat berpindah stasiun. Penyetelan hanya menggeser
          frekuensi Osilator Lokal (LO).
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
  titleText: {
    fontWeight: '800',
    color: tokens.colors.text,
  },
  descText: {
    lineHeight: 20,
  },
  stepGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stepItem: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: tokens.colors.surfaceContainerLow,
    padding: tokens.spacing.sm,
    borderRadius: tokens.radii.md,
    gap: 3,
  },
  stepTitle: {
    fontWeight: '700',
    color: tokens.colors.text,
  },
  stepDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  noteBox: {
    backgroundColor: tokens.colors.surfaceContainerLow,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: tokens.radii.sm,
  },
  noteText: {
    lineHeight: 18,
  },
  noteBold: {
    fontWeight: '700',
    color: tokens.colors.text,
  },
});
