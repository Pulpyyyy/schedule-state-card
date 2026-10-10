/**
 * Mounts the card and reads what it shows as a plain model.
 *
 * Behavior tests assert on this model, never on raw HTML: when the rendering
 * changes (e.g. a move to Lit), only readCard() has to follow, and the tests
 * keep checking the same user-visible behavior.
 */

const BLOCK_HEIGHT = 20;
const VERTICAL_GAP = 8;
const TOP_MARGIN = 4;

export function mountCard(config, hass) {
    const card = document.createElement("schedule-state-card");
    card.setConfig({ type: "custom:schedule-state-card", ...config });
    document.body.appendChild(card);
    card.hass = hass;
    return card;
}

export function unmountAll() {
    document.querySelectorAll("schedule-state-card").forEach(el => el.remove());
}

const toTime = (minutes) => {
    const m = Math.round(minutes);
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

const styleNumber = (el, prop) => {
    const m = (el.getAttribute("style") || "").match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*(-?[\\d.]+)`));
    return m ? parseFloat(m[1]) : null;
};

const rowOf = (el) => Math.round((styleNumber(el, "top") - TOP_MARGIN) / (BLOCK_HEIGHT + VERTICAL_GAP));

// The card escapes the tooltip text, then decodes it when showing it
const decodeEntities = (text) => text.replace(/&(amp|lt|gt|quot|#39);/g,
    (_, e) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" })[e]);

// Full value of a block, from its tooltip: the label on the block itself is
// truncated to the block's width
const valueOf = (tooltip) => tooltip.match(/🌡️ [^:\n]+: ([^\n]*)/)?.[1] ?? null;

function readTimeline(timeline) {
    const rows = new Map();
    const row = (i) => {
        if (!rows.has(i)) rows.set(i, { label: null, tooltip: null, blocks: [] });
        return rows.get(i);
    };

    for (const icon of timeline.querySelectorAll(".icon-row")) {
        const r = row(rowOf(icon));
        r.label = icon.querySelector(".layer-number")?.textContent ?? null;
        r.tooltip = icon.dataset.tooltip ?? null;
    }

    for (const block of timeline.querySelectorAll(".schedule-block")) {
        const left = styleNumber(block, "left");
        const width = styleNumber(block, "width");
        const from = left * 14.4;
        const tooltip = decodeEntities(block.dataset.tooltip ?? "");
        row(rowOf(block)).blocks.push({
            from: toTime(from),
            to: toTime(from + width * 14.4),
            value: valueOf(tooltip),
            text: block.querySelector(".block-center")?.textContent ?? "",
            kind: block.classList.contains("combined-layer-block") ? "combined"
                : block.classList.contains("default-block") ? "default" : "layer",
            tooltip,
            background: block.style.backgroundColor,
            color: block.style.color,
        });
    }

    return {
        name: timeline.querySelector(".room-name")?.textContent ?? null,
        entityId: timeline.querySelector(".room-name")?.dataset.entityId ?? null,
        state: timeline.querySelector(".room-state")?.textContent ?? null,
        empty: timeline.querySelector(".no-schedule")?.textContent ?? null,
        rows: [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([, r]) => r),
    };
}

export function readCard(card) {
    const root = card.shadowRoot;
    const header = root.querySelector(".card-header");
    return {
        title: header && !header.classList.contains("hidden") ? root.querySelector(".card-title").textContent : null,
        days: [...root.querySelectorAll(".day-button")].map(b => ({
            id: b.dataset.day, label: b.textContent, name: b.getAttribute("aria-label") ?? b.textContent,
            active: b.classList.contains("active"),
        })),
        entityOptions: [...root.querySelectorAll("#entity-selector option")].map(o => o.value),
        timelines: [...root.querySelectorAll(".room-timeline")].map(readTimeline),
    };
}

/** Σ row of a timeline as "HH:MM-HH:MM value" strings (full values, not truncated labels). */
export const sigmaOf = (timeline) =>
    timeline.rows.find(r => r.label === "Σ")?.blocks.map(b => `${b.from}-${b.to} ${b.value}`) ?? null;

export function clickSigma(card, index = 0) {
    card.shadowRoot.querySelectorAll(".combined-layer-toggle")[index].click();
}

export function clickDay(card, day) {
    card.shadowRoot.querySelector(`.day-button[data-day="${day}"]`).click();
}
