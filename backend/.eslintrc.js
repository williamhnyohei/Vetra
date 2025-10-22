module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'max-len': ['error', { code: 120 }],
    'no-underscore-dangle': 'off',
    'consistent-return': 'off',
    'no-param-reassign': ['error', { props: false }],
  },
  ignorePatterns: [
    'node_modules/',
    'coverage/',
    'logs/',
    'dist/',
  ],
};
