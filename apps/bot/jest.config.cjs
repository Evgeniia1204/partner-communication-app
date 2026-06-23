module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  moduleNameMapper: {
    '^@bot/(.*)$': '<rootDir>/src/$1',
    '^@api/(.*)$': '<rootDir>/../api/src/$1',
    '^@core/(.*)$': '<rootDir>/../api/src/core/$1',
    '^@partner/shared$': '<rootDir>/../../packages/shared/src',
    '^@partner/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
  },
};
