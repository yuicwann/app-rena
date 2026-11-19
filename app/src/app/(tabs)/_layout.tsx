import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/shared/theme/tokens';
import { SmoothTabBarButton } from '@/shared/ui';
import { useAuthStore } from '@/store/authStore';
import { t } from '@/i18n';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Auth Guard: Sembarang user yang belum memiliki sesi sah ditolak dan diarahkan ke login depan
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  // Dynamic bottom padding to handle native system navigation bars (3-button navigation, gesture indicator, home pill)
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);
  const tabHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: (props) => <SmoothTabBarButton {...props} />,
        tabBarActiveTintColor: tokens.colors.primaryDarkText,
        tabBarInactiveTintColor: tokens.colors.textDisabled,
        tabBarStyle: {
          backgroundColor: tokens.colors.surface,
          borderTopColor: tokens.colors.border,
          borderTopWidth: 1.5,
          height: tabHeight,
          paddingBottom: bottomPadding,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
          letterSpacing: 0.2,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="materi"
        options={{
          title: 'Belajar',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <Ionicons
                name={focused ? 'school' : 'school-outline'}
                size={22}
                color={typeof color === 'string' ? color : tokens.colors.primary}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="simulasi"
        options={{
          title: t('tabs.simulasi'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <Ionicons
                name={focused ? 'hardware-chip' : 'hardware-chip-outline'}
                size={22}
                color={typeof color === 'string' ? color : tokens.colors.primary}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="troubleshoot"
        options={{
          title: 'Kasus',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <Ionicons
                name={focused ? 'construct' : 'construct-outline'}
                size={22}
                color={typeof color === 'string' ? color : tokens.colors.primary}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="evaluasi"
        options={{
          title: t('tabs.evaluasi'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconWrapper, focused && styles.activeIconWrapper]}>
              <Ionicons
                name={focused ? 'ribbon' : 'ribbon-outline'}
                size={22}
                color={typeof color === 'string' ? color : tokens.colors.primary}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconWrapper: {
    backgroundColor: tokens.colors.primaryLight,
    borderWidth: 1.5,
    borderColor: tokens.colors.primaryBorderActive,
  },
});
