import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadCard } from "../helpers/load-card.js";
import { makeHass, dayLayers } from "../helpers/hass.js";

const { ConditionEvaluator, extractTemplateEntityIds } = loadCard();

const evaluator = (opts, day = "mon") => new ConditionEvaluator(makeHass(opts), day);
const state = (entity_id, s) => ({ condition: "state", entity_id, state: s });
const numeric = (entity_id, bounds) => ({ condition: "numeric_state", entity_id, ...bounds });
const AWAY = "input_boolean.sst_away";
const OUTDOOR = "input_number.sst_outdoor";

beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-12T10:00:00")); // Monday, October
});
afterEach(() => vi.useRealTimers());

describe("time condition", () => {
    it("checks weekdays against the rendered day, not today", () => {
        const cond = { condition: "time", weekday: ["sat", "sun"] };
        expect(evaluator({}, "mon").evaluateCondition(cond)).toBe(false);
        expect(evaluator({}, "sat").evaluateCondition(cond)).toBe(true);
    });

    it("checks months against the current date", () => {
        expect(evaluator().evaluateCondition({ condition: "time", month: [10] })).toBe(true);
        expect(evaluator().evaluateCondition({ condition: "time", month: [11, 12] })).toBe(false);
        expect(evaluator().evaluateCondition({ condition: "time", month: 10 })).toBe(true);
    });
});

describe("state condition", () => {
    it("compares the entity state", () => {
        expect(evaluator().evaluateCondition(state(AWAY, "off"))).toBe(true);
        expect(evaluator().evaluateCondition(state(AWAY, "on"))).toBe(false);
        expect(evaluator({ states: { [AWAY]: "on" } }).evaluateCondition(state(AWAY, "on"))).toBe(true);
    });

    it("is false for an unknown entity", () => {
        expect(evaluator().evaluateCondition(state("input_boolean.nope", "on"))).toBe(false);
    });

    it("accepts any of several entities, or all of them with match: all", () => {
        const both = [AWAY, "input_boolean.other"];
        const hass = { states: { "input_boolean.other": { entity_id: "input_boolean.other", state: "on" } } };
        expect(evaluator(hass).evaluateCondition(state(both, "on"))).toBe(true);
        expect(evaluator(hass).evaluateCondition({ ...state(both, "on"), match: "all" })).toBe(false);
    });

    it("accepts a list of states (any of them)", () => {
        expect(evaluator().evaluateCondition(state(AWAY, ["on", "off"]))).toBe(true);
        expect(evaluator().evaluateCondition(state(AWAY, ["on", "unavailable"]))).toBe(false);
    });
});

describe("numeric_state condition", () => {
    it("applies above / below as strict bounds", () => {
        expect(evaluator().evaluateCondition(numeric(OUTDOOR, { below: 10.5 }))).toBe(true);
        expect(evaluator().evaluateCondition(numeric(OUTDOOR, { below: 10 }))).toBe(false);
        expect(evaluator().evaluateCondition(numeric(OUTDOOR, { above: 10 }))).toBe(false);
        expect(evaluator().evaluateCondition(numeric(OUTDOOR, { above: 5, below: 15 }))).toBe(true);
    });

    it("is false for a non-numeric or missing state", () => {
        expect(evaluator({ states: { [OUTDOOR]: "unavailable" } }).evaluateCondition(numeric(OUTDOOR, { below: 50 }))).toBe(false);
        expect(evaluator().evaluateCondition(numeric("sensor.nope", { below: 50 }))).toBe(false);
    });
});

describe("and / or / not", () => {
    const yes = state(AWAY, "off");
    const no = state(AWAY, "on");

    it("combines sub-conditions", () => {
        const ev = evaluator();
        expect(ev.evaluateCondition({ condition: "and", conditions: [yes, yes] })).toBe(true);
        expect(ev.evaluateCondition({ condition: "and", conditions: [yes, no] })).toBe(false);
        expect(ev.evaluateCondition({ condition: "or", conditions: [no, yes] })).toBe(true);
        expect(ev.evaluateCondition({ condition: "or", conditions: [no, no] })).toBe(false);
        expect(ev.evaluateCondition({ condition: "not", conditions: [no] })).toBe(true);
        expect(ev.evaluateCondition({ condition: "not", conditions: [yes] })).toBe(false);
    });

    it("evaluates nested groups (fixture alias condition)", () => {
        const cond = dayLayers("sensor.sst_thermostat", "mon")
            .flatMap(l => l.blocks).flatMap(b => b.raw_conditions || [])
            .find(c => c.alias === "Absent ou pas de canicule");
        expect(evaluator().evaluateCondition(cond)).toBe(true);
        expect(evaluator({ states: { [OUTDOOR]: "30" } }).evaluateCondition(cond)).toBe(false);
        expect(evaluator({ states: { [OUTDOOR]: "30", [AWAY]: "on" } }).evaluateCondition(cond)).toBe(true);
    });

    it("not: true only when none of its conditions is true", () => {
        const ev = evaluator();
        expect(ev.evaluateCondition({ condition: "not", conditions: [no, yes] })).toBe(false);
        expect(ev.evaluateCondition({ condition: "not", conditions: [no, no] })).toBe(true);
    });
});

