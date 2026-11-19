import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useProgressStore } from '@/store/progressStore';
import { getInitials } from '@/shared/lib/initials';
import { defaultStudent, modulesData } from './data/dashboardData';
import { StepStatus } from './types/dashboard';
import {
  DashboardTopBar,
  ActiveModuleCard,
  TimelineStepRow,
  UpcomingModuleHeader,
  GuestLoginPromptModal,
  MateriReaderModal,
} from './components';

export function MateriScreen() {
  const router = useRouter();

  // Auth Context
  const isGuest = useAuthStore((s) => s.isGuest);
  const authUser = useAuthStore((s) => s.user);
  const tokensState = useAuthStore((s) => s.tokens);
  const isUserLoggedIn = !isGuest && !!tokensState?.accessToken;

  // Nickname & Real Progress Data
  const storeNickname = useSettingsStore((s) => s.nickname);
  const progressUserId = useProgressStore((s) => s.userId);
  const completedSteps = useProgressStore((s) => s.completedSteps);
  const activeStepId = useProgressStore((s) => s.activeStepId);
  const progressPercentage = useProgressStore((s) => s.progressPercentage);
  const completeStep = useProgressStore((s) => s.completeStep);
  const syncWithServer = useProgressStore((s) => s.syncWithServer);

  // Validasi kepemilikan data: jika data store milik user lain atau belum disinkronisasi, anggap 0% bersih
  const isProgressOwnedByActiveUser =
    isUserLoggedIn && authUser?.id
      ? progressUserId === authUser.id
      : false;

  const effectiveCompletedSteps = isUserLoggedIn
    ? isProgressOwnedByActiveUser
      ? completedSteps
      : []
    : [];

  const effectiveActiveStepId = isUserLoggedIn
    ? isProgressOwnedByActiveUser
      ? activeStepId
      : 'm1-s1'
    : 'm1-s1';

  const effectiveProgress = isUserLoggedIn
    ? isProgressOwnedByActiveUser
      ? progressPercentage
      : 0
    : 0;

  // Modal State for Guest Lock Prompt
  const [promptModalVisible, setPromptModalVisible] = useState(false);
  const [selectedStepTitle, setSelectedStepTitle] = useState('');

  // Modal State for Material Learning Reader
  const [readerModalVisible, setReaderModalVisible] = useState(false);
  const [readerStepInfo, setReaderStepInfo] = useState<{
    stepId: string;
    title: string;
    moduleId: string;
    isCompleted: boolean;
  } | null>(null);

  // Sinkronisasi data progres real dari server saat layar dimuat untuk user yang login
  useEffect(() => {
    if (isUserLoggedIn && tokensState?.accessToken) {
      syncWithServer(tokensState.accessToken, authUser?.id);
    }
  }, [isUserLoggedIn, tokensState?.accessToken, authUser?.id, syncWithServer]);

  // Progres pembelajaran: jika mode tamu atau akun baru, progres terkunci pada 0%
  const currentProgress = effectiveProgress;

  const studentName = isUserLoggedIn
    ? authUser?.username || storeNickname || defaultStudent.name
    : isGuest
    ? storeNickname || 'Siswa Tamu'
    : storeNickname || defaultStudent.name;

  const studentProgram = authUser?.class?.name
    ? `${authUser.class.name} • TAV`
    : defaultStudent.program;

  const student = {
    ...defaultStudent,
    name: studentName,
    initials: getInitials(studentName),
    program: studentProgram,
    progressPercentage: currentProgress,
  };

  const module1 = modulesData[0];
  const module2 = modulesData[1];

  // Apakah Modul 1 sudah selesai semua? Jika ya, buka Modul 2
  const isModule1Completed = module1
    ? module1.steps.every((s) => effectiveCompletedSteps.includes(s.id))
    : false;

  const handleStepPress = async (
    stepId: string,
    title: string,
    moduleId: string,
    type?: string
  ) => {
    // Jika belum login dengan akun sah (guest), kunci interaksi dan tampilkan prompt login
    if (!isUserLoggedIn) {
      setSelectedStepTitle(title);
      setPromptModalVisible(true);
      return;
    }

    // Khusus Tahap 1 Modul 1 (Materi Ajar): Buka halaman interaktif per topik khusus
    if (stepId === 'm1-s1') {
      router.push('/materi/tahap-1');
      return;
    }

    // Untuk langkah kuis/troubleshooting/praktikal, arahkan ke tab terkait
    if (type === 'quiz') {
      router.push('/(tabs)/evaluasi');
      return;
    }
    if (type === 'troubleshoot') {
      router.push('/(tabs)/troubleshoot');
      return;
    }
    if (type === 'practical') {
      router.push('/(tabs)/simulasi');
      return;
    }

    // Buka sesi belajar materi (baca kartu & kerjakan cek cepat)
    const isAlreadyCompleted = effectiveCompletedSteps.includes(stepId);
    setReaderStepInfo({
      stepId,
      title,
      moduleId,
      isCompleted: isAlreadyCompleted,
    });
    setReaderModalVisible(true);
  };

  const handleCompleteMaterial = async () => {
    if (readerStepInfo) {
      await completeStep(readerStepInfo.stepId, undefined, readerStepInfo.moduleId);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Clean, Unified TopBar: Greeting + Subtitle + Profile Avatar */}
        <DashboardTopBar student={student} isGuest={!isUserLoggedIn} />

        {/* Compact, Calm Guest Strip (Only shown when not logged in) */}
        {!isUserLoggedIn && (
          <Pressable
            onPress={() => router.push('/login')}
            style={({ pressed }) => [styles.guestStrip, pressed && styles.guestStripPressed]}
            accessibilityRole="button"
            accessibilityLabel="Masuk akun kelas untuk membuka dan menyimpan progres"
          >
            <View style={styles.guestStripLeft}>
              <View style={styles.guestStripIconWrapper}>
                <Ionicons name="lock-closed" size={14} color="#D97706" />
              </View>
              <Text style={styles.guestStripTitle}>Mode Siswa Tamu</Text>
            </View>

            <View style={styles.guestLoginButton}>
              <Text style={styles.guestLoginButtonText}>Masuk</Text>
              <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
            </View>
          </Pressable>
        )}

        {/* Modul 1: Clean Unit Header */}
        {module1 && (
          <ActiveModuleCard
            module={{
              ...module1,
              progressPercentage: currentProgress,
            }}
            isGuestLocked={!isUserLoggedIn}
          />
        )}

        {/* Modul 1: Focused Journey Steps */}
        {module1 && (
          <View style={styles.timelineSection}>
            {module1.steps.map((step, index) => {
              const isCompleted = isUserLoggedIn && effectiveCompletedSteps.includes(step.id);
              const isActive =
                isUserLoggedIn &&
                (step.id === effectiveActiveStepId || (!effectiveActiveStepId && index === 0));
              const status: StepStatus = isCompleted ? 'completed' : isActive ? 'active' : 'locked';

              // Label tombol dinamis sesuai status penyelesaian
              let dynamicButtonLabel = step.buttonLabel;
              if (isActive) {
                if (step.type === 'material') {
                  dynamicButtonLabel = 'Buka Materi Ajar';
                } else if (step.type === 'quiz') {
                  dynamicButtonLabel = 'Mulai Latihan Soal';
                } else if (step.type === 'troubleshoot') {
                  dynamicButtonLabel = 'Mulai Kasus Troubleshooting';
                } else if (step.type === 'practical') {
                  dynamicButtonLabel = 'Mulai Simulasi Osiloskop';
                } else {
                  dynamicButtonLabel = 'Mulai Belajar';
                }
              } else if (isCompleted) {
                dynamicButtonLabel = step.type === 'material' ? 'Buka Ulang Materi Ajar' : 'Baca Ulang Materi';
              }

              return (
                <TimelineStepRow
                  key={step.id}
                  step={{
                    ...step,
                    status,
                    buttonLabel: dynamicButtonLabel,
                    score: isCompleted ? step.score : undefined,
                  }}
                  isLast={index === module1.steps.length - 1}
                  isGuestLocked={!isUserLoggedIn}
                  onPressAction={() =>
                    handleStepPress(step.id, step.title, module1.id, step.type)
                  }
                />
              );
            })}
          </View>
        )}

        {/* Modul 2: Sleek upcoming preview (or active steps if Modul 1 completed) */}
        {module2 && !isModule1Completed && (
          <UpcomingModuleHeader module={module2} />
        )}

        {module2 && isModule1Completed && (
          <>
            <UpcomingModuleHeader module={module2} />
            <View style={styles.timelineSection}>
              {module2.steps.map((step, index) => {
                const isCompleted = isUserLoggedIn && effectiveCompletedSteps.includes(step.id);
                const isActive =
                  isUserLoggedIn &&
                  (step.id === effectiveActiveStepId || (!effectiveActiveStepId && index === 0));
                const status: StepStatus = isCompleted ? 'completed' : isActive ? 'active' : 'locked';

                let dynamicButtonLabel = step.buttonLabel;
                if (isActive) {
                  if (step.type === 'material') {
                    dynamicButtonLabel = 'Mulai Baca Modul';
                  } else if (step.type === 'quiz') {
                    dynamicButtonLabel = 'Mulai Latihan Soal';
                  } else if (step.type === 'troubleshoot') {
                    dynamicButtonLabel = 'Mulai Analisis Kasus';
                  } else if (step.type === 'practical') {
                    dynamicButtonLabel = 'Mulai Praktik Audio';
                  } else {
                    dynamicButtonLabel = 'Mulai Belajar';
                  }
                } else if (isCompleted) {
                  dynamicButtonLabel = 'Baca Ulang Materi';
                }

                return (
                  <TimelineStepRow
                    key={step.id}
                    step={{
                      ...step,
                      status,
                      buttonLabel: dynamicButtonLabel,
                      score: isCompleted ? step.score : undefined,
                    }}
                    isLast={index === module2.steps.length - 1}
                    isGuestLocked={!isUserLoggedIn}
                    onPressAction={() =>
                      handleStepPress(step.id, step.title, module2.id, step.type)
                    }
                  />
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* Modal Dialog Prompt Login untuk Akun Tamu */}
      <GuestLoginPromptModal
        visible={promptModalVisible}
        stepTitle={selectedStepTitle}
        onClose={() => setPromptModalVisible(false)}
      />

      {/* Modal Sesi Belajar Materi */}
      <MateriReaderModal
        visible={readerModalVisible}
        stepTitle={readerStepInfo?.title}
        isAlreadyCompleted={readerStepInfo?.isCompleted}
        onClose={() => setReaderModalVisible(false)}
        onComplete={handleCompleteMaterial}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  scrollContent: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: 4,
    paddingBottom: 100,
  },

  // Sleek Guest Notice Strip (Replaces the giant yellow box)
  guestStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEA',
    borderColor: '#FDE68A',
    borderWidth: 1.5,
    borderRadius: tokens.radii.lg,
    paddingVertical: 10,
    paddingHorizontal: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  guestStripPressed: {
    opacity: 0.85,
  },
  guestStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    flex: 1,
  },
  guestStripIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestStripTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  guestLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radii.full,
    borderBottomWidth: 2,
    borderBottomColor: tokens.colors.primaryDark,
  },
  guestLoginButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  timelineSection: {
    marginBottom: tokens.spacing.md,
    overflow: 'visible',
  },
});
