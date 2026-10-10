/**
 * Fake `hass` objects built from real states captured on the test Home
 * Assistant (tests/fixtures/ha-states.json, produced by the package in tests/ha).
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const FIXTURE_FILE = resolve(dirname(fileURLToPath(import.meta.url)), "../fixtures/ha-states.json");
const FIXTURE = JSON.parse(readFileSync(FIXTURE_FILE, "utf8"));

export const fixtureMeta = FIXTURE._meta;

/**
 * @param {Object} [opts]
 * @param {Object} [opts.states] - entity_id → new state string, or partial state object
 * @param {string} [opts.language]
 * @param {string} [opts.timeFormat] - HA locale.time_format: "12" | "24" | "language" | "system"
 * @param {Object} [opts.templates] - value_template → first result HA's render_template
 *   subscription pushes (connection.push() sends later ones); a template missing here is
 *   rejected like an HA error (the card then uses its JS fallback)
 */
export function makeHass({ states = {}, language = "en", timeFormat = "24", templates = {} } = {}) {
    const all = structuredClone(FIXTURE.states);
    for (const [id, value] of Object.entries(states)) {
        all[id] = typeof value === "string" ? { ...all[id], state: value } : { ...all[id], ...value };
    }
    const templateCalls = [];
    const active = new Map(); // template → Set(callback): open render_template subscriptions
    return {
        states: all,
        entities: Object.fromEntries(Object.keys(all)
            .filter(id => id.startsWith("sensor.sst_"))
            .map(id => [id, { entity_id: id, platform: "schedule_state" }])),
        language,
        locale: { language, time_format: timeFormat },
        connection: {
            templateCalls,
            /** Templates with an open subscription. */
            active: () => [...active.keys()],
            /** HA pushes a new result to the subscribers of a template. */
            push(template, result) {
                for (const callback of active.get(template) ?? []) callback({ result });
            },
            subscribeMessage(callback, msg) {
                templateCalls.push(msg.template);
                if (!(msg.template in templates)) {
                    return Promise.reject(new Error(`no fixture result for ${msg.template}`));
                }
                if (!active.has(msg.template)) active.set(msg.template, new Set());
                active.get(msg.template).add(callback);
                queueMicrotask(() => callback({ result: templates[msg.template] }));
                return Promise.resolve(() => {
                    active.get(msg.template)?.delete(callback);
                    if (!active.get(msg.template)?.size) active.delete(msg.template);
                });
            },
        },
    };
}

/**
 * Next hass after state changes, the way HA does it: a new hass object and a
 * new states map, unchanged entities keep their object identity.
 */
export function withStates(hass, changes) {
    const states = { ...hass.states };
    for (const [id, value] of Object.entries(changes)) {
        states[id] = typeof value === "string" ? { ...states[id], state: value } : { ...states[id], ...value };
    }
    return { ...hass, states };
}

/** Layers of one fixture sensor for one day. */
export function dayLayers(entityId, day) {
    return structuredClone(FIXTURE.states[entityId].attributes.layers[day]);
}
