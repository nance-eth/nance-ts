import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/src/.*\\.test\\.ts$"
  ],
  injectGlobals: true,
  globalSetup: "<rootDir>/test/api/setup/jest.setup.ts",
  globalTeardown: "<rootDir>/test/api/setup/jest.teardown.ts",
  detectOpenHandles: true,
};

export default config;
