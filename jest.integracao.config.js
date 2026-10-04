// Testes que usam a rede de verdade (sem o preset jest-expo, que substitui o fetch).
// Uso: SCRIBE_AUDIO=/caminho/sintetico.m4a npx jest -c jest.integracao.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.integracao.test.ts'],
  transform: { '^.+\\.[jt]sx?$': ['babel-jest', { presets: [require.resolve('babel-preset-expo', { paths: [require.resolve('expo/package.json')] })] }] },
};
