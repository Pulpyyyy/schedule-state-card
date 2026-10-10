import { test, expect, mount, SENSORS } from "./fixtures.js";

// Behavior in a real browser (layout, pointer, focus): one project is enough
test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-light", "interactions run on desktop-light only");
});

const tooltip = (page) => page.locator("body > .custom-tooltip");
const priceNight = (page) => page.locator(".schedule-block").first();

test("hovering a block shows its details after a short delay", async ({ page }) => {
    await mount(page, { layout: "days", entities: ["sensor.sst_price"] });
    await priceNight(page).hover();
    await expect(tooltip(page)).toBeVisible();
    await expect(tooltip(page)).toContainText("00:00 - 06:00");
    await expect(tooltip(page)).toContainText("0 €/kWh");

    await page.mouse.move(5, 5);
    await expect(tooltip(page)).toBeHidden();
});

test("tapping a block shows its details, then hides them", async ({ page }) => {
    await mount(page, { layout: "days", entities: ["sensor.sst_price"] });
    await priceNight(page).click();
    await expect(tooltip(page)).toBeVisible();
    await page.clock.runFor(4500);
    await expect(tooltip(page)).toBeHidden();
});

test("clicking the entity name opens Home Assistant's more-info", async ({ page }) => {
    await mount(page, { layout: "days", entities: ["sensor.sst_price"] });
    const opened = page.evaluate(() => new Promise(resolve =>
        window.addEventListener("hass-more-info", e => resolve(e.detail.entityId), { once: true })));
    await page.locator(".room-name").click();
    expect(await opened).toBe("sensor.sst_price");
});

test("the entity selector switches the week shown", async ({ page }) => {
    await mount(page, { layout: "entities", entities: ["sensor.sst_mode", "sensor.sst_price"] });
    await page.locator("#entity-selector").selectOption("sensor.sst_price");
    await expect(page.locator(".room-state").first()).toContainText("€/kWh");
});

test("the card fits a phone screen without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await mount(page, { title: "Planning", layout: "days", entities: SENSORS });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
});

// Audit #3: mouseout from the block onto its own label starts an untracked
// 50 ms hide, the re-show waits 200 ms
test("the tooltip stays visible while the pointer moves inside a block (known bug)", async ({ page }) => {
    test.fail();
    await mount(page, { layout: "days", entities: ["sensor.sst_price"] });
    const box = await priceNight(page).boundingBox();
    await page.mouse.move(box.x + 3, box.y + box.height / 2);
    await expect(tooltip(page)).toBeVisible();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 }); // onto the label
    for (let i = 0; i < 6; i++) {
        await page.clock.runFor(50);
        expect(await tooltip(page).isVisible()).toBe(true);
    }
});

// Audit #15: Σ toggle and entity name are <span>s, unreachable by keyboard
test("the Σ toggle can be reached and used with the keyboard (known bug)", async ({ page }) => {
    test.fail();
    await mount(page, { layout: "days", entities: ["sensor.sst_mode"] });
    let reached = false;
    for (let i = 0; i < 15 && !reached; i++) {
        await page.keyboard.press("Tab");
        reached = await page.evaluate(() => {
            let el = document.activeElement;
            while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
            return !!el?.classList?.contains("combined-layer-toggle");
        });
    }
    expect(reached).toBe(true);
});
