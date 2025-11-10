// schedule-state-card.js v3.9.18 - Code épuré et optimisé - CORRIGÉ (Traduction des conditions + Ponctuation)

const TRANSLATIONS = {
    en: {
        state_label: "State",
        condition_label: "Condition",
        layer_label: "Layer",
        time_label: "Time",
        no_specific_condition: "No specific condition",
        default_state_label: "Default state",
        wrapping: "wrapping",
        no_schedule: "No schedule",
        entity_not_found: "Entity not found",
        dynamic_value: "Dynamic value",
        dynamic_ref_schedule: "schedule_state",
        dynamic_ref_sensor: "sensor",
        // NOUVEAU: Clés pour la traduction des conditions
        cond_days: "Days",
        cond_month: "Month",
        cond_and: "AND",
        cond_or: "OR",
        days: {
            mon: "Monday",
            tue: "Tuesday",
            wed: "Wednesday",
            thu: "Thursday",
            fri: "Friday",
            sat: "Saturday",
            sun: "Sunday"
        }
    },
    fr: {
        state_label: "État",
        condition_label: "Condition",
        layer_label: "Couche",
        time_label: "Horaires",
        no_specific_condition: "Aucune condition spécifique",
        default_state_label: "État par défaut",
        wrapping: "débordement",
        no_schedule: "Pas de planning",
        entity_not_found: "Entité non trouvée",
        dynamic_value: "Valeur dynamique",
        dynamic_ref_schedule: "état_planning",
        dynamic_ref_sensor: "capteur",
        // NOUVEAU: Clés pour la traduction des conditions
        cond_days: "Jours",
        cond_month: "Mois",
        cond_and: "ET",
        cond_or: "OU",
        days: {
            mon: "Lundi",
            tue: "Mardi",
            wed: "Mercredi",
            thu: "Jeudi",
            fri: "Vendredi",
            sat: "Samedi",
            sun: "Dimanche"
        }
    },
    de: {
        state_label: "Status",
        condition_label: "Bedingung",
        layer_label: "Schicht",
        time_label: "Zeiten",
        no_specific_condition: "Keine spezifische Bedingung",
        default_state_label: "Standardstatus",
        wrapping: "Überlauf",
        no_schedule: "Kein Zeitplan",
        entity_not_found: "Entität nicht gefunden",
        dynamic_value: "Dynamischer Wert",
        dynamic_ref_schedule: "Zeitplan-Status",
        dynamic_ref_sensor: "Sensor",
        // NOUVEAU: Clés pour la traduction des conditions
        cond_days: "Tage",
        cond_month: "Monat",
        cond_and: "UND",
        cond_or: "ODER",
        days: {
            mon: "Montag",
            tue: "Dienstag",
            wed: "Mittwoch",
            thu: "Donnerstag",
            fri: "Freitag",
            sat: "Samstag",
            sun: "Sonntag"
        }
    },
    es: {
        state_label: "Estado",
        condition_label: "Condición",
        layer_label: "Capa",
        time_label: "Horarios",
        no_specific_condition: "Sin condición específica",
        default_state_label: "Estado por defecto",
        wrapping: "desbordamiento",
        no_schedule: "Sin horario",
        entity_not_found: "Entidad no encontrada",
        dynamic_value: "Valor dinámico",
        dynamic_ref_schedule: "estado_horario",
        dynamic_ref_sensor: "sensor",
        // NOUVEAU: Clés pour la traduction des conditions
        cond_days: "Días",
        cond_month: "Mes",
        cond_and: "Y",
        cond_or: "O",
        days: {
            mon: "Lunes",
            tue: "Martes",
            wed: "Miércoles",
            thu: "Jueves",
            fri: "Viernes",
            sat: "Sábado",
            sun: "Domingo"
        }
    }
};

class ScheduleStateCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._config = {};
        this._hass = null;
        this.currentTime = this.getCurrentTime();
        this.selectedDay = this.currentTime.day;
        this.updateInterval = null;
        this.tooltipElement = null;
    }

    getLanguage() {
        if (this._hass?.locale?.language) {
            return TRANSLATIONS[this._hass.locale.language] ? this._hass.locale.language : "en";
        }
        return "en";
    }

    t(key) {
        const lang = this.getLanguage();
        return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
    }
    
    // NOUVELLE MÉTHODE AMÉLIORÉE: Traduit la chaîne de condition en gérant la ponctuation
    _translateConditionText(text) {
        if (!text) return "";
        let translated = text;

        // Mappings des jours abrégés anglais vers les clés de traduction complètes
        const dayAbbrs = { "Mon": "mon", "Tue": "tue", "Wed": "wed", "Thu": "thu", "Fri": "fri", "Sat": "sat", "Sun": "sun" };
        const dayTranslations = this.t("days");

        // 1. Traduire les en-têtes et connecteurs
        translated = translated.replace("Days:", this.t("cond_days") + ":");
        translated = translated.replace("Month:", this.t("cond_month") + ":");
        // Remplacer les connecteurs logiques (avec espaces autour)
        translated = translated.replace(/\sAND\s/g, ` ${this.t("cond_and")} `);
        translated = translated.replace(/\sOR\s/g, ` ${this.t("cond_or")} `);

        // 2. Traduire les abréviations de jours et conserver la ponctuation/espaces
        for (const [abbr, fullDayKey] of Object.entries(dayAbbrs)) {
            const translatedDay = dayTranslations[fullDayKey];
            if (translatedDay) {
                // Utilise \b pour ne matcher que des mots entiers.
                // ([,\.\s]*) capture la ponctuation et les espaces suivants dans $1.
                translated = translated.replace(new RegExp(`\\b${abbr}([,\.\\s]*)`, 'g'), `${translatedDay}$1`);
            }
        }
        
        return translated;
    }

    use12HourFormat() {
        return this._hass?.locale?.time_format === "12" || this.getLanguage() === "en";
    }

    formatHour(hour) {
        if (this.use12HourFormat()) {
            if (hour === 0) return "12 AM";
            if (hour < 12) return hour + " AM";
            if (hour === 12) return "12 PM";
            return hour - 12 + " PM";
        }
        return hour + "h";
    }

    setConfig(config) {
        if (!config) throw new Error("Invalid configuration");
        let entities = config.entities || [];
        this._config = {
            ...config,
            entities: Array.isArray(entities) ? entities.map(e => typeof e === "string" ? { entity: e } : e) : []
        };
        if (this._hass) this.render();
    }

    set hass(hass) {
        this._hass = hass;
        if (this._config?.entities && !this.shadowRoot.querySelector("ha-card")) {
            this.render();
        }
        this.updateContent();
    }

    static getConfigElement() {
        return document.createElement("schedule-state-card-editor");
    }

    static getStubConfig() {
        return {
            entities: [{
                entity: "sensor.schedule_consigne_rdc",
                name: "RDC",
                icon: "mdi:thermometer"
            }],
            title: "Schedule Planning"
        };
    }

    getCardSize() {
        return 8;
    }

    getDays() {
        const dayTranslations = TRANSLATIONS[this.getLanguage()]?.days || TRANSLATIONS.en.days;
        return ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map(id => ({
            id,
            label: dayTranslations[id]
        }));
    }

    getCurrentTime() {
        const now = new Date();
        const dayMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
        return {
            day: dayMap[now.getDay()],
            hours: String(now.getHours()).padStart(2, "0"),
            minutes: String(now.getMinutes()).padStart(2, "0")
        };
    }

    isToday() {
        return this.selectedDay === this.currentTime.day;
    }

    getCurrentTimePercentage() {
        const hours = parseInt(this.currentTime.hours);
        const minutes = parseInt(this.currentTime.minutes);
        return (hours * 60 + minutes) / 1440 * 100;
    }

    startTimelineUpdate() {
        if (this.updateInterval) clearInterval(this.updateInterval);
        this.updateInterval = setInterval(() => {
            this.currentTime = this.getCurrentTime();
            this.updateTimeline();
        }, 60000);
    }

    stopTimelineUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    updateTimeline() {
        const containers = this.shadowRoot.querySelectorAll(".timeline-container");
        
        if (!this.isToday()) {
            containers.forEach(container => {
                const cursor = container.querySelector(".time-cursor");
                if (cursor) cursor.style.display = "none";
            });
            return;
        }
        
        const timePercentage = this.getCurrentTimePercentage();
        containers.forEach(container => {
            let cursor = container.querySelector(".time-cursor");
            if (!cursor) {
                cursor = document.createElement("div");
                cursor.className = "time-cursor";
                container.appendChild(cursor);
            }
            cursor.style.display = "block";
            cursor.style.left = timePercentage + "%";
        });
    }

    getPerceivedLuminance(h, s, l) {
        const c = (s / 100) * (1 - Math.abs(2 * (l / 100) - 1));
        const h_prime = h / 60;
        let r_prime, g_prime, b_prime;
        if (h_prime <= 1) {
            r_prime = c; g_prime = c * h_prime; b_prime = 0;
        } else if (h_prime <= 2) {
            r_prime = c * (2 - h_prime); g_prime = c; b_prime = 0;
        } else if (h_prime <= 3) {
            r_prime = 0; g_prime = c; b_prime = c * (h_prime - 2);
        } else if (h_prime <= 4) {
            r_prime = 0; g_prime = c * (4 - h_prime); b_prime = c;
        } else if (h_prime <= 5) {
            r_prime = c * (h_prime - 4); g_prime = 0; b_prime = c;
        } else {
            r_prime = c; g_prime = 0; b_prime = c * (6 - h_prime);
        }
        const m = (l / 100) - c / 2;
        const r = r_prime + m;
        const g = g_prime + m;
        const b = b_prime + m;
        const luminance = 0.2126 * (r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)) +
                         0.7152 * (g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)) +
                         0.0722 * (b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4));
        return luminance;
    }

    getTextColorForBackground(hslColor) {
        const match = hslColor.match(/hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/);
        if (!match) return "#000000";
        const h = parseFloat(match[1]);
        const s = parseFloat(match[2]);
        const l = parseFloat(match[3]);
        const luminance = this.getPerceivedLuminance(h, s, l);
        return luminance > 0.5 ? "#000000" : "#ffffff";
    }

    getColorForState(stateValue, unit) {
        let str = String(stateValue).trim();
        const numMatch = str.match(/^[\d.]+/);
        if (numMatch) str = String(parseFloat(numMatch[0]));
        if (unit) str = str + "|" + unit;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash = hash & 4294967295;
        }
        const hues = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195, 200, 205, 210, 215, 220, 225, 230, 235, 240, 245, 250, 255, 260, 265, 270, 275, 280, 285, 290, 295, 300, 305, 310, 315, 320, 325, 330, 335, 340, 345, 350, 355];
        const idx = Math.abs(hash) % hues.length;
        const hsl = "hsl(" + hues[idx] + ", 75%, 50%)";
        const textColor = this.getTextColorForBackground(hsl);
        return { color: hsl, textColor: textColor };
    }

    timeToMinutes(time) {
        if (!time || typeof time !== "string") return 0;
        const parts = time.split(":");
        if (parts.length < 2) return 0;
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        return (isNaN(hours) ? 0 : hours) * 60 + (isNaN(minutes) ? 0 : minutes);
    }

    escapeHtml(text) {
        const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    decodeHtmlEntities(text) {
        const map = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };
        return String(text).replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, m => map[m]);
    }

    truncateText(text, maxWidthPx) {
        if (!text || typeof text !== "string") return text;
        if (maxWidthPx < 30) return "...";
        const charWidth = 6;
        const maxChars = Math.floor(maxWidthPx / charWidth) - 2;
        if (maxChars <= 0) return "...";
        if (text.length <= maxChars) return text;
        return text.substring(0, maxChars) + "...";
    }

    resolveTemplate(template) {
        if (!template || typeof template !== "string") return template;
        if (!this._hass) return template;
        let result = template.trim();
        result = result.replace(/\{\{|\}\}/g, "").replace(/\{%|%\}/g, "").trim();
        const ifElifMatch = result.match(/if\s+(.+?)\s+(.+?)\s+elif\s+(.+?)\s+(.+?)\s+else\s+(.+?)$/is);
        if (ifElifMatch) {
            result = this.evalCondition(ifElifMatch[1].trim()) ? ifElifMatch[2].trim() : this.evalCondition(ifElifMatch[3].trim()) ? ifElifMatch[4].trim() : ifElifMatch[5].trim();
        } else {
            const ifMatch = result.match(/if\s+(.+?)\s+(.+?)\s+else\s+(.+?)$/is);
            if (ifMatch) result = this.evalCondition(ifMatch[1].trim()) ? ifMatch[2].trim() : ifMatch[3].trim();
        }
        result = result.replace(/states\(\s*['"]([^'"]+)['"]\s*\)/g, (match, entity) => {
            const state = this._hass.states[entity];
            return state ? String(state.state) : "0";
        });
        result = result.replace(/state_attr\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g, (match, entity, attr) => {
            const state = this._hass.states[entity];
            return state?.attributes?.[attr] !== undefined ? String(state.attributes[attr]) : "0";
        });
        result = result.replace(/\|\s*float\([^)]*\)/g, "").replace(/\|\s*int\([^)]*\)/g, "").replace(/\|\s*float\b/g, "").replace(/\|\s*int\b/g, "");
        result = this._evalMath(result);
        return String(result).trim();
    }

    _evalMath(expr) {
        if (!expr || typeof expr !== 'string') return String(expr);
        let cleanedExpr = expr.trim();
        if (!/^[\d\s\.\+\-\*\/\(\)]+$/.test(cleanedExpr)) {
            const num = parseFloat(cleanedExpr);
            return isNaN(num) ? expr : String(num);
        }
        try {
            const result = this._safeMathEval(cleanedExpr);
            if (typeof result === 'number' && !isNaN(result)) return String(result);
            return expr;
        } catch (e) {
            console.error("Schedule card: Math eval failed:", cleanedExpr, e);
            return expr;
        }
    }

    _safeMathEval(expr) {
        const tokens = [];
        let current = '';
        for (let i = 0; i < expr.length; i++) {
            const char = expr[i];
            if ('+-*/()'.includes(char)) {
                if (current) tokens.push(parseFloat(current));
                tokens.push(char);
                current = '';
            } else if (char === ' ') {
                if (current) tokens.push(parseFloat(current));
                current = '';
            } else {
                current += char;
            }
        }
        if (current) tokens.push(parseFloat(current));
        return this._evaluateTokens(tokens);
    }

    _evaluateTokens(tokens) {
        while (tokens.includes('(')) {
            const startIdx = tokens.lastIndexOf('(');
            let endIdx = tokens.indexOf(')', startIdx);
            if (endIdx === -1) throw new Error('Mismatched parentheses');
            const subTokens = tokens.slice(startIdx + 1, endIdx);
            const result = this._evaluateTokens(subTokens);
            tokens.splice(startIdx, endIdx - startIdx + 1, result);
        }
        for (let i = 1; i < tokens.length; i += 2) {
            if (tokens[i] === '*') {
                const result = tokens[i - 1] * tokens[i + 1];
                tokens.splice(i - 1, 3, result);
                i -= 2;
            } else if (tokens[i] === '/') {
                if (tokens[i + 1] === 0) throw new Error('Division by zero');
                const result = tokens[i - 1] / tokens[i + 1];
                tokens.splice(i - 1, 3, result);
                i -= 2;
            }
        }
        for (let i = 1; i < tokens.length; i += 2) {
            if (tokens[i] === '+') {
                const result = tokens[i - 1] + tokens[i + 1];
                tokens.splice(i - 1, 3, result);
                i -= 2;
            } else if (tokens[i] === '-') {
                const result = tokens[i - 1] - tokens[i + 1];
                tokens.splice(i - 1, 3, result);
                i -= 2;
            }
        }
        return tokens[0];
    }

    evalCondition(condition) {
        let expr = condition.trim();
        expr = expr.replace(/is_state\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g, (match, entity, value) => {
            const state = this._hass.states[entity];
            return state && state.state === value ? "true" : "false";
        });
        expr = expr.replace(/\band(s*)\b/gi, "&&").replace(/\bor\b/gi, "||").replace(/\bnot\b/gi, "!");
        return this._safeBooleanEval(expr);
    }

    _safeBooleanEval(expr) {
        expr = expr.trim().replace(/\bfalse\b/g, "0").replace(/\btrue\b/g, "1");
        try {
            if (!/^[01&|()!\s]+$/.test(expr)) return false;
            let result = expr;
            while (result.includes("!")) result = result.replace(/!([01])/g, (m, v) => v === "1" ? "0" : "1");
            while (result.includes("&&")) result = result.replace(/([01])\s*&&\s*([01])/g, (m, a, b) => (a === "1" && b === "1") ? "1" : "0");
            while (result.includes("||")) result = result.replace(/([01])\s*\|\|\s*([01])/g, (m, a, b) => (a === "1" || b === "1") ? "1" : "0");
            return result.replace(/\s/g, "") === "1";
        } catch (e) {
            console.error("Schedule card: condition evaluation failed", e);
            return false;
        }
    }

    _evaluateConditionsForLayer(layer) {
        if (layer.is_default_layer) return false;
        if (!layer?.blocks?.length) return true;
        let allConditions = [];
        for (const block of layer.blocks) {
            if (block.raw_conditions?.length) {
                allConditions = allConditions.concat(block.raw_conditions);
            }
        }
        if (allConditions.length === 0) return true;
        const conditionStrings = new Set();
        const uniqueConditions = [];
        for (const cond of allConditions) {
            const condStr = JSON.stringify(cond);
            if (!conditionStrings.has(condStr)) {
                conditionStrings.add(condStr);
                uniqueConditions.push(cond);
            }
        }
        for (const cond of uniqueConditions) {
            if (cond.condition === "time" && !cond.month) continue;
            if (!this._evaluateCondition(cond)) return false;
        }
        return true;
    }

    _evaluateCondition(condition) {
        if (!condition || typeof condition !== "object") return true;
        const condType = condition.condition;
        if (condType === "time") {
            if (condition.month) {
                const currentMonth = new Date().getMonth() + 1;
                const months = condition.month;
                if (Array.isArray(months)) return months.includes(currentMonth);
                else if (typeof months === "number") return currentMonth === months;
            }
            return true;
        }
        if (condType === "state") {
            const entity = this._hass.states[condition.entity_id];
            if (!entity) return false;
            return entity.state === condition.state;
        }
        if (condType === "numeric_state") {
            const entity = this._hass.states[condition.entity_id];
            if (!entity) return false;
            const value = parseFloat(entity.state);
            if (condition.above !== undefined && value <= condition.above) return false;
            if (condition.below !== undefined && value >= condition.below) return false;
            return true;
        }
        return true;
    }

    isDynamicTemplate(rawTemplate) {
        if (!rawTemplate || typeof rawTemplate !== "string") return false;
        return rawTemplate.includes("states(") || rawTemplate.includes("state_attr(") || rawTemplate.includes("{%") || rawTemplate.includes("{{");
    }

    isScheduleStateSensor(rawTemplate) {
        if (!rawTemplate || typeof rawTemplate !== "string" || !this._hass) return false;
        const match = rawTemplate.match(/(?:states|state_attr)\(\s*['"]([^'"]+)['"]/);
        if (!match) return false;
        const entityId = match[1];
        const entity = this._hass.states[entityId];
        if (!entity) return false;
        return entity.attributes?.icon === "mdi:calendar-clock";
    }

    extractEntityFromTemplate(template) {
        if (!template || typeof template !== "string") return "";
        const match = template.match(/(?:states|state_attr)\(\s*['"]([^'"]+)['"]/);
        return match ? match[1] : "";
    }

    showTooltip(event, text) {
        if (!this.tooltipElement) {
            this.tooltipElement = document.createElement("div");
            this.tooltipElement.className = "custom-tooltip";
            this.tooltipElement.style.cssText = "position:fixed;background:var(--primary-background-color,#1a1a1a);color:var(--primary-text-color,white);padding:8px 12px;border-radius:4px;border:1px solid var(--divider-color,#333);font-size:12px;z-index:3;max-width:300px;word-wrap:break-word;box-shadow:0 2px 8px rgba(0,0,0,0.3);pointer-events:none;white-space:pre-line;";
            document.body.appendChild(this.tooltipElement);
        }
        const decoded = this.decodeHtmlEntities(text);
        this.tooltipElement.textContent = decoded.replace(/\\n/g, "\n");
        const rect = event.target.getBoundingClientRect();
        const tooltipRect = this.tooltipElement.getBoundingClientRect();
        let left = rect.left + rect.width / 2;
        let top = rect.top - tooltipRect.height - 10;
        if (top < 0) top = rect.bottom + 10;
        if (left + tooltipRect.width / 2 > window.innerWidth) left = window.innerWidth - tooltipRect.width / 2 - 10;
        if (left - tooltipRect.width / 2 < 0) left = tooltipRect.width / 2 + 10;
        this.tooltipElement.style.left = left + "px";
        this.tooltipElement.style.top = top + "px";
        this.tooltipElement.style.transform = "translateX(-50%)";
        this.tooltipElement.style.display = "block";
    }

    hideTooltip() {
        if (this.tooltipElement) this.tooltipElement.style.display = "none";
    }

    renderErrorCard(entityId, message) {
        return '<div class="room-timeline"><div class="room-header"><ha-icon icon="mdi:alert-circle"></ha-icon><span class="room-name" style="color:var(--error-color);">' + entityId + '</span></div><div class="timeline-container" style="padding:16px;text-align:center;"><div style="color:var(--secondary-text-color);">' + message + "</div></div></div>";
    }

    renderTimeline(roomName, roomIcon, layers, unitOfMeasurement) {
        if (!layers?.length) {
            return '<div class="room-timeline"><div class="room-header"><span class="room-name">' + roomName + '</span></div><div class="timeline-container"><div class="no-schedule">' + this.t("no_schedule") + '</div></div></div>';
        }

        const blockHeight = 20;
        const verticalGap = 8;
        const topMargin = 4;
        const bottomMargin = 20;
        const iconColumnWidth = 28;

        let defaultLayer = null;
        let otherLayers = [];
        for (let i = 0; i < layers.length; i++) {
            if (layers[i].is_default_layer) defaultLayer = layers[i];
            else otherLayers.push(layers[i]);
        }
        
        let visibleLayers = [];
        if (defaultLayer) visibleLayers.push(defaultLayer);
        if (otherLayers.length > 0) visibleLayers = visibleLayers.concat(otherLayers);
        
        const layerActiveStates = [];
        for (const layer of visibleLayers) {
            layerActiveStates.push(layer.is_default_layer ? null : this._evaluateConditionsForLayer(layer));
        }
        
        const anyOtherLayerActive = layerActiveStates.some((active, idx) => active === true && !visibleLayers[idx].is_default_layer);
        
        for (let i = 0; i < layerActiveStates.length; i++) {
            if (visibleLayers[i].is_default_layer) {
                layerActiveStates[i] = !anyOtherLayerActive;
            }
        }

        const containerHeight = topMargin + visibleLayers.length * blockHeight + (visibleLayers.length - 1) * verticalGap + bottomMargin;
        const hours = Array.from({ length: 24 }, (v, i) => i);
        const hourLabels = hours.map(h => h === 6 || h === 12 || h === 18 ? '<div class="timeline-hour">' + this.formatHour(h) + "</div>" : '<div class="timeline-hour"></div>').join("");

        let blockHtml = "";
        let iconHtml = "";

        for (let layerIdx = 0; layerIdx < visibleLayers.length; layerIdx++) {
            const currentLayer = visibleLayers[layerIdx];
            if (!currentLayer?.blocks) continue;

            const top = topMargin + layerIdx * (blockHeight + verticalGap);
            const conditionText = currentLayer.condition_text || "(default)";
            const translatedConditionText = this._translateConditionText(conditionText); // UTILISATION DE LA NOUVELLE FONCTION

            for (let i = 0; i < currentLayer.blocks.length; i++) {
                const block = currentLayer.blocks[i];
                const startMin = this.timeToMinutes(block.start);
                let endMin = this.timeToMinutes(block.end);
                const isDefaultBg = block.is_default_bg || false;

                if (block.end === '00:00' && endMin === 0) endMin = 1440;
                if (block.end === '23:59') endMin = 1439.5;

                let zIndex = block.z_index || 2;
                if (isDefaultBg) zIndex = 1;
                
                const left = startMin / 1440 * 100;
                const width = (endMin - startMin) / 1440 * 100;
                const rawState = block.state_value || "";
                const rawTemplate = block.raw_state_template || rawState;
                const isDynamic = this.isDynamicTemplate(rawTemplate);
                const isScheduleState = this.isScheduleStateSensor(rawTemplate);
                const resolvedState = this.resolveTemplate(rawState);
                const unit = block.unit || unitOfMeasurement || "";
                const stateWithUnit = resolvedState?.trim() ? (unit ? resolvedState + " " + unit : (unitOfMeasurement ? resolvedState + " " + unitOfMeasurement : resolvedState)) : "";
                const colorData = this.getColorForState(resolvedState || "default", unit || unitOfMeasurement);
                const color = colorData.color;
                const textColor = colorData.textColor;

                const wrapsStart = block.wraps_start || false;
                const wrapsEnd = block.wraps_end || false;

                let borderRadius = "4px";
                if (width === 100) {
                    borderRadius = "4px";
                } else if (wrapsStart && !wrapsEnd) {
                    borderRadius = "0 4px 4px 0";
                } else if (!wrapsStart && wrapsEnd) {
                    borderRadius = "4px 0 0 4px";
                }
                
                if (isDefaultBg) {
                    if (width === 100) {
                        borderRadius = "4px";
                    } else if (startMin === 0 && endMin < 1440) {
                        borderRadius = "0 4px 4px 0";
                    } else if (startMin > 0 && endMin === 1440) {
                        borderRadius = "4px 0 0 4px";
                    }
                }

                const originalStart = block.original_start || block.start;
                const originalEnd = block.original_end || block.end;

                let blockClass = "schedule-block";
                if (isDefaultBg) blockClass += " default-block";
                if (isDynamic) blockClass += " dynamic";

                const style = "left:" + left + "%;width:" + width + "%;top:" + top + "px;height:" + blockHeight + "px;z-index:" + zIndex + ";border-radius:" + borderRadius + ";color:" + textColor + ";";
                const containerWidth = this.shadowRoot.querySelector(".timeline-container")?.offsetWidth || 800;
                const bWidthPx = width / 100 * containerWidth;
                const displayText = this.truncateText(stateWithUnit, bWidthPx);
                const escapedState = this.escapeHtml(displayText);

                let dynamicIcon = "";
                if (isDynamic) {
                    const blockIcon = block.icon || 'mdi:calendar';
                    if (blockIcon === 'mdi:refresh') {
                        dynamicIcon = "🔄";
                    } else {
                        dynamicIcon = "";
                    }
                }
                
                const finalText = isDynamic && dynamicIcon ? escapedState + " " + dynamicIcon : escapedState;

                let blockTooltipText = this.t("time_label") + ": ";
                if (wrapsStart || wrapsEnd) {
                    blockTooltipText += originalStart + " - " + originalEnd + " (" + this.t("wrapping") + ")";
                } else {
                    blockTooltipText += block.start + " - " + block.end;
                }
                blockTooltipText += "\n🌡️ " + this.t("state_label") + ": " + this.escapeHtml(resolvedState) + (unit ? " " + unit : "");
                if (isDefaultBg) {
                    blockTooltipText += "\n(" + this.t("default_state_label") + ")";
                }
                if (isDynamic) {
                    const entity = this.extractEntityFromTemplate(rawTemplate);
                    const blockIcon = block.icon || 'mdi:calendar';
                    
                    let refText = "";
                    if (blockIcon === 'mdi:refresh') {
                        refText = entity ? " (" + this.t("dynamic_ref_schedule") + ": " + entity + ")" : "";
                        blockTooltipText += "\n🔄 " + this.t("dynamic_value") + refText;
                    } else {
                        refText = entity ? " (" + this.t("dynamic_ref_sensor") + ": " + entity + ")" : "";
                        blockTooltipText += "\n📊 " + this.t("dynamic_value") + refText;
                    }
                }
                if (block.description) {
                    blockTooltipText += "\n💬 " + this.escapeHtml(block.description);
                }

                blockHtml += '<div class="' + blockClass + '" style="' + style + "background-color:" + color + ';" data-tooltip="' + this.escapeHtml(blockTooltipText) + '"><span class="block-center">' + finalText + "</span></div>";
            }

            const firstBlock = currentLayer.blocks?.[0];
            if (firstBlock) {
                const isActive = layerActiveStates[layerIdx];
                const iconStyle = isActive ? "background:var(--primary-color);filter:brightness(1.3);" : "background:var(--secondary-text-color);opacity:0.5;";
                let iconTooltipText = this.t("layer_label") + " " + (layerIdx);
                if (currentLayer.is_default_layer) {
                    iconTooltipText = this.t("layer_label") + " 0";
                    if (conditionText && conditionText !== "default") { 
                        // UTILISATION DE LA CHAÎNE TRADUITE POUR L'INFOBULLE
                        iconTooltipText += "\n✔️ " + this.t("condition_label") + ": " + translatedConditionText;
                    } else {
                        iconTooltipText += "\n" + this.t("default_state_label");
                    }
                } else {
                    if (conditionText && conditionText !== "default") { 
                        // UTILISATION DE LA CHAÎNE TRADUITE POUR L'INFOBULLE
                        iconTooltipText += "\n✔️ " + this.t("condition_label") + ": " + translatedConditionText;
                    } else {
                        iconTooltipText += "\n" + this.t("no_specific_condition");
                    }
                }

                const displayLayerIndex = currentLayer.is_default_layer ? "0" : (layerIdx);
                iconHtml += '<div class="icon-row" style="top:' + top + 'px;" data-tooltip="' + this.escapeHtml(iconTooltipText) + '" data-layer-index="' + displayLayerIndex + '"><span class="layer-number" style="' + iconStyle + '">' + displayLayerIndex + "</span></div>";
            }
        }

        return '<div class="room-timeline"><div class="room-header">' + (roomIcon ? '<ha-icon icon="' + roomIcon + '"></ha-icon>' : "") + '<span class="room-name">' + roomName + '</span></div><div class="timeline-wrapper"><div class="icon-column" style="width:' + iconColumnWidth + "px;height:" + containerHeight + 'px;position:relative;">' + iconHtml + '</div><div class="timeline-container" style="height:' + containerHeight + 'px;flex:1;"><div class="timeline-grid">' + hourLabels + '</div><div class="blocks-container" style="position:relative;height:' + containerHeight + 'px;">' + blockHtml + '</div></div></div></div>';
    }

    updateContent() {
        if (!this._hass) return;
        const content = this.shadowRoot.querySelector("#content");
        if (!content) return;
        let timelines = "";
        for (let i = 0; i < this._config.entities.length; i++) {
            const entityConfig = this._config.entities[i];
            const entityId = typeof entityConfig === "string" ? entityConfig : entityConfig.entity;
            if (!entityId) continue;
            const state = this._hass.states[entityId];
            if (!state) {
                timelines += this.renderErrorCard(entityId, this.t("entity_not_found"));
                continue;
            }
            const attrs = state.attributes || {};
            const layers = attrs.layers || {};
            const customName = typeof entityConfig === "object" ? entityConfig.name : null;
            const customIcon = typeof entityConfig === "object" ? entityConfig.icon : null;
            const roomName = customName || attrs.room || attrs.friendly_name || entityId;
            const roomIcon = customIcon || attrs.icon || "mdi:thermometer";
            const unitOfMeasurement = attrs.unit_of_measurement || "";
            const dayLayers = layers[this.selectedDay] || [];
            timelines += this.renderTimeline(roomName, roomIcon, dayLayers, unitOfMeasurement);
        }
        content.innerHTML = '<div class="schedules-container">' + timelines + "</div>";
        this.attachBlockTooltips();
        this.updateTimeline();
    }

    attachBlockTooltips() {
        requestAnimationFrame(() => {
            const blocks = this.shadowRoot.querySelectorAll(".schedule-block");
            const iconRows = this.shadowRoot.querySelectorAll(".icon-row");
            blocks.forEach(block => {
                block.addEventListener("mouseenter", e => {
                    const tooltip = e.currentTarget.dataset.tooltip;
                    if (tooltip) this.showTooltip(e, tooltip);
                });
                block.addEventListener("mouseleave", () => this.hideTooltip());
            });
            iconRows.forEach(row => {
                row.addEventListener("mouseenter", e => {
                    const tooltip = e.currentTarget.dataset.tooltip;
                    if (tooltip) this.showTooltip(e, tooltip);
                });
                row.addEventListener("mouseleave", () => this.hideTooltip());
            });
        });
    }

    render() {
        const days = this.getDays();
        const showTitle = this._config.title?.trim().length > 0;
        const styleContent = `:host{display:block}ha-card{padding:16px}.card-header{display:flex;align-items:center;gap:12px;margin-bottom:16px}.card-header.hidden{display:none}.card-title{font-size:24px;font-weight:bold;margin:0}.day-selector{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}.day-button{padding:8px 16px;border:none;border-radius:8px;background:var(--primary-background-color);color:var(--primary-text-color);cursor:pointer;font-weight:500;transition:all .2s;border:1px solid var(--divider-color)}.day-button:hover{background:var(--secondary-background-color);border-color:var(--primary-color)}.day-button.active{background:var(--primary-color);color:var(--text-primary-color,white);border-color:var(--primary-color)}.schedules-container{display:flex;flex-direction:column;gap:24px}.room-timeline{margin-bottom:12px}.room-header{display:flex;align-items:center;gap:8px;padding:0 8px}.room-name{font-weight:600;font-size:14px;color:var(--primary-text-color)}.timeline-wrapper{display:flex;gap:0;align-items:stretch}.icon-column{position:relative;width:28px;flex-shrink:0;display:flex;flex-direction:column;z-index:0}.icon-row{position:absolute;display:flex;align-items:center;justify-content:center;cursor:help;width:100%;height:20px;transition:all .2s;top:0;margin-top:6px;z-index:3}.icon-row:hover .layer-number{filter:brightness(1.3)!important}.layer-number{width:24px;height:24px;color:white;border-radius:50%;font-size:11px;font-weight:bold;display:flex;align-items:center;justify-content:center;transition:all .2s}.timeline-container{position:relative;background:var(--secondary-background-color);border-radius:8px;border:1px solid var(--divider-color);overflow:visible;padding:4px;flex:1}.timeline-grid{position:absolute;inset:0;display:flex;pointer-events:none;z-index:0}.blocks-container{position:absolute;inset:0;overflow:visible}.timeline-hour{position:relative;flex:1;border-right:1px solid var(--secondary-text-color);opacity:.4;font-size:11px;color:var(--secondary-text-color);display:flex;align-items:flex-end;justify-content:center;font-weight:600;padding-bottom:4px}.timeline-hour:empty{font-size:0}.timeline-hour:last-child{border-right:none}.schedule-block{position:absolute;display:flex;align-items:center;justify-content:center;color:white;font-weight:500;box-shadow:0 1px 3px rgba(0,0,0,.3);cursor:help;text-align:center;font-size:12px;overflow:hidden;z-index:2}.schedule-block.default-block{background-image:repeating-linear-gradient(45deg,transparent,transparent 6px,rgba(0,0,0,0.15) 6px,rgba(0,0,0,0.15) 12px)!important;color:white;font-weight:500}.block-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);max-width:95%;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.no-schedule{font-size:14px;color:var(--secondary-text-color);text-align:center;padding:12px 0}.time-cursor{position:absolute;top:0;bottom:0;width:2px;background-color:var(--label-badge-yellow);z-index:10}`;
        const htmlContent = '<ha-card><div class="card-header' + (showTitle ? "" : " hidden") + '"><div class="card-title">' + (this._config.title || "") + '</div></div><div class="day-selector">' + days.map(day => '<button class="day-button' + (day.id === this.selectedDay ? " active" : "") + '" data-day="' + day.id + '">' + day.label + "</button>").join("") + '</div><div id="content"></div></ha-card>';
        this.shadowRoot.innerHTML = '<style>' + styleContent + "</style>" + htmlContent;
        this.updateContent();
        this.startTimelineUpdate();
        
        requestAnimationFrame(() => {
            const dayButtons = this.shadowRoot.querySelectorAll(".day-button");
            dayButtons.forEach(button => {
                button.addEventListener("click", e => {
                    const newDay = e.target.dataset.day;
                    if (newDay !== this.selectedDay) {
                        this.selectedDay = newDay;
                        this.render();
                    }
                });
            });
        });
    }

    connectedCallback() {
        this.startTimelineUpdate();
    }

    disconnectedCallback() {
        this.stopTimelineUpdate();
        if (this.tooltipElement) {
            this.tooltipElement.remove();
            this.tooltipElement = null;
        }
    }
}

class ScheduleStateCardEditor extends HTMLElement {
    setConfig(config) {
        this._config = config;
    }

    render() {
        if (!this.shadowRoot) {
            this.attachShadow({ mode: "open" });
            this.shadowRoot.innerHTML = '<style>.config-row{margin-bottom:10px}.config-row label{font-weight:bold;display:block;margin-bottom:5px}.config-row input{width:100%;padding:8px;border:1px solid var(--divider-color);border-radius:4px;background:var(--primary-background-color);color:var(--primary-text-color);box-sizing:border-box}</style><div class="config-row"><label>Title (leave empty to hide)</label><input id="title" value="' + (this._config?.title || "") + '" placeholder="Schedule Planning"/></div><div class="config-row"><label>Entities (use YAML editor)</label><div style="font-size:12px;color:var(--secondary-text-color)">Edit your configuration in YAML</div></div>';
            const titleInput = this.shadowRoot.querySelector("#title");
            if (titleInput) {
                titleInput.addEventListener("change", e => {
                    this._config.title = e.target.value;
                    this.dispatchEvent(new CustomEvent("config-changed", {
                        detail: { config: this._config }
                    }));
                });
            }
        }
    }

    set hass(hass) {
        this._hass = hass;
        this.render();
    }
}

customElements.define("schedule-state-card", ScheduleStateCard);
customElements.define("schedule-state-card-editor", ScheduleStateCardEditor);
console.info("%c Schedule State Card %c v3.9.18 - Code épuré et optimisé - CORRIGÉ (Traduction des conditions + Ponctuation) %c", "background:#2196F3;color:white;padding:2px 8px;border-radius:3px 0 0 3px;font-weight:bold", "background:#4CAF50;color:white;padding:2px 8px;border-radius:0 3px 3px 0", "background:none");
window.customCards = window.customCards || [];
window.customCards.push({
    type: "schedule-state-card",
    name: "Schedule State Card",
    description: "Visualizes schedules defined via AppDaemon schedule_parser."
});