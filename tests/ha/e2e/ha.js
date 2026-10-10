/**
 * Tier B helpers: a real Home Assistant running the fixture package
 * (tests/ha/packages) and the test dashboard (tests/ha/create_dashboard.py).
 *
 * Environment (.env, gitignored):
 *   HA_URL          e.g. http://homeassistant.local:8123
 *   HA_TOKEN_FILE   file holding a long-lived access token
 *   HA_CARD_URL     path HA serves the card from (default: HACS path)
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
try { process.loadEnvFile(resolve(ROOT, ".env")); } catch { /* variables may come from the shell */ }

export function env(name, fallback) {
    const value = process.env[name] ?? fallback;
    if (value === undefined) throw new Error(`${name} is not set (see .env)`);
    return value;
}

export const HA_URL = () => env("HA_URL").replace(/\/$/, "");
export const token = () => readFileSync(env("HA_TOKEN_FILE"), "utf8").trim();
export const CARD_URL = () => env("HA_CARD_URL", "/hacsfiles/schedule-state-card/schedule-state-card.js");

export async function api(method, path, body) {
    const res = await fetch(`${HA_URL()}/api/${path}`, {
        method,
        headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${method} /api/${path}: HTTP ${res.status}`);
    return res.json();
}

export const sha256 = (data) => createHash("sha256").update(data).digest("hex");

/** sha256 of the card HA actually serves (the .gz when there is one). */
export async function servedCardSha() {
    const res = await fetch(`${HA_URL()}${CARD_URL()}`, { headers: { "Accept-Encoding": "gzip" } });
    if (!res.ok) throw new Error(`GET ${CARD_URL()}: HTTP ${res.status}`);
    return sha256(Buffer.from(await res.arrayBuffer()));
}

export const localCardSha = () => sha256(readFileSync(resolve(ROOT, "dist/schedule-state-card.js")));

/** Default state of the helper entities the fixture conditions read. */
export const HELPERS_DEFAULT = { away: false, outdoor: 10, setpoint: 20 };

export async function setHelpers({ away, outdoor, setpoint } = {}) {
    if (away !== undefined) await api("POST", `services/input_boolean/turn_${away ? "on" : "off"}`, { entity_id: "input_boolean.sst_away" });
    if (outdoor !== undefined) await api("POST", "services/input_number/set_value", { entity_id: "input_number.sst_outdoor", value: outdoor });
    if (setpoint !== undefined) await api("POST", "services/input_number/set_value", { entity_id: "input_number.sst_setpoint", value: setpoint });
}

/**
 * Log the browser in with the long-lived token, the way the frontend stores
 * its own tokens (no login form, no refresh: the token does not expire).
 */
export async function login(page) {
    await page.addInitScript(([hassUrl, accessToken]) => {
        localStorage.setItem("hassTokens", JSON.stringify({
            hassUrl, clientId: `${hassUrl}/`, access_token: accessToken, token_type: "Bearer",
            refresh_token: "", expires_in: 1800, expires: Date.now() + 365 * 24 * 3600 * 1000,
        }));
        // English UI and default theme, whatever the token owner's profile says
        localStorage.setItem("selectedLanguage", JSON.stringify("en"));
        localStorage.setItem("selectedTheme", JSON.stringify({ theme: "default", dark: false }));
    }, [HA_URL(), token()]);
}

/** Card of the test dashboard whose title or entity name contains `text`. */
export const cardWith = (page, text) => page.locator("schedule-state-card").filter({ hasText: text });

/** Σ row of a rendered card as "HH:MM-HH:MM value" (values from the tooltips). */
export function readSigma(card) {
    return card.evaluate((el) => {
        const time = (pct) => {
            const m = Math.round(pct * 14.4);
            return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
        };
        return [...el.shadowRoot.querySelectorAll(".combined-layer-block")].map((b) => {
            const left = parseFloat(b.style.left);
            const width = parseFloat(b.style.width);
            const value = (b.dataset.tooltip || "").match(/🌡️ [^:\n]+: ([^\n]*)/)?.[1];
            return `${time(left)}-${time(left + width)} ${value}`;
        });
    });
}
