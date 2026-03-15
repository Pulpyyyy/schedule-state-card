/**
 * Schedule State Card - Editor
 * Uses native Home Assistant UI helpers:
 *   ha-entity-picker, ha-icon-picker, ha-selector (color_rgb)
 *   ha-textfield, ha-formfield, ha-switch, ha-select
 *
 * Globals (TRANSLATIONS, DEFAULT_COLORS, COLOR_CACHE) are accessed lazily from
 * window._scheduleStateCardShared, set by schedule-state-card.js at runtime.
 * This file is loaded as an ES module via dynamic import(), so it cannot access
 * top-level const from the classic script directly.
 */

// escapeHtml defined locally — no dependency on shared globals
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

class ScheduleStateCardEditor extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._config          = {};
        this._hass            = null;
        this._entities        = [];
        this._editingIndex    = null;
        this._rendered        = false;
        this._renderId        = 0;
        this._overrideBgRgb   = [33, 150, 243];   // default #2196F3
        this._overrideTextRgb = [255, 255, 255];  // default #ffffff
    }

    // ── i18n ────────────────────────────────────────────────────────────────
    _lang() {
        const tr = window._scheduleStateCardShared?.TRANSLATIONS;
        const l  = this._hass?.locale?.language;
        return (l && tr?.[l]) ? l : 'en';
    }
    t(key) {
        const tr = window._scheduleStateCardShared?.TRANSLATIONS;
        if (!tr) return key;
        const l = this._lang();
        return tr[l]?.[key] ?? tr.en?.[key] ?? key;
    }

    // ── HA interface ────────────────────────────────────────────────────────
    setConfig(config) {
        if (!config) throw new Error('Invalid configuration');
        this._config = {
            ...config,
            entities: Array.isArray(config.entities)
                ? config.entities.map(e => (typeof e === 'string' ? { entity: e } : e))
                : [],
            show_state_in_title: config.show_state_in_title !== false,
        };
        this._entities = [...this._config.entities];
        if (this._hass) this._render();
    }

    set hass(hass) {
        this._hass = hass;
        if (!this._rendered) {
            this._render();
        } else {
            // Propagate hass to HA pickers already in the DOM (includes inside slots)
            this.shadowRoot.querySelectorAll(
                'ha-entity-picker, ha-icon-picker, ha-selector'
            ).forEach(el => { el.hass = hass; });
        }
    }

    // ── config change ────────────────────────────────────────────────────────
    _fire() {
        this._config = { ...this._config, entities: this._entities };
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this._config },
            bubbles: true,
            composed: true,
        }));
    }

    // ── color helpers ────────────────────────────────────────────────────────
    _resolveColor(color) {
        if (!color) return '#2196F3';
        if (color.includes('var(')) {
            const m = color.match(/#[0-9A-Fa-f]{6}/);
            return m ? m[0].toUpperCase() : '#2196F3';
        }
        return color.toUpperCase();
    }

    _hexToRgb(hex) {
        const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(this._resolveColor(hex));
        return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [33, 150, 243];
    }

    _rgbToHex(arr) {
        if (!Array.isArray(arr)) return '#2196F3';
        return '#' + arr.map(x => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    // ── render ───────────────────────────────────────────────────────────────
    _render() {
        this._rendered = true;
        const t = this.t.bind(this);
        const c = this._config;

        const entityRows = this._entities.map((e, i) => this._entityRow(e, i)).join('');

        const colorRows = [
            ['active_layer',            t('editor_active_layer_label')],
            ['inactive_layer',          t('editor_inactive_layer_label')],
            ['combined_folded_layer',   t('editor_combined_folded_label')],
            ['combined_unfolded_layer', t('editor_combined_unfolded_label')],
            ['cursor',                  t('editor_cursor_label')],
        ].map(([k, l]) => this._colorRow(k, l)).join('');

        this.shadowRoot.innerHTML = `
<style>
  :host { display: block; }
  .card-config { padding: 4px 0; }
  .divider { height: 1px; background: var(--divider-color); margin: 12px 0; }
  .section-title { font-size: 15px; font-weight: 600; margin: 0 0 10px; color: var(--primary-text-color); }
  ha-textfield  { display: block; margin-bottom: 8px; width: 100%; }
  .layout-select-wrapper { display: block; margin-bottom: 8px; width: 100%; }
  .layout-select-wrapper label { display: block; font-size: 12px; color: var(--secondary-text-color); margin-bottom: 4px; }
  .layout-select-wrapper select { width: 100%; padding: 10px 12px; border: 1px solid var(--divider-color); border-radius: 4px; background: var(--card-background-color, var(--primary-background-color)); color: var(--primary-text-color); font-size: 14px; cursor: pointer; box-sizing: border-box; }
  ha-formfield  { display: block; margin-bottom: 12px; }
  .picker-slot, ha-icon-picker { display: block; margin-bottom: 8px; width: 100%; }

  .entity-row {
    display: flex; align-items: center; gap: 8px;
    padding: 10px; border-radius: 6px; margin-bottom: 6px;
    background: var(--secondary-background-color); border: 1px solid var(--divider-color);
  }
  .entity-row ha-icon { flex-shrink: 0; }
  .entity-name { flex: 1; font-size: 13px; color: var(--primary-text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .entity-id   { flex: 1; font-size: 11px; color: var(--secondary-text-color); font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .row-actions { display: flex; gap: 2px; flex-shrink: 0; }
  .icon-btn {
    background: transparent; border: 1px solid var(--divider-color);
    border-radius: 4px; padding: 4px 6px; cursor: pointer;
    color: var(--primary-text-color); display: flex; align-items: center;
    transition: background .15s, color .15s;
  }
  .icon-btn:hover { background: var(--primary-color); color: #fff; border-color: var(--primary-color); }
  .icon-btn.danger:hover { background: #e74c3c; border-color: #e74c3c; }

  .entity-edit-form {
    padding: 12px; border: 1px solid var(--primary-color);
    border-radius: 6px; margin-bottom: 8px; background: var(--primary-background-color);
  }

  .add-btn {
    width: 100%; padding: 10px; margin-top: 4px;
    background: var(--primary-color); color: white;
    border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;
  }
  .add-btn:hover { opacity: .9; }

  .color-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--divider-color); }
  .color-row:last-child { border-bottom: none; }
  .color-label { flex: 1; font-size: 13px; color: var(--primary-text-color); }
  .color-selector-slot { width: 220px; flex-shrink: 0; }

  .override-row {
    display: flex; align-items: center; gap: 8px; padding: 8px;
    background: var(--secondary-background-color);
    border: 1px solid var(--divider-color); border-radius: 4px; margin-bottom: 6px;
  }
  .override-chip {
    min-width: 56px; height: 26px; padding: 0 8px; border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: bold; border: 1px solid var(--divider-color); flex-shrink: 0;
  }
  .override-key { flex: 1; font-family: monospace; font-size: 12px; }
  .new-override-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
  .color-field-label { font-size: 11px; color: var(--secondary-text-color); margin-bottom: 4px; }
  .override-input {
    width: 100%; padding: 8px; box-sizing: border-box;
    background: var(--secondary-background-color); color: var(--primary-text-color);
    border: 1px solid var(--divider-color); border-radius: 4px; font-size: 14px;
  }
  .override-input:focus { outline: none; border-color: var(--primary-color); }
  .add-override-btn {
    grid-column: 1 / -1; padding: 8px; background: var(--primary-color); color: white;
    border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 600;
  }
  .add-override-btn:hover { opacity: .9; }
</style>

<div class="card-config">

  <ha-textfield id="title-input" label="${t('editor_card_title')}"
    value="${escapeHtml(c.title || '')}" placeholder="${t('editor_title_placeholder')}">
  </ha-textfield>

  <ha-formfield label="${t('editor_show_state_in_title')}">
    <ha-switch id="show-state-input" ${c.show_state_in_title ? 'checked' : ''}></ha-switch>
  </ha-formfield>

  <div class="divider"></div>

  <div class="layout-select-wrapper">
    <label>${t('editor_layout_label')}</label>
    <select id="layout-selector">
      <option value="entities">${t('editor_layout_entities')}</option>
      <option value="days">${t('editor_layout_days')}</option>
    </select>
  </div>

  <div class="divider"></div>

  <div class="section-title">${t('editor_entities_label')}</div>
  <div id="entities-list">
    ${entityRows || `<div style="text-align:center;padding:20px;color:var(--secondary-text-color);">${t('editor_no_entities')}</div>`}
  </div>
  <button class="add-btn" id="add-btn">+ ${t('editor_add_entity')}</button>

  <div class="divider"></div>

  <div class="section-title">${t('editor_colors_label')}</div>
  <div id="colors-section">${colorRows}</div>

  <div class="divider"></div>

  ${this._colorOverridesSection(t)}

</div>`;

        // _applyHAProps() creates ha-entity-picker and ha-selector programmatically
        // (document.createElement + set properties + appendChild) so properties are
        // set BEFORE the element's first render — avoids null-selector/null-hass crashes
        // from HA's scoped custom element registry which upgrades during innerHTML.
        this._applyHAProps();

        // Deduplicate _boot(): if _render() is called twice before a rAF fires
        // (e.g. from handler + setConfig callback), only the last boot runs.
        this._renderId++;
        const rid = this._renderId;
        requestAnimationFrame(() => { if (this._renderId === rid) this._boot(); });
    }

    // ── entity row HTML ──────────────────────────────────────────────────────
    _entityRow(entityConfig, index) {
        const t  = this.t.bind(this);
        const id = entityConfig.entity || '';
        const st = this._hass?.states[id];
        const nm = entityConfig.name || st?.attributes?.friendly_name || id || t('editor_default_entity_name');
        const ic = entityConfig.icon || st?.attributes?.icon || 'mdi:calendar-clock';
        const isEditing = this._editingIndex === index;

        return `
<div class="entity-row">
  <ha-icon icon="${escapeHtml(ic)}"></ha-icon>
  <span class="entity-name">${escapeHtml(nm)}</span>
  <span class="entity-id">${escapeHtml(id)}</span>
  <div class="row-actions">
    <button class="icon-btn edit-btn" data-index="${index}" title="Edit">
      <ha-icon icon="mdi:pencil"></ha-icon>
    </button>
    <button class="icon-btn danger remove-btn" data-index="${index}" title="Delete">
      <ha-icon icon="mdi:delete"></ha-icon>
    </button>
  </div>
</div>
${isEditing ? this._entityEditForm(entityConfig, index) : ''}`;
    }

    _entityEditForm(entityConfig, index) {
        const t = this.t.bind(this);
        // ha-entity-picker is NOT in the HTML string — it's created in _applyHAProps()
        // and injected into .picker-slot to avoid null-hass render crash.
        return `
<div class="entity-edit-form" data-edit-index="${index}">
  <div class="picker-slot" data-index="${index}"></div>
  <ha-textfield data-index="${index}" data-field="name"
    label="${t('editor_name_label')}"
    value="${escapeHtml(entityConfig.name || '')}"
    placeholder="${t('editor_placeholder_name')}">
  </ha-textfield>
  <ha-icon-picker data-index="${index}" data-field="icon"></ha-icon-picker>
</div>`;
    }

    // ── color row HTML ───────────────────────────────────────────────────────
    // ha-selector is NOT in the HTML string — created in _applyHAProps().
    _colorRow(colorKey, label) {
        return `
<div class="color-row">
  <span class="color-label">${label}</span>
  <div class="color-selector-slot" data-colorkey="${colorKey}"></div>
</div>`;
    }

    // ── color overrides section HTML ─────────────────────────────────────────
    _colorOverridesSection(t) {
        const overrides = this._config.color_overrides || {};
        const rows = Object.entries(overrides).map(([key, val]) => {
            const [value, unit] = key.split('|');
            const bg   = val?.color     || '#cccccc';
            const text = val?.textColor || '#ffffff';
            return `
<div class="override-row">
  <div class="override-chip" style="background:${bg};color:${text};">${escapeHtml(value)}${unit ? ' ' + escapeHtml(unit) : ''}</div>
  <span class="override-key">${escapeHtml(key)}</span>
  <button class="icon-btn danger delete-override-btn" data-override-key="${escapeHtml(key)}" title="Delete">
    <ha-icon icon="mdi:delete"></ha-icon>
  </button>
</div>`;
        }).join('');

        return `
<div class="section-title">${t('editor_override_title')}</div>
<div style="font-size:12px;color:var(--secondary-text-color);margin-bottom:10px;">${t('editor_override_description')}</div>
<div id="overrides-list">
  ${rows || `<div style="text-align:center;padding:10px;color:var(--secondary-text-color);">${t('editor_override_no_overrides')}</div>`}
</div>
<div class="new-override-grid">
  <div>
    <div class="color-field-label">${t('editor_override_value_label')}</div>
    <input id="override-value-input" class="override-input" type="text" placeholder="21">
  </div>
  <div>
    <div class="color-field-label">${t('editor_override_unit_label')}</div>
    <input id="override-unit-input" class="override-input" type="text" placeholder="°C">
  </div>
  <div>
    <div class="color-field-label">${t('editor_override_bg_label')}</div>
    <div id="override-bg-slot"></div>
  </div>
  <div>
    <div class="color-field-label">${t('editor_override_text_label')}</div>
    <div id="override-text-slot"></div>
  </div>
  <button class="add-override-btn" id="add-override-btn">${t('editor_override_add_button')}</button>
</div>`;
    }

    // ── boot: attach listeners (runs once per render cycle) ──────────────────
    // No whenDefined() wait: HA uses a scoped custom element registry, so
    // customElements.get() returns undefined for HA elements even when defined,
    // causing whenDefined() to hang forever. Elements are already usable by the
    // time this rAF callback fires.
    _boot() {
        this._attachListeners();
    }

    // ── create HA elements programmatically + set their properties ────────────
    // Called synchronously in _render(), BEFORE the rAF that runs _boot().
    // Creating elements via document.createElement and setting properties before
    // appendChild ensures the element renders with correct props from the start.
    _applyHAProps() {
        const sr = this.shadowRoot;
        if (!sr || !this._hass) return;

        const DEFAULT_COLORS = window._scheduleStateCardShared?.DEFAULT_COLORS || {};

        // --- Entity pickers ---
        sr.querySelectorAll('.picker-slot[data-index]').forEach(slot => {
            const i = parseInt(slot.dataset.index);
            slot.innerHTML = '';
            const p = document.createElement('ha-entity-picker');
            p.hass           = this._hass;
            p.value          = this._entities[i]?.entity || '';
            p.includeDomains = ['sensor'];
            p.setAttribute('allow-custom-entity', '');
            p.style.cssText  = 'display:block;margin-bottom:8px;width:100%;';
            // Listener on the element itself (not a slot div) — most reliable
            p.addEventListener('value-changed', e => {
                this._entities = this._entities.map((ent, idx) =>
                    idx === i ? { ...ent, entity: e.detail.value } : ent
                );
                this._fire();
                this._render();
            });
            slot.appendChild(p);
        });

        // --- Icon pickers ---
        sr.querySelectorAll('ha-icon-picker[data-index]').forEach(p => {
            const i = parseInt(p.dataset.index);
            p.value = this._entities[i]?.icon || '';
        });

        // --- Card color selectors ---
        sr.querySelectorAll('.color-selector-slot[data-colorkey]').forEach(slot => {
            const key   = slot.dataset.colorkey;
            const color = this._config.colors?.[key] || DEFAULT_COLORS[key];
            slot.innerHTML = '';
            const sel = document.createElement('ha-selector');
            sel.hass     = this._hass;
            sel.selector = { color_rgb: {} };
            sel.value    = this._hexToRgb(color);
            sel.addEventListener('value-changed', e => {
                const hex    = this._rgbToHex(e.detail.value);
                const colors = { ...DEFAULT_COLORS, ...(this._config.colors || {}), [key]: hex };
                this._config = { ...this._config, colors };
                this._fire();
            });
            slot.appendChild(sel);
        });

        // --- Override color selectors ---
        const bgSlot   = sr.querySelector('#override-bg-slot');
        const textSlot = sr.querySelector('#override-text-slot');
        if (bgSlot) {
            bgSlot.innerHTML = '';
            const sel = document.createElement('ha-selector');
            sel.hass     = this._hass;
            sel.selector = { color_rgb: {} };
            sel.value    = this._overrideBgRgb;
            sel.addEventListener('value-changed', e => { this._overrideBgRgb = e.detail.value; });
            bgSlot.appendChild(sel);
        }
        if (textSlot) {
            textSlot.innerHTML = '';
            const sel = document.createElement('ha-selector');
            sel.hass     = this._hass;
            sel.selector = { color_rgb: {} };
            sel.value    = this._overrideTextRgb;
            sel.addEventListener('value-changed', e => { this._overrideTextRgb = e.detail.value; });
            textSlot.appendChild(sel);
        }

        // --- ha-select layout ---
        const layoutSel = sr.querySelector('#layout-selector');
        if (layoutSel) layoutSel.value = this._config.layout || 'entities';
    }

    // ── event listeners ──────────────────────────────────────────────────────
    _attachListeners() {
        const sr = this.shadowRoot;
        if (!sr) return;

        // Title
        sr.querySelector('#title-input')?.addEventListener('change', e => {
            this._config = { ...this._config, title: e.target.value };
            this._fire();
        });

        // Show state toggle
        sr.querySelector('#show-state-input')?.addEventListener('change', e => {
            this._config = { ...this._config, show_state_in_title: e.target.checked };
            this._fire();
        });

        // Layout selector
        const layoutSel = sr.querySelector('#layout-selector');
        if (layoutSel) {
            layoutSel.addEventListener('change', e => {
                const v = e.target.value;
                if (v) { this._config = { ...this._config, layout: v }; this._fire(); }
            });
        }

        // Add entity
        sr.querySelector('#add-btn')?.addEventListener('click', () => {
            this._entities    = [...this._entities, { entity: '', name: '', icon: '' }];
            this._editingIndex = this._entities.length - 1;
            this._fire();
            this._render();
        });

        // Edit / remove entity buttons
        sr.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const i = parseInt(btn.dataset.index);
                this._editingIndex = this._editingIndex === i ? null : i;
                this._render();
            });
        });
        sr.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const i = parseInt(btn.dataset.index);
                this._entities = this._entities.filter((_, idx) => idx !== i);
                if (this._editingIndex === i) this._editingIndex = null;
                this._fire();
                this._render();
            });
        });

        // Icon picker value-changed
        sr.querySelectorAll('ha-icon-picker[data-index]').forEach(p => {
            p.addEventListener('value-changed', e => {
                const i = parseInt(p.dataset.index);
                this._entities = this._entities.map((ent, idx) =>
                    idx === i ? { ...ent, icon: e.detail.value } : ent
                );
                this._fire();
                this._render();
            });
        });

        // Entity name
        sr.querySelectorAll('ha-textfield[data-field="name"]').forEach(f => {
            f.addEventListener('change', e => {
                const i = parseInt(f.dataset.index);
                this._entities = this._entities.map((ent, idx) =>
                    idx === i ? { ...ent, name: e.target.value } : ent
                );
                this._fire();
            });
        });

        // Note: entity picker and color selector value-changed listeners are
        // attached directly on each element inside _applyHAProps().

        // Delete override
        sr.querySelectorAll('.delete-override-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const key      = btn.dataset.overrideKey;
                const overrides = { ...(this._config.color_overrides || {}) };
                delete overrides[key];
                window._scheduleStateCardShared?.COLOR_CACHE?.removeOverride(key);
                this._config = { ...this._config, color_overrides: overrides };
                this._fire();
                this._render();
            });
        });

        // Add override
        sr.querySelector('#add-override-btn')?.addEventListener('click', () => {
            const value = sr.querySelector('#override-value-input')?.value?.trim();
            if (!value) return;
            const unit      = sr.querySelector('#override-unit-input')?.value?.trim() || '';
            const bgColor   = this._rgbToHex(this._overrideBgRgb);
            const textColor = this._rgbToHex(this._overrideTextRgb);
            const key       = `${value}|${unit}`;
            const overrides = { ...(this._config.color_overrides || {}), [key]: { color: bgColor, textColor } };
            window._scheduleStateCardShared?.COLOR_CACHE?.setOverride(key, bgColor, textColor);
            this._config = { ...this._config, color_overrides: overrides };
            this._fire();
            this._render();
        });
    }
}

customElements.define('schedule-state-card-editor', ScheduleStateCardEditor);
