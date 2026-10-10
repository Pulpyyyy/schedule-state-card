import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { login, cardWith, readSigma, setHelpers, HELPERS_DEFAULT } from "./ha.js";

// The card used by a non-admin user: template conditions must still be
// judged by HA (render_template over the WebSocket is open to every user).
const tokenFile = process.env.HA_USER_TOKEN_FILE;

test.skip(!tokenFile, "HA_USER_TOKEN_FILE not set");
test.afterEach(() => setHelpers(HELPERS_DEFAULT));

test("a non-admin user sees template conditions follow HA", async ({ page }) => {
    await login(page, readFileSync(tokenFile, "utf8").trim());
    await page.goto("/schedule-tests/templates");
    const card = cardWith(page, "Template conditions");
    await expect(card.locator(".schedule-block").first()).toBeVisible();
    expect(await page.evaluate(() => document.querySelector("home-assistant").hass.user.is_admin)).toBe(false);
    await expect.poll(() => readSigma(card)).toEqual(["00:00-23:59 home"]);

    await setHelpers({ away: true }); // changed by the admin token, pushed to the user's session
    await expect.poll(() => readSigma(card)).toEqual(["00:00-09:00 home", "09:00-17:00 away", "17:00-23:59 home"]);
});
