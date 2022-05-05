import type { Config } from "@jest/types"

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  verbose: true,
  automock: true,
  coverageDirectory: './coverage',
  moduleDirectories: ['node_modules', 'src'],
  globalSetup: './src/discord/tests/test.global.ts'
}
export default config