import { test, expect } from "@playwright/test";
import { login } from "./ha.js";

// The card editor inside Home Assistant's real edit dialog. Nothing is ever
// saved: the dialog is left without pressing Save, the dashboard stays as is.

test.beforeEach(async ({ page }) => {
    await login(page);
});

/** Opens the edit dialog of the first schedule card of a view; returns the editor. */
async function openEditor(page, view = "days") {
    await page.goto(`/schedule-tests/${view}?edit=1`);
    const options = page.locator("hui-card-options").filter({ has: page.locator("schedule-state-card") }).first();
    await options.getByRole("button", { name: /^(Edit|Modifier)$/ }).click();
    const editor = page.locator("schedule-state-card-editor");
    await expect(editor.locator(".entity-row").first()).toBeVisible();
    return editor;
}

const preview = (page) => page.locator("hui-dialog-edit-card schedule-state-card");

test("shows the card's configuration", async ({ page }) => {
    const editor = await openEditor(page);
    await expect(editor.locator(".entity-row")).toHaveCount(4);
    await expect(editor.locator(".entity-id")).toHaveText(["sensor.sst_thermostat", "sensor.sst_price", "sensor.sst_mode", "sensor.sst_dynamic"]);
    await expect(editor.locator("#layout-selector")).toHaveValue("days");
});

test("the preview follows the editor", async ({ page }) => {
    const editor = await openEditor(page);
    await expect(preview(page).locator(".room-state").first()).toBeVisible();
    await editor.locator("#show-state-input").click();
    await expect(preview(page).locator(".room-state")).toHaveCount(0);
});

test("removing an entity removes it from the preview", async ({ page }) => {
    const editor = await openEditor(page);
    await editor.locator(".remove-btn").last().click();
    await expect(editor.locator(".entity-row")).toHaveCount(3);
    await expect(preview(page).locator(".room-timeline")).toHaveCount(3);
});

// HA 2026.x dropped ha-textfield: the card title and entity name fields
// never upgrade and render 0 px high
test("every text field is displayed (known bug)", async ({ page }) => {
    test.fail();
    const editor = await openEditor(page);
    await editor.locator(".edit-btn").first().click();
    for (const field of ["#title-input", '[data-field="name"]']) {
        const box = await editor.locator(field).first().boundingBox();
        expect(box?.height ?? 0, field).toBeGreaterThan(20);
    }
});

// Audit #17: every change re-renders the whole editor (HA calls setConfig back)
test("a color field survives its own change (known bug)", async ({ page }) => {
    test.fail();
    const editor = await openEditor(page);
    const input = editor.locator(".color-selector-slot").first().locator('input[type="color"]');
    const handle = await input.elementHandle();
    await input.fill("#ff0000");
    await page.waitForTimeout(500);
    expect(await handle.evaluate(el => el.isConnected)).toBe(true);
});

test("text typed for a new color override survives other changes (known bug)", async ({ page }) => {
    test.fail();
    const editor = await openEditor(page);
    await editor.locator("#override-value-input").fill("21");
    await editor.locator("#show-state-input").click();
    await page.waitForTimeout(500);
    await expect(editor.locator("#override-value-input")).toHaveValue("21");
});
