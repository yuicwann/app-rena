import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Header } from '@/features/gamification';
import { useProgressStore } from '@/store/progressStore';
import { t } from '@/i18n';

export function EvaluasiScreen() {
  const bestScore = useProgressStore((s) => s.quiz.best);
  const history = useProgressStore((s) => s.quiz.history);

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerBanner}>
          <Text variant="titleMedium" style={styles.title}>
            {t('evaluasi.title')}
          </Text>
          <Text variant="bodySmall" color={tokens.colors.textMuted}>
            Uji pemahaman alur sinyal radio superheterodyne & troubleshooting
          </Text>
        </View>

        <Card style={styles.summaryCard}>
          <View style={styles.scoreRow}>
            <View>
              <Text variant="caption" color={tokens.colors.textMuted}>
                {t('evaluasi.score')} Tertinggi
              </Text>
              <Text variant="titleLarge" style={styles.scoreValue}>
                {bestScore !== null ? `${bestScore}%` : 'Belum Ada'}
              </Text>
            </View>
            <View style={styles.attemptBadge}>
              <Text variant="caption" color={tokens.colors.textMuted}>
                {history.length} kali percobaan
              </Text>
            </View>
          </View>

          <View style={styles.quizInfo}>
            <Text variant="bodySmall" color={tokens.colors.textMuted}>
              • 20 Soal Pilihan Ganda{'\n'}• Syarat Lulus: Nilai ≥ 75{'\n'}• Uji Pemahaman Penalaan & Resonansi Radio
            </Text>
          </View>

          <Button
            label={bestScore !== null ? t('evaluasi.retake') : 'Mulai Kuis'}
            variant="accent"
            onPress={() => {
              // Start quiz session
            }}
          />
        </Card>
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
    padding: tokens.spacing.lg,
    paddingBottom: 110,
  },
  headerBanner: {
    marginBottom: tokens.spacing.xl,
  },
  title: {
    fontWeight: '800',
    color: tokens.colors.text,
  },
  summaryCard: {
    gap: tokens.spacing.lg,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreValue: {
    fontWeight: '800',
    color: tokens.colors.primary,
    marginTop: tokens.spacing.xs,
  },
  attemptBadge: {
    backgroundColor: tokens.colors.background,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radii.full,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  quizInfo: {
    backgroundColor: tokens.colors.background,
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.md,
  },
});
