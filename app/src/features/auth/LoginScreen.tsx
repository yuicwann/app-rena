import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/shared/theme/tokens';
import { DuoCard } from '@/shared/ui/DuoCard';
import { DuoButton } from '@/shared/ui/DuoButton';
import { useAuthStore } from '@/store/authStore';
import { LoginForm } from './components/LoginForm';

export function LoginScreen() {
  const router = useRouter();
  const guestLogin = useAuthStore((s) => s.guestLogin);

  const handleAuthSuccess = () => {
    router.replace('/(tabs)/materi');
  };

  const handleGuestLogin = () => {
    guestLogin('Siswa Tamu');
    router.replace('/(tabs)/materi');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Header */}
          <View style={styles.headerRow}>
            <View style={styles.brandPill}>
              <View style={styles.brandIconCircle}>
                <Ionicons name="radio" size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.brandTitle}>RadioLingo</Text>
              <View style={styles.badgePill}>
                <Text style={styles.badgeText}>TAV</Text>
              </View>
            </View>
          </View>

          {/* Hero Greeting Section */}
          <View style={styles.heroSection}>
            <Text style={styles.headline}>Selamat Datang!</Text>
            <Text style={styles.subheadline}>
              Masuk atau daftarkan namamu di kelas untuk mulai belajar.
            </Text>
          </View>

          {/* Form Card Container */}
          <DuoCard variant="default" style={styles.card}>
            <View style={styles.formBody}>
              <LoginForm onSuccess={handleAuthSuccess} />
            </View>
          </DuoCard>

          {/* Quick Guest / Demo Option */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ATAU</Text>
            <View style={styles.dividerLine} />
          </View>

          <DuoButton
            label="Eksplorasi sebagai Siswa Tamu"
            variant="white"
            size="medium"
            icon={<Ionicons name="compass-outline" size={18} color={tokens.colors.primaryDarkText} />}
            onPress={handleGuestLogin}
            style={styles.guestButton}
          />

          {/* Footer Note */}
          <Text style={styles.footerNote}>
            SMK Jurusan Audio Video (TAV) • Kurikulum Merdeka
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
    paddingBottom: tokens.spacing.xxl,
    justifyContent: 'center',
  },
  headerRow: {
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radii.full,
    borderWidth: 2,
    borderColor: tokens.colors.border,
    borderBottomWidth: 3,
    borderBottomColor: tokens.colors.borderDark,
    gap: 8,
  },
  brandIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: tokens.colors.text,
    letterSpacing: -0.3,
  },
  badgePill: {
    backgroundColor: tokens.colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: '#C6F0B4',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: tokens.colors.primaryDarkText,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
    paddingHorizontal: tokens.spacing.sm,
  },
  headline: {
    fontSize: 26,
    fontWeight: '900',
    color: tokens.colors.text,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subheadline: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    padding: tokens.spacing.lg,
    gap: tokens.spacing.lg,
  },
  formBody: {
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: tokens.spacing.lg,
    paddingHorizontal: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: tokens.colors.border,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '800',
    color: tokens.colors.textMuted,
    letterSpacing: 0.5,
  },
  guestButton: {
    width: '100%',
  },
  footerNote: {
    marginTop: tokens.spacing.xl,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.textMuted,
  },
});
