import { defaults } from 'jest-config';

module.exports = {
  roots: ['<rootDir>/src'],
  bail: true,
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts'],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  verbose: true,
};
