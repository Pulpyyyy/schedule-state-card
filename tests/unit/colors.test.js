import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadCard } from "../helpers/load-card.js";
import { makeHass } from "../helpers/hass.js";
import { mountCard, unmountAll, readCard } from "../helpers/card-dom.js";
import { contrast } from "../helpers/contrast.js";

const { COLOR_CACHE } = loadCard();
const card = () => document.createElement("schedule-state-card");

// 300 typical schedule values: temperatures, prices, modes
const SAMPLE = [
    ...Array.from({ length: 160 }, (_, i) => [String(10 + i / 8), "°C"]),
    ...Array.from({ length: 100 }, (_, i) => [(0.1 + i / 400).toFixed(4), "€/kWh"]),
    ...["eco", "comfort", "off", "on", "home", "away", "sleep", "normal", "boost", "frost",
        "night", "day", "auto", "manual", "heat", "cool", "dry", "fan", "idle", "open",
        "closed", "1", "2", "3", "4", "5", "low", "medium", "high", "max",
        "vacation", "party", "guest", "school", "work", "holiday", "weekend", "morning", "evening", "noon"]
        .map(v => [v, ""]),
];

afterEach(() => {
    unmountAll();
    vi.useRealTimers();
});

describe("state colors", () => {
    it("are stable across releases for the same value and unit", () => {
        const c = card();
        const sample = ["19", "21", "0", "eco", "comfort"].map(v => [v, c.getColorForState(v, v.match(/\d/) ? "°C" : "")]);
        sample.push(["0 €/kWh", c.getColorForState("0", "€/kWh")]);
        expect(sample).toMatchSnapshot();
    });

    it("treat 21 and 21.0 as the same value, but not the same value with another unit", () => {
        const c = card();
        expect(c.getColorForState("21.0", "°C")).toEqual(c.getColorForState("21", "°C"));
        expect(c.getColorForState("21", "°C").color).not.toBe(c.getColorForState("21", "%").color);
    });

    it("can be overridden per value|unit, and the override goes away with its card", () => {
        const owner = {};
        COLOR_CACHE.setOwnerOverrides(owner, { "0|€/kWh": { color: "#4CAF50", textColor: "#000000" } });
        expect(card().getColorForState("0", "€/kWh")).toEqual({ color: "#4CAF50", textColor: "#000000" });
        COLOR_CACHE.setOwnerOverrides(owner, null);
        expect(card().getColorForState("0", "€/kWh").color).toMatch(/^hsl\(/);
    });

    it("keep block text readable (WCAG 4.5:1)", () => {
        const c = card();
        const unreadable = SAMPLE
            .map(([v, u]) => ({ v, u, ...c.getColorForState(v, u) }))
            .filter(x => contrast(x.color, x.textColor) < 4.5);
        expect(unreadable).toEqual([]);
    });

    it("pick the text color for a block's own color", async () => {
        vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame"] });
        vi.setSystemTime(new Date("2026-10-12T10:00:00"));
        const yellow = "#FFEB3B";
        // A value whose generated color calls for white text
        const value = SAMPLE.map(([v]) => v).find(v => card().getColorForState(v, "").textColor === "#ffffff");
        const layers = { mon: [{ is_default_layer: true, condition_text: "default",
            blocks: [{ start: "00:00", end: "23:59", state_value: value, is_default_bg: true, color: yellow }] }] };
        const hass = makeHass({ states: { "sensor.colored": { entity_id: "sensor.colored", state: value, attributes: { friendly_name: "Colored", layers } } } });
        const mounted = mountCard({ layout: "days", entities: ["sensor.colored"] }, hass);
        await vi.advanceTimersByTimeAsync(1000);
        const block = readCard(mounted).timelines[0].rows[0].blocks[0];
        expect(contrast(block.background, block.color)).toBeGreaterThanOrEqual(4.5);
    });
});
