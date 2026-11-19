module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/features/(.*)$': '<rootDir>/src/features/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@/store/(.*)$': '<rootDir>/src/store/$1',
    '^@/i18n$': '<rootDir>/src/i18n/index.ts',
    '^@/i18n/(.*)$': '<rootDir>/src/i18n/$1',
    '^@/content/(.*)$': '<rootDir>/content/$1',
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
  },
};
