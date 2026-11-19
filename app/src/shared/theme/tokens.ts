export const tokens = {
  colors: {
    // Duolingo Primary / Eager Green
    primary: '#58CC02',
    primaryDark: '#46A302',
    primaryLight: '#EAF8EE',
    primaryPill: '#DCF6D2',
    primaryDarkText: '#246303',
    primaryStorybook: '#D7FFB8',
    primaryFixed: '#87FE45',
    primaryBorderActive: '#BBF7D0',

    // Secondary / Spark Blue
    secondary: '#1CB0F6',
    secondaryDark: '#1899D6',
    secondaryLight: '#E6F6FE',

    // Accent / Sunny Gold
    accent: '#FFC800',
    accentDark: '#D4A600',
    accentLight: '#FFFBEA',

    // Surfaces & Canvas
    background: '#FBF9F9',
    surface: '#FFFFFF',
    surfaceContainerLow: '#F5F3F3',
    border: '#E2E8F0',
    borderDark: '#CBD5E1',
    cardBorder: '#E2E8F0',

    // Typography & Ink
    text: '#1B1C1C',
    textSecondary: '#4B4B4B',
    textMuted: '#6F7B64',
    textDisabled: '#94A3B8',
    textInverted: '#FFFFFF',

    // Status
    success: '#58CC02',
    successLight: '#EEFCE6',
    error: '#BA1A1A',
    errorLight: '#FFDAD6',
    warning: '#FFC800',
    warningLight: '#FFFBEA',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  typography: {
    caption: {
      fontSize: 12,
      lineHeight: 16,
    },
    bodySmall: {
      fontSize: 14,
      lineHeight: 20,
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
    },
    titleSmall: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '700' as const,
    },
    titleMedium: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '800' as const,
    },
    titleLarge: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '900' as const,
    },
  },
} as const;

export type ThemeTokens = typeof tokens;
