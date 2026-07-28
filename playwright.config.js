import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

const systemChrome = process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === "1"
  || (process.platform === "win32" && existsSync("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"));

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(systemChrome ? { channel: "chrome" } : {})
      }
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
        ...(systemChrome ? { channel: "chrome" } : {})
      }
    }
  ],
  webServer: [
    {
      command: "npm run start --prefix backend",
      url: "http://127.0.0.1:4000/api/health",
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: "development",
        PORT: "4000",
        DB_DIALECT: "sqlite",
        DATABASE_URL: "./data/unitracka-e2e.sqlite",
        SEED_DEMO: "true",
        BOOTSTRAP_ADMIN: "false",
        APP_URL: "http://127.0.0.1:5173",
        CORS_ORIGIN: "http://127.0.0.1:5173",
        COOKIE_SAMESITE: "lax",
        COOKIE_SECURE: "false"
      }
    },
    {
      command: "npm run dev --prefix frontend -- --host 127.0.0.1",
      url: "http://127.0.0.1:5173",
      timeout: 60_000,
      reuseExistingServer: !process.env.CI
    }
  ]
});
