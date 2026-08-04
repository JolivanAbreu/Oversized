module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/src/__tests__/setupIntegration.js'],
  testPathIgnorePatterns: ['/node_modules/', '/src/__tests__/setupIntegration.js'],
  testTimeout: 15000,
};
