import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/shared/theme/tokens';
import { DuoTextInput } from './DuoTextInput';

export interface DuoSelectOption {
  label: string;
  value: string;
  subtitle?: string;
}

export interface DuoSelectProps {
  label?: string;
  placeholder?: string;
  value?: string;
  options: (DuoSelectOption | string)[];
  onSelect: (value: string) => void;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  allowCustom?: boolean;
  customPlaceholder?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function DuoSelect({
  label,
  placeholder = 'Pilih kelas',
  value,
  options,
  onSelect,
  error,
  helperText,
  leftIcon = 'school-outline',
  allowCustom = true,
  customPlaceholder = 'Nama kelas',
  containerStyle,
}: DuoSelectProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Normalisasi opsi menjadi array DuoSelectOption
  const normalizedOptions: DuoSelectOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { label: opt, value: opt };
      }
      return opt;
    });
  }, [options]);

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : value || '';

  const handleOpenModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleSelectOption = (val: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsCustomMode(false);
    onSelect(val);
    setModalVisible(false);
  };

  const handleChooseCustom = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsCustomMode(true);
    setModalVisible(false);
  };

  const handleSwitchBackToSelect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsCustomMode(false);
    if (normalizedOptions.length > 0 && normalizedOptions[0]) {
      onSelect(normalizedOptions[0].value);
    }
  };

  // Jika user beralih ke mode ketik manual
  if (isCustomMode) {
    return (
      <View style={[styles.wrapper, containerStyle]}>
        <DuoTextInput
          label={label}
          placeholder={customPlaceholder}
          value={value}
          onChangeText={onSelect}
          leftIcon={leftIcon}
          error={error}
          helperText={helperText}
          autoCapitalize="words"
        />
        <Pressable
          onPress={handleSwitchBackToSelect}
          style={styles.switchModeBtn}
          accessibilityRole="button"
          accessibilityLabel="Beralih kembali ke pilihan daftar kelas"
        >
          <Ionicons name="list-outline" size={14} color={tokens.colors.primaryDark} />
          <Text style={styles.switchModeText}>Pilih dari daftar kelas</Text>
        </Pressable>
      </View>
    );
  }

  const hasError = Boolean(error);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      {/* Trigger Box Dropdown */}
      <Pressable
        onPress={handleOpenModal}
        style={({ pressed }) => [
          styles.triggerBox,
          modalVisible && styles.triggerBoxActive,
          hasError && styles.triggerBoxError,
          pressed && styles.triggerBoxPressed,
        ]}
        accessibilityRole="combobox"
        accessibilityLabel={label || placeholder}
        accessibilityHint="Klik untuk membuka daftar pilihan kelas"
      >
        <View style={styles.triggerContent}>
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={20}
              color={
                hasError
                  ? tokens.colors.error
                  : modalVisible
                  ? tokens.colors.primaryDark
                  : tokens.colors.textMuted
              }
              style={styles.leftIcon}
            />
          )}

          <Text
            numberOfLines={1}
            style={[
              styles.triggerText,
              !displayLabel && styles.triggerPlaceholder,
            ]}
          >
            {displayLabel || placeholder}
          </Text>
        </View>

        <Ionicons
          name="chevron-down"
          size={18}
          color={tokens.colors.textMuted}
          style={[styles.arrowIcon, modalVisible && styles.arrowIconOpen]}
        />
      </Pressable>

      {/* Pesan Error / Helper */}
      {hasError ? (
        <View style={styles.messageRow}>
          <Ionicons name="alert-circle" size={14} color={tokens.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}

      {/* Bottom Sheet Modal untuk Memilih Kelas */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
          <Pressable style={styles.sheetContainer} onPress={(e) => e.stopPropagation()}>
            {/* Handle Drag Indicator */}
            <View style={styles.sheetHandle} />

            {/* Header Modal */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>{label || 'Pilih Kelas'}</Text>
                <Text style={styles.sheetSubtitle}>Pilih kelas tempat Anda belajar</Text>
              </View>
              <Pressable
                onPress={handleCloseModal}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Tutup daftar kelas"
              >
                <Ionicons name="close" size={20} color={tokens.colors.textSecondary} />
              </Pressable>
            </View>

            {/* List Pilihan Kelas */}
            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {normalizedOptions.map((opt) => {
                const isSelected = opt.value.toLowerCase().trim() === (value || '').toLowerCase().trim();
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => handleSelectOption(opt.value)}
                    style={({ pressed }) => [
                      styles.optionRow,
                      isSelected && styles.optionRowSelected,
                      pressed && styles.optionRowPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Pilih kelas ${opt.label}`}
                  >
                    <View style={styles.optionContent}>
                      <View style={[styles.optionIconBox, isSelected && styles.optionIconBoxSelected]}>
                        <Ionicons
                          name="school"
                          size={16}
                          color={isSelected ? tokens.colors.primaryDark : tokens.colors.textMuted}
                        />
                      </View>
                      <View style={styles.optionTextColumn}>
                        <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                          {opt.label}
                        </Text>
                        {opt.subtitle && (
                          <Text style={styles.optionSubtitle}>{opt.subtitle}</Text>
                        )}
                      </View>
                    </View>

                    {isSelected ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={tokens.colors.primary}
                      />
                    ) : (
                      <View style={styles.unselectedRadio} />
                    )}
                  </Pressable>
                );
              })}

              {/* Opsi Ketik Manual / Kelas Lainnya */}
              {allowCustom && (
                <Pressable
                  onPress={handleChooseCustom}
                  style={({ pressed }) => [
                    styles.customOptionRow,
                    pressed && styles.customOptionRowPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Tulis nama kelas manual"
                >
                  <Ionicons name="create-outline" size={18} color={tokens.colors.secondaryDark} />
                  <Text style={styles.customOptionText}>+ Tulis nama kelas lain</Text>
                </Pressable>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: tokens.colors.textSecondary,
    letterSpacing: 0.2,
    marginLeft: 2,
  },
  triggerBox: {
    minHeight: 50,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radii.lg,
    borderWidth: 2,
    borderColor: tokens.colors.border,
    borderBottomWidth: 3.5,
    borderBottomColor: tokens.colors.borderDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
  },
  triggerBoxActive: {
    borderColor: tokens.colors.primary,
    borderBottomColor: tokens.colors.primaryDark,
    backgroundColor: '#FFFFFF',
  },
  triggerBoxError: {
    borderColor: tokens.colors.error,
    borderBottomColor: '#93000A',
    backgroundColor: '#FFF8F8',
  },
  triggerBoxPressed: {
    transform: [{ translateY: 1 }],
    borderBottomWidth: 2,
  },
  triggerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftIcon: {
    marginRight: tokens.spacing.sm,
  },
  triggerText: {
    fontSize: 15,
    fontWeight: '700',
    color: tokens.colors.text,
  },
  triggerPlaceholder: {
    fontWeight: '500',
    color: tokens.colors.textMuted,
  },
  arrowIcon: {
    marginLeft: tokens.spacing.sm,
  },
  arrowIconOpen: {
    transform: [{ rotate: '180deg' }],
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginLeft: 2,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.error,
  },
  helperText: {
    fontSize: 12,
    color: tokens.colors.textMuted,
    marginLeft: 2,
  },
  switchModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginLeft: 4,
    marginTop: 2,
  },
  switchModeText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.primaryDark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: tokens.colors.surface,
    borderTopLeftRadius: tokens.radii.xl,
    borderTopRightRadius: tokens.radii.xl,
    paddingTop: 12,
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: 28,
    maxHeight: '75%',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: tokens.colors.text,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: tokens.colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: tokens.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: {
    maxHeight: 340,
  },
  sheetScrollContent: {
    gap: 8,
    paddingVertical: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: tokens.radii.md,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surfaceContainerLow,
  },
  optionRowSelected: {
    borderColor: tokens.colors.primary,
    backgroundColor: tokens.colors.primaryLight,
  },
  optionRowPressed: {
    backgroundColor: tokens.colors.border,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  optionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  optionIconBoxSelected: {
    borderColor: tokens.colors.primaryBorderActive,
    backgroundColor: '#FFFFFF',
  },
  optionTextColumn: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: tokens.colors.text,
  },
  optionLabelSelected: {
    color: tokens.colors.primaryDarkText,
    fontWeight: '800',
  },
  optionSubtitle: {
    fontSize: 11,
    color: tokens.colors.textMuted,
    marginTop: 1,
  },
  unselectedRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: tokens.colors.borderDark,
  },
  customOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: tokens.radii.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: tokens.colors.secondaryDark,
    backgroundColor: tokens.colors.secondaryLight,
    marginTop: 4,
  },
  customOptionRowPressed: {
    opacity: 0.8,
  },
  customOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.secondaryDark,
  },
});
