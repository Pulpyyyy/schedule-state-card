import { defineConfig } from "@playwright/test";

// Visual tests (tier B): the card inside a real Home Assistant, the test
// instance described in tests/ha (fixture package + test dashboard).
// Settings come from .env (gitignored), see tests/ha/e2e/ha.js. Its
// screenshots depend on the instance and its HA version: they stay local.
try { process.loadEnvFile(".env"); } catch { /* variables may come from the shell */ }

export default defineConfig({
    testDir: "tests/ha/e2e",
    testMatch: "**/*.spec.js",
    snapshotPathTemplate: "{testDir}/__screenshots__/{testFileName}/{arg}-{platform}{ext}",
    globalSetup: "./tests/ha/e2e/global-setup.js",
    // One shared instance: tests drive its helper entities, never in parallel
    workers: 1,
    fullyParallel: false,
    retries: 0,
    timeout: 60_000,
    reporter: [["list"]],
    expect: {
        timeout: 15_000,
        toHaveScreenshot: { animations: "disabled", caret: "hide", scale: "css" },
    },
    use: {
        browserName: "chromium",
        baseURL: process.env.HA_URL,
        viewport: { width: 1280, height: 900 },
        locale: "en-US",
        trace: "retain-on-failure",
    },
});
