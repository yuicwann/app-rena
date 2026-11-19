import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { t } from '@/i18n';

export function OnboardingScreen() {
  const router = useRouter();
  const currentNickname = useSettingsStore((s) => s.nickname);
  const setNickname = useSettingsStore((s) => s.setNickname);
  const setOnboardingCompleted = useSettingsStore((s) => s.setOnboardingCompleted);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const guestLogin = useAuthStore((s) => s.guestLogin);

  const [inputName, setInputName] = useState(currentNickname);

  const handleStart = () => {
    const finalName = inputName.trim() || 'Siswa Radio';
    setNickname(finalName);
    setOnboardingCompleted(true);

    if (!isAuthenticated) {
      guestLogin(finalName);
    }

    router.replace('/(tabs)/materi');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.heroSection}>
        <View style={styles.iconCircle}>
          <Text style={styles.heroIcon}>📻</Text>
        </View>
        <Text variant="titleLarge" style={styles.welcomeTitle}>
          {t('onboarding.welcome')}
        </Text>
        <Text variant="body" color={tokens.colors.textMuted} style={styles.subtitle}>
          {t('onboarding.subtitle')}
        </Text>
      </View>

      <Card style={styles.formCard}>
        <View style={styles.fieldGroup}>
          <Text variant="titleSmall" style={styles.label}>
            {t('onboarding.enterNickname')}
          </Text>
          <TextInput
            style={styles.textInput}
            value={inputName}
            onChangeText={setInputName}
            placeholder="Misal: Budi Radio"
            placeholderTextColor={tokens.colors.textMuted}
            maxLength={20}
            accessibilityLabel={t('onboarding.enterNickname')}
          />
        </View>

        <Button
          label={t('onboarding.startAction')}
          variant="primary"
          size="large"
          onPress={handleStart}
          style={styles.startButton}
        />

        <Pressable
          onPress={() => router.push('/login')}
          style={styles.loginLink}
          accessibilityRole="button"
          accessibilityLabel="Sudah punya kelas? Masuk di sini"
        >
          <Text variant="bodySmall" color={tokens.colors.primaryDarkText} style={styles.loginLinkText}>
            Sudah punya kelas? Masuk di sini →
          </Text>
        </Pressable>
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
    paddingTop: tokens.spacing.xxl,
    paddingBottom: tokens.spacing.xxl,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
    gap: tokens.spacing.sm,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: tokens.colors.primaryLight,
    borderWidth: 2,
    borderColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.sm,
  },
  heroIcon: {
    fontSize: 40,
  },
  welcomeTitle: {
    fontWeight: '800',
    textAlign: 'center',
    color: tokens.colors.text,
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: tokens.spacing.md,
  },
  formCard: {
    gap: tokens.spacing.lg,
  },
  fieldGroup: {
    gap: tokens.spacing.sm,
  },
  label: {
    fontWeight: '700',
  },
  textInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    paddingHorizontal: tokens.spacing.md,
    fontSize: tokens.typography.body.fontSize,
    color: tokens.colors.text,
    backgroundColor: tokens.colors.surface,
  },
  startButton: {
    marginTop: tokens.spacing.sm,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.xs,
  },
  loginLinkText: {
    fontWeight: '800',
  },
});
