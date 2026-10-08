module.exports = {
  testEnvironment: "node",

  roots: ["<rootDir>/tests"],

  testMatch: ["**/*.e2e.test.ts"],

  transform: {
    "^.+\\.tsx?$": ["@swc/jest"]
  },

  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },

  setupFiles: ["<rootDir>/tests/setup.ts"],

  setupFilesAfterEnv: ["<rootDir>/tests/setupAfter.ts"],

  clearMocks: true,

  maxWorkers: 1
};