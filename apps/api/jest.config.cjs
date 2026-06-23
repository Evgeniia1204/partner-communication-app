module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@prisma/(.*)$': '<rootDir>/src/prisma/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@partner/shared$': '<rootDir>/../../packages/shared/src',
    '^@partner/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
  },
};
