import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://127.0.0.1:3000",
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/smoke/**/*.cy.{js,jsx,ts,tsx}",
    setupNodeEvents(_on, config) {
      return config;
    },
    video: false,
    screenshotOnRunFailure: true,
  },
});
