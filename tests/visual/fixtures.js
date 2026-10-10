/**
 * Playwright fixtures: the harness is served straight from the repository
 * through page.route() (no web server, no port), with a frozen date.
 */
import { test as base, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const ORIGIN = "http://harness.test";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff" };

// Monday 10:00 in the fixtures' zone (timezoneId in playwright.config.js)
export const NOW = new Date("2026-10-12T10:00:00+02:00");
export const WINTER = "{{ now().month in [11, 12, 1, 2, 3] }}";
export const SENSORS = ["sensor.sst_thermostat", "sensor.sst_price", "sensor.sst_mode", "sensor.sst_dynamic"];

export const test = base.extend({
    page: async ({ page }, use) => {
        await page.route(`${ORIGIN}/**`, async (route) => {
            const path = decodeURIComponent(new URL(route.request().url()).pathname);
            const file = resolve(ROOT, "." + path);
            if (!file.startsWith(ROOT + sep)) return route.fulfill({ status: 403 });
            try {
                await route.fulfill({ body: await readFile(file), contentType: TYPES[extname(file)] || "application/octet-stream" });
            } catch {
                await route.fulfill({ status: 404 });
            }
        });
        await page.clock.install({ time: NOW });
        await page.goto(`${ORIGIN}/tests/visual/harness/index.html`);
        await use(page);
    },
});

/** Mount the card in the harness; templates default to HA's October answer. */
export async function mount(page, config, opts = {}) {
    await page.evaluate(([c, o]) => window.mountCard(c, o), [config, { templates: { [WINTER]: false }, ...opts }]);
    return page.locator("schedule-state-card");
}

export { expect };
