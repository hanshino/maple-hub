import nextConfig from 'eslint-config-next/core-web-vitals';
import prettierConfig from 'eslint-config-prettier';

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '__tests__/**',
      '*.log',
      '.env*',
      '.eslintcache',
      '.cache',
    ],
  },
  ...nextConfig,
  prettierConfig,
  {
    rules: {
      '@next/next/no-img-element': 'off',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
];

export default eslintConfig;
