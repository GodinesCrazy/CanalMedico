module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/database/**',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  // Timeout para tests de integración (30 segundos)
  testTimeout: 30000,
  // Setup files (ejecutar antes de los tests)
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/jest-setup.ts'],
  // Variables de entorno para tests
  testEnvironmentOptions: {
    // Si DATABASE_URL_TEST no está definido, usar la DB de test por defecto
    NODE_ENV: 'test',
  },
};
