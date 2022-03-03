/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
// jest.config.ts
import type { Config } from "@jest/types"

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.jsx?$": "babel-jest", // Adding this line solved the issue
    "^.+\\.tsx?$": "ts-jest"
  },
  verbose: true,
  automock: false,
  globals: {
    "ts-jest": {
      "tsconfig": "tsconfig.json",
      "diagnostics": true
    }
  },
}
export default config