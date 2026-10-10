/**
 * Before tier B runs: the instance answers, the fixtures exist, and HA serves
 * exactly the card of this working tree (otherwise the tests would judge an
 * older card: deploy dist/ first, .gz included).
 */
import { api, servedCardSha, localCardSha, setHelpers, HELPERS_DEFAULT, CARD_URL } from "./ha.js";

export default async function globalSetup() {
    const config = await api("GET", "config");
    const fixtures = await api("GET", "states/sensor.sst_issue_18").catch(() => null);
    if (!fixtures?.attributes?.layers) {
        throw new Error("Fixture sensors missing: install tests/ha/packages/schedule_card_tests.yaml on the instance");
    }

    const [served, local] = [await servedCardSha(), localCardSha()];
    if (served !== local && process.env.HA_ALLOW_STALE_CARD !== "1") {
        throw new Error(`HA serves another card than dist/ (${CARD_URL()}): deploy dist/ (and regenerate the .gz)` +
            " (or set HA_ALLOW_STALE_CARD=1 to test the deployed one)");
    }

    await setHelpers(HELPERS_DEFAULT);
    console.log(`Home Assistant ${config.version}, card ${served === local ? "= dist/" : "STALE (allowed)"}`);
}
