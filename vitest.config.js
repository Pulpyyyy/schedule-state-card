import { defineConfig } from "vitest/config";

// Same zone as the test Home Assistant the fixtures come from: dates must not depend on the machine
// running the tests (GitHub runners are UTC). Set before workers start.
process.env.TZ = "Europe/Paris";

export default defineConfig({
    test: {
        environment: "happy-dom",
        include: ["tests/**/*.test.js"],
        // Every test file gets a fresh window: the card registers its custom
        // element and its shared color cache at load time
        isolate: true,
    },
});
