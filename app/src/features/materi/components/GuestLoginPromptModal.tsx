import React from 'react';
import { View, StyleSheet, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/shared/theme/tokens';
import { Text } from '@/shared/ui/Text';
import { DuoButton } from '@/shared/ui/DuoButton';

export interface GuestLoginPromptModalProps {
  visible: boolean;
  onClose: () => void;
  stepTitle?: string;
}

export function GuestLoginPromptModal({
  visible,
  onClose,
  stepTitle,
}: GuestLoginPromptModalProps) {
  const router = useRouter();

  const handleGoToLogin = () => {
    onClose();
    router.push('/login');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.dialogCard}>
          {/* Lock Icon Badge */}
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed" size={32} color={tokens.colors.primaryDark} />
          </View>

          {/* Heading */}
          <Text variant="titleSmall" style={styles.title}>
            Masuk untuk Berprogres
          </Text>

          {/* Description */}
          <Text variant="bodySmall" color={tokens.colors.textSecondary} style={styles.description}>
            {stepTitle
              ? `Tahapan "${stepTitle}" terkunci untuk akun tamu. Masuk dengan akun kelasmu agar progres belajar dan riwayat nilaimu tersimpan secara nyata!`
              : 'Fitur progres belajar terkunci pada Mode Tamu. Masuk dengan akun kelasmu untuk membuka tahapan materi dan menyimpan hasil belajarmu di server.'}
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <DuoButton
              label="Masuk Akun Kelas"
              variant="green"
              size="medium"
              icon={<Ionicons name="log-in" size={18} color="#FFFFFF" />}
              onPress={handleGoToLogin}
            />

            <DuoButton
              label="Tetap Eksplorasi Tamu"
              variant="white"
              size="small"
              onPress={onClose}
            />
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.lg,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radii.xl,
    padding: tokens.spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: tokens.colors.border,
    borderBottomWidth: 5,
    borderBottomColor: tokens.colors.borderDark,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: tokens.colors.primaryLight,
    borderWidth: 2,
    borderColor: tokens.colors.primaryBorderActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: tokens.colors.text,
    textAlign: 'center',
    marginBottom: tokens.spacing.xs,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    color: tokens.colors.textSecondary,
    marginBottom: tokens.spacing.lg,
  },
  buttonContainer: {
    width: '100%',
    gap: tokens.spacing.sm,
  },
});
