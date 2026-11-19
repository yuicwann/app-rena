// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*'],
  },
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*', '!@/features/*'],
              message:
                'Hanya index.ts fitur yang boleh diimpor dari luar fitur. Jangan mengimpor jalur internal (Architecture.MD §3).',
            },
          ],
        },
      ],
    },
  },
]);
