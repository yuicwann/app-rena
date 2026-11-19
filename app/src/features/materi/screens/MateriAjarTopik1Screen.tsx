import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';
import { DuoButton } from '@/shared/ui/DuoButton';
import { useProgressStore } from '@/store/progressStore';
import { useAuthStore } from '@/store/authStore';
import {
  DIAGRAM_NODES,
  NODE_WIDTH,
  NODE_HEIGHT,
  getDiagramNode,
} from '../components/tahap1/tahap1Data';
import { BlockDiagramSvg } from '../components/tahap1/BlockDiagramSvg';
import { LiveOscilloscope } from '../components/tahap1/LiveOscilloscope';
import { BlockCaptionCard } from '../components/tahap1/BlockCaptionCard';
import { StepDotsAndControls } from '../components/tahap1/StepDotsAndControls';
import { ArchitectureFeatureCard } from '../components/tahap1/ArchitectureFeatureCard';
import { QuickCheckSection } from '../components/tahap1/QuickCheckSection';

export function MateriAjarTopik1Screen() {
  const router = useRouter();

  // Progress store
  const completedSteps = useProgressStore((s) => s.completedSteps);
  const completeStep = useProgressStore((s) => s.completeStep);
  const isAlreadyCompleted = completedSteps.includes('m1-s1');

  // Auth
  const isGuest = useAuthStore((s) => s.isGuest);

  // Screen State
  const [mode, setMode] = useState<'fm' | 'am'>('fm');
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [isQuickCheckDone, setIsQuickCheckDone] = useState<boolean>(isAlreadyCompleted);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Pulse position state for SVG tracker circle
  const initialNode = getDiagramNode(0);
  const [pulsePos, setPulsePos] = useState<{ x: number; y: number }>({
    x: initialNode.x + NODE_WIDTH / 2,
    y: initialNode.y + NODE_HEIGHT / 2,
  });

  const nextAutoTimeRef = useRef<number>(0);

  // Auto-advance loop
  useEffect(() => {
    nextAutoTimeRef.current = performance.now() + 3500;
    let animId: number;

    const tick = () => {
      const now = performance.now();

      if (isAutoPlaying && now > nextAutoTimeRef.current) {
        setActiveStageIndex((prev) => {
          const next = (prev + 1) % DIAGRAM_NODES.length;
          return next;
        });
        nextAutoTimeRef.current = now + 3500;
      }

      // Smooth pulse movement toward target node center
      const targetNode = getDiagramNode(activeStageIndex);
      const targetX = targetNode.x + NODE_WIDTH / 2;
      const targetY = targetNode.y + NODE_HEIGHT / 2;

      setPulsePos((prev) => ({
        x: prev.x + (targetX - prev.x) * 0.15,
        y: prev.y + (targetY - prev.y) * 0.15,
      }));

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [activeStageIndex, isAutoPlaying]);

  const handleSelectNode = (index: number) => {
    setIsAutoPlaying(false);
    setActiveStageIndex(index);
    nextAutoTimeRef.current = performance.now() + 4500;
  };

  const handleToggleAuto = () => {
    setIsAutoPlaying((prev) => {
      const next = !prev;
      if (next) {
        nextAutoTimeRef.current = performance.now() + 2000;
      }
      return next;
    });
  };

  const handlePrevStage = () => {
    if (activeStageIndex > 0) {
      handleSelectNode(activeStageIndex - 1);
    } else {
      router.back();
    }
  };

  const handleNextStage = () => {
    if (activeStageIndex < DIAGRAM_NODES.length - 1) {
      handleSelectNode(activeStageIndex + 1);
    }
  };

  const handleCompleteAndFinish = async () => {
    if (isGuest) {
      router.back();
      return;
    }

    setIsSubmitting(true);
    try {
      await completeStep('m1-s1', undefined, 'modul-1');
      router.back();
    } catch {
      // Best effort
      router.back();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLastStage = activeStageIndex === DIAGRAM_NODES.length - 1;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* ============ TOP APP BAR ============ */}
      <View style={styles.topAppBar}>
        <View style={styles.topRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Kembali ke Daftar Modul"
          >
            <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
          </Pressable>

          <View style={styles.headerTitleCol}>
            <Text style={styles.breadcrumb}>MODUL 1 • TAHAP 1</Text>
            <Text style={styles.mainTitle} numberOfLines={1}>
              Materi Ajar: Teori Penerima Radio
            </Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.xpBadge}>
              <Ionicons name="flash" size={13} color="#7a5d00" />
              <Text style={styles.xpText}>15 XP</Text>
            </View>
            <View style={styles.topicBadge}>
              <Text style={styles.topicBadgeText}>Topik 1 / 4</Text>
            </View>
          </View>
        </View>

        {/* 4-Segment Progress Bar (Segment 1 Active) */}
        <View style={styles.segmentedBar}>
          <View style={[styles.segment, styles.segmentActive]} />
          <View style={styles.segment} />
          <View style={styles.segment} />
          <View style={styles.segment} />
        </View>
      </View>

      {/* ============ SCROLLABLE CONTENT ============ */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CARD UTAMA: TOPIK 1 VERSI FM */}
        <View style={styles.mainCard}>
          {/* Header Card with FM / AM Toggle */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.topikPill}>
                <Text style={styles.topikPillText}>Topik 1 • Alur Sinyal FM</Text>
              </View>
              <Text style={styles.topicHeading}>Perjalanan Sinyal FM</Text>
            </View>

            {/* Mode Switcher: FM vs AM */}
            <View style={styles.modeToggleGroup}>
              <Pressable
                onPress={() => setMode('fm')}
                style={[styles.modeChip, mode === 'fm' && styles.modeChipActiveFM]}
                accessibilityRole="button"
                accessibilityLabel="Pilih Mode FM"
              >
                <Text style={[styles.modeChipText, mode === 'fm' && styles.modeChipTextActive]}>
                  FM
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setMode('am')}
                style={[styles.modeChip, mode === 'am' && styles.modeChipActiveAM]}
                accessibilityRole="button"
                accessibilityLabel="Pilih Mode AM"
              >
                <Text style={[styles.modeChipText, mode === 'am' && styles.modeChipTextActive]}>
                  AM
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Banner Instruksi Radio FM */}
          <View style={styles.instructionBanner}>
            <View style={styles.radioIconCircle}>
              <Ionicons name="radio" size={20} color="#006590" />
            </View>
            <Text style={styles.instructionText}>
              <Text style={styles.boldText}>Sistem Penerima FM: </Text>
              Sinyal pita 88–108 MHz diproses melalui limiter & diskriminator untuk membuang desis derau. Ketuk blok untuk loncat.
            </Text>
          </View>

          {/* Bagian Diagram Blok & Osiloskop Interaktif */}
          <View style={styles.interactiveSection}>
            {/* Status Alur Sinyal */}
            <View style={styles.signalStatusRow}>
              <View style={styles.statusLeft}>
                <View style={styles.activeSignalDot} />
                <Text style={styles.statusLabel}>Alur Sinyal Aktif</Text>
              </View>
              <View style={styles.modePill}>
                <Text style={styles.modePillText}>
                  {mode === 'fm' ? 'Penerima FM Superheterodyne' : 'Penerima AM (Versi Pembanding)'}
                </Text>
              </View>
            </View>

            {/* SVG Diagram Blok */}
            <BlockDiagramSvg
              activeIndex={activeStageIndex}
              onSelectNode={handleSelectNode}
              pulsePos={pulsePos}
            />

            {/* Live Osiloskop FM/AM */}
            <LiveOscilloscope
              activeIndex={activeStageIndex}
              mode={mode}
              isPaused={!isAutoPlaying}
            />

            {/* Penjelasan Blok yang Sedang Dipilih */}
            <BlockCaptionCard activeIndex={activeStageIndex} />

            {/* Step Dots & Auto/Manual Controller */}
            <StepDotsAndControls
              activeIndex={activeStageIndex}
              onSelectIndex={handleSelectNode}
              isAutoPlaying={isAutoPlaying}
              onToggleAuto={handleToggleAuto}
            />
          </View>
        </View>

        {/* KOTAK FITUR: KEUNGGULAN ARSITEKTUR FM */}
        <ArchitectureFeatureCard />

        {/* CEK CEPAT PEMAHAMAN */}
        <QuickCheckSection
          onAnswerCorrect={() => setIsQuickCheckDone(true)}
          isAlreadyCompleted={isAlreadyCompleted}
        />
      </ScrollView>

      {/* ============ FIXED BOTTOM CONTROL BAR ============ */}
      <View style={styles.bottomControlBar}>
        <Pressable
          onPress={handlePrevStage}
          style={({ pressed }) => [styles.prevButton, pressed && styles.buttonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Langkah Sebelumnya"
        >
          <Ionicons name="arrow-back" size={16} color={tokens.colors.textSecondary} />
          <Text style={styles.prevButtonText}>
            {activeStageIndex === 0 ? 'Kembali' : 'Sebelumnya'}
          </Text>
        </Pressable>

        {isLastStage || isQuickCheckDone || isAlreadyCompleted ? (
          <View style={styles.nextButtonFlex}>
            <DuoButton
              label={
                isSubmitting
                  ? 'Menyimpan...'
                  : isAlreadyCompleted
                  ? 'Selesai & Kembali'
                  : 'Selesaikan Materi & Simpan Progres'
              }
              variant="green"
              size="medium"
              disabled={isSubmitting}
              icon={
                isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name="checkmark-done" size={18} color="#ffffff" />
                )
              }
              onPress={handleCompleteAndFinish}
            />
          </View>
        ) : (
          <Pressable
            onPress={handleNextStage}
            style={({ pressed }) => [styles.nextStepButton, pressed && styles.buttonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Langkah Selanjutnya"
          >
            <Text style={styles.nextStepButtonText}>Lanjut Blok Berikutnya</Text>
            <Ionicons name="arrow-forward" size={16} color="#ffffff" />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fbf9f9',
  },
  topAppBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f3f3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  headerTitleCol: {
    flex: 1,
  },
  breadcrumb: {
    fontSize: 10,
    fontWeight: '800',
    color: '#777777',
    letterSpacing: 0.8,
  },
  mainTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: tokens.colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 200, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  xpText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#7a5d00',
  },
  topicBadge: {
    backgroundColor: '#c8e6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  topicBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#004c6e',
  },
  segmentedBar: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 2,
  },
  segment: {
    flex: 1,
    height: 7,
    borderRadius: 9999,
    backgroundColor: '#e5e5e5',
  },
  segmentActive: {
    backgroundColor: '#58cc02',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 100,
    gap: 14,
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  topikPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#c8e6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  topikPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#004c6e',
  },
  topicHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: tokens.colors.text,
  },
  modeToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#f5f3f3',
    padding: 3,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    gap: 3,
  },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  modeChipActiveFM: {
    backgroundColor: '#2fb8ff',
    shadowColor: '#1899d6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  modeChipActiveAM: {
    backgroundColor: '#58cc02',
    shadowColor: '#58a700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  modeChipText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#4b4b4b',
  },
  modeChipTextActive: {
    color: '#ffffff',
  },
  instructionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(200, 230, 255, 0.45)',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#b3deff',
  },
  radioIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#c8e6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: '#004c6e',
  },
  boldText: {
    fontWeight: '900',
  },
  interactiveSection: {
    backgroundColor: '#f5f3f3',
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    gap: 10,
  },
  signalStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeSignalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2fb8ff',
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#777777',
  },
  modePill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  modePillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#006590',
  },
  bottomControlBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#f5f3f3',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  prevButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: tokens.colors.textSecondary,
    textTransform: 'uppercase',
  },
  nextStepButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#58cc02',
    shadowColor: '#58a700',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
  },
  nextStepButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  nextButtonFlex: {
    flex: 1,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});
