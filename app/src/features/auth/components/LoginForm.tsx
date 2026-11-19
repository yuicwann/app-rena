import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { DuoTextInput } from '@/shared/ui/DuoTextInput';
import { DuoSelect } from '@/shared/ui/DuoSelect';
import { DuoButton } from '@/shared/ui/DuoButton';
import { DuoAlert } from '@/shared/ui/DuoAlert';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/shared/api';
import { tokens } from '@/shared/theme/tokens';

export interface LoginFormProps {
  onSuccess: () => void;
  initialClassName?: string;
  initialUsername?: string;
}

const DEFAULT_CLASSES = [
  'XII TAV 1',
  'XII TAV 2',
  'XI TAV 1',
  'XI TAV 2',
  'X TAV 1',
  'X TAV 2',
];

export function LoginForm({
  onSuccess,
  initialClassName = '',
  initialUsername = '',
}: LoginFormProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [className, setClassName] = useState(initialClassName);
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [classOptions, setClassOptions] = useState<string[]>(DEFAULT_CLASSES);

  const [prevInitialClassName, setPrevInitialClassName] = useState(initialClassName);
  const [prevInitialUsername, setPrevInitialUsername] = useState(initialUsername);

  if (initialClassName !== prevInitialClassName) {
    setPrevInitialClassName(initialClassName);
    if (initialClassName) setClassName(initialClassName);
  }

  if (initialUsername !== prevInitialUsername) {
    setPrevInitialUsername(initialUsername);
    if (initialUsername) setUsername(initialUsername);
  }

  const login = useAuthStore((s) => s.login);
  const registerStudent = useAuthStore((s) => s.registerStudent);
  const isLoading = useAuthStore((s) => s.isLoading);
  const serverError = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  useEffect(() => {
    let isMounted = true;
    authApi
      .getClasses()
      .then((classes) => {
        if (isMounted && classes && classes.length > 0) {
          const fetchedNames = classes.map((c) => c.name);
          const merged = Array.from(new Set([...fetchedNames, ...DEFAULT_CLASSES]));
          setClassOptions(merged);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async () => {
    setValidationError(null);
    clearError();

    const cleanClass = className.trim();
    if (!cleanClass) {
      setValidationError('Nama kelas wajib dipilih atau diisi.');
      return;
    }

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setValidationError('Nama siswa wajib diisi.');
      return;
    }

    if (!password) {
      setValidationError('Password murid wajib diisi.');
      return;
    }

    if (password.length < 4) {
      setValidationError('Password minimal 4 karakter.');
      return;
    }

    try {
      if (authMode === 'login') {
        const result = await login({
          className: cleanClass,
          password,
          username: cleanUsername,
        });

        if (result.success) {
          onSuccess();
        }
      } else {
        const result = await registerStudent({
          className: cleanClass,
          password,
          username: cleanUsername,
        });

        if (result.success) {
          onSuccess();
        }
      }
    } catch {
      setValidationError('Terjadi kendala saat memproses permintaan. Silakan periksa koneksi Anda atau coba lagi.');
    }
  };

  const errorMessage = validationError || serverError;

  return (
    <View style={styles.formContainer}>
      {/* Tab Switcher: Masuk vs Daftar Murid Baru */}
      <View style={styles.tabContainer}>
        <Pressable
          onPress={() => {
            setAuthMode('login');
            setValidationError(null);
            clearError();
          }}
          style={[styles.tabButton, authMode === 'login' && styles.activeTabButton]}
          accessibilityRole="button"
          accessibilityLabel="Tab Masuk"
        >
          <Text style={[styles.tabText, authMode === 'login' && styles.activeTabText]}>
            Masuk
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setAuthMode('register');
            setValidationError(null);
            clearError();
          }}
          style={[styles.tabButton, authMode === 'register' && styles.activeTabButton]}
          accessibilityRole="button"
          accessibilityLabel="Tab Daftar Murid"
        >
          <Text style={[styles.tabText, authMode === 'register' && styles.activeTabText]}>
            Daftar Murid Baru
          </Text>
        </Pressable>
      </View>

      {errorMessage && <DuoAlert message={errorMessage} variant="error" style={styles.alert} />}

      {/* 1. Pilihan Dropdown Kelas */}
      <DuoSelect
        label="Nama Kelas"
        placeholder="Pilih kelas"
        value={className}
        options={classOptions}
        onSelect={(val) => {
          setClassName(val);
          if (validationError) setValidationError(null);
        }}
        leftIcon="school-outline"
        allowCustom={true}
        customPlaceholder="Nama kelas"
      />

      {/* 2. Nama Siswa (Wajib Diisi) */}
      <DuoTextInput
        label="Nama Murid"
        placeholder="Nama murid"
        value={username}
        onChangeText={(text) => {
          setUsername(text);
          if (validationError) setValidationError(null);
        }}
        leftIcon="person-outline"
        autoCapitalize="words"
        helperText={
          authMode === 'login'
            ? 'Ketik namamu yang sudah terdaftar di kelas ini.'
            : 'Ketik nama lengkapmu untuk didaftarkan ke kelas ini.'
        }
      />

      {/* 3. Password Murid / Akun */}
      <DuoTextInput
        label={authMode === 'login' ? 'Password Murid' : 'Buat Password Murid'}
        placeholder={authMode === 'login' ? 'Masukkan password akunmu' : 'Buat password akunmu'}
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (validationError) setValidationError(null);
        }}
        isPassword={true}
        leftIcon="lock-closed-outline"
        autoCapitalize="none"
        helperText={
          authMode === 'login'
            ? 'Password akun yang kamu buat saat mendaftar.'
            : 'Password pribadi untuk login ke akun belajarmu.'
        }
      />

      <DuoButton
        label={authMode === 'login' ? 'Masuk ke Kelas' : 'Daftar & Mulai Belajar'}
        variant="green"
        size="large"
        loading={isLoading}
        onPress={handleSubmit}
        style={styles.submitBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    gap: tokens.spacing.md,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F2F5',
    borderRadius: tokens.radii.lg,
    padding: 4,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    marginBottom: tokens.spacing.xs,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radii.md,
  },
  activeTabButton: {
    backgroundColor: tokens.colors.surface,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    borderBottomWidth: 3,
    borderBottomColor: tokens.colors.borderDark,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.textMuted,
  },
  activeTabText: {
    color: tokens.colors.primaryDarkText,
    fontWeight: '800',
  },
  alert: {
    marginBottom: tokens.spacing.xs,
  },
  submitBtn: {
    marginTop: tokens.spacing.xs,
  },
});
