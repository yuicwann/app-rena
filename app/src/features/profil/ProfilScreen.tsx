import React from 'react';
import { View, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { useSettingsStore } from '@/store/settingsStore';
import { useProgressStore } from '@/store/progressStore';
import { useAuthStore } from '@/store/authStore';
import { DuoButton } from '@/shared/ui/DuoButton';
import { getInitials } from '@/shared/lib/initials';
import { t } from '@/i18n';

export function ProfilScreen() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const storeNickname = useSettingsStore((s) => s.nickname);
  const nickname = authUser?.username || storeNickname || 'Siswa';
  const sound = useSettingsStore((s) => s.sound);
  const setSound = useSettingsStore((s) => s.setSound);
  const haptics = useSettingsStore((s) => s.haptics);
  const setHaptics = useSettingsStore((s) => s.setHaptics);

  const progressMateri = useProgressStore((s) => s.materi);
  const resetProgress = useProgressStore((s) => s.resetProgress);

  const completedCount = Object.values(progressMateri).filter((m) => m.completed).length;
  const totalMateri = 4;
  const progressPercent = Math.min(100, Math.round((completedCount / totalMateri) * 100));

  const initials = getInitials(nickname);

  const handleReset = () => {
    Alert.alert(
      'Reset Progres Belajar?',
      'Semua progres materi dan skor kuis akan dikembalikan ke awal. Tindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetProgress();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.topBar}>
        <Button
          label="← Kembali"
          variant="outline"
          size="small"
          onPress={() => router.back()}
          style={styles.backButton}
        />
      </View>

      <Card style={styles.profileCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarCircle}>
            <Text variant="titleMedium" style={styles.avatarText}>
              {initials}
            </Text>
          </View>
          <View style={styles.nameDetails}>
            <Text variant="titleSmall" style={styles.nickname}>
              {nickname}
            </Text>
            <Text variant="bodySmall" color={tokens.colors.textMuted}>
              Progres Pembelajaran: {progressPercent}% Selesai
            </Text>
          </View>
        </View>

        <View style={styles.levelProgressContainer}>
          <View style={styles.levelTextRow}>
            <Text variant="caption" color={tokens.colors.textMuted} style={styles.boldCaption}>
              Kurikulum Radio TAV
            </Text>
            <Text variant="caption" color={tokens.colors.primary} style={styles.boldCaption}>
              {completedCount} dari {totalMateri} Modul ({progressPercent}%)
            </Text>
          </View>
          <ProgressBar progress={progressPercent / 100} />
        </View>
      </Card>

      {/* Akun & Kelas */}
      <Card style={styles.sectionCard}>
        <Text variant="titleSmall" style={styles.sectionTitle}>
          Akun & Kelas
        </Text>
        <View style={styles.accountInfoRow}>
          <View style={styles.accountTextCol}>
            <Text variant="bodySmall" style={styles.accountStatusLabel}>
              {isAuthenticated ? 'Status: Terdaftar di Kelas' : 'Status: Siswa Tamu / Belum Login'}
            </Text>
            <Text variant="body" style={styles.accountClassName}>
              {authUser?.class?.name ? authUser.class.name : 'Belum Terhubung ke Kelas'}
            </Text>
          </View>
        </View>
        <DuoButton
          label={isAuthenticated ? 'Ganti Kelas / Akun' : 'Masuk atau Daftarkan Kelas'}
          variant={isAuthenticated ? 'white' : 'green'}
          size="medium"
          onPress={() => {
            if (isAuthenticated) {
              logout();
            }
            router.push('/login');
          }}
        />
      </Card>

      {/* Pengaturan */}
      <Card style={styles.sectionCard}>
        <Text variant="titleSmall" style={styles.sectionTitle}>
          {t('profil.settings')}
        </Text>

        <View style={styles.settingRow}>
          <Text variant="body">{t('profil.sound')}</Text>
          <Switch
            value={sound}
            onValueChange={setSound}
            trackColor={{ false: tokens.colors.border, true: tokens.colors.primary }}
          />
        </View>

        <View style={styles.settingRow}>
          <Text variant="body">{t('profil.haptics')}</Text>
          <Switch
            value={haptics}
            onValueChange={setHaptics}
            trackColor={{ false: tokens.colors.border, true: tokens.colors.primary }}
          />
        </View>

        <View style={styles.dangerZone}>
          <Button
            label={t('profil.resetProgress')}
            variant="danger"
            size="medium"
            onPress={handleReset}
          />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  scrollContent: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxl,
    gap: tokens.spacing.lg,
  },
  topBar: {
    marginBottom: tokens.spacing.xs,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  profileCard: {
    gap: tokens.spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: tokens.colors.primaryLight,
    borderWidth: 2,
    borderColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '800',
    color: tokens.colors.primary,
  },
  nameDetails: {
    flex: 1,
    gap: 4,
  },
  nickname: {
    fontWeight: '800',
  },
  levelProgressContainer: {
    gap: tokens.spacing.xs,
  },
  levelTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  boldCaption: {
    fontWeight: '700',
  },
  sectionCard: {
    gap: tokens.spacing.md,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  accountInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing.xs,
  },
  accountTextCol: {
    flex: 1,
    gap: 2,
  },
  accountStatusLabel: {
    color: tokens.colors.textMuted,
    fontWeight: '700',
    fontSize: 12,
  },
  accountClassName: {
    fontWeight: '800',
    fontSize: 16,
    color: tokens.colors.text,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: tokens.spacing.xs,
  },
  dangerZone: {
    marginTop: tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
    paddingTop: tokens.spacing.md,
  },
});
