module.exports = {
  env: {
    browser: true,
    node: true,
    es2024: true,
    jest: true, // Jest 전역 변수
  },
  extends: ['airbnb-base'],
  plugins: ['import'],
  rules: {
    'no-console': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',
    'no-else-return': 'error',
    'max-len': ['error', { code: 100 }],
    'comma-dangle': ['error', 'always-multiline'],
    'arrow-body-style': ['error', 'as-needed'],
    'object-curly-spacing': ['error', 'always'],
    'import/extensions': ['error', 'ignorePackages', { js: 'always', jsx: 'always' }],
  },
};
