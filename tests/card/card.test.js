import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadCard } from "../helpers/load-card.js";
import { makeHass, withStates } from "../helpers/hass.js";
import { mountCard, unmountAll, readCard, sigmaOf, clickSigma, clickDay } from "../helpers/card-dom.js";

loadCard(); // registers <schedule-state-card>

const SENSORS = ["sensor.sst_thermostat", "sensor.sst_price", "sensor.sst_mode", "sensor.sst_dynamic"];
const WINTER = "{{ now().month in [11, 12, 1, 2, 3] }}";
// HA's answer to the fixture's template condition (October: not winter)
const hassOf = (opts = {}) => makeHass({ templates: { [WINTER]: false }, ...opts });

const timeline = (card, name) => readCard(card).timelines.find(t => t.name === name);
const settle = () => vi.advanceTimersByTimeAsync(1000); // debounce, rAF, template answers

beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame"] });
    vi.setSystemTime(new Date("2026-10-12T10:00:00")); // Monday
});
afterEach(() => {
    unmountAll();
    vi.useRealTimers();
});

describe("days layout", () => {
    it("shows the title, the week with today selected and one collapsed timeline per entity", async () => {
        const card = mountCard({ title: "Planning", layout: "days", entities: SENSORS }, hassOf());
        await settle();
        const model = readCard(card);

        expect(model.title).toBe("Planning");
        expect(model.days.map(d => d.id)).toEqual(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
        expect(model.days.filter(d => d.active).map(d => d.id)).toEqual(["mon"]);
        expect(model.timelines.map(t => t.name)).toEqual(["SST Thermostat", "SST Price", "SST Mode", "SST Dynamic"]);
        // Collapsed: only the Σ row
        expect(model.timelines.map(t => t.rows.map(r => r.label))).toEqual([["Σ"], ["Σ"], ["Σ"], ["Σ"]]);
    });

    it("shows each entity's current state with its unit, unless disabled", async () => {
        const hass = hassOf();
        let card = mountCard({ layout: "days", entities: ["sensor.sst_thermostat"] }, hass);
        await settle();
        expect(timeline(card, "SST Thermostat").state).toBe(`${hass.states["sensor.sst_thermostat"].state} °C`);

        unmountAll();
        card = mountCard({ layout: "days", show_state_in_title: false, entities: ["sensor.sst_thermostat"] }, hass);
        await settle();
        expect(timeline(card, "SST Thermostat").state).toBeNull();
    });

    it("hides the header without a title and uses the configured name and icon", async () => {
        const card = mountCard({ layout: "days", entities: [{ entity: "sensor.sst_mode", name: "Mode maison", icon: "mdi:home" }] }, hassOf());
        await settle();
        expect(readCard(card).title).toBeNull();
        expect(readCard(card).timelines[0].name).toBe("Mode maison");
        expect(card.shadowRoot.querySelector(".room-header ha-icon").getAttribute("icon")).toBe("mdi:home");
    });

    it("#18: renders the merged Σ", async () => {
        const card = mountCard({ layout: "days", entities: ["sensor.sst_issue_18"] }, hassOf());
        await settle();
        expect(sigmaOf(timeline(card, "SST Issue 18"))).toEqual([
            "00:00-07:00 sleep",
            "07:00-22:30 normal",
            "22:30-23:59 sleep",
        ]);
    });

    it("Σ merges the same value from two layers when folded, and cuts it per layer when unfolded", async () => {
        const block = (start, end, state_value, extra = {}) => ({ start, end, state_value, ...extra });
        const day = [
            { condition_key: "a", condition_text: "", blocks: [block("08:00", "10:00", "21")] },
            { condition_key: "b", condition_text: "", blocks: [block("10:00", "12:00", "21")] },
            { is_default_layer: true, condition_text: "default", blocks: [block("00:00", "23:59", "19", { is_default_bg: true })] },
        ];
        const hass = hassOf({ states: { "sensor.two_layers": { entity_id: "sensor.two_layers", state: "21", attributes: { friendly_name: "Two layers", layers: { mon: day } } } } });
        const card = mountCard({ layout: "days", entities: ["sensor.two_layers"] }, hass);
        await settle();
        expect(sigmaOf(timeline(card, "Two layers"))).toEqual(["00:00-08:00 19", "08:00-12:00 21", "12:00-23:59 19"]);

        clickSigma(card);
        await settle();
        expect(sigmaOf(timeline(card, "Two layers"))).toEqual(["00:00-08:00 19", "08:00-10:00 21", "10:00-12:00 21", "12:00-23:59 19"]);
    });

    it("Σ toggle expands every layer with its active state, and collapses back", async () => {
        const card = mountCard({ layout: "days", entities: ["sensor.sst_thermostat"] }, hassOf());
        await settle();
        clickSigma(card);
        await settle();

        const rows = timeline(card, "SST Thermostat").rows;
        expect(rows.map(r => [r.label, r.tooltip.includes("✅") ? "active" : r.tooltip.includes("❌") ? "inactive" : "-"]))
            .toMatchInlineSnapshot(`
              [
                [
                  "0",
                  "inactive",
                ],
                [
                  "1",
                  "active",
                ],
                [
                  "2",
                  "-",
                ],
                [
                  "3",
                  "inactive",
                ],
                [
                  "4",
                  "inactive",
                ],
                [
                  "5",
                  "-",
                ],
                [
                  "6",
                  "inactive",
                ],
                [
                  "7",
                  "active",
                ],
                [
                  "Σ",
                  "-",
                ],
              ]
            `);

        clickSigma(card);
        await settle();
        expect(timeline(card, "SST Thermostat").rows.map(r => r.label)).toEqual(["Σ"]);
    });

    it("keeps the expanded state when switching days", async () => {
        const card = mountCard({ layout: "days", entities: ["sensor.sst_mode"] }, hassOf());
        await settle();
        clickSigma(card);
        await settle();
        clickDay(card, "sat");
        await settle();
        expect(timeline(card, "SST Mode").rows.length).toBeGreaterThan(1);
    });

    it("day buttons render the selected day's schedule", async () => {
        const card = mountCard({ layout: "days", entities: ["sensor.sst_mode"] }, hassOf());
        await settle();
        expect(sigmaOf(timeline(card, "SST Mode"))).toContain("07:00-09:00 comfort");

        clickDay(card, "sat");
        await settle();
        expect(readCard(card).days.find(d => d.active).id).toBe("sat");
        expect(sigmaOf(timeline(card, "SST Mode"))).toContain("09:00-10:00 comfort");
        expect(sigmaOf(timeline(card, "SST Mode"))).not.toContain("07:00-09:00 comfort");
    });

    it("shows plain values verbatim, a 0 value and a unit with a slash", async () => {
        const card = mountCard({ layout: "days", entities: ["sensor.sst_mode", "sensor.sst_price"] }, hassOf());
        await settle();
        const mode = sigmaOf(timeline(card, "SST Mode"));
        expect(mode).toContain("10:00-11:00 08:30");
        expect(mode).toContain("13:00-14:00 2 persons");
        expect(sigmaOf(timeline(card, "SST Price"))[0]).toBe("00:00-06:00 0 €/kWh");
    });

    it("labels blocks with the full value, escaped once (CSS cuts it to the block)", async () => {
        const day = [{ is_default_layer: true, condition_text: "default", blocks: [
            { start: "00:00", end: "12:00", state_value: "Tom & Jerry <3", is_default_bg: true },
            { start: "12:00", end: "23:59", state_value: "Very long state label to test truncation", is_default_bg: true },
        ] }];
        const hass = hassOf({ states: { "sensor.text": { entity_id: "sensor.text", state: "x", attributes: { friendly_name: "Text", layers: { mon: day } } } } });
        const card = mountCard({ layout: "days", entities: ["sensor.text"] }, hass);
        await settle();
        const blocks = timeline(card, "Text").rows[0].blocks;
        expect(blocks.map(b => b.text)).toEqual(["Tom & Jerry <3", "Very long state label to test truncation"]);
        expect(card.shadowRoot.querySelectorAll(".block-center script, .block-center b")).toHaveLength(0);
    });

    it("explains a block in its tooltip", async () => {
        const card = mountCard({ layout: "days", entities: ["sensor.sst_price", "sensor.sst_dynamic"] }, hassOf());
        await settle();
        const price = timeline(card, "SST Price").rows[0].blocks[0];
        expect(price.tooltip).toContain("00:00 - 06:00");
        expect(price.tooltip).toContain("0 €/kWh");

        const dynamic = timeline(card, "SST Dynamic").rows[0].blocks.find(b => b.from === "08:00");
        expect(dynamic.text).toBe("22.0 °C");
        expect(dynamic.tooltip).toContain("input_number.sst_setpoint");
    });

    it("shows the time cursor on today only", async () => {
        const card = mountCard({ layout: "days", entities: ["sensor.sst_mode"] }, hassOf());
        await settle();
        const cursor = () => card.shadowRoot.querySelector(".time-cursor");
        expect(cursor().style.display).toBe("block");
        expect(parseFloat(cursor().style.left)).toBeCloseTo(10 / 24 * 100, 1);

        clickDay(card, "tue");
        await settle();
        expect(cursor()?.style.display ?? "none").toBe("none");
    });

    it("labels hours in the user's time format", async () => {
        const hours = (card) => [...card.shadowRoot.querySelectorAll(".timeline-hour")].map(h => h.textContent).filter(Boolean);
        let card = mountCard({ layout: "days", entities: ["sensor.sst_mode"] }, hassOf({ timeFormat: "24" }));
        await settle();
        expect(hours(card)).toEqual(["6h", "12h", "18h"]);

        unmountAll();
        card = mountCard({ layout: "days", entities: ["sensor.sst_mode"] }, hassOf({ timeFormat: "12" }));
        await settle();
        expect(hours(card)).toEqual(["6 AM", "12 PM", "6 PM"]);
    });

    it("speaks the user's language", async () => {
        const card = mountCard({ layout: "days", entities: ["sensor.sst_mode"] }, hassOf({ language: "fr" }));
        await settle();
        expect(readCard(card).days.map(d => d.label)).toMatchInlineSnapshot(`
          [
            "Lundi",
            "Mardi",
            "Mercredi",
            "Jeudi",
            "Vendredi",
            "Samedi",
            "Dimanche",
          ]
        `);
    });

    it("reports a missing entity without breaking the others", async () => {
        const card = mountCard({ layout: "days", entities: ["sensor.nope", "sensor.sst_mode"] }, hassOf());
        await settle();
        const model = readCard(card);
        expect(model.timelines[0].name).toBe("sensor.nope");
        expect(model.timelines[0].rows).toEqual([]);
        expect(model.timelines[1].name).toBe("SST Mode");
    });
});

describe("entities layout", () => {
    it("shows the week of the selected entity, one timeline per day", async () => {
        const card = mountCard({ layout: "entities", entities: SENSORS }, hassOf());
        await settle();
        const model = readCard(card);
        expect(model.entityOptions).toEqual(SENSORS);
        expect(model.timelines).toHaveLength(7);
        expect(model.days).toEqual([]);
        // Weekday condition evaluated per row (#17), not against today
        const mode = card.shadowRoot.querySelector("#entity-selector");
        mode.value = "sensor.sst_mode";
        mode.dispatchEvent(new Event("change"));
        await settle();
        const rows = readCard(card).timelines;
        expect(sigmaOf(rows[0])).toContain("07:00-09:00 comfort"); // Monday
        expect(sigmaOf(rows[5])).toContain("09:00-10:00 comfort"); // Saturday
    });
});

describe("reactivity", () => {
    it("re-renders when an entity used by a condition changes", async () => {
        const hass = hassOf();
        const card = mountCard({ layout: "days", entities: ["sensor.sst_issue_18"] }, hass);
        await settle();
        card.hass = withStates(hass, { "input_boolean.sst_away": "on" });
        await settle();
        expect(sigmaOf(timeline(card, "SST Issue 18"))).toEqual([
            "00:00-06:00 normal",
            "06:00-09:00 comfort",
            "09:00-12:00 normal",
            "12:00-14:00 eco",
            "14:00-17:00 normal",
            "17:00-20:00 comfort",
            "20:00-23:59 normal",
        ]);
    });

    it("keeps its DOM when a relevant change does not change what is shown", async () => {
        const hass = hassOf();
        const card = mountCard({ layout: "days", entities: ["sensor.sst_thermostat"] }, hass);
        await settle();
        const block = card.shadowRoot.querySelector(".schedule-block");
        // 10 -> 11 °C: read by the conditions (below 5, above 25), flips none
        card.hass = withStates(hass, { "input_number.sst_outdoor": "11" });
        await settle();
        expect(block.isConnected).toBe(true);

        // A change that flips a layer rebuilds it
        card.hass = withStates(hass, { "input_number.sst_outdoor": "0" });
        await settle();
        expect(block.isConnected).toBe(false);
        expect(card.shadowRoot.querySelector(".schedule-block")).not.toBeNull();
    });

    it("ignores changes it does not depend on", async () => {
        const hass = hassOf();
        const card = mountCard({ layout: "days", entities: ["sensor.sst_issue_18"] }, hass);
        await settle();
        const spy = vi.spyOn(card, "updateContent");

        // An unrelated entity, then the schedule sensor's last_update heartbeat
        let next = withStates(hass, { "sun.sun": { entity_id: "sun.sun", state: "below_horizon", attributes: {} } });
        card.hass = next;
        const sensor = next.states["sensor.sst_issue_18"];
        card.hass = withStates(next, { "sensor.sst_issue_18": { attributes: { ...sensor.attributes, last_update: "2026-10-12T10:00:30+02:00" } } });
        await settle();
        expect(spy).not.toHaveBeenCalled();
    });

    const passMidnight = async () => {
        vi.setSystemTime(new Date("2026-10-12T23:59:30")); // Monday
        const card = mountCard({ layout: "days", entities: ["sensor.sst_mode"] }, hassOf());
        await settle();
        await vi.advanceTimersByTimeAsync(60_000);
        return card;
    };

    it("follows today past midnight: the cursor restarts on the new day", async () => {
        const card = await passMidnight();
        const cursor = card.shadowRoot.querySelector(".time-cursor");
        expect(cursor.style.display).toBe("block"); // shown only when the rendered day is today
        expect(parseFloat(cursor.style.left)).toBeLessThan(0.1);
    });

    it("highlights the new day in the selector after midnight", async () => {
        const card = await passMidnight();
        expect(readCard(card).days.find(d => d.active).id).toBe("tue");
    });
});
