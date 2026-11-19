import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';

export default function IndexRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const onboardingCompleted = useSettingsStore((s) => s.onboardingCompleted);

  // 1. Pintu Depan: Pengguna yang belum terautentikasi (termasuk belum memilih guest) wajib ke login
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  // 2. Jika sudah terautentikasi tapi belum menyelesaikan onboarding awal
  if (!onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

  // 3. Masuk ke dashboard utama
  return <Redirect href="/(tabs)/materi" />;
}
