import React, { useState } from 'react';
import { View, StyleSheet, Modal, ScrollView, Pressable, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';
import { DuoButton } from '@/shared/ui/DuoButton';
import { DuoAlert } from '@/shared/ui/DuoAlert';
import { DuoBadge } from '@/shared/ui/DuoBadge';
import materiContent from '../../../../content/materi.json';

export interface MateriReaderModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => Promise<void>;
  stepTitle?: string;
  isAlreadyCompleted?: boolean;
}

const defaultCard = {
  id: 's1-c1',
  title: 'Tugas Penerima Radio',
  body: 'Penerima radio menangkap sinyal elektromagnetik dari udara, memilih satu stasiun, memperkuatnya, dan mengubahnya menjadi suara yang bisa didengar.',
};

const defaultSection = {
  id: 's1-blok',
  title: 'Diagram Blok Radio',
  objective: 'Memahami alur dasar penerima AM dan FM',
  cards: [defaultCard],
  quickCheck: {
    question: 'Pada urutan penerima FM, Limiter berada di antara...',
    options: [
      'Penguat IF dan Detektor FM',
      'Antena dan Tuner',
      'Detektor dan Speaker',
      'Mixer dan Osilator Lokal',
    ],
    correctIndex: 0,
    explanation: 'Limiter ditempatkan persis setelah penguat IF untuk membatasi amplitudo sebelum masuk ke detektor FM.',
  },
};

