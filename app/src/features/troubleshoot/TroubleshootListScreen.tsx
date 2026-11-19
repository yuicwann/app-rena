import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Header } from '@/features/gamification';
import { useProgressStore } from '@/store/progressStore';
import { t } from '@/i18n';
import troubleshootContent from '@/content/troubleshoot.json';

export function TroubleshootListScreen() {
  const casesProgress = useProgressStore((s) => s.troubleshoot);
  const cases = troubleshootContent.cases;

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerBanner}>
          <Text variant="titleMedium" style={styles.title}>
            {t('troubleshoot.title')}
          </Text>
          <Text variant="bodySmall" color={tokens.colors.textMuted}>
            Diagnosa kerusakan blok rangkaian radio superheterodyne
          </Text>
        </View>

        <View style={styles.casesList}>
          {cases.map((c) => {
            const prog = casesProgress[c.id];
            const solved = prog?.solved ?? false;
            const stars = prog?.bestStars ?? 0;

            return (
              <Card key={c.id} style={styles.caseCard}>
                <View style={styles.caseHeader}>
                  <View style={styles.badgeMode}>
                    <Text variant="caption" style={styles.badgeModeText}>
                      {c.mode}
                    </Text>
                  </View>
                  <View style={styles.titleContainer}>
                    <Text variant="titleSmall" style={styles.caseTitle}>
                      {c.title}
                    </Text>
                    <Text variant="bodySmall" color={tokens.colors.textMuted}>
                      {c.symptom}
                    </Text>
                  </View>
                </View>

                <View style={styles.caseFooter}>
                  <View style={styles.starsRow}>
                    <Text variant="bodySmall">
                      {'★'.repeat(stars)}
                      {'☆'.repeat(3 - stars)}
                    </Text>
                  </View>
                  <Button
                    label={solved ? 'Coba Lagi' : t('troubleshoot.diagnose')}
                    variant={solved ? 'outline' : 'primary'}
                    size="small"
                    onPress={() => {
                      // Navigate to diagnose screen
                    }}
                  />
                </View>
              </Card>
            );
          })}
        </View>
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
  casesList: {
    gap: tokens.spacing.md,
  },
  caseCard: {
    gap: tokens.spacing.md,
  },
  caseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.md,
  },
  badgeMode: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 4,
    borderRadius: tokens.radii.sm,
    backgroundColor: tokens.colors.primaryLight,
  },
  badgeModeText: {
    fontWeight: '800',
    color: tokens.colors.primaryDark,
  },
  titleContainer: {
    flex: 1,
    gap: 2,
  },
  caseTitle: {
    fontWeight: '700',
  },
  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
    paddingTop: tokens.spacing.sm,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
