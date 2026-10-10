/**
 * Loads dist/schedule-state-card.js exactly as HA does (classic script, no
 * build) and returns its top-level classes and helpers, which the script
 * keeps private. Tests therefore run against the shipped file itself.
 *
 * SSC_CARD_FILE=<path> runs the suite against another copy of the card, e.g.
 * a released version extracted with `git show v2.2.4:dist/schedule-state-card.js`.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// node:path, not new URL(): the happy-dom environment replaces the global URL
const DEFAULT_FILE = resolve(dirname(fileURLToPath(import.meta.url)), "../../dist/schedule-state-card.js");

// Names the tests may use. A name missing from the card (renamed during a
// refactor) comes back undefined instead of breaking every test file.
const EXPOSED = [
    "CARD_VERSION", "LAYOUT_CONSTANTS", "DEFAULT_COLORS", "TRANSLATIONS", "DAY_ORDER",
    "COLOR_CACHE", "ColorCacheSingleton",
    "TimeHelper", "ConditionEvaluator", "CombinedLayerBuilder", "LanguageHelper", "AppState",
    "ScheduleStateCard",
    "escapeHtml", "escapeHtmlAttribute", "extractTemplateEntityIds", "evaluateNowInExpression",
];

let loaded = null;

export function loadCard() {
    if (loaded) return loaded;
    const file = process.env.SSC_CARD_FILE || DEFAULT_FILE;
    const source = readFileSync(file, "utf8");
    const exposeLine = "\nreturn {" + EXPOSED.map(n => `${n}: typeof ${n} === "undefined" ? undefined : ${n}`).join(", ") + "};";
    loaded = new Function(source + exposeLine)();
    loaded.file = file;
    return loaded;
}
