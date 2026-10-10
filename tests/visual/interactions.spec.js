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

test("moving to the next block replaces the tooltip without hiding it", async ({ page }) => {
    await mount(page, { layout: "days", entities: ["sensor.sst_price"] });
    const blocks = page.locator(".schedule-block");
    const first = await blocks.nth(0).boundingBox();
    const second = await blocks.nth(1).boundingBox();
    const y = first.y + first.height / 2;
    await page.mouse.move(first.x + first.width / 2, y);
    await expect(tooltip(page)).toContainText("00:00 - 06:00");
    await page.mouse.move(second.x + second.width / 2, y, { steps: 6 });
    for (let i = 0; i < 4; i++) {
        await page.clock.runFor(60);
        expect(await tooltip(page).isVisible()).toBe(true);
    }
    await expect(tooltip(page)).toContainText("06:00 - 08:00");
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

// Crossing a block's own label fires mouseout/mouseover: it used to hide
// the tooltip for 150 ms (audit #3)
test("the tooltip stays visible while the pointer moves inside a block", async ({ page }) => {
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

// Keyboard: the Σ toggle and the entity name are buttons (audit #15)
const deepActive = (page) => page.evaluate(() => {
    let el = document.activeElement;
    while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
    return { cls: el?.className || "", expanded: el?.getAttribute?.("aria-expanded") ?? null };
});

test("the Σ toggle can be reached and used with the keyboard", async ({ page }) => {
    await mount(page, { layout: "days", entities: ["sensor.sst_mode"] });
    let reached = false;
    for (let i = 0; i < 15 && !reached; i++) {
        await page.keyboard.press("Tab");
        reached = (await deepActive(page)).cls.includes("combined-layer-toggle");
    }
    expect(reached).toBe(true);
    expect((await deepActive(page)).expanded).toBe("false");

    await page.keyboard.press("Enter");
    await expect(page.locator(".icon-row")).not.toHaveCount(1);
    // The focus stays on the toggle although the rows were rebuilt
    expect(await deepActive(page)).toEqual({ cls: expect.stringContaining("combined-layer-toggle"), expanded: "true" });

    await page.clock.runFor(400);
    await page.keyboard.press(" ");
    await expect(page.locator(".icon-row")).toHaveCount(1);
    expect((await deepActive(page)).expanded).toBe("false");
});

test("the entity name opens more-info from the keyboard", async ({ page }) => {
    await mount(page, { layout: "days", entities: ["sensor.sst_price"] });
    const opened = page.evaluate(() => new Promise(resolve =>
        window.addEventListener("hass-more-info", e => resolve(e.detail.entityId), { once: true })));
    await page.locator(".room-name").focus();
    await page.keyboard.press("Enter");
    expect(await opened).toBe("sensor.sst_price");
});

test("the size declared to the dashboard matches the rendered height", async ({ page }) => {
    const configs = [
        { layout: "days", entities: SENSORS.slice(0, 1) },
        { title: "Planning", layout: "days", entities: SENSORS },
        { title: "Planning", layout: "days", entities: [...SENSORS, ...SENSORS] },
        { title: "Planning", layout: "entities", entities: SENSORS },
        { layout: "entities", entities: SENSORS.slice(0, 1) },
    ];
    for (const config of configs) {
        const card = await mount(page, config);
        const [height, size] = await card.evaluate(el =>
            [el.shadowRoot.querySelector("ha-card").getBoundingClientRect().height, el.getCardSize()]);
        // Masonry units of ~50 px, one unit of tolerance
        expect(Math.abs(size - height / 50), JSON.stringify(config)).toBeLessThanOrEqual(1);
    }
});

test("the Σ toggle answers a tap slightly off its badge", async ({ page }) => {
    await mount(page, { layout: "days", entities: ["sensor.sst_mode"] });
    const box = await page.locator(".combined-layer-toggle").boundingBox();
    // 6 px below the 24 px badge: inside the 40 px hit area
    await page.mouse.click(box.x + box.width / 2, box.y + box.height + 6);
    await expect(page.locator(".icon-row")).not.toHaveCount(1);
});

test("hour labels are readable", async ({ page }) => {
    await mount(page, { layout: "days", entities: ["sensor.sst_mode"] });
    const [color, opacity] = await page.locator(".timeline-hour", { hasText: "12h" }).evaluate(el => {
        const style = getComputedStyle(el);
        return [style.color, style.opacity];
    });
    expect(opacity).toBe("1");
    expect(color).not.toBe("rgba(0, 0, 0, 0)");
});
