import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const FAKE_GOOGLE_PORT = 3199;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    trace: "retain-on-failure",
  },
  projects: [
    // iPhone の画面サイズ・タッチ操作を Chromium で再現（Safari 実機は手動確認）
    { name: "iphone", use: { ...devices["iPhone 13"], browserName: "chromium" } },
    { name: "android", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      // 偽 Google サーバー（OAuth・FreeBusy の本物と同じ手順を再現）
      command: `node tests/e2e/fake-google.mjs`,
      url: `http://localhost:${FAKE_GOOGLE_PORT}/__health`,
      env: { FAKE_GOOGLE_PORT: String(FAKE_GOOGLE_PORT) },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npm run build && npx next start -p ${PORT}`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        GOOGLE_CLIENT_ID: "e2e-client",
        GOOGLE_CLIENT_SECRET: "e2e-secret",
        GOOGLE_REDIRECT_URI: `http://localhost:${PORT}/api/auth/google/callback`,
        // テスト専用の固定鍵（本番では絶対に使わない）
        SESSION_SECRET: Buffer.alloc(32, 1).toString("base64"),
        APP_ORIGIN: `http://localhost:${PORT}`,
        GOOGLE_ENDPOINT_OVERRIDE: `http://localhost:${FAKE_GOOGLE_PORT}`,
      },
    },
  ],
});
