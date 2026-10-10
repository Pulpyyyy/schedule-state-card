import { test, expect, mount, SENSORS } from "./fixtures.js";

const sigma = (page, index = 0) => page.locator(".combined-layer-toggle").nth(index);
const day = (page, id) => page.locator(`.day-button[data-day="${id}"]`);

// Screenshot of the card alone: move the pointer away so no hover state or
// tooltip (appended to <body>, over the card) ends up in the image
async function shot(page, card, name) {
    await page.mouse.move(0, 0);
    await page.clock.runFor(300);
    await expect(card).toHaveScreenshot(name);
}

test.describe("days layout", () => {
    test("collapsed, four entities", async ({ page }) => {
        const card = await mount(page, { title: "Planning", layout: "days", entities: SENSORS });
        await shot(page, card, "days-collapsed.png");
    });

    test("expanded layers", async ({ page }) => {
        const card = await mount(page, { title: "Planning", layout: "days", entities: ["sensor.sst_thermostat", "sensor.sst_mode"] });
        await sigma(page, 0).click();
        await sigma(page, 1).click();
        await shot(page, card, "days-expanded.png");
    });

    test("another day selected", async ({ page }) => {
        const card = await mount(page, { layout: "days", entities: ["sensor.sst_thermostat", "sensor.sst_mode"] });
        await day(page, "sat").click();
        await shot(page, card, "days-saturday.png");
    });

    test("#18: merged Σ, collapsed and expanded", async ({ page }) => {
        const card = await mount(page, { title: "Issue 18", layout: "days", entities: ["sensor.sst_issue_18"] });
        await shot(page, card, "issue-18-collapsed.png");
        await sigma(page).click();
        await shot(page, card, "issue-18-expanded.png");
    });

    test("conditions flipped by entity changes", async ({ page }) => {
        const card = await mount(page, { layout: "days", entities: ["sensor.sst_issue_18", "sensor.sst_thermostat"] });
        await page.evaluate(() => window.setStates({ "input_boolean.sst_away": "on", "input_number.sst_outdoor": "0" }));
        await page.clock.runFor(1000);
        await shot(page, card, "conditions-flipped.png");
    });

    test("color overrides, no title, no state", async ({ page }) => {
        const card = await mount(page, {
            layout: "days", show_state_in_title: false, entities: ["sensor.sst_price"],
            color_overrides: { "0|€/kWh": { color: "#4CAF50", textColor: "#000000" }, "0.1952|€/kWh": { color: "#1565C0", textColor: "#ffffff" } },
        });
        await shot(page, card, "color-overrides.png");
    });

    test("French, 12-hour clock", async ({ page }) => {
        const card = await mount(page, { title: "Planning", layout: "days", entities: ["sensor.sst_thermostat"] }, { language: "fr", timeFormat: "12" });
        await shot(page, card, "fr-12h.png");
    });

    test("missing entity", async ({ page }) => {
        const card = await mount(page, { layout: "days", entities: ["sensor.does_not_exist", "sensor.sst_mode"] });
        await shot(page, card, "missing-entity.png");
    });
});

test.describe("entities layout", () => {
    test("a week of one entity", async ({ page }) => {
        const card = await mount(page, { title: "Mode", layout: "entities", entities: ["sensor.sst_mode", "sensor.sst_thermostat"] });
        await shot(page, card, "entities-week.png");
    });
});
