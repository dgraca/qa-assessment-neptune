import { defineConfig, devices } from '@playwright/test';

// Load local credentials when tests are run directly on the host.
// Docker/CI can continue to provide them through environment variables.
try {
  process.loadEnvFile();
} catch {
  // A .env file is optional outside local development.
}

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Authentication uses one account and writes to one shared storage-state file. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000'
    baseURL: process.env.BASE_URL ?? 'http://localhost:8080',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    // I must configure the initial setup to create the user session so the other tests can be ran without running the auth test every time
    {
      name: 'auth-setup',
      testMatch: '**/auth/login.setup.ts',
    },
    {
      name: 'table-definition-setup',
      testMatch: '**/setup-table-definition/table-definition.setup.ts',
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
    },
    {
      name: 'chromium',
      testIgnore: '**/*.setup.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['table-definition-setup'],
    },
    {
      name: 'firefox',
      testIgnore: '**/*.setup.ts',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['table-definition-setup'],
    },
    {
      name: 'webkit',
      testIgnore: '**/*.setup.ts',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['table-definition-setup'],
    },
  ],
});
