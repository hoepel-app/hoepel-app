 module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
  ],
  rules:  {
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/explicit-function-return-type': [ 'error', { allowExpressions: true } ],
    '@typescript-eslint/member-delimiter-style': 'off', // Conflicts with Prettier#
    '@typescript-eslint/no-unused-vars': ["warn", { "ignoreRestSiblings": true }],
    '@typescript-eslint/no-explicit-any': 'off'
  }
}

