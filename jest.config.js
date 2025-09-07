export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        // Use less strict configuration for tests
        strict: true,
        noUnusedLocals: false,
        noUnusedParameters: false
      }
    }],
    '^.+\\.js$': 'babel-jest',
  },
  // Allow both .js and .ts files in tests during migration
  testMatch: [
    '**/tests/**/*.(test|spec).(ts|js)',
    '**/__tests__/**/*.(test|spec).(ts|js)'
  ],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  // To be able to import .js files from .ts during gradual migration
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
}