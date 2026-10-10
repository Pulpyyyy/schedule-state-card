import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadCard } from "../helpers/load-card.js";
import { makeHass, dayLayers } from "../helpers/hass.js";

const { TimeHelper, ConditionEvaluator, CombinedLayerBuilder } = loadCard();

function combinedOf(layers, day, hass) {
    const evaluator = new ConditionEvaluator(hass, day);
    const defaultLayer = layers.find(l => l.is_default_layer);
    const active = layers.filter(l => !l.is_default_layer && !l.is_combined_layer && evaluator.evaluateLayer(l));
    return new CombinedLayerBuilder(new TimeHelper(), evaluator).build(defaultLayer, active);
}
const describeBlocks = (blocks) => blocks.map(b => `${b.start}-${b.end} ${b.state_value}`);

/** Σ of a layer list as shown with the layers unfolded (cut per layer). */
const sigma = (layers, day, hass = makeHass()) => describeBlocks(combinedOf(layers, day, hass).blocks);

/** Σ as shown folded: identical neighbours merged even across layers. */
const sigmaFolded = (layers, day, hass = makeHass()) => describeBlocks(combinedOf(layers, day, hass).packed_blocks);

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

    describe("same value from different layers", () => {
        const layers = () => [
            layer([block("08:00", "10:00", "21")], { condition_key: "a" }),
            layer([block("10:00", "12:00", "21")], { condition_key: "b" }),
            defaultLayer("19"),
        ];

        it("unfolded: stays cut where the layer changes (the result may change there)", () => {
            expect(sigma(layers(), "mon")).toEqual([
                "00:00-08:00 19",
                "08:00-10:00 21",
                "10:00-12:00 21",
                "12:00-23:59 19",
            ]);
        });

        it("folded: merged, like the schedule_state entity", () => {
            expect(sigmaFolded(layers(), "mon")).toEqual([
                "00:00-08:00 19",
                "08:00-12:00 21",
                "12:00-23:59 19",
            ]);
        });

        it("folded: a merged span no longer claims the first piece's wrap times", () => {
            const wrapped = [
                layer([block("00:00", "06:00", "17", { wraps_start: true, original_start: "22:30", original_end: "06:00" })]),
                layer([block("06:00", "08:00", "17")]),
                defaultLayer("19"),
            ];
            const merged = combinedOf(wrapped, "mon", makeHass()).packed_blocks[0];
            expect([merged.start, merged.end, merged.wraps_start, merged.wraps_end]).toEqual(["00:00", "08:00", false, false]);
        });

        it("folded: values that differ in anything rendered stay apart", () => {
            const differ = [
                layer([block("08:00", "10:00", "21", { icon: "mdi:sun" })]),
                layer([block("10:00", "12:00", "21", { icon: "mdi:moon" })]),
                defaultLayer("19"),
            ];
            expect(sigmaFolded(differ, "mon")).toEqual(sigma(differ, "mon"));
        });
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

    describe("end of day", () => {
        const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
        const SENSORS = ["sensor.sst_thermostat", "sensor.sst_price", "sensor.sst_mode", "sensor.sst_dynamic", "sensor.sst_issue_18"];
        const SITUATIONS = [{}, { "input_boolean.sst_away": "on" }, { "input_number.sst_outdoor": "0" }, { "input_number.sst_outdoor": "39" }];

        // schedule_state ends the default layer (and events written up to
        // midnight) at 23:59: Σ must not fill the last minute with a slot
        // nobody configured
        it("never invents a 23:59-00:00 slot", () => {
            for (const id of SENSORS) for (const day of DAYS) for (const states of SITUATIONS) {
                const hass = makeHass({ states });
                const segments = [...sigma(dayLayers(id, day), day, hass), ...sigmaFolded(dayLayers(id, day), day, hass)];
                expect(segments.filter(s => s.startsWith("23:59-")), `${id} ${day} ${JSON.stringify(states)}`).toEqual([]);
            }
        });

        it("keeps a 23:59 end as 23:59, and an explicit midnight end as 00:00", () => {
            expect(sigma(dayLayers("sensor.sst_price", "mon"), "mon").at(-1)).toBe("22:00-23:59 0.1952");
            // the wrapping event 22:30 -> 06:30 reaches midnight explicitly
            expect(sigma(dayLayers("sensor.sst_thermostat", "mon"), "mon").at(-1)).toBe("22:30-00:00 17");
        });

        it("keeps a 23:59-00:00 slot that exists explicitly", () => {
            const layers = [layer([block("23:59", "00:00", "last minute")]), defaultLayer("19")];
            expect(sigma(layers, "mon")).toEqual(["00:00-23:59 19", "23:59-00:00 last minute"]);
        });
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

    it("folded Σ of every fixture sensor (characterization)", () => {
        const result = {};
        for (const id of ["sensor.sst_thermostat", "sensor.sst_price", "sensor.sst_mode", "sensor.sst_dynamic", "sensor.sst_issue_18"]) {
            result[id] = { mon: sigmaFolded(dayLayers(id, "mon"), "mon"), sat: sigmaFolded(dayLayers(id, "sat"), "sat") };
        }
        expect(result).toMatchSnapshot();
    });
});
