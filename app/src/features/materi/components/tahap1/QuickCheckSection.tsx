import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';
import { DuoAlert } from '@/shared/ui/DuoAlert';
import { QUICK_CHECK_DATA } from './tahap1Data';

interface QuickCheckSectionProps {
  onAnswerCorrect: () => void;
  isAlreadyCompleted?: boolean;
}

export function QuickCheckSection({
  onAnswerCorrect,
  isAlreadyCompleted = false,
}: QuickCheckSectionProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(isAlreadyCompleted);

  const isAnswerCorrect = selectedOption === QUICK_CHECK_DATA.correctIndex || isAlreadyCompleted;

  const handleSelect = (idx: number) => {
    setSelectedOption(idx);
    setHasSubmitted(true);
    if (idx === QUICK_CHECK_DATA.correctIndex) {
      onAnswerCorrect();
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="help-circle" size={20} color="#ffc800" />
        <Text style={styles.title}>Cek Cepat Pemahaman</Text>
      </View>

      <Text style={styles.question}>{QUICK_CHECK_DATA.question}</Text>

      <View style={styles.optionsList}>
        {QUICK_CHECK_DATA.options.map((option, idx) => {
          const isSelected = selectedOption === idx;
          const isCorrect = idx === QUICK_CHECK_DATA.correctIndex;
          const showResult = hasSubmitted;

          const isOptionCorrect = showResult && isCorrect;
          const isOptionWrong = showResult && isSelected && !isCorrect;

          return (
            <Pressable
              key={idx}
              onPress={() => handleSelect(idx)}
              style={({ pressed }) => [
                styles.optionButton,
                isSelected && styles.optionButtonSelected,
                isOptionCorrect && styles.optionButtonCorrect,
                isOptionWrong && styles.optionButtonWrong,
                pressed && styles.optionButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Pilihan ${String.fromCharCode(65 + idx)}: ${option}`}
            >
              <View
                style={[
                  styles.optionBadge,
                  isOptionCorrect && styles.optionBadgeCorrect,
                  isOptionWrong && styles.optionBadgeWrong,
                ]}
              >
                <Text
                  style={[
                    styles.optionBadgeText,
                    (isOptionCorrect || isOptionWrong) && styles.optionBadgeTextActive,
                  ]}
                >
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

      {hasSubmitted && (
        <View style={styles.alertWrapper}>
          {isAnswerCorrect ? (
            <DuoAlert
              variant="success"
              message={`Tepat sekali! ${QUICK_CHECK_DATA.explanation}`}
            />
          ) : (
            <DuoAlert
              variant="warning"
              message="Jawabanmu belum tepat. Perhatikan diagram alur blok radio di atas: limiter berada tepat setelah Penguat IF dan sebelum Detektor FM."
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    color: tokens.colors.text,
  },
  question: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    color: tokens.colors.text,
  },
  optionsList: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3f3',
    borderRadius: 12,
    padding: 10,
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#e5e5e5',
  },
  optionButtonSelected: {
    borderColor: '#2fb8ff',
    backgroundColor: '#e6f6fe',
  },
  optionButtonCorrect: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  optionButtonWrong: {
    borderColor: tokens.colors.error,
    backgroundColor: '#fef2f2',
  },
  optionButtonPressed: {
    transform: [{ scale: 0.99 }],
  },
  optionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBadgeCorrect: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  optionBadgeWrong: {
    backgroundColor: tokens.colors.error,
    borderColor: tokens.colors.error,
  },
  optionBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: tokens.colors.text,
  },
  optionBadgeTextActive: {
    color: '#ffffff',
  },
  optionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: tokens.colors.text,
  },
  alertWrapper: {
    marginTop: 4,
  },
});
