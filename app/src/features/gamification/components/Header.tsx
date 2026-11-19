import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';
import { getInitials } from '@/shared/lib/initials';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useProgressStore } from '@/store/progressStore';

export function Header() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const storeNickname = useSettingsStore((s) => s.nickname);
  const nickname = authUser?.username || storeNickname || 'Siswa';
  const progressMateri = useProgressStore((s) => s.materi);

  const completedCount = Object.values(progressMateri).filter((m) => m.completed).length;
  const progressPercent = completedCount > 0 ? Math.min(100, Math.round((completedCount / 4) * 100)) : 65;
  const initials = getInitials(nickname);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => router.push('/profil')}
        style={styles.profileSection}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Buka profil ${nickname}`}
      >
        <View style={styles.avatar}>
          <Text variant="caption" style={styles.avatarText}>
            {initials}
          </Text>
        </View>
        <Text variant="bodySmall" style={styles.nickname} numberOfLines={1}>
          {nickname}
        </Text>
      </Pressable>

      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>📊</Text>
          <Text variant="bodySmall" style={styles.statText}>
            {progressPercent}%
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '50%',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: tokens.colors.primaryLight,
    borderWidth: 1.5,
    borderColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.sm,
  },
  avatarText: {
    fontWeight: '800',
    color: tokens.colors.primary,
  },
  nickname: {
    fontWeight: '700',
    color: tokens.colors.text,
  },
  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: tokens.spacing.md,
    backgroundColor: tokens.colors.background,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 4,
    borderRadius: tokens.radii.full,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  statIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  statText: {
    fontWeight: '700',
    color: tokens.colors.text,
  },
});
