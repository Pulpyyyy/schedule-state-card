# Changelog

All notable changes to this project are documented in this file.

## [2.2.5] - 2026-10-10

### Fixed
- **Σ is no longer cut into pieces** ([#18](https://github.com/Pulpyyyy/schedule-state-card/issues/18)): the combined layer was split at every start and end of every active layer, so a layer winning the whole day showed up as many small blocks. Consecutive segments of the same layer with the same value are merged. When Σ is folded, identical neighbours from different layers are merged too, like the `schedule_state` entity does; unfolded, the cut where the layer changes is kept, since the result may change there. A wrapping event ending at midnight is no longer cut at 23:59 either.
- **Editor: the card title and entity name fields are back**: Home Assistant 2026.x no longer provides the text field the editor used, so these two fields were invisible and could not be edited. They now update the preview as you type.
- **Editor: changes are no longer lost while editing**: each change redrew the whole editor, so the color picker closed on its own change and the text typed for a new color override was lost when another setting changed.
- **Block text is readable on every background**: about half of the generated colors had white text below the readable contrast (white on light green, for instance). The text is now black or white, whichever contrasts more. A block with its own color now gets a text color for that color.
- **Conditions evaluated like Home Assistant**: a `state` condition with a list of states (`state: [a, b]`) was never true, and `not` only looked at its first condition. Layers using them could show as active or inactive in the card while the entity said the opposite.
- **The day selector follows midnight**: when today was shown, the card moved to the new day at midnight but kept highlighting the previous day's button.
- **Tooltips no longer blink**: moving the pointer over a block's label, or to the next block, hid the tooltip for a moment.
- **Block labels use the block's real width**: labels were cut from an estimated width, so on a phone most blocks showed `...` or `com...`. The browser now cuts them to the space actually available. A value containing `&` or `<` was shown escaped (`Tom &amp; Jerry`).
- **The Σ of another entity responds right after a click**: any Σ click ignored all Σ clicks of the card for 300 ms.

### Performance
- **No more full redraw when nothing changes on screen**: every relevant state change rebuilt the whole card, recreating every icon (they flickered) and losing the hover state. The card now keeps its content when the result is identical, and no longer forces a layout measurement on each render.

### Documentation
- README matches what `schedule_state` 0.20.4 accepts: the unit goes in `extra_attributes`, an event ending at `00:00` is ignored by the integration (end the day with `23:59`, or use `allow_wrap`), and `unit`, `description` and `tooltip` are not passed on to the card.

### Tests
- Automated tests now guard against regressions: unit and behavior tests, screenshots of the card in light and dark themes on desktop and mobile, and tests inside a real Home Assistant, editor included. They run on every push and pull request.

## [2.2.4] - 2026-10-06

### Fixed
- **Template conditions no longer show a stale or fallback result**: the template cache was emptied at each new minute before Home Assistant's answers came back, so a render in between (every night at midnight, for instance) showed template-conditioned layers as active, and the error stayed on screen when HA's answer had not changed. Changing an entity used in a template now updates the card at once instead of up to ~2 minutes later, and templates nested in `and`/`or`/`not` are now evaluated by HA instead of always counting as true.
- **Plain state values are shown verbatim**: values such as `08:30`, `2024-01-05` or `2 persons` were displayed as `8`, `2018` and `2`.
- **Dashboard tab no longer freezes on some templates**: a state template using `not` or parentheses could make the card loop forever. `{% if %}` conditions containing spaces (e.g. `is_state('binary_sensor.home', 'on')`) now pick the right branch.
- **Editor and README now show the right default layout** ("By Days"): on a new card, selecting "By Entities" in the editor did nothing.
- **Shared color overrides**: overrides stay shared across all cards, but removing one from a card no longer removes it from another card that still declares it, and deleting an override in the editor no longer changes the dashboard's colors when the editor is cancelled. When two cards declare the same key, the most recently configured one wins.

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
