module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist'],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],

    // General rules
    'no-console': ['warn', { allow: ['log', 'warn', 'error'] }],
    'no-debugger': 'warn',
    'no-duplicate-imports': 'error',
    'no-unused-vars': 'off', // Using TypeScript's no-unused-vars instead
    'prefer-const': 'warn',
    'no-var': 'error',

    // Async/Promise rules
    'no-return-await': 'warn',
    'require-await': 'warn', // No options here

    // Code style
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'all',
        printWidth: 100,
        tabWidth: 2,
        semi: true,
      },
    ],
  },
  overrides: [
    {
      // Relaxed rules for database files
      files: [
        '**/database/**/*.ts',
        '**/migrations/**/*.ts',
        '**/seeds/**/*.ts',
        '**/repositories/**/*.ts',
      ],
      rules: {
        // '@typescript-eslint/no-explicit-any': 'off',
        'require-await': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
    {
      // Stricter rules for services and controllers
      files: ['**/services/**/*.ts', '**/controllers/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        'require-await': 'error',
      },
    },
  ],
};
