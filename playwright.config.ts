import { defineConfig, devices } from "@playwright/test";

const APP_PORT = Number(process.env.E2E_APP_PORT || 3210);
const MOCK_PORT = Number(process.env.E2E_MOCK_PORT || 3299);
const BASE_URL = `http://localhost:${APP_PORT}`;
const MOCK_URL = `http://127.0.0.1:${MOCK_PORT}`;
const useDevServer = process.env.E2E_SERVER === "dev";

const serverCommand = useDevServer
  ? `npx next dev -p ${APP_PORT}`
  : `npm run build && npx next start -p ${APP_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.results",
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { outputFolder: "e2e/.report", open: "never" }]],
  globalSetup: "./e2e/support/global-setup.ts",
  globalTeardown: "./e2e/support/global-teardown.ts",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      testMatch: /(landing|responsive)\.spec\.ts/,
    },
  ],
  webServer: [
    {
      command: "node e2e/mock-server.mjs",
      url: `${MOCK_URL}/health`,
      reuseExistingServer: !process.env.CI,
      env: { E2E_MOCK_PORT: String(MOCK_PORT) },
    },
    {
      command: serverCommand,
      url: BASE_URL,
      reuseExistingServer: false,
      timeout: 600_000,
      stdout: "pipe",
      env: {
        APP_URL: BASE_URL,
        GOOGLE_GEMINI_BASE_URL: `${MOCK_URL}/gemini`,
        RESEND_BASE_URL: `${MOCK_URL}/resend`,
        MAYAR_API_URL: `${MOCK_URL}/mayar`,
        ENABLE_PAYMENT_SIMULATION: "true",
        NEXT_TELEMETRY_DISABLED: "1",
      },
    },
  ],
});
