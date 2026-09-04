const path = require('path');
const { readFileSync } = require('fs');

// Reading the SWC compilation config for the spec files
const swcJestConfig = JSON.parse(
  readFileSync(`${__dirname}/.spec.swcrc`, 'utf-8'),
);

// Disable .swcrc look-up by SWC core because we're passing in swcJestConfig ourselves
swcJestConfig.swcrc = false;

module.exports = {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: {
    '^@pulse-crypto/contracts$': path.join(
      __dirname,
      '../../libs/contracts/src/index.ts',
    ),
    '^@pulse-crypto/market-domain$': path.join(
      __dirname,
      '../../libs/market-domain/src/index.ts',
    ),
    '^@pulse-crypto/shared$': path.join(
      __dirname,
      '../../libs/shared/src/index.ts',
    ),
  },
  coverageDirectory: 'test-output/jest/coverage',
};
