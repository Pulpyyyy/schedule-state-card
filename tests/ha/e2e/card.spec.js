import { test, expect } from "@playwright/test";
import { login, cardWith, readSigma, setHelpers, HELPERS_DEFAULT } from "./ha.js";

// Monday 10:00 for the browser (day buttons, time cursor); HA itself keeps
// its real clock, so only the browser-side rendering is frozen
const NOW = new Date("2026-10-12T10:00:00");

test.beforeEach(async ({ page }) => {
    await login(page);
    await page.clock.install({ time: NOW });
});
test.afterEach(() => setHelpers(HELPERS_DEFAULT));

async function openView(page, view) {
    await page.goto(`/schedule-tests/${view}`);
    await expect(page.locator("schedule-state-card").first()).toBeVisible();
    await expect(page.locator("schedule-state-card .schedule-block").first()).toBeVisible();
}

test("the card loads in Home Assistant and registers in the card picker", async ({ page }) => {
    await openView(page, "days");
    const registered = await page.evaluate(() => ({
        element: !!customElements.get("schedule-state-card"),
        picker: (window.customCards || []).some(c => c.type === "schedule-state-card"),
    }));
    expect(registered).toEqual({ element: true, picker: true });
});

test("#18: merged Σ on the integration's real data", async ({ page }) => {
    await openView(page, "issues");
    await expect.poll(() => readSigma(cardWith(page, "#18"))).toEqual([
        "00:00-07:00 sleep",
        "07:00-22:30 normal",
        "22:30-23:59 sleep",
    ]);
});

test("follows live entity changes pushed by Home Assistant", async ({ page }) => {
    await openView(page, "issues");
    const card = cardWith(page, "#18");
    await expect.poll(() => readSigma(card)).toHaveLength(3);

    await setHelpers({ away: true });
    await page.clock.runFor(1000); // the card debounces bursts of updates
    await expect.poll(() => readSigma(card)).toEqual([
        "00:00-06:00 normal",
        "06:00-09:00 comfort",
        "09:00-12:00 normal",
        "12:00-14:00 eco",
        "14:00-17:00 normal",
        "17:00-20:00 comfort",
        "20:00-23:59 normal",
    ]);

    await setHelpers({ away: false });
    await page.clock.runFor(1000);
    await expect.poll(() => readSigma(card)).toHaveLength(3);
});

test("template conditions are evaluated by Home Assistant", async ({ page }) => {
    // The fixture's "winter" layer: {{ now().month in [11, 12, 1, 2, 3] }},
    // judged by HA with its real date
    const winter = [11, 12, 1, 2, 3].includes(new Date().getMonth() + 1);
    await openView(page, "days");
    const card = cardWith(page, "SST Thermostat").first();
    await card.locator(".combined-layer-toggle").first().click();
    const row = card.locator(".icon-row").filter({ has: page.locator(".layer-number") })
        .and(card.locator('[data-tooltip*="now().month"], [data-tooltip*="Month"], [data-tooltip*="Mois"]'));
    await expect(row).toHaveCount(1);
    await expect.poll(async () => (await row.getAttribute("data-tooltip")).includes(winter ? "✅" : "❌")).toBe(true);
});

test("a template condition follows the result Home Assistant pushes", async ({ page }) => {
    // {{ is_state('input_boolean.sst_away', 'on') }}: no state condition the
    // card could judge itself, only HA's render_template subscription
    await page.goto("/schedule-tests/templates");
    const card = cardWith(page, "Template conditions");
    await expect(card.locator(".schedule-block").first()).toBeVisible();
    await expect.poll(() => readSigma(card)).toEqual(["00:00-23:59 home"]);

    await setHelpers({ away: true });
    await page.clock.runFor(1000);
    await expect.poll(() => readSigma(card)).toEqual(["00:00-09:00 home", "09:00-17:00 away", "17:00-23:59 home"]);

    await setHelpers({ away: false });
    await page.clock.runFor(1000);
    await expect.poll(() => readSigma(card)).toEqual(["00:00-23:59 home"]);
});

test("clicking the entity name opens Home Assistant's more-info dialog", async ({ page }) => {
    await openView(page, "issues");
    await cardWith(page, "#18").locator(".room-name").click();
    const dialog = page.locator("ha-more-info-dialog");
    await expect(dialog.locator("dialog[open]")).toBeVisible();
    await expect(dialog.getByText("SST Issue 18").first()).toBeVisible();
});

test("#18 card as Home Assistant renders it", async ({ page }) => {
    await openView(page, "issues");
    const card = cardWith(page, "#18");
    await page.mouse.move(0, 0);
    // The entity state comes from HA's real clock: mask it
    await expect(card).toHaveScreenshot("issue-18.png", { mask: [card.locator(".room-state")] });
});
