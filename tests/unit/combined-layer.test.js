import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadCard } from "../helpers/load-card.js";
import { makeHass, dayLayers } from "../helpers/hass.js";

const { TimeHelper, ConditionEvaluator, CombinedLayerBuilder } = loadCard();

/** Σ of a layer list, the way the card builds it for one day. */
function sigma(layers, day, hass = makeHass()) {
    const evaluator = new ConditionEvaluator(hass, day);
    const defaultLayer = layers.find(l => l.is_default_layer);
    const active = layers.filter(l => !l.is_default_layer && !l.is_combined_layer && evaluator.evaluateLayer(l));
    const combined = new CombinedLayerBuilder(new TimeHelper(), evaluator).build(defaultLayer, active);
    return combined.blocks.map(b => `${b.start}-${b.end} ${b.state_value}`);
}

const block = (start, end, state_value, extra = {}) => ({ start, end, state_value, ...extra });
const layer = (blocks, extra = {}) => ({ blocks, ...extra });
const defaultLayer = (state_value = "default") =>
    layer([block("00:00", "23:59", state_value, { is_default_bg: true })], { is_default_layer: true });

beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-12T10:00:00")); // Monday
});
afterEach(() => vi.useRealTimers());

describe("Σ combined layer", () => {
    it("#18: a top layer covering the whole day is not cut at lower layers' boundaries", () => {
        expect(sigma(dayLayers("sensor.sst_issue_18", "mon"), "mon")).toEqual([
            "00:00-07:00 sleep",
            "07:00-22:30 normal",
            "22:30-23:59 sleep",
        ]);
    });

    it("#18: with the top layer off, the lower layers show through the default", () => {
        const hass = makeHass({ states: { "input_boolean.sst_away": "on" } });
        expect(sigma(dayLayers("sensor.sst_issue_18", "mon"), "mon", hass)).toEqual([
            "00:00-06:00 normal",
            "06:00-09:00 comfort",
            "09:00-12:00 normal",
            "12:00-14:00 eco",
            "14:00-17:00 normal",
            "17:00-20:00 comfort",
            "20:00-23:59 normal",
        ]);
    });

    it("keeps segments of different layers apart even with the same value", () => {
        const layers = [
            layer([block("08:00", "10:00", "21")], { condition_key: "a" }),
            layer([block("10:00", "12:00", "21")], { condition_key: "b" }),
            defaultLayer("19"),
        ];
        expect(sigma(layers, "mon")).toEqual([
            "00:00-08:00 19",
            "08:00-10:00 21",
            "10:00-12:00 21",
            "12:00-23:59 19",
        ]);
    });

    it("keeps adjacent segments of one layer apart when they render differently", () => {
        const layers = [
            layer([block("08:00", "10:00", "21", { icon: "mdi:sun" }), block("10:00", "12:00", "21", { icon: "mdi:moon" })]),
            defaultLayer("19"),
        ];
        expect(sigma(layers, "mon")).toEqual([
            "00:00-08:00 19",
            "08:00-10:00 21",
            "10:00-12:00 21",
            "12:00-23:59 19",
        ]);
    });

    it("lets the highest active layer win where layers overlap", () => {
        const layers = [
            layer([block("06:00", "12:00", "low")]),
            layer([block("08:00", "10:00", "high")]),
            defaultLayer("def"),
        ];
        expect(sigma(layers, "mon")).toEqual([
            "00:00-06:00 def",
            "06:00-08:00 low",
            "08:00-10:00 high",
            "10:00-12:00 low",
            "12:00-23:59 def",
        ]);
    });

    it("only takes weekday blocks matching the rendered day", () => {
        const mode = dayLayers("sensor.sst_mode", "mon");
        expect(sigma(mode, "mon")).toContain("07:00-09:00 comfort");
        const weekend = dayLayers("sensor.sst_mode", "sat");
        expect(sigma(weekend, "sat")).toContain("09:00-10:00 comfort");
        expect(sigma(weekend, "sat")).not.toContain("07:00-09:00 comfort");
    });

    it("is the default layer alone when no conditional layer is active", () => {
        const layers = [layer([block("08:00", "10:00", "x", {
            raw_conditions: [{ condition: "state", entity_id: "input_boolean.sst_away", state: "on" }],
        })]), defaultLayer("19")];
        expect(sigma(layers, "mon")).toEqual(["00:00-23:59 19"]);
    });

    it("is null without a default layer", () => {
        const evaluator = new ConditionEvaluator(makeHass(), "mon");
        expect(new CombinedLayerBuilder(new TimeHelper(), evaluator).build(null, [])).toBeNull();
    });

    it("matches the reference Σ of every fixture sensor (characterization)", () => {
        const result = {};
        for (const id of ["sensor.sst_thermostat", "sensor.sst_price", "sensor.sst_mode", "sensor.sst_dynamic"]) {
            result[id] = { mon: sigma(dayLayers(id, "mon"), "mon"), sat: sigma(dayLayers(id, "sat"), "sat") };
        }
        expect(result).toMatchSnapshot();
    });
});
