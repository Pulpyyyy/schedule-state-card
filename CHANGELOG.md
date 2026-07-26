# Changelog

All notable changes to this project are documented in this file.

## [2.2.3] - 2026-07-26

### Fixed
- **Self-referencing templates no longer defeat the render dirty-check**: a `schedule_state` sensor can read back one of its own attributes inside its template (e.g. `state_attr('sensor.x', 'over_head')`), which put the sensor in its own template-referenced set where full identity comparison let the beating `last_update` attribute re-trigger a full render on every server poll (30 s). Attributes of such sensors are now compared key by key ignoring `last_update`; real attribute changes still trigger a render.

## [2.2.2] - 2026-07-26

### Fixed
- **"By Entities" layout: day-based conditions are now evaluated against each rendered day** ([#17](https://github.com/Pulpyyyy/schedule-state-card/issues/17)): weekday-conditioned overrides were evaluated against today on all 7 rows, so every day looked like the current one. The combined layer and the active/inactive badges now reflect each day's own evaluation. The "By Days" view is unchanged.

### Performance
- **`set hass` work fully decoupled from state churn**: the card no longer re-walks every configured sensor's `layers` tree (10-40 KB) on every state change in the house. The relevant-entity collection is memoized on the `layers` object identity, the dirty-check ignores attribute noise the card never renders (schedule_state's beating `last_update`, trend sensors' `gradient`), and the template-condition cache is clock-keyed (one evaluation per minute, matching HA's own cycle) instead of being tied to `last_update` — which also means time-based conditions keep working if the integration stops rewriting unchanged states. A re-render now only happens when a schedule, a referenced entity, or a template condition result actually changes.

## [2.2.1] - 2026-07-05

All changes since the last published release, `v2.0.9` (2.2.0 was never released; its content is included here).

### Added
- **HA 2026.6 entity-first card picker support**: the card is suggested when a `schedule_state` sensor is selected in the new picker, offering both layouts ("By Days" / "By Entities") as labeled suggestions with live preview; `getStubConfig` pre-fills the selected sensor.
- **Condition `alias` support in layer tooltips** ([#16](https://github.com/Pulpyyyy/schedule-state-card/issues/16)): when a condition defines an `alias`, the tooltip shows it instead of the technical text. `and`/`or`/`not` groups are decomposed with localized operators (`ET`/`OU`/`NON`, …) and parentheses; leaves without alias get a readable description built from the structured condition (state, numeric bounds, translated weekdays/months, prettified `now()` templates, sun events). Example: `En semaine (lun-ven) ET (Retour proche (< 24h) OU Jour de ménage)`.
- **Tap-to-show tooltips on touch devices** (Companion app): tap a block or layer icon to display its tooltip (auto-hides after 4 s, tap elsewhere to dismiss).

### Fixed
- Card froze (no expand, no day change) after Home Assistant re-parented it in the DOM (masonry re-layout, view switch): the card now fully rebuilds on reconnection.
- Expanded/collapsed state persists when switching days in "By Days" layout, and across DOM re-parenting.
- A schedule state value of `0` was rendered as an empty block.
- `pt-BR` translations were unreachable (HA sends BCP47 codes); language matching now normalizes and falls back to the base language.
- 12-hour time format was forced for every English locale; the card now honors an explicit `time_format` (12/24) and otherwise lets `Intl` decide (en-GB → 24 h, en-US → 12 h).
- Portuguese translation fixes (leftover Spanish/English strings).
- Template conditions could stay frozen for the whole session when the sensor exposes no `last_update` attribute.
- Failing template evaluations no longer retry a WebSocket round-trip on every state change.
- WebSocket `render_template` subscription leak when the 5 s timeout fired before the subscription was established.
- Removing a `color_overrides` entry from YAML now takes effect without a full page reload.
- `getCardSize()` crash when called before `setConfig()`.
- Editor: HA form components (`ha-entity-picker`, `ha-selector`, …) are force-loaded before creating the pickers, so the editor no longer renders blank when opened first.

### Security
- Entity id and message are now escaped in the error card (HTML injection via config).
- Strict validation of `var()` colors from config, and layer-icon styles go through the CSS whitelist (style-attribute breakout).
- `card_mod.style` is accepted as string only and sanitized so it can no longer terminate the `<style>` block.
- Editor color-override chips validate config-sourced colors before injecting them.

### Performance
- Re-render is skipped when nothing the card depends on changed (dirty-check on configured sensors, entities referenced by conditions/templates, and locale) instead of rebuilding on every state change in the house.
- Global color cache is bounded (500 entries).
- Removed ~400 lines of dead code and duplicated CSS.

### Changed
- `getStubConfig` no longer returns a hardcoded example sensor; the picker pre-fills a detected `schedule_state` sensor or an empty config.
- Release workflow tweaks (release name format, tag extraction).

## [2.0.9] - 2026-03-19

- Evaluate Jinja2 templates via WebSocket (`render_template`), works for non-admin users.
- Workflow improvements.

Older releases: see the [releases page](https://github.com/Pulpyyyy/schedule-state-card/releases).
