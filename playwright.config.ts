import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 90000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    reducedMotion: "reduce",
    actionTimeout: 10000,
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      executablePath:
        process.env.CHROME_PATH ??
        (existsSync("C:/Program Files/Google/Chrome/Application/chrome.exe")
          ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
          : undefined),
    },
    screenshot: "only-on-failure",
  },
  webServer: {
    command:
      process.platform === "win32" ? "npm.cmd run start" : "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 30000,
  },
});
