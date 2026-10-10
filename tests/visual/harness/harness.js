/**
 * Visual test harness: stand-ins for the HA elements the card uses, and a
 * fake hass built from the captured fixture states (same data as the unit
 * tests, see tests/helpers/hass.js).
 */

// <ha-card>: HA's card surface (background, radius, shadow)
customElements.define("ha-card", class extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" }).innerHTML = `<style>
            :host {
                display: block;
                background: var(--ha-card-background, var(--card-background-color));
                color: var(--primary-text-color);
                border-radius: 12px;
                border: 1px solid var(--divider-color);
            }
        </style><slot></slot>`;
    }
});

// <ha-icon>: neutral square of the icon's size (real MDI glyphs would only
// add noise to the screenshots)
customElements.define("ha-icon", class extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" }).innerHTML = `<style>
            :host { display: inline-flex; width: 24px; height: 24px; flex-shrink: 0; }
            span { margin: 3px; flex: 1; border-radius: 4px; background: currentColor; opacity: 0.35; }
        </style><span></span>`;
    }
});

let fixture = null;

/**
 * @param {Object} config - card config (type is added)
 * @param {Object} [opts]
 * @param {Object} [opts.states] - entity_id → state string or partial state
 * @param {string} [opts.language]
 * @param {string} [opts.timeFormat]
 * @param {Object} [opts.templates] - value_template → HA render_template result
 */
window.mountCard = async (config, { states = {}, language = "en", timeFormat = "24", templates = {} } = {}) => {
    fixture ??= await (await fetch("/tests/fixtures/ha-states.json")).json();
    const all = structuredClone(fixture.states);
    for (const [id, value] of Object.entries(states)) {
        all[id] = typeof value === "string" ? { ...all[id], state: value } : { ...all[id], ...value };
    }
    const hass = {
        states: all,
        entities: Object.fromEntries(Object.keys(all).map(id => [id, { entity_id: id, platform: "schedule_state" }])),
        language,
        locale: { language, time_format: timeFormat },
        connection: {
            subscribeMessage(callback, msg) {
                if (!(msg.template in templates)) return Promise.reject(new Error("no fixture result"));
                queueMicrotask(() => callback({ result: templates[msg.template] }));
                return Promise.resolve(() => {});
            },
        },
    };
    const card = document.createElement("schedule-state-card");
    card.setConfig({ type: "custom:schedule-state-card", ...config });
    document.getElementById("host").replaceChildren(card);
    card.hass = hass;
    await document.fonts.ready;
    // Let the card attach its listeners (rAF) and settle its debounce
    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 50)));
    window.__hass = hass;
    return true;
};

/** Push new states to the mounted card, the way HA does (new hass object). */
window.setStates = (changes) => {
    const card = document.querySelector("schedule-state-card");
    const states = { ...window.__hass.states };
    for (const [id, value] of Object.entries(changes)) {
        states[id] = typeof value === "string" ? { ...states[id], state: value } : { ...states[id], ...value };
    }
    window.__hass = { ...window.__hass, states };
    card.hass = window.__hass;
};