export function MateriReaderModal({
  visible,
  onClose,
  onComplete,
  stepTitle,
  isAlreadyCompleted = false,
}: MateriReaderModalProps) {
  const section = (materiContent?.sections && materiContent.sections[0]) ? materiContent.sections[0] : defaultSection;
  const card = (section.cards && section.cards[0]) ? section.cards[0] : defaultCard;
  const quickCheck = section.quickCheck || defaultSection.quickCheck;

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAnswerCorrect = selectedOption === quickCheck.correctIndex;

  const handleSelectOption = (index: number) => {
    setSelectedOption(index);
    setHasSubmitted(true);
  };

  const handleFinish = async () => {
    if (!isAnswerCorrect && !isAlreadyCompleted) return;
    setIsSubmitting(true);
    try {
      await onComplete();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedOption(null);
    setHasSubmitted(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleCol}>
              <View style={styles.badgeRow}>
                <DuoBadge label="Materi Pelajaran" variant="greenWash" />
                {isAlreadyCompleted && (
                  <DuoBadge label="Sudah Selesai" variant="slate" />
                )}
              </View>
              <Text variant="titleSmall" style={styles.headerTitle}>
                {stepTitle || section.title}
              </Text>
            </View>

            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Tutup materi pembelajaran"
            >
              <Ionicons name="close" size={22} color={tokens.colors.text} />
            </Pressable>
          </View>

          {/* Content Body */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Objective Banner */}
            <View style={styles.objectiveCard}>
              <Ionicons name="compass-outline" size={18} color={tokens.colors.primaryDarkText} />
              <Text variant="bodySmall" style={styles.objectiveText}>
                {section.objective}
              </Text>
            </View>

            {/* Main Lesson Card */}
            <View style={styles.lessonCard}>
              <Text variant="titleSmall" style={styles.cardTitle}>
                {card.title}
              </Text>
              <Text variant="body" style={styles.cardBody}>
                {card.body}
              </Text>

              {/* Visual Pedagogical Diagram */}
              <View style={styles.diagramWrapper}>
                <Text style={styles.diagramHeader}>ALUR DIAGRAM BLOK PENERIMA RADIO</Text>
                <View style={styles.diagramRow}>
                  <View style={styles.diagramBlock}>
                    <Ionicons name="radio-outline" size={16} color={tokens.colors.primaryDark} />
                    <Text style={styles.diagramBlockText}>Antena</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={14} color={tokens.colors.borderDark} />
                  <View style={styles.diagramBlock}>
                    <Ionicons name="funnel-outline" size={16} color={tokens.colors.primaryDark} />
                    <Text style={styles.diagramBlockText}>Tuner RF</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={14} color={tokens.colors.borderDark} />
                  <View style={styles.diagramBlock}>
                    <Ionicons name="git-merge-outline" size={16} color={tokens.colors.primaryDark} />
                    <Text style={styles.diagramBlockText}>Mixer / LO</Text>
                  </View>
                </View>

                <View style={styles.diagramDividerRow}>
                  <Ionicons name="arrow-down" size={14} color={tokens.colors.borderDark} />
                </View>

                <View style={styles.diagramRow}>
                  <View style={styles.diagramBlock}>
                    <Ionicons name="volume-high-outline" size={16} color={tokens.colors.primaryDark} />
                    <Text style={styles.diagramBlockText}>Speaker</Text>
                  </View>
                  <Ionicons name="arrow-back" size={14} color={tokens.colors.borderDark} />
                  <View style={styles.diagramBlock}>
                    <Ionicons name="pulse-outline" size={16} color={tokens.colors.primaryDark} />
                    <Text style={styles.diagramBlockText}>Detektor</Text>
                  </View>
                  <Ionicons name="arrow-back" size={14} color={tokens.colors.borderDark} />
                  <View style={styles.diagramBlockHighlight}>
                    <Ionicons name="speedometer-outline" size={16} color="#047857" />
                    <Text style={styles.diagramBlockTextHighlight}>Penguat IF & Limiter</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Quick Check Section */}
            <View style={styles.quickCheckCard}>
              <View style={styles.quickCheckHeader}>
                <Ionicons name="help-circle" size={20} color={tokens.colors.accentDark} />
                <Text variant="titleSmall" style={styles.quickCheckTitle}>
                  Cek Cepat Pemahaman
                </Text>
              </View>

              <Text variant="body" style={styles.questionText}>
                {quickCheck.question}
              </Text>

              <View style={styles.optionsList}>
                {quickCheck.options.map((option: string, idx: number) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === quickCheck.correctIndex;
                  const showResult = hasSubmitted;

                  const buttonStyles: StyleProp<ViewStyle>[] = [styles.optionButton];
                  if (isSelected) {
                    if (showResult && isCorrect) {
                      buttonStyles.push(styles.optionButtonCorrect);
                    } else if (showResult && !isCorrect) {
                      buttonStyles.push(styles.optionButtonWrong);
                    } else {
                      buttonStyles.push(styles.optionButtonSelected);
                    }
                  } else if (showResult && isCorrect) {
                    buttonStyles.push(styles.optionButtonCorrect);
                  }

                  return (
                    <Pressable
                      key={idx}
                      onPress={() => handleSelectOption(idx)}
                      style={buttonStyles}
                    >
                      <View style={styles.optionIndexCircle}>
                        <Text style={styles.optionIndexText}>
                          {String.fromCharCode(65 + idx)}
                        </Text>
                      </View>
                      <Text style={styles.optionText}>{option}</Text>
                      {showResult && isCorrect && (
                        <Ionicons name="checkmark-circle" size={18} color="#059669" />
                      )}
                      {showResult && isSelected && !isCorrect && (
                        <Ionicons name="close-circle" size={18} color={tokens.colors.error} />
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Feedback Alert */}
              {hasSubmitted && (
                <View style={styles.feedbackContainer}>
                  {isAnswerCorrect ? (
                    <DuoAlert
                      variant="success"
                      message={`Tepat sekali! ${quickCheck.explanation}`}
                    />
                  ) : (
                    <DuoAlert
                      variant="warning"
                      message="Jawabanmu belum tepat. Coba pilih kembali jawaban yang sesuai dengan alur blok radio di atas."
                    />
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Bottom Action Footer */}
          <View style={styles.footer}>
            {isAnswerCorrect || isAlreadyCompleted ? (
              <DuoButton
                label={isSubmitting ? 'Menyimpan...' : 'Selesaikan Materi & Simpan Progres'}
                variant="green"
                size="large"
                disabled={isSubmitting}
                icon={<Ionicons name="checkmark-done" size={20} color="#FFFFFF" />}
                onPress={handleFinish}
              />
            ) : (
              <DuoButton
                label="Jawab Cek Cepat untuk Menyelesaikan"
                variant="white"
                size="large"
                disabled={true}
                onPress={() => {}}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: tokens.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
    borderBottomWidth: 1.5,
    borderBottomColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
  },
  headerTitleCol: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: tokens.colors.text,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: tokens.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: tokens.spacing.sm,
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
    paddingBottom: tokens.spacing.xl,
  },
  objectiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: tokens.colors.primaryLight,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 10,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  objectiveText: {
    flex: 1,
    fontWeight: '600',
    color: tokens.colors.primaryDarkText,
  },
  lessonCard: {
    backgroundColor: tokens.colors.surface,
    padding: tokens.spacing.lg,
    borderRadius: tokens.radii.lg,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    borderBottomWidth: 3,
    borderBottomColor: tokens.colors.borderDark,
    gap: tokens.spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: tokens.colors.text,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 22,
    color: tokens.colors.text,
  },
  diagramWrapper: {
    marginTop: tokens.spacing.sm,
    padding: tokens.spacing.md,
    backgroundColor: '#F8FAFC',
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    gap: tokens.spacing.sm,
  },
  diagramHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: tokens.colors.textMuted,
    textAlign: 'center',
  },
  diagramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  diagramDividerRow: {
    alignItems: 'flex-end',
    paddingRight: 28,
  },
  diagramBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: tokens.radii.sm,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    gap: 2,
  },
  diagramBlockHighlight: {
    flex: 1.3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: tokens.radii.sm,
    borderWidth: 1.5,
    borderColor: '#10B981',
    gap: 2,
  },
  diagramBlockText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.text,
    textAlign: 'center',
  },
  diagramBlockTextHighlight: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    textAlign: 'center',
  },
  quickCheckCard: {
    backgroundColor: tokens.colors.surface,
    padding: tokens.spacing.lg,
    borderRadius: tokens.radii.lg,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    borderBottomWidth: 3,
    borderBottomColor: tokens.colors.borderDark,
    gap: tokens.spacing.md,
  },
  quickCheckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickCheckTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: tokens.colors.text,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.text,
    lineHeight: 20,
  },
  optionsList: {
    gap: tokens.spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    backgroundColor: tokens.colors.background,
    paddingVertical: 12,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radii.md,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
  },
  optionButtonSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: tokens.colors.secondary,
  },
  optionButtonCorrect: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  optionButtonWrong: {
    backgroundColor: '#FEF2F2',
    borderColor: tokens.colors.error,
  },
  optionIndexCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: tokens.colors.surface,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIndexText: {
    fontSize: 11,
    fontWeight: '800',
    color: tokens.colors.textSecondary,
  },
  optionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.text,
  },
  feedbackContainer: {
    marginTop: 4,
  },
  footer: {
    padding: tokens.spacing.lg,
    backgroundColor: tokens.colors.surface,
    borderTopWidth: 1.5,
    borderTopColor: tokens.colors.border,
  },
});
