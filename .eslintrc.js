module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'plugin:@typescript-eslint/recommended',
  ],
  rules:  {
    'quotes': 'off', // Conflicts with @typescript-eslint/quotes
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/quotes': [ 'error', 'single' ],
    '@typescript-eslint/explicit-function-return-type': [ 'error', { allowExpressions: true } ],
    // "@typescript-eslint/explicit-function-return-type": "off",
  }
}

