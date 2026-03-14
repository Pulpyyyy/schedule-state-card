/**
 * Schedule State Card - Editor
 * Uses native Home Assistant UI helpers:
 *   ha-entity-picker, ha-icon-picker, ha-selector (color_rgb / select / boolean / text)
 *   ha-textfield, ha-formfield, ha-switch, ha-icon-button
 */

// ─── helpers (globals exposed by the main card file) ────────────────────────
// TRANSLATIONS, DEFAULT_COLORS, COLOR_CACHE, escapeHtml, DAY_ORDER
// are defined in schedule-state-card.js which is always loaded first.
// ─────────────────────────────────────────────────────────────────────────────

class ScheduleStateCardEditor extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._config   = {};
        this._hass     = null;
        this._entities = [];
        this._editingIndex = null;
        this._rendered = false;
    }

    // ── i18n ────────────────────────────────────────────────────────────────
    _lang() {
        const l = this._hass?.locale?.language;
        return (l && TRANSLATIONS[l]) ? l : 'en';
    }
    t(key) {
        const l = this._lang();
        return (TRANSLATIONS[l]?.[key]) ?? TRANSLATIONS.en[key] ?? key;
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
            // Propagate hass to all HA pickers already in the DOM
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
        const t  = this.t.bind(this);
        const c  = this._config;

        const entityRows = this._entities.map((e, i) => this._entityRow(e, i)).join('');

        const colorRows = [
            ['active_layer',           t('editor_active_layer_label')],
            ['inactive_layer',         t('editor_inactive_layer_label')],
            ['combined_folded_layer',  t('editor_combined_folded_label')],
            ['combined_unfolded_layer',t('editor_combined_unfolded_label')],
            ['cursor',                 t('editor_cursor_label')],
        ].map(([k, l]) => this._colorRow(k, l)).join('');

        this.shadowRoot.innerHTML = `
<style>
  :host { display: block; }
  .card-config { padding: 4px 0; }
  .divider { height: 1px; background: var(--divider-color); margin: 12px 0; }
  .section-title {
    font-size: 15px; font-weight: 600; margin: 0 0 10px;
    color: var(--primary-text-color);
  }
  ha-textfield  { display: block; margin-bottom: 8px; width: 100%; }
  ha-select     { display: block; margin-bottom: 8px; width: 100%; }
  ha-formfield  { display: block; margin-bottom: 12px; }
  ha-entity-picker, ha-icon-picker { display: block; margin-bottom: 8px; width: 100%; }

  /* entity rows */
  .entity-row {
    display: flex; align-items: center; gap: 8px;
    padding: 10px; border-radius: 6px; margin-bottom: 6px;
    background: var(--secondary-background-color);
    border: 1px solid var(--divider-color);
  }
  .entity-row ha-icon { flex-shrink: 0; }
  .entity-name {
    flex: 1; font-size: 13px; color: var(--primary-text-color);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .entity-id {
    flex: 1; font-size: 11px; color: var(--secondary-text-color);
    font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .row-actions { display: flex; gap: 2px; flex-shrink: 0; }
  .icon-btn {
    background: transparent; border: 1px solid var(--divider-color);
    border-radius: 4px; padding: 4px 6px; cursor: pointer;
    color: var(--primary-text-color); display: flex; align-items: center;
    transition: background .15s, color .15s;
  }
  .icon-btn:hover { background: var(--primary-color); color: #fff; border-color: var(--primary-color); }
  .icon-btn.danger:hover { background: #e74c3c; border-color: #e74c3c; }

  /* entity edit form */
  .entity-edit-form {
    padding: 12px; border: 1px solid var(--primary-color);
    border-radius: 6px; margin-bottom: 8px;
    background: var(--primary-background-color);
  }

  /* add button */
  .add-btn {
    width: 100%; padding: 10px; margin-top: 4px;
    background: var(--primary-color); color: white;
    border: none; border-radius: 6px; cursor: pointer;
    font-size: 14px; font-weight: 600;
  }
  .add-btn:hover { opacity: .9; }

  /* color rows */
  .color-row {
    display: flex; align-items: center; gap: 12px;
    padding: 8px 0; border-bottom: 1px solid var(--divider-color);
  }
  .color-row:last-child { border-bottom: none; }
  .color-label { flex: 1; font-size: 13px; color: var(--primary-text-color); }
  .color-selector-wrap { width: 220px; flex-shrink: 0; }

  /* overrides */
  .override-row {
    display: flex; align-items: center; gap: 8px; padding: 8px;
    background: var(--secondary-background-color);
    border: 1px solid var(--divider-color); border-radius: 4px; margin-bottom: 6px;
  }
  .override-chip {
    min-width: 56px; height: 26px; padding: 0 8px; border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: bold; border: 1px solid var(--divider-color);
    flex-shrink: 0;
  }
  .override-key { flex: 1; font-family: monospace; font-size: 12px; }
  .new-override-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px; margin-top: 10px;
  }
  .color-field-label {
    font-size: 11px; color: var(--secondary-text-color); margin-bottom: 2px;
  }
  .add-override-btn {
    grid-column: 1 / -1; padding: 8px;
    background: var(--primary-color); color: white;
    border: none; border-radius: 4px; cursor: pointer;
    font-size: 13px; font-weight: 600;
  }
  .add-override-btn:hover { opacity: .9; }
</style>

<div class="card-config">

  <!-- Title -->
  <ha-textfield
    id="title-input"
    label="${t('editor_card_title')}"
    value="${escapeHtml(c.title || '')}"
    placeholder="${t('editor_title_placeholder')}">
  </ha-textfield>

  <!-- Show state -->
  <ha-formfield label="${t('editor_show_state_in_title')}">
    <ha-switch id="show-state-input" ${c.show_state_in_title ? 'checked' : ''}></ha-switch>
  </ha-formfield>

  <div class="divider"></div>

  <!-- Layout -->
  <ha-select id="layout-selector" label="${t('editor_layout_label')}" value="${c.layout || 'entities'}">
    <mwc-list-item value="entities">${t('editor_layout_entities')}</mwc-list-item>
    <mwc-list-item value="days">${t('editor_layout_days')}</mwc-list-item>
  </ha-select>

  <div class="divider"></div>

  <!-- Entities -->
  <div class="section-title">${t('editor_entities_label')}</div>
  <div id="entities-list">
    ${entityRows || `<div style="text-align:center;padding:20px;color:var(--secondary-text-color);">${t('editor_no_entities')}</div>`}
  </div>
  <button class="add-btn" id="add-btn">+ ${t('editor_add_entity')}</button>

  <div class="divider"></div>

  <!-- Colors -->
  <div class="section-title">${t('editor_colors_label')}</div>
  <div id="colors-section">${colorRows}</div>

  <div class="divider"></div>

  <!-- Color overrides -->
  ${this._colorOverridesSection(t)}

</div>`;

        // Attach HA-specific properties and listeners once elements exist
        requestAnimationFrame(() => this._boot());
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
    <button class="icon-btn edit-btn" data-index="${index}" title="${t('common.edit') || 'Edit'}">
      <ha-icon icon="mdi:pencil"></ha-icon>
    </button>
    <button class="icon-btn danger remove-btn" data-index="${index}" title="${t('common.delete') || 'Delete'}">
      <ha-icon icon="mdi:delete"></ha-icon>
    </button>
  </div>
</div>
${isEditing ? this._entityEditForm(entityConfig, index) : ''}`;
    }

    _entityEditForm(entityConfig, index) {
        const t = this.t.bind(this);
        return `
<div class="entity-edit-form" data-edit-index="${index}">
  <ha-entity-picker
    data-index="${index}"
    data-field="entity"
    allow-custom-entity>
  </ha-entity-picker>
  <ha-textfield
    data-index="${index}"
    data-field="name"
    label="${t('editor_name_label')}"
    value="${escapeHtml(entityConfig.name || '')}"
    placeholder="${t('editor_placeholder_name')}">
  </ha-textfield>
  <ha-icon-picker
    data-index="${index}"
    data-field="icon">
  </ha-icon-picker>
</div>`;
    }

    // ── color row HTML ───────────────────────────────────────────────────────
    _colorRow(colorKey, label) {
        return `
<div class="color-row">
  <span class="color-label">${label}</span>
  <div class="color-selector-wrap">
    <ha-selector data-colorkey="${colorKey}"></ha-selector>
  </div>
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
  <button class="icon-btn danger delete-override-btn" data-override-key="${escapeHtml(key)}" title="${t('common.delete') || 'Delete'}">
    <ha-icon icon="mdi:delete"></ha-icon>
  </button>
</div>`;
        }).join('');

        return `
<div class="section-title">${t('editor_override_title')}</div>
<div style="font-size:12px;color:var(--secondary-text-color);margin-bottom:10px;">
  ${t('editor_override_description')}
</div>
<div id="overrides-list">
  ${rows || `<div style="text-align:center;padding:10px;color:var(--secondary-text-color);">${t('editor_override_no_overrides')}</div>`}
</div>
<div class="new-override-grid">
  <ha-textfield id="override-value-input" label="${t('editor_override_value_label') || 'Value'}" placeholder="18"></ha-textfield>
  <ha-textfield id="override-unit-input"  label="${t('editor_override_unit_label')  || 'Unit'}"  placeholder="°C"></ha-textfield>
  <div>
    <div class="color-field-label">${t('editor_override_bg_label')}</div>
    <ha-selector id="override-bg-selector"></ha-selector>
  </div>
  <div>
    <div class="color-field-label">${t('editor_override_text_label')}</div>
    <ha-selector id="override-text-selector"></ha-selector>
  </div>
  <button class="add-override-btn" id="add-override-btn">${t('editor_override_add') || '+ Add override'}</button>
</div>`;
    }

    // ── boot: set HA properties + attach listeners ───────────────────────────
    async _boot() {
        // Wait for HA elements to be defined (they almost certainly already are)
        await Promise.all(
            ['ha-entity-picker', 'ha-icon-picker', 'ha-selector', 'ha-textfield', 'ha-select', 'ha-switch', 'ha-formfield']
                .filter(n => !customElements.get(n))
                .map(n => customElements.whenDefined(n))
        );
        this._applyHAProps();
        this._attachListeners();
    }

    _applyHAProps() {
        const sr = this.shadowRoot;
        if (!sr || !this._hass) return;

        // --- Entity pickers ---
        sr.querySelectorAll('ha-entity-picker[data-index]').forEach(p => {
            const i = parseInt(p.dataset.index);
            p.hass  = this._hass;
            p.value = this._entities[i]?.entity || '';
        });

        // --- Icon pickers ---
        sr.querySelectorAll('ha-icon-picker[data-index]').forEach(p => {
            const i = parseInt(p.dataset.index);
            p.value = this._entities[i]?.icon || '';
        });

        // --- Color selectors (card colors) ---
        sr.querySelectorAll('ha-selector[data-colorkey]').forEach(sel => {
            const key   = sel.dataset.colorkey;
            const color = this._config.colors?.[key] || DEFAULT_COLORS[key];
            sel.hass     = this._hass;
            sel.selector = { color_rgb: {} };
            sel.value    = this._hexToRgb(color);
        });

        // --- Color selectors (overrides) ---
        const bgSel   = sr.querySelector('#override-bg-selector');
        const textSel = sr.querySelector('#override-text-selector');
        [bgSel, textSel].forEach((sel, i) => {
            if (!sel) return;
            sel.hass     = this._hass;
            sel.selector = { color_rgb: {} };
            sel.value    = this._hexToRgb(i === 0 ? '#2196F3' : '#ffffff');
        });

        // --- ha-select layout value (needs to be set after upgrade) ---
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
            const onLayout = () => {
                const v = layoutSel.value;
                if (v) { this._config = { ...this._config, layout: v }; this._fire(); }
            };
            layoutSel.addEventListener('value-changed', onLayout);
            layoutSel.addEventListener('selected', onLayout);
        }

        // Add entity
        sr.querySelector('#add-btn')?.addEventListener('click', () => {
            this._entities = [...this._entities, { entity: '', name: '', icon: '' }];
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

        // Entity picker value-changed
        sr.querySelectorAll('ha-entity-picker[data-index]').forEach(p => {
            p.addEventListener('value-changed', e => {
                const i = parseInt(p.dataset.index);
                this._entities = this._entities.map((ent, idx) =>
                    idx === i ? { ...ent, entity: e.detail.value } : ent
                );
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

        // Entity name text field
        sr.querySelectorAll('ha-textfield[data-field="name"]').forEach(f => {
            f.addEventListener('change', e => {
                const i = parseInt(f.dataset.index);
                this._entities = this._entities.map((ent, idx) =>
                    idx === i ? { ...ent, name: e.target.value } : ent
                );
                this._fire();
            });
        });

        // Card color selectors
        sr.querySelectorAll('ha-selector[data-colorkey]').forEach(sel => {
            sel.addEventListener('value-changed', e => {
                const key    = sel.dataset.colorkey;
                const hex    = this._rgbToHex(e.detail.value);
                const colors = { ...DEFAULT_COLORS, ...(this._config.colors || {}), [key]: hex };
                this._config = { ...this._config, colors };
                this._fire();
            });
        });

        // Delete override
        sr.querySelectorAll('.delete-override-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const key      = btn.dataset.overrideKey;
                const overrides = { ...(this._config.color_overrides || {}) };
                delete overrides[key];
                COLOR_CACHE.removeOverride(key);
                this._config = { ...this._config, color_overrides: overrides };
                this._fire();
                this._render();
            });
        });

        // Add override
        sr.querySelector('#add-override-btn')?.addEventListener('click', () => {
            const valueInput = sr.querySelector('#override-value-input');
            const unitInput  = sr.querySelector('#override-unit-input');
            const bgSel      = sr.querySelector('#override-bg-selector');
            const textSel    = sr.querySelector('#override-text-selector');

            const value = valueInput?.value?.trim();
            if (!value) return;

            const unit    = unitInput?.value?.trim() || '';
            const bgColor   = bgSel?.value   ? this._rgbToHex(bgSel.value)   : '#2196F3';
            const textColor = textSel?.value ? this._rgbToHex(textSel.value) : '#ffffff';

            const key       = `${value}|${unit}`;
            const overrides = { ...(this._config.color_overrides || {}), [key]: { color: bgColor, textColor } };
            COLOR_CACHE.setOverride(key, bgColor, textColor);
            this._config = { ...this._config, color_overrides: overrides };
            this._fire();
            this._render();
        });
    }
}

customElements.define('schedule-state-card-editor', ScheduleStateCardEditor);