describe("template condition", () => {
    const WINTER = "{{ now().month in [11, 12, 1, 2, 3] }}";

    it("uses the result Home Assistant rendered", async () => {
        const hass = makeHass({ templates: { "{{ is_state('x', 'y') }}": true } });
        const ev = new ConditionEvaluator(hass, "mon");
        const tmpl = "{{ is_state('x', 'y') }}";
        expect(await ev.refreshTemplateCache(hass, [tmpl], "k1")).toBe(true);
        expect(ev.evaluateCondition({ condition: "template", value_template: tmpl })).toBe(true);
    });

    it("falls back to a local now() evaluation before HA answers", () => {
        expect(evaluator().evaluateCondition({ condition: "template", value_template: WINTER })).toBe(false);
        vi.setSystemTime(new Date("2026-12-01T10:00:00"));
        expect(evaluator().evaluateCondition({ condition: "template", value_template: WINTER })).toBe(true);
    });

    it("keeps the last HA result while a refresh is in flight", async () => {
        const tmpl = "{{ states('sensor.x') == 'on' }}";
        const hass = makeHass({ templates: { [tmpl]: true } });
        const ev = new ConditionEvaluator(hass, "mon");
        await ev.refreshTemplateCache(hass, [tmpl], "k1");
        const pending = ev.refreshTemplateCache(makeHass({ templates: { [tmpl]: false } }), [tmpl], "k2");
        expect(ev.evaluateCondition({ condition: "template", value_template: tmpl })).toBe(true);
        expect(await pending).toBe(true);
        expect(ev.evaluateCondition({ condition: "template", value_template: tmpl })).toBe(false);
    });

    it("does not query HA again for the same clock key", async () => {
        const tmpl = "{{ true }}";
        const hass = makeHass({ templates: { [tmpl]: true } });
        const ev = new ConditionEvaluator(hass, "mon");
        await ev.refreshTemplateCache(hass, [tmpl], "k1");
        expect(await ev.refreshTemplateCache(hass, [tmpl], "k1")).toBe(false);
        expect(hass.connection.templateCalls).toHaveLength(1);
    });

    it("caches the fallback when HA fails, without retrying on the same key", async () => {
        const hass = makeHass(); // no fixture result: render_template fails
        const ev = new ConditionEvaluator(hass, "mon");
        await ev.refreshTemplateCache(hass, [WINTER], "k1");
        await ev.refreshTemplateCache(hass, [WINTER], "k1");
        expect(hass.connection.templateCalls).toHaveLength(1);
        expect(ev.evaluateCondition({ condition: "template", value_template: WINTER })).toBe(false);
    });
});

describe("layers", () => {
    it("default and combined layers are never 'active' conditional layers", () => {
        expect(evaluator().evaluateLayer({ is_default_layer: true, blocks: [] })).toBe(false);
        expect(evaluator().evaluateLayer({ is_combined_layer: true, blocks: [] })).toBe(false);
    });

    it("a layer without conditions is active", () => {
        expect(evaluator().evaluateLayer({ blocks: [{ start: "08:00", end: "09:00" }] })).toBe(true);
    });

    it("fixture thermostat: active layers on a Monday in October", () => {
        const ev = evaluator();
        const active = dayLayers("sensor.sst_thermostat", "mon")
            .filter(l => !l.is_default_layer)
            .map(l => [l.condition_text || "(none)", ev.evaluateLayer(l)]);
        expect(active).toMatchInlineSnapshot(`
          [
            [
              "Days: Mon, Tue, Wed, Thu, Fri",
              true,
            ],
            [
              "(none)",
              true,
            ],
            [
              "input_boolean.sst_away == on",
              false,
            ],
            [
              "input_number.sst_outdoor < 5.0",
              false,
            ],
            [
              "(none)",
              true,
            ],
            [
              "Custom: {{ now().month in [11, 12, 1, 2, 3] }}",
              false,
            ],
            [
              "(input_boolean.sst_away == on OR NOT (input_number.sst_outdoor > 25.0))",
              true,
            ],
          ]
        `);
    });
});

describe("template entity extraction", () => {
    it("finds every entity a template reads", () => {
        expect(extractTemplateEntityIds(
            "{{ states('sensor.a') | float + state_attr(\"climate.b\", 'temp') }}" +
            "{% if is_state('input_boolean.c', 'on') and has_value('sensor.d') %}{{ states.sensor.e.state }}{% endif %}"
        )).toEqual(["sensor.a", "climate.b", "input_boolean.c", "sensor.d", "sensor.e"]);
        expect(extractTemplateEntityIds(null)).toEqual([]);
    });
});
