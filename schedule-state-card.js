const TRANSLATIONS = {
    en: {
        state_label: "State",
        condition_label: "Condition",
        layer_label: "Schedule Rule", 
        time_label: "Time Slots",     
        no_specific_condition: "No specific condition",
        default_state_label: "Default state",
        wrapping: "wrapping",
        no_schedule: "No schedule",
        entity_not_found: "Entity not found",
        dynamic_value: "Dynamic value",
        dynamic_ref_schedule: "schedule_state",
        dynamic_ref_sensor: "sensor",
        cond_days: "Days",
        cond_month: "Month",
        cond_and: "AND",
        cond_or: "OR",
        cond_not: "NOT",
        cond_sunrise: "Sunrise",
        cond_sunset: "Sunset",
        cond_combined_result: "Combined Schedule", 
        cond_combined_schedule_toggle: "Combined Schedule Result (Click to show/hide rules)",
        cond_after: "after",
        cond_before: "before", 
        days: {
            mon: "Monday",
            tue: "Tuesday",
            wed: "Wednesday",
            thu: "Thursday",
            fri: "Friday",
            sat: "Saturday",
            sun: "Sunday"
        },
        editor_title: "Schedule State Card Editor",
        editor_card_title: "Card Title",
        editor_entities_label: "Entities",
        editor_add_entity: "Add Entity",
        editor_entity_id_label: "Entity ID",
        editor_name_label: "Name",
        editor_icon_label: "Icon (mdi:)",
        editor_placeholder_name: "Display Name",
        editor_handle: "Handle",
        editor_actions: "Actions",
        editor_default_entity_name: "Entity",
        editor_no_entities: "No entities",
        editor_title_placeholder: "Schedule Planning",
        editor_no_entities_found: "No entities found",
        editor_colors_label: "Colors Configuration",
        editor_active_layer_label: "Active Layer Color",
        editor_inactive_layer_label: "Inactive Layer Color",
        editor_combined_folded_label: "Combined Icon Color (Folded)",
        editor_combined_unfolded_label: "Combined Icon Color (Unfolded)",
        editor_cursor_label: "Time Cursor Color",
        editor_color_hex_label: "Hex Color",
        editor_color_picker_label: "Color Picker",
        editor_show_state_in_title: "Show state value in header",
        common: {
            edit: "Edit",
            delete: "Delete"
        }
    },
    fr: {
        state_label: "État",
        condition_label: "Condition",
        layer_label: "Règle de planning", 
        time_label: "Plages horaires",    
        no_specific_condition: "Aucune condition spécifique",
        default_state_label: "État par défaut",
        wrapping: "débordement",
        no_schedule: "Pas de planning",
        entity_not_found: "Entité non trouvée",
        dynamic_value: "Valeur dynamique",
        dynamic_ref_schedule: "état_planning",
        dynamic_ref_sensor: "capteur",
        cond_days: "Jours",
        cond_month: "Mois",
        cond_and: "ET",
        cond_or: "OU",
        cond_not: "NON",
        cond_sunrise: "Lever du soleil",
        cond_sunset: "Coucher du soleil",
        cond_combined_result: "Planning Combiné", 
        cond_combined_schedule_toggle: "Résultat du Planning Combiné (Cliquez pour afficher/masquer les règles)",
        cond_after: "après",
        cond_before: "avant",
        days: {
            mon: "Lundi",
            tue: "Mardi",
            wed: "Mercredi",
            thu: "Jeudi",
            fri: "Vendredi",
            sat: "Samedi",
            sun: "Dimanche"
        },
        editor_title: "Éditeur de Carte d'État de Planning",
        editor_card_title: "Titre de la Carte",
        editor_entities_label: "Entités",
        editor_add_entity: "Ajouter une Entité",
        editor_entity_id_label: "ID d'Entité",
        editor_name_label: "Nom",
        editor_icon_label: "Icône (mdi:)",
        editor_placeholder_name: "Nom d'affichage",
        editor_handle: "Poignée",
        editor_actions: "Actions",
        editor_default_entity_name: "Entité",
        editor_no_entities: "Aucune entité",
        editor_title_placeholder: "Planning d'Horaires",
        editor_no_entities_found: "Aucune entité trouvée",
        editor_colors_label: "Configuration des Couleurs",
        editor_active_layer_label: "Couleur de la Couche Active",
        editor_inactive_layer_label: "Couleur de la Couche Inactive",
        editor_combined_folded_label: "Couleur de l'Icône Combinée (Pliée)",
        editor_combined_unfolded_label: "Couleur de l'Icône Combinée (Dépliée)",
        editor_cursor_label: "Couleur du Curseur Temporel",
        editor_color_hex_label: "Couleur Hex",
        editor_color_picker_label: "Sélecteur de Couleur",
        editor_show_state_in_title: "Afficher la valeur d'état dans l'en-tête",
        common: {
            edit: "Éditer",
            delete: "Supprimer"
        }
    },
    de: {
        state_label: "Status",
        condition_label: "Bedingung",
        layer_label: "Zeitplanregel", 
        time_label: "Zeitfenster",     
        no_specific_condition: "Keine spezifische Bedingung",
        default_state_label: "Standardstatus",
        wrapping: "Überlauf",
        no_schedule: "Kein Zeitplan",
        entity_not_found: "Entität nicht gefunden",
        dynamic_value: "Dynamischer Wert",
        dynamic_ref_schedule: "Zeitplan-Status",
        dynamic_ref_sensor: "Sensor",
        cond_days: "Tage",
        cond_month: "Monat",
        cond_and: "UND",
        cond_or: "ODER",
        cond_not: "NICHT", 
        cond_sunrise: "Sonnenaufgang",
        cond_sunset: "Sonnenuntergang",
        cond_combined_result: "Kombinierter Zeitplan", 
        cond_combined_schedule_toggle: "Ergebnis des kombinierten Zeitplans (Klicken zum Anzeigen/Ausblenden der Regeln)",
        cond_after: "nach",
        cond_before: "vor",
        days: {
            mon: "Montag",
            tue: "Dienstag",
            wed: "Mittwoch",
            thu: "Donnerstag",
            fri: "Freitag",
            sat: "Samstag",
            sun: "Sonntag"
        },
        editor_title: "Zeitplan-Status-Karten-Editor",
        editor_card_title: "Kartentitel",
        editor_entities_label: "Entitäten",
        editor_add_entity: "Entität hinzufügen",
        editor_entity_id_label: "Entitäts-ID",
        editor_name_label: "Name",
        editor_icon_label: "Icon (mdi:)",
        editor_placeholder_name: "Anzeigename",
        editor_handle: "Griff",
        editor_actions: "Aktionen",
        editor_default_entity_name: "Entität",
        editor_no_entities: "Keine Entitäten",
        editor_title_placeholder: "Zeitplan-Planung",
        editor_no_entities_found: "Keine Entitäten gefunden",
        editor_colors_label: "Farbkonfiguration",
        editor_active_layer_label: "Farbe der aktiven Schicht",
        editor_inactive_layer_label: "Farbe der inaktiven Schicht",
        editor_combined_folded_label: "Kombinierte Symbolfarbe (Zusammengeklappt)",
        editor_combined_unfolded_label: "Kombinierte Symbolfarbe (Erweitert)",
        editor_cursor_label: "Zeitzeiger-Farbe",
        editor_color_hex_label: "Hex-Farbe",
        editor_color_picker_label: "Farbwähler",
        editor_show_state_in_title: "Zustandswert in der Kopfzeile anzeigen",
        common: {
            edit: "Bearbeiten",
            delete: "Löschen"
        }
    },
    es: {
        state_label: "Estado",
        condition_label: "Condición",
        layer_label: "Regla de horario", 
        time_label: "Intervalos",
        no_specific_condition: "Sin condición específica",
        default_state_label: "Estado por defecto",
        wrapping: "desbordamiento",
        no_schedule: "Sin horario",
        entity_not_found: "Entidad no encontrada",
        dynamic_value: "Valor dinámico",
        dynamic_ref_schedule: "estado_horario",
        dynamic_ref_sensor: "sensor",
        cond_days: "Días",
        cond_month: "Mes",
        cond_and: "Y",
        cond_or: "O",
        cond_not: "NO",
        cond_sunrise: "Amanecer",
        cond_sunset: "Atardecer",
        cond_combined_result: "Horario Combinado", 
        cond_combined_schedule_toggle: "Resultado del Horario Combinado (Clic para mostrar/ocultar reglas)",
        cond_after: "después de",
        cond_before: "antes de",
        days: {
            mon: "Lunes",
            tue: "Martes",
            wed: "Miércoles",
            thu: "Jueves",
            fri: "Viernes",
            sat: "Sábado",
            sun: "Domingo"
        },
        editor_title: "Editor de Tarjeta de Estado de Horario",
        editor_card_title: "Título de la Tarjeta",
        editor_entities_label: "Entidades",
        editor_add_entity: "Añadir Entidad",
        editor_entity_id_label: "ID de Entidad",
        editor_name_label: "Nombre",
        editor_icon_label: "Icono (mdi:)",
        editor_placeholder_name: "Nombre de visualización",
        editor_handle: "Mango",
        editor_actions: "Acciones",
        editor_default_entity_name: "Entidad",
        editor_no_entities: "Sin entidades",
        editor_title_placeholder: "Planificación de Horarios",
        editor_no_entities_found: "No se encontraron entidades",
        editor_colors_label: "Configuración de Colores",
        editor_active_layer_label: "Color de Capa Activa",
        editor_inactive_layer_label: "Color de Capa Inactiva",
        editor_combined_folded_label: "Color del Icono Combinado (Plegado)",
        editor_combined_unfolded_label: "Color del Icono Combinado (Expandido)",
        editor_cursor_label: "Color del Cursor Temporal",
        editor_color_hex_label: "Color Hex",
        editor_color_picker_label: "Selector de Color",
        editor_show_state_in_title: "Mostrar valor de estado en el encabezado",
        common: {
            edit: "Editar",
            delete: "Eliminar"
        }
    },
    pt: {
        state_label: "Estado",
        condition_label: "Condição",
        layer_label: "Regra de Agenda",
        time_label: "Intervalos de Tempo",
        no_specific_condition: "Sem condição específica",
        default_state_label: "Estado padrão",
        wrapping: "empacotamento",
        no_schedule: "Sem agenda",
        entity_not_found: "Entidade não encontrada",
        dynamic_value: "Valor dinâmico",
        dynamic_ref_schedule: "estado_agenda",
        dynamic_ref_sensor: "sensor",
        cond_days: "Dias",
        cond_month: "Mês",
        cond_and: "E",
        cond_or: "OU",
        cond_not: "NÃO",
        cond_sunrise: "Nascer do sol",
        cond_sunset: "Pôr do sol",
        cond_combined_result: "Agenda Combinada",
        cond_combined_schedule_toggle: "Resultado da Agenda Combinada (Clique para mostrar/ocultar regras)",
        cond_after: "después de",
        cond_before: "antes de",
        days: {
            mon: "Segunda-feira",
            tue: "Terça-feira",
            wed: "Quarta-feira",
            thu: "Quinta-feira",
            fri: "Sexta-feira",
            sat: "Sábado",
            sun: "Domingo"
        },
        editor_title: "Editor do Cartão de Estado da Agenda",
        editor_card_title: "Título do Cartão",
        editor_entities_label: "Entidades",
        editor_add_entity: "Adicionar Entidade",
        editor_entity_id_label: "ID da Entidade",
        editor_name_label: "Nome",
        editor_icon_label: "Ícone (mdi:)",
        editor_placeholder_name: "Nome de Exibição",
        editor_handle: "Manipulador",
        editor_actions: "Ações",
        editor_default_entity_name: "Entidade",
        editor_no_entities: "Sem entidades",
        editor_title_placeholder: "Planejamento de Agenda",
        editor_no_entities_found: "Nenhuma entidade encontrada",
        editor_colors_label: "Configuração de Cores",
        editor_active_layer_label: "Cor da Camada Ativa",
        editor_inactive_layer_label: "Cor da Camada Inativa",
        editor_combined_folded_label: "Combined Icon Color (Folded)",
        editor_combined_unfolded_label: "Combined Icon Color (Unfolded)",
        editor_cursor_label: "Cor do Cursor Temporal",
        editor_color_hex_label: "Cor Hex",
        editor_color_picker_label: "Seletor de Cor",
        editor_show_state_in_title: "Mostrar valor de estado no cabeçalho",
        common: {
            edit: "Editar",
            delete: "Excluir"
        }
    },
    pt_BR: {
        state_label: "Estado",
        condition_label: "Condição",
        layer_label: "Regra de Programação",
        time_label: "Períodos de Tempo",
        no_specific_condition: "Sem condição específica",
        default_state_label: "Estado padrão",
        wrapping: "empacotamento",
        no_schedule: "Sem programação",
        entity_not_found: "Entidade não encontrada",
        dynamic_value: "Valor dinâmico",
        dynamic_ref_schedule: "estado_programação",
        dynamic_ref_sensor: "sensor",
        cond_days: "Dias",
        cond_month: "Mês",
        cond_and: "E",
        cond_or: "OU",
        cond_not: "NÃO",
        cond_sunrise: "Nascer do sol",
        cond_sunset: "Pôr do sol",
        cond_combined_result: "Programação Combinada",
        cond_combined_schedule_toggle: "Resultado da Programação Combinada (Clique para mostrar/ocultar regras)",
        cond_after: "após",
        cond_before: "antes de",
        days: {
            mon: "Segunda-feira",
            tue: "Terça-feira",
            wed: "Quarta-feira",
            thu: "Quinta-feira",
            fri: "Sexta-feira",
            sat: "Sábado",
            sun: "Domingo"
        },
        editor_title: "Editor do Cartão de Estado da Programação",
        editor_card_title: "Título do Cartão",
        editor_entities_label: "Entidades",
        editor_add_entity: "Adicionar Entidade",
        editor_entity_id_label: "ID da Entidade",
        editor_name_label: "Nome",
        editor_icon_label: "Ícone (mdi:)",
        editor_placeholder_name: "Nome de Exibição",
        editor_handle: "Manipulador",
        editor_actions: "Ações",
        editor_default_entity_name: "Entidade",
        editor_no_entities: "Nenhuma entidade",
        editor_title_placeholder: "Planejamento de Programação",
        editor_no_entities_found: "Nenhuma entidade encontrada",
        editor_colors_label: "Configuração de Cores",
        editor_active_layer_label: "Cor da Camada Ativa",
        editor_inactive_layer_label: "Cor da Camada Inativa",
        editor_combined_folded_label: "Combined Icon Color (Folded)",
        editor_combined_unfolded_label: "Combined Icon Color (Unfolded)",
        editor_cursor_label: "Cor do Cursor Temporal",
        editor_color_hex_label: "Cor Hex",
        editor_color_picker_label: "Seletor de Cor",
        editor_show_state_in_title: "Mostrar valor de estado no cabeçalho",
        common: {
            edit: "Editar",
            delete: "Excluir"
        }
    }
};

const DEFAULT_COLORS = {
    active_layer: "var(--primary-color, #2196F3)",
    inactive_layer: "var(--secondary-text-color, #BDBDBD)",
    combined_folded_layer: "var(--warning-color, #FF9800)",
    combined_unfolded_layer: "var(--primary-color, #2196F3)",
    cursor: "var(--label-badge-yellow, #FDD835)"
};

class ScheduleStateCard extends HTMLElement {
    static get BLOCK_HEIGHT() { return 20; }
    static get VERTICAL_GAP() { return 8; }
    static get TOP_MARGIN() { return 4; }
    static get BOTTOM_MARGIN() { return 20; }
    static get ICON_COLUMN_WIDTH() { return 28; }
    static get MOUSE_STABILIZATION_DELAY() { return 200; }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._config = {};
        this._hass = null;
        this.currentTime = this.getCurrentTime();
        this.selectedDay = this.currentTime.day;
        this.updateInterval = null;
        this.tooltipElement = null;
        this._layerVisibility = {};
        this._listener = null; 
        this._tooltipTimer = null; 
        this._isToggling = false;
        this._colors = { ...DEFAULT_COLORS };
        this._lastUpdateTime = 0;
        this._updateDebounceTimer = null;
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
    
    _translateConditionText(text) {
        if (!text) return "";
        let translated = text;
        const dayAbbrs = { "Mon": "mon", "Tue": "tue", "Wed": "wed", "Thu": "thu", "Fri": "fri", "Sat": "sat", "Sun": "sun" };
        const dayTranslations = this.t("days");
        
        // Translate Days: and Month: labels
        translated = translated.replace(/\bDays:/g, this.t("cond_days") + ":");
        translated = translated.replace(/\bMonth:/g, this.t("cond_month") + ":");
        
        // Translate AND/OR/NOT operators
        translated = translated.replace(/\sAND\s/g, ` ${this.t("cond_and")} `);
        translated = translated.replace(/\sOR\s/g, ` ${this.t("cond_or")} `);
        translated = translated.replace(/\bNOT\s+\(/g, `${this.t("cond_not")} (`);
        
        // Translate Sunrise/Sunset conditions BEFORE translating days
        // Use word boundaries to avoid matching "Sun" in "Sunday"
        translated = translated.replace(/\bSunrise\s+condition\b/g, this.t("cond_sunrise"));
        translated = translated.replace(/\bSunset\s+condition\b/g, this.t("cond_sunset"));
        translated = translated.replace(/\bSunrise\s+after\s+/g, this.t("cond_sunrise") + " " + this.t("cond_after") + " ");
        translated = translated.replace(/\bSunrise\s+before\s+/g, this.t("cond_sunrise") + " " + this.t("cond_before") + " ");
        translated = translated.replace(/\bSunset\s+after\s+/g, this.t("cond_sunset") + " " + this.t("cond_after") + " ");
        translated = translated.replace(/\bSunset\s+before\s+/g, this.t("cond_sunset") + " " + this.t("cond_before") + " ");
        translated = translated.replace(/\bSunrise\s+>/g, this.t("cond_sunrise") + " >");
        translated = translated.replace(/\bSunrise\s+</g, this.t("cond_sunrise") + " <");
        translated = translated.replace(/\bSunset\s+>/g, this.t("cond_sunset") + " >");
        translated = translated.replace(/\bSunset\s+</g, this.t("cond_sunset") + " <");
        
        // Translate day abbreviations (after Sunrise/Sunset to avoid conflict with "Sun")
        for (const [abbr, fullDayKey] of Object.entries(dayAbbrs)) {
            const translatedDay = dayTranslations[fullDayKey];
            if (translatedDay) {
                // Use word boundary at the start to avoid matching "Sun" in "Sunrise"/"Sunset"
                translated = translated.replace(new RegExp(`\\b${abbr}\\b`, 'g'), translatedDay);
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
            entities: Array.isArray(entities) ? entities.map(e => typeof e === "string" ? { entity: e } : e) : [],
            show_state_in_title: config.show_state_in_title !== false // true by default
        };
        
        if (config.colors) {
            this._colors = { ...DEFAULT_COLORS, ...config.colors };
        } else {
            this._colors = { ...DEFAULT_COLORS };
        }
        
        if (this._hass) this.render();
    }

    set hass(hass) {
        this._hass = hass;
        if (this._config?.entities && !this.shadowRoot.querySelector("ha-card")) {
            this.render();
        }
        
        // Debounce updates to prevent excessive re-renders (SOLUTION 2)
        const now = Date.now();
        if (now - this._lastUpdateTime < 500) {
            // If too soon, schedule update after delay
            if (this._updateDebounceTimer) clearTimeout(this._updateDebounceTimer);
            this._updateDebounceTimer = setTimeout(() => {
                this.updateContent();
                this._lastUpdateTime = Date.now();
            }, 500);
        } else {
            // If enough time has passed, update immediately
            this.updateContent();
            this._lastUpdateTime = now;
        }
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
            title: "Schedule Planning",
            colors: { ...DEFAULT_COLORS }
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
        const dayMap = ["sun","mon", "tue", "wed", "thu", "fri", "sat"];
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
            cursor.style.backgroundColor = this._colors.cursor;
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
        let valueStr = String(stateValue === null || stateValue === undefined ? "" : stateValue).trim();
        const numMatch = valueStr.match(/^[\d.]+/);
        if (numMatch) valueStr = String(parseFloat(numMatch[0]));
        
        const unitStr = String(unit === null || unit === undefined ? "" : unit).trim();

        let str;
        if (unitStr) {
            if (valueStr) {
                str = `V:${valueStr}|U:${unitStr}`; 
            } else {
                str = `V:${unitStr}|U:${unitStr}`;
            }
        } else {
            if (valueStr) {
                str = `V:${valueStr}`;
            } else {
                str = "";
            }
        }

        let hash = 2166136261;
        const prime = 16777619;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = (hash * prime) >>> 0;
        }

        hash = (hash ^ (hash >>> 16)) >>> 0;
        hash = (Math.imul(hash, 0x85ebca6b)) >>> 0;
        hash = (hash ^ (hash >>> 13)) >>> 0;
        hash = (Math.imul(hash, 0xc2b2ae35)) >>> 0;
        hash = (hash ^ (hash >>> 16)) >>> 0;

        const goldenAngle = 137.507764;
        const hueOffset = hash * 0.1;
        const hue = ((hash * goldenAngle) + hueOffset) % 360; 
        
        const sat = 50 + (hash % 40); 
        const light = 35 + ((hash >>> 8) % 30); 

        const hsl = `hsl(${hue.toFixed(1)}, ${sat}%, ${light}%)`;
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
        // Don't evaluate default layers
        if (layer.is_default_layer) return false;
        // Don't evaluate combined layers themselves
        if (layer.is_combined_layer) return false;
        // If no blocks, consider it active
        if (!layer?.blocks?.length) return true;
        
        // Collect all conditions from all blocks in this layer
        let allConditions = [];
        for (const block of layer.blocks) {
            if (block.raw_conditions?.length) {
                allConditions = allConditions.concat(block.raw_conditions);
            }
        }
        // If no conditions, the layer is active
        if (allConditions.length === 0) return true;
        
        // Remove duplicate conditions
        const conditionStrings = new Set();
        const uniqueConditions = [];
        for (const cond of allConditions) {
            const condStr = JSON.stringify(cond);
            if (!conditionStrings.has(condStr)) {
                conditionStrings.add(condStr);
                uniqueConditions.push(cond);
            }
        }
        
        // All conditions must be met for the layer to be active (AND logic)
        for (const cond of uniqueConditions) {
            // Evaluate all conditions - treating selected day as the "current day" for condition evaluation
            if (!this._evaluateCondition(cond)) return false; 
        }
        return true;
    }

    _evaluateCondition(condition) {
        if (!condition || typeof condition !== "object") return true;
        const condType = condition.condition;
        
        if (condType === "time") {
            // Get selected day's date context (use selectedDay instead of current day)
            const today = new Date();
            const currentMonth = today.getMonth() + 1;
            
            // Use selectedDay as the reference day for evaluation
            const selectedDayValue = this.selectedDay;
            
            // Check month condition if specified
            if (condition.month !== undefined && condition.month !== null) {
                const months = condition.month;
                if (Array.isArray(months)) {
                    if (!months.includes(currentMonth)) return false;
                } else if (typeof months === "number") {
                    if (currentMonth !== months) return false;
                }
            }
            
            // Check weekday condition if specified - now using selectedDay
            if (condition.weekday !== undefined && condition.weekday !== null) {
                const weekdays = condition.weekday;
                if (Array.isArray(weekdays)) {
                    // Condition applies only to specific days of the week
                    if (!weekdays.includes(selectedDayValue)) return false;
                }
            }

            // If we reach here, all specified conditions matched
            return true;
        }
        
        if (condType === "state") {
            const entityId = condition.entity_id;
            // Handle case where entity_id is an array
            const entities = Array.isArray(entityId) ? entityId : [entityId];
            
            // If match: all, all entities must match the state
            if (condition.match === "all") {
                return entities.every(id => {
                    const entity = this._hass.states[id];
                    if (!entity) return false;
                    return entity.state === condition.state;
                });
            }
            
            // Otherwise (match: any or no match specified), at least one entity must match
            return entities.some(id => {
                const entity = this._hass.states[id];
                if (!entity) return false;
                return entity.state === condition.state;
            });
        }
        
        if (condType === "numeric_state") {
            const entityId = condition.entity_id;
            // Handle case where entity_id is an array
            const entities = Array.isArray(entityId) ? entityId : [entityId];
            
            // For numeric_state, test each entity
            return entities.some(id => {
                const entity = this._hass.states[id];
                if (!entity) return false;
                const value = parseFloat(entity.state);
                if (isNaN(value)) return false;
                
                if (condition.above !== undefined && value <= condition.above) return false;
                if (condition.below !== undefined && value >= condition.below) return false;
                
                return true;
            });
        }
        
        if (condType === "or") {
            // OR condition: at least one sub-condition must be true
            if (!condition.conditions || !Array.isArray(condition.conditions)) return true;
            return condition.conditions.some(subCond => this._evaluateCondition(subCond));
        }
        
        if (condType === "and") {
            // AND condition: all sub-conditions must be true
            if (!condition.conditions || !Array.isArray(condition.conditions)) return true;
            return condition.conditions.every(subCond => this._evaluateCondition(subCond));
        }
        
        if (condType === "not") {
            // NOT condition: inverts the result of the sub-condition
            if (!condition.conditions || !Array.isArray(condition.conditions)) return true;
            return !this._evaluateCondition(condition.conditions[0]);
        }
        
        return true;
    }
    
    createCombinedLayer(defaultLayer, activeConditionalLayers) {
        if (!defaultLayer) return null;
        
        let result = [];
        
        // Get selected day for filtering day-specific conditions (instead of current day)
        const selectedDayValue = this.selectedDay;
        
        // Collect blocks from ALL active conditional layers
        for (const activeLayer of activeConditionalLayers) {
            if (!activeLayer.blocks) continue;
            
            for (const activeBlock of activeLayer.blocks) {
                // Check if block has day-specific conditions that EXCLUDE the selected day
                let blockAppliesToday = true;
                
                if (activeBlock.raw_conditions && activeBlock.raw_conditions.length > 0) {
                    for (const cond of activeBlock.raw_conditions) {
                        if (cond.condition === "time" && cond.weekday && Array.isArray(cond.weekday)) {
                            // This block has a weekday restriction
                            if (!cond.weekday.includes(selectedDayValue)) {
                                // Block does NOT apply to selected day
                                blockAppliesToday = false;
                                break;
                            }
                            // If it DOES include selected day, continue (blockAppliesToday stays true)
                        }
                    }
                }
                
                // Add block if it applies to selected day
                if (blockAppliesToday) {
                    result.push({...activeBlock, _source_layer: activeLayer});
                }
            }
        }
        
        // Add default layer blocks at the end (they have lowest priority)
        if (defaultLayer.blocks) {
            for (const defBlock of defaultLayer.blocks) {
                result.push({...defBlock, _source_layer: defaultLayer});
            }
        }
        
        // Sort by: layer priority (higher first), then start time, then event_idx (higher first)
        result.sort((a, b) => {
            // Get layer index for each block
            const layerIdxA = activeConditionalLayers.indexOf(a._source_layer);
            const layerIdxB = activeConditionalLayers.indexOf(b._source_layer);
            
            // If one is from default layer, it has lowest priority
            const isADefault = a._source_layer === defaultLayer;
            const isBDefault = b._source_layer === defaultLayer;
            
            if (isADefault && !isBDefault) return 1;  // B is conditional, has priority
            if (!isADefault && isBDefault) return -1; // A is conditional, has priority
            
            // If same layer type, sort by start time
            const startA = this.timeToMinutes(a.start);
            const startB = this.timeToMinutes(b.start);
            if (startA !== startB) return startA - startB;
            
            // Same layer and same time, sort by event_idx (higher first)
            const idxA = a.event_idx !== undefined ? a.event_idx : -1;
            const idxB = b.event_idx !== undefined ? b.event_idx : -1;
            return idxB - idxA;
        });
        
        // Now fill gaps with default layer blocks
        result = this._fillGapsWithDefaultLayer(result, defaultLayer, activeConditionalLayers);
        
        return {
            is_combined_layer: true, 
            condition_text: this.t("cond_combined_result"), 
            is_default_layer: false,
            blocks: result,
        };
    }

    _fillGapsWithDefaultLayer(layerBlocks, defaultLayer, activeConditionalLayers) {
            if (!layerBlocks || layerBlocks.length === 0) {
                return (defaultLayer.blocks || []).map(b => ({...b, _source_layer: defaultLayer}));
            }
            
            const result = [];
            const breakpoints = new Set([0, 1440]);
            
            // Collect all breakpoints from conditional layer blocks (excluding default)
            // Including all blocks from all active layers
            for (const layer of activeConditionalLayers) {
                for (const block of layerBlocks) {
                    if (block._source_layer !== layer) continue;
                    
                    const startMin = this.timeToMinutes(block.start);
                    let endMin = this.timeToMinutes(block.end);
                    if (block.end === '00:00' && endMin === 0) endMin = 1440;
                    breakpoints.add(startMin);
                    breakpoints.add(endMin);
                }
            }
            
            // Collect all breakpoints from default layer
            const defaultBlocks = defaultLayer.blocks || [];
            for (const defBlock of defaultBlocks) {
                const defStart = this.timeToMinutes(defBlock.start);
                let defEnd = this.timeToMinutes(defBlock.end);
                if (defBlock.end === '00:00' && defEnd === 0) defEnd = 1440;
                breakpoints.add(defStart);
                breakpoints.add(defEnd);
            }
            
            const sortedBreakpoints = Array.from(breakpoints).sort((a, b) => a - b);
            
            for (let i = 0; i < sortedBreakpoints.length - 1; i++) {
                const segStart = sortedBreakpoints[i];
                const segEnd = sortedBreakpoints[i + 1];
                
                // Find ALL conditional blocks that cover this segment
                let coveringBlocks = [];
                for (const block of layerBlocks) {
                    if (block._source_layer === defaultLayer) continue;
                    
                    const blockStart = this.timeToMinutes(block.start);
                    let blockEnd = this.timeToMinutes(block.end);
                    if (block.end === '00:00' && blockEnd === 0) blockEnd = 1440;
                    
                    if (blockStart <= segStart && segEnd <= blockEnd) {
                        coveringBlocks.push(block);
                    }
                }
                
                if (coveringBlocks.length > 0) {
                    // Sort by layer priority FIRST (later layer index = higher priority)
                    // Then by event_idx (descending) 
                    coveringBlocks.sort((a, b) => {
                        const layerIdxA = activeConditionalLayers.indexOf(a._source_layer);
                        const layerIdxB = activeConditionalLayers.indexOf(b._source_layer);
                        
                        // Different layers: higher index = higher priority
                        if (layerIdxA !== layerIdxB) {
                            return layerIdxB - layerIdxA;
                        }
                        
                        // Same layer: higher event_idx takes priority
                        const aIdx = a.event_idx !== undefined ? a.event_idx : -1;
                        const bIdx = b.event_idx !== undefined ? b.event_idx : -1;
                        return bIdx - aIdx;
                    });
                    
                    const coveringBlock = coveringBlocks[0];
                    const segStartStr = this._minutesToTime(segStart);
                    const segEndStr = segEnd === 1440 ? '00:00' : this._minutesToTime(segEnd);
                    result.push({
                        ...coveringBlock,
                        start: segStartStr,
                        end: segEndStr,
                        is_default_bg: false  // Conditional blocks are never hatched
                    });
                } else {
                    // No conditional block covers this segment, use default layer
                    for (const defBlock of defaultBlocks) {
                        const defStart = this.timeToMinutes(defBlock.start);
                        let defEnd = this.timeToMinutes(defBlock.end);
                        if (defBlock.end === '00:00' && defEnd === 0) defEnd = 1440;
                        
                        if (defStart <= segStart && segEnd <= defEnd) {
                            const segStartStr = this._minutesToTime(segStart);
                            const segEndStr = segEnd === 1440 ? '00:00' : this._minutesToTime(segEnd);
                            result.push({
                                ...defBlock,
                                start: segStartStr,
                                end: segEndStr,
                                _source_layer: defaultLayer,
                                is_default_bg: true  // Mark as default layer block
                            });
                            break;
                        }
                    }
                }
            }
            
            return result;
        }

    _minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60) % 24;
        const mins = minutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
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
        const textWithNewlines = decoded.replace(/\\n/g, "\n");
        
        // Colorize parentheses by pairs
        const coloredText = this.colorizeParentheses(textWithNewlines);
        this.tooltipElement.innerHTML = coloredText;

        const x = event.clientX;
        const y = event.clientY;
        const tooltipRect = this.tooltipElement.getBoundingClientRect();

        // Vertical position: above the cursor by default
        let top = y - tooltipRect.height - 10;
        if (top < 0) top = y + 25; // If not enough space above, show below

        // Horizontal position: Always to the right of the cursor (15px offset)
        let left = x + 15;

        // Safety check for the RIGHT edge of the screen only
        if (left + tooltipRect.width > window.innerWidth - 10) {
            // If it overflows on the right, push it back 10px from the edge
            left = window.innerWidth - tooltipRect.width - 10;
        }

        this.tooltipElement.style.left = left + "px";
        this.tooltipElement.style.top = top + "px";
        this.tooltipElement.style.transform = "none";
        this.tooltipElement.style.display = "block";
    }

    colorizeParentheses(text) {
        let result = '';
        let depth = 0;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            if (char === '(') {
                // Dynamic color calculation:
                // Rotate the hue by 60 degrees for each depth level
                const hue = (depth * 60) % 360;
                const color = `hsl(${hue}, 80%, 70%)`; // 80% saturation, 70% lightness
                
                result += `<span style="color:${color};font-weight:bold;">(</span>`;
                depth++;
            } else if (char === ')') {
                depth = Math.max(0, depth - 1);
                const hue = (depth * 60) % 360;
                const color = `hsl(${hue}, 80%, 70%)`;
                
                result += `<span style="color:${color};font-weight:bold;">)</span>`;
            } else if (char === '<') {
                result += '&lt;';
            } else if (char === '>') {
                result += '&gt;';
            } else if (char === '&') {
                result += '&amp;';
            } else if (char === '\n') {
                result += '<br>';
            } else {
                result += char;
            }
        }
        
        return result;
    }

    hideTooltip() {
        if (this.tooltipElement) this.tooltipElement.style.display = "none";
    }
    
    toggleLayerVisibility(entityId) {
        if (this._isToggling) return; 
        this._isToggling = true; 
        this._layerVisibility[entityId] = !this._layerVisibility[entityId];
        this.updateContent();
        setTimeout(() => {
            this._isToggling = false;
        }, 300); 
    }

    fireEvent(node, type, detail = {}, options = {}) {
        // Fire custom event using Home Assistant pattern (CSP compliant)
        const event = new Event(type, {
            bubbles: options.bubbles || true,
            cancelable: options.cancelable || true,
            composed: options.composed || true,
        });
        event.detail = detail;
        node.dispatchEvent(event);
    }

    attachAllListeners() {
        const container = this.shadowRoot.querySelector("#content");
        if (!container) return;

        // Remove old event listeners BEFORE adding new ones
        // This prevents duplicate listeners and memory leaks
        if (this._listener) {
            container.removeEventListener("click", this._listener);
            container.removeEventListener("mouseover", this._listener);
            container.removeEventListener("mouseout", this._listener);
            this._listener = null;
        }

        const handler = (e) => {
            // Handle room name click - opens entity info popup
            const roomNameTarget = e.target.closest(".room-name");
            if (e.type === "click" && roomNameTarget) {
                const entityId = roomNameTarget.dataset.entityId;
                if (entityId && this._hass) {
                    this.fireEvent(this, 'hass-more-info', { entityId: entityId });
                }
                e.stopPropagation();
                e.preventDefault();
                return;
            }

            // Handle combined layer toggle
            const toggleTarget = e.target.closest(".combined-layer-toggle");
            if (e.type === "click" && toggleTarget) {
                if (this._tooltipTimer) {
                    clearTimeout(this._tooltipTimer);
                    this._tooltipTimer = null;
                    this.hideTooltip(); 
                }
                
                const entityId = toggleTarget.dataset.entityId;
                if (entityId) {
                    this.toggleLayerVisibility(entityId); 
                }
                e.stopPropagation();
                return;
            }

            // Handle tooltip display on hover
            const tooltipTarget = e.target.closest(".schedule-block, .icon-row[data-tooltip]");
            
            if (e.type === "mouseover" && tooltipTarget) {
                const tooltip = tooltipTarget.dataset.tooltip;
                
                if (this._tooltipTimer) {
                    clearTimeout(this._tooltipTimer);
                    this._tooltipTimer = null;
                }
                
                if (tooltip) {
                    const eventData = { clientX: e.clientX, clientY: e.clientY }; 
                    this._tooltipTimer = setTimeout(() => {
                        this.showTooltip(eventData, tooltip);
                        this._tooltipTimer = null;
                    }, ScheduleStateCard.MOUSE_STABILIZATION_DELAY);
                }
            } else if (e.type === "mouseout") {
                if (this._tooltipTimer) {
                    clearTimeout(this._tooltipTimer);
                    this._tooltipTimer = null;
                }
                setTimeout(() => this.hideTooltip(), 50); 
            }
        };

        // Add new event listeners
        container.addEventListener("click", handler);
        container.addEventListener("mouseover", handler);
        container.addEventListener("mouseout", handler);
        this._listener = handler;
    }

    renderErrorCard(entityId, message) {
        return '<div class="room-timeline"><div class="room-header"><ha-icon icon="mdi:alert-circle"></ha-icon><span class="room-name" data-entity-id="' + entityId + '" style="color:var(--error-color);">' + entityId + '</span></div><div class="timeline-container" style="padding:16px;text-align:center;"><div style="color:var(--secondary-text-color);">' + message + "</div></div></div>";
    }

    renderTimeline(roomName, roomIcon, allLayers, unitOfMeasurement, entityId, entityState) {
        if (!allLayers?.length) {
            return '<div class="room-timeline"><div class="room-header">' + this.renderRoomHeader(roomName, roomIcon, entityState, unitOfMeasurement, entityId) + '</div><div class="timeline-container"><div class="no-schedule">' + this.t("no_schedule") + '</div></div></div>';
        }

        const blockHeight = ScheduleStateCard.BLOCK_HEIGHT;
        const verticalGap = ScheduleStateCard.VERTICAL_GAP;
        const topMargin = ScheduleStateCard.TOP_MARGIN;
        const bottomMargin = ScheduleStateCard.BOTTOM_MARGIN;

        let defaultLayer = allLayers.find(l => l.is_default_layer);
        let combinedLayer = allLayers.find(l => l.is_combined_layer);
        let conditionalLayers = allLayers.filter(l => !l.is_default_layer && !l.is_combined_layer);
        
        const isCollapsed = this._layerVisibility[entityId] === true;
        
        let layersToDisplay = [];

        if (!isCollapsed) {
            if (defaultLayer) layersToDisplay.push(defaultLayer);
            layersToDisplay = layersToDisplay.concat(conditionalLayers);
        }
        
        if (combinedLayer) layersToDisplay.push(combinedLayer);
        
        if (layersToDisplay.length === 0) {
            return '<div class="room-timeline"><div class="room-header">' + this.renderRoomHeader(roomName, roomIcon, entityState, unitOfMeasurement) + '</div><div class="timeline-container"><div class="no-schedule">' + this.t("no_schedule") + '</div></div></div>';
        }

        const layerActiveStates = [];
        for (const layer of allLayers) {
            layerActiveStates.push(layer.is_default_layer || layer.is_combined_layer ? null : this._evaluateConditionsForLayer(layer));
        }
        
        const anyOtherLayerActive = layerActiveStates.some((active, idx) => active === true && !allLayers[idx].is_default_layer && !allLayers[idx].is_combined_layer);
        
        for (let i = 0; i < allLayers.length; i++) {
            if (allLayers[i].is_default_layer) {
                layerActiveStates[i] = !anyOtherLayerActive;
            }
        }
        
        const layersCount = layersToDisplay.length;
        const containerHeight = topMargin + layersCount * blockHeight + (layersCount > 0 ? (layersCount - 1) * verticalGap : 0) + bottomMargin;
        
        const hours = Array.from({ length: 24 }, (v, i) => i);
        const hourLabels = hours.map(h => h === 6 || h === 12 || h === 18 ? '<div class="timeline-hour">' + this.formatHour(h) + "</div>" : '<div class="timeline-hour"></div>').join("");

        let blockHtml = "";
        let iconHtml = "";
        
        // Check if selected day is today for sigma icon styling
        const isSelectedDayToday = this.isToday();

        for (let layerIdx = 0; layerIdx < layersToDisplay.length; layerIdx++) {
            const currentLayer = layersToDisplay[layerIdx];
            if (!currentLayer?.blocks) continue;

            const top = topMargin + layerIdx * (blockHeight + verticalGap);
            const conditionText = currentLayer.condition_text || "(default)";
            const translatedConditionText = this._translateConditionText(conditionText);

            const isDefaultLayer = currentLayer.is_default_layer;
            const isCombinedLayer = currentLayer.is_combined_layer;
            
            // Get the original index in allLayers to check activation state
            const originalIndex = allLayers.findIndex(l => l === currentLayer);
            const isLayerActive = layerActiveStates[originalIndex];
            
            let displayLayerIndex = "";
            let iconTooltipText = "";

            if (isCombinedLayer) {
                const hasCollapsibleLayers = defaultLayer || conditionalLayers.length > 0;
                let toggleClass = '';
                // Grey out sigma icon if selected day is not today
                let iconStyle = 'background:' + (this._colors.combined_folded_layer || DEFAULT_COLORS.combined_folded_layer) + ';filter:brightness(1.1);';
                if (!isSelectedDayToday) {
                    iconStyle = 'background:' + (this._colors.combined_folded_layer || DEFAULT_COLORS.combined_folded_layer) + ';opacity:0.5;filter:brightness(0.8);';
                }
            
                if (hasCollapsibleLayers) {
                    toggleClass = ' combined-layer-toggle'; 
                    if (!isCollapsed) {
                        iconStyle = 'background:' + (this._colors.combined_unfolded_layer || DEFAULT_COLORS.combined_unfolded_layer) + ';filter:brightness(1.3);';
                        if (!isSelectedDayToday) {
                            iconStyle = 'background:' + (this._colors.combined_unfolded_layer || DEFAULT_COLORS.combined_unfolded_layer) + ';opacity:0.5;filter:brightness(0.8);';
                        }
                    }
                }
                
                iconTooltipText = this.t("cond_combined_schedule_toggle");
            
                iconHtml += `<div class="icon-row combined-icon-row" style="top:${top}px;" data-layer-index="Σ" data-tooltip="${this.escapeHtml(iconTooltipText)}">
                <span class="layer-number${toggleClass}" data-entity-id="${entityId}" style="${iconStyle}">
                    Σ
                </span>
                </div>`;
            }
            else { 
                const isActive = layerActiveStates[originalIndex];
                const iconStyle = isActive ? "background:" + this._colors.active_layer + ";filter:brightness(1.3);" : "background:" + this._colors.inactive_layer + ";opacity:0.5;";                
                
                if (isDefaultLayer) {
                    displayLayerIndex = "0";
                    iconTooltipText = this.t("layer_label") + " 0"; 
                    
                    if (conditionText && conditionText !== "default") { 
                        // Display condition with checkmark if active, or cross if inactive
                        if (isActive) {
                            iconTooltipText += "\n✔️ " + this.t("condition_label") + ": " + translatedConditionText;
                        } else {
                            iconTooltipText += "\n❌ " + this.t("condition_label") + ": " + translatedConditionText;
                        }
                    } else {
                        iconTooltipText += "\n" + this.t("default_state_label");
                    }
                } else {
                    const condLayerIndex = conditionalLayers.findIndex(l => l === currentLayer);
                    displayLayerIndex = String(condLayerIndex + 1); 

                    iconTooltipText = this.t("layer_label") + " " + displayLayerIndex; 
                    
                    if (conditionText && conditionText !== "default") { 
                        // Display condition with checkmark if active, or cross if inactive
                        if (isActive) {
                            iconTooltipText += "\n✔️ " + this.t("condition_label") + ": " + translatedConditionText;
                        } else {
                            iconTooltipText += "\n❌ " + this.t("condition_label") + ": " + translatedConditionText;
                        }
                    } else {
                        iconTooltipText += "\n" + this.t("no_specific_condition");
                    }
                }

                iconHtml += `<div class="icon-row" style="top:${top}px;" data-tooltip="${this.escapeHtml(iconTooltipText)}" data-layer-index="${displayLayerIndex}">
                    <span class="layer-number" style="${iconStyle}">${displayLayerIndex}</span>
                </div>`;
            }

            for (let i = 0; i < currentLayer.blocks.length; i++) {
                const block = currentLayer.blocks[i];
                const startMin = this.timeToMinutes(block.start);
                let endMin = this.timeToMinutes(block.end);
                
                let isDefaultBg = block.is_default_bg || false;

                if (block.end === '00:00' && endMin === 0) endMin = 1440;
                if (block.end === '23:59') endMin = 1440;

                let zClass = 'sch-z-layer'; 
                if (isDefaultBg) zClass = 'sch-z-default';
                
                let blockClass = "schedule-block";

                if (currentLayer.is_combined_layer) {
                    zClass = 'sch-z-combined'; 
                    blockClass += " combined-layer-block";
                }
                
                blockClass += " " + zClass;

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
                const color = block.color || colorData.color; 
                let textColor = colorData.textColor; 

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
                        borderRadius = "0";
                    } else if (startMin === 0 && endMin < 1440) {
                        borderRadius = "0 4px 4px 0";
                    } else if (startMin > 0 && endMin === 1440) {
                        borderRadius = "4px 0 0 4px";
                    }
                }

                const originalStart = block.original_start || block.start;
                const originalEnd = block.original_end || block.end;

                
                if (isDefaultBg) blockClass += " default-block";
                if (isDynamic) blockClass += " dynamic";

                const style = `
                    left:${left}%;
                    width:${width}%;
                    top:${top}px;
                    border-radius:${borderRadius};
                    color:${textColor};
                    background-color:${color};
                `;
                
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
                
                if (currentLayer.is_combined_layer) {
                    blockTooltipText += "\n(" + this.t("cond_combined_result") + ")"; 
                } else if (isDefaultBg) {
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

                blockHtml += '<div class="' + blockClass + '" style="' + style + '" data-tooltip="' + this.escapeHtml(blockTooltipText) + '"><span class="block-center">' + finalText + "</span></div>";
            }
        }

        return '<div class="room-timeline"><div class="room-header">' + this.renderRoomHeader(roomName, roomIcon, entityState, unitOfMeasurement, entityId) + '</div><div class="timeline-wrapper"><div class="icon-column" style="height:' + containerHeight + 'px;position:relative;">' + iconHtml + '</div><div class="timeline-container" style="height:' + containerHeight + 'px;flex:1;"><div class="timeline-grid">' + hourLabels + '</div><div class="blocks-container" style="position:relative;height:' + containerHeight + 'px;">' + blockHtml + '</div></div></div></div>';
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
            
            if (this._layerVisibility[entityId] === undefined) {
                this._layerVisibility[entityId] = true; 
            }
            
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
            
            let dayLayers = layers[this.selectedDay] || [];
            
            const defaultLayer = dayLayers.find(l => l.is_default_layer);
            
            const allConditionalLayers = dayLayers.filter(layer => 
                !layer.is_default_layer && !layer.is_combined_layer
            );
            
            const activeConditionalLayers = allConditionalLayers.filter(layer =>
                this._evaluateConditionsForLayer(layer)
            );
            
            const combinedLayer = this.createCombinedLayer(defaultLayer, activeConditionalLayers);
            
            let allLayers = dayLayers.filter(l => !l.is_combined_layer); 
            
            if (combinedLayer) {
                allLayers = [...allLayers, combinedLayer]; 
            }

            timelines += this.renderTimeline(roomName, roomIcon, allLayers, unitOfMeasurement, entityId, state);
        }
        
        // SOLUTION 1: Only update DOM if content has actually changed
        const newHTML = '<div class="schedules-container">' + timelines + "</div>";
        const existingContent = content.innerHTML;
        
        if (existingContent !== newHTML) {
            // Update only when content differs to prevent unnecessary DOM recreation
            content.innerHTML = newHTML;
            this.attachAllListeners(); 
        }
        
        this.updateTimeline();
    }

    renderRoomHeader(roomName, roomIcon, entityState, unitOfMeasurement, entityId) {
        const showStateInTitle = this._config.show_state_in_title !== false;
        let stateValue = '';
        
        if (showStateInTitle && entityState) {
            const attrs = entityState.attributes || {};
            const state = entityState.state || '';
            const unit = unitOfMeasurement || attrs.unit_of_measurement || '';
            stateValue = state ? (unit ? state + ' ' + unit : state) : '';
        }
        
        // FIX: Use data attributes instead of onclick (CSP compliant)
        const headerContent = (roomIcon ? '<ha-icon icon="' + roomIcon + '"></ha-icon>' : '') + 
                            '<span class="room-name" data-entity-id="' + entityId + '">' + roomName + '</span>' +
                            (stateValue ? '<span class="room-state">' + this.escapeHtml(stateValue) + '</span>' : '');
        
        return headerContent;
    }

    render() {
        const days = this.getDays();
        const showTitle = this._config.title?.trim().length > 0;
        
        const blockHeight = ScheduleStateCard.BLOCK_HEIGHT; 
        const iconColumnWidth = ScheduleStateCard.ICON_COLUMN_WIDTH;
        
        const additionalStyle = `
            .schedule-block.combined-layer-block{opacity:1;border:1px dashed var(--primary-text-color);box-shadow:0 0 10px var(--info-color);z-index:1!important}
            .icon-row.combined-icon-row .layer-number{cursor:pointer;position:relative;font-size:16px!important;line-height:24px;overflow:hidden}
            .icon-row.combined-icon-row .layer-number:hover{filter:brightness(1.3)}
            .combined-layer-toggle{padding-left:0;padding-right:0}
            .sch-z-default{z-index:1}
            .sch-z-layer{z-index:1}
            .sch-z-combined{z-index:1}
            .layer-number{width:24px;height:24px;color:white;border-radius:50%;font-size:11px;font-weight:bold;display:flex;align-items:center;justify-content:center;transition:all .2s}
        `;
        
        const styleContent = `
            :host {
                display: block;
                --sch-block-height: ${blockHeight}px;
                --sch-icon-col-width: ${iconColumnWidth}px;
            }
            ha-card{padding:16px}
            .card-header{display:flex;align-items:center;gap:12px;margin-bottom:16px}
            .card-header.hidden{display:none}
            .card-title{font-size:24px;font-weight:bold;margin:0}
            .day-selector{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;justify-content: center}
            .day-button{padding:8px 6px;border:none;border-radius:8px;background:var(--primary-background-color);color:var(--primary-text-color);cursor:pointer;font-weight:500;transition:all .2s;border:1px solid var(--divider-color)}
            .day-button:hover{background:var(--secondary-background-color);border-color:var(--primary-color)}
            .day-button.active{background:var(--primary-color);color:var(--text-primary-color,white);border-color:var(--primary-color)}
            .schedules-container{display:flex;flex-direction:column;gap:24px}
            .room-timeline{margin-bottom:12px}
            .room-header{display:flex;align-items:center;gap:8px;padding:0 8px;justify-content:space-between}
            .room-name{font-weight:600;font-size:14px;color:var(--primary-text-color);flex-grow:1;cursor:pointer;transition:color 0.2s}
            .room-name:hover{color:var(--primary-color);text-decoration:underline}
            .room-state{font-weight:600;font-size:14px;color:var(--primary-color);margin-left:auto}
            .timeline-wrapper{display:flex;gap:0;align-items:stretch}
            
            .icon-column{position:relative;width:var(--sch-icon-col-width);flex-shrink:0;display:flex;flex-direction:column;z-index:1}
            .icon-row{position:absolute;display:flex;align-items:center;justify-content:center;cursor:help;width:100%;height:var(--sch-block-height);transition:all .2s;top:0;margin-top:6px;z-index:1}
            .icon-row:hover .layer-number{filter:brightness(1.3)!important}
            
            .timeline-container{position:relative;background:var(--secondary-background-color);border-radius:8px;border:1px solid var(--divider-color);overflow:visible;padding:4px;flex:1}
            .timeline-grid{position:absolute;inset:0;display:flex;pointer-events:none;z-index:0}
            .blocks-container{position:absolute;inset:0;overflow:visible}
            .timeline-hour{position:relative;flex:1;border-right:1px solid var(--secondary-text-color);opacity:.4;font-size:11px;color:var(--secondary-text-color);display:flex;align-items:flex-end;justify-content:center;font-weight:600;padding-bottom:4px}
            .timeline-hour:empty{font-size:0}
            .timeline-hour:last-child{border-right:none}
            
            .schedule-block{
                position:absolute;
                display:flex;
                align-items:center;
                justify-content:center;
                font-weight:500;
                box-shadow:0 1px 3px rgba(0,0,0,.3);
                cursor:help;
                text-align:center;
                font-size:12px;
                overflow:hidden;
                height: var(--sch-block-height);
            }
            .schedule-block.default-block{
                background-image:repeating-linear-gradient(45deg,transparent,transparent 6px,rgba(0,0,0,0.15) 6px,rgba(0,0,0,0.15) 12px)!important;
                color:white;
                font-weight:500;
            }
            .block-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);max-width:95%;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}
            .no-schedule{font-size:14px;color:var(--secondary-text-color);text-align:center;padding:12px 0}
            .time-cursor{position:absolute;top:0;bottom:0;width:2px;background-color:var(--label-badge-yellow);z-index:2}
        ` + additionalStyle;
        
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
                        dayButtons.forEach(btn => btn.classList.remove("active"));
                        e.target.classList.add("active");
                        
                        this.selectedDay = newDay;
                        this.updateContent(); 
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
        
        if (this._tooltipTimer) {
            clearTimeout(this._tooltipTimer);
            this._tooltipTimer = null;
        }
        
        const container = this.shadowRoot.querySelector("#content");
        if (container && this._listener) {
            container.removeEventListener("click", this._listener);
            container.removeEventListener("mouseover", this._listener);
            container.removeEventListener("mouseout", this._listener);
            this._listener = null;
        }
    }
}

class ScheduleStateCardEditor extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._config = {};
        this._hass = null;
        this._entities = [];
        this._editingIndex = null;
        this._colorPickerOpen = null;
        this._iconsCache = null;
    }

    getLanguage() {
        if (this._hass?.locale?.language) {
            return TRANSLATIONS[this._hass.locale.language] ? this._hass.locale.language : "en";
        }
        return "en";
    }

    t(key) {
        const lang = this.getLanguage();
        return TRANSLATIONS[lang] && TRANSLATIONS[lang][key]
            ? TRANSLATIONS[lang][key]
            : TRANSLATIONS.en[key] || key;
    }

    setConfig(config) {
        this._config = { ...config };
        this._entities = Array.isArray(this._config.entities)
            ? this._config.entities.map(e => typeof e === "string" ? { entity: e } : { ...e })
            : [];
        if (!this._config.colors) {
            this._config.colors = { ...DEFAULT_COLORS };
        }
        this.render();
    }

    set hass(hass) {
        this._hass = hass;
        this._iconsCache = null;
        
        // Only render if config exists and not already rendered
        if (this._config && Object.keys(this._config).length > 0) {
            const alreadyRendered = this.shadowRoot.querySelector(".config-row");
            if (!alreadyRendered) {
                this.render();
            }
        }
    }

    fireConfigChanged() {
        this._config.entities = this._entities;
        this.dispatchEvent(new CustomEvent("config-changed", {
            detail: { config: this._config }
        }));
        this.requestUpdate();
    }

    requestUpdate() {
        setTimeout(() => {
            const previewCard = document.querySelector('hui-card-preview');
            if (previewCard) {
                previewCard.requestUpdate?.();
            }
        }, 0);
    }

    addEntity() {
        this._entities.push({ entity: "", name: "", icon: "" });
        this.fireConfigChanged();
        this.render();
    }

    removeEntity(index) {
        this._entities.splice(index, 1);
        this.fireConfigChanged();
        this.render();
    }

    updateEntity(index, field, value) {
        if (this._entities[index]) {
            this._entities[index][field] = value;
            this.fireConfigChanged();
            this.requestUpdate();
        }
    }

    updateColor(colorKey, value) {
        if (!this._config.colors) {
            this._config.colors = { ...DEFAULT_COLORS };
        }
        this._config.colors[colorKey] = value;
        this.fireConfigChanged();
        this.render();
    }

    toggleEditForm(index) {
        this._editingIndex = this._editingIndex === index ? null : index;
        this.render();
    }

    toggleColorPicker(colorKey) {
        this._colorPickerOpen = this._colorPickerOpen === colorKey ? null : colorKey;
        this.render();
    }

    escapeHtml(text) {
        if (!text) return "";
        const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }

    isValidHex(hex) {
        return /^#[0-9A-F]{6}$/i.test(hex);
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    rgbToHex(r, g, b) {
        return "#" + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }).join("").toUpperCase();
    }

    rgbToHsv(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0;
        const v = max;
        const d = max - min;
        s = max === 0 ? 0 : d / max;
        if (max === min) {
            h = 0;
        } else {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h * 360, s: s * 100, v: v * 100 };
    }

    hsvToRgb(h, s, v) {
        h = h / 360;
        s = s / 100;
        v = v / 100;
        const c = v * s;
        const x = c * (1 - Math.abs((h * 6) % 2 - 1));
        const m = v - c;
        let r = 0, g = 0, b = 0;
        if (h < 1/6) { r = c; g = x; b = 0; }
        else if (h < 2/6) { r = x; g = c; b = 0; }
        else if (h < 3/6) { r = 0; g = c; b = x; }
        else if (h < 4/6) { r = 0; g = x; b = c; }
        else if (h < 5/6) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);
        return { r, g, b };
    }

    getAllMDIIcons() {
        if (this._iconsCache) return this._iconsCache;

        let iconList = [];
        
        try {
            const resources = this._hass?.resources;
            if (resources) {
                for (const [key, value] of Object.entries(resources)) {
                    if (typeof value === 'object' && value !== null) {
                        const icons = Object.keys(value)
                            .filter(icon => icon.startsWith('mdi:'));
                        iconList.push(...icons);
                    }
                }
            }
        } catch (e) {
            console.log("Erreur lors de la récupération des icônes:", e);
        }

        if (iconList.length === 0) {
            iconList = [
                "mdi:calendar-clock", "mdi:thermometer", "mdi:lightbulb", "mdi:power",
                "mdi:weather-sunny", "mdi:water", "mdi:motion-sensor", "mdi:door",
                "mdi:window-closed", "mdi:fan", "mdi:air-conditioner", "mdi:television",
                "mdi:music", "mdi:lock", "mdi:shield", "mdi:alarm", "mdi:clock",
                "mdi:timer", "mdi:play", "mdi:stop", "mdi:pause", "mdi:volume-high",
                "mdi:brightness-7", "mdi:home", "mdi:sofa", "mdi:bed", "mdi:check", "mdi:close"
            ];
        }

        const uniqueIcons = [...new Set(iconList)].sort();
        this._iconsCache = uniqueIcons;
        return uniqueIcons;
    }

    getFilteredEntities(filterText) {
        const allEntities = Object.keys(this._hass?.states || {}).sort();
        if (!filterText) return allEntities.slice(0, 10);
        return allEntities.filter(e => e.toLowerCase().includes(filterText.toLowerCase()));
    }

    getFilteredIcons(filterText) {
        const allIcons = this.getAllMDIIcons();

        if (!filterText) return allIcons.slice(0, 20);
        return allIcons.filter(i => i.toLowerCase().includes(filterText.toLowerCase())).slice(0, 50);
    }

    renderColorPicker(colorKey, colorLabel) {
        const currentColor = this._config.colors?.[colorKey] || DEFAULT_COLORS[colorKey];
        const isOpen = this._colorPickerOpen === colorKey;
        
        const rgb = this.hexToRgb(currentColor);
        const hsv = rgb ? this.rgbToHsv(rgb.r, rgb.g, rgb.b) : { h: 0, s: 100, v: 100 };
        
        const pickerHtml = isOpen ? `
            <div class="color-picker-overlay" data-colorkey="${colorKey}"></div>
            <div class="color-picker-popup">
                <div class="color-wheel-container">
                    <canvas id="color-wheel-${colorKey}" class="color-wheel" width="280" height="280" data-colorkey="${colorKey}"></canvas>
                    <div class="color-marker" id="marker-${colorKey}" style="position: absolute; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.5); pointer-events: none;"></div>
                </div>
                <div class="brightness-control">
                    <label>Brightness: <span id="brightness-value-${colorKey}">100</span>%</label>
                    <input type="range" class="brightness-slider" id="brightness-${colorKey}" min="0" max="100" value="${hsv.v}" data-colorkey="${colorKey}" />
                </div>
            </div>
        ` : '';
    
        return `
            <div class="color-config-row">
                <label>${colorLabel}</label>
                <div class="color-input-group">
                    <div class="color-preview" style="background-color: ${currentColor};" data-colorkey="${colorKey}"></div>
                    <input type="text" class="color-hex-input" value="${currentColor}" data-colorkey="${colorKey}" maxlength="7" placeholder="#000000" />
                    <button class="color-picker-btn" data-colorkey="${colorKey}" title="${this.t('editor_color_picker_label')}">🎨</button>
                </div>
                ${pickerHtml}
            </div>
        `;
    }

    renderEditForm(entityConfig, index) {
        const t = this.t.bind(this);
        const entityId = entityConfig.entity || "";
        return `
            <div class="entity-edit-form">
                <div class="input-group">
                    <label>${t('editor_entity_id_label')}:</label>
                    <div class="input-with-suggestions">
                        <input type="text" class="entity-input entity-search" data-index="${index}" data-field="entity" value="${this.escapeHtml(entityId)}" placeholder="light.my_light" autocomplete="off">
                    </div>
                </div>
                <div class="input-group">
                    <label>${t('editor_name_label')}:</label>
                    <input type="text" class="entity-input" data-index="${index}" data-field="name" value="${this.escapeHtml(entityConfig.name || '')}" placeholder="${t('editor_placeholder_name')}" autocomplete="off">
                </div>
                <div class="input-group">
                    <label>${t('editor_icon_label')}:</label>
                    <div class="input-with-suggestions">
                        <input type="text" class="entity-input icon-search" data-index="${index}" data-field="icon" value="${this.escapeHtml(entityConfig.icon || '')}" placeholder="mdi:calendar-clock" autocomplete="off">
                    </div>
                </div>
            </div>
        `;
    }

    renderEntityRow(entityConfig, index) {
        const t = this.t.bind(this);
        const entityId = entityConfig.entity || "";
        const entityState = this._hass?.states[entityId];
        const name = entityConfig.name || entityState?.attributes?.friendly_name || entityId || t('editor_default_entity_name');
        const icon = entityConfig.icon || entityState?.attributes?.icon || "mdi:calendar-clock";

        const isEditing = this._editingIndex === index;

        return `
            <div class="entity-row">
                <div class="handle">≡</div>
                <div class="icon-name">
                    <ha-icon icon="${this.escapeHtml(icon)}"></ha-icon>
                    <span>${this.escapeHtml(name)}</span>
                </div>
                <div class="entity-id">${this.escapeHtml(entityId)}</div>
                <div class="actions">
                    <button class="action-button edit-btn" data-index="${index}" title="${t('common.edit') || 'Edit'}">
                        <ha-icon icon="mdi:pencil"></ha-icon>
                    </button>
                    <button class="action-button remove-btn" data-index="${index}" title="${t('common.delete') || 'Delete'}">
                        <ha-icon icon="mdi:close"></ha-icon>
                    </button>
                </div>
            </div>
            ${isEditing ? this.renderEditForm(entityConfig, index) : ''}
        `;
    }

    render() {
        // Clear all previous content and listeners
        if (this.shadowRoot) {
            this.shadowRoot.innerHTML = '';
        }
        
        const t = this.t.bind(this);
        const style = `
            :host { display: block; }
            
            .config-row { margin-bottom: 15px; }
            .config-row label { font-weight: bold; display: block; margin-bottom: 5px; color: var(--primary-text-color); }
            .config-row input { width: 100%; padding: 8px; border: 1px solid var(--divider-color); border-radius: 4px; background: var(--primary-background-color); color: var(--primary-text-color); box-sizing: border-box; }
            
            .entity-list { border: 1px solid var(--divider-color); border-radius: 4px; overflow: visible; margin-bottom: 10px; }
            
            .entity-row { 
                display: flex; 
                align-items: center; 
                padding: 10px; 
                background: var(--card-background-color); 
                border-bottom: 1px solid var(--divider-color); 
                gap: 10px;
            }
            
            .handle { 
                cursor: grab; 
                color: var(--secondary-text-color); 
                flex-shrink: 0;
                width: 20px;
            }
            
            .icon-name { 
                display: flex; 
                align-items: center; 
                gap: 8px;
                flex-grow: 0;
                flex-basis: 120px;
                font-weight: 500; 
                min-width: 0;
            }
            
            .icon-name ha-icon { 
                color: var(--primary-color); 
                flex-shrink: 0;
            }
            
            .icon-name span {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .entity-id { 
                flex-grow: 1;
                flex-basis: auto;
                color: var(--secondary-text-color); 
                font-family: monospace; 
                font-size: 12px; 
                text-align: right; 
                overflow: hidden; 
                text-overflow: ellipsis; 
                white-space: nowrap;
            }
            
            .actions { 
                display: flex; 
                gap: 5px;
                flex-shrink: 0;
            }
            
            .action-button { 
                background: none; 
                border: none; 
                cursor: pointer; 
                color: var(--primary-text-color); 
                padding: 4px;
                display: flex;
                align-items: center;
            }
            
            .action-button:hover ha-icon { 
                color: var(--primary-color); 
            }
            
            .entity-edit-form { 
                display: flex;
                padding: 10px; 
                background: var(--secondary-background-color); 
                border-bottom: 1px solid var(--divider-color); 
                gap: 10px; 
                flex-wrap: wrap;
                position: relative;
                z-index: 10;
            }
            
            .input-group { 
                flex: 1 1 calc(33.333% - 10px); 
                min-width: 150px;
                display: flex;
                flex-direction: column;
                position: relative;
            }
            
            .input-group label { 
                font-size: 12px; 
                margin-bottom: 3px; 
                font-weight: 600;
                color: var(--primary-text-color);
            }
            
            .entity-input {
                padding: 6px !important;
                border: 1px solid var(--divider-color) !important;
                border-radius: 3px !important;
                background: var(--primary-background-color) !important;
                color: var(--primary-text-color) !important;
                font-size: 12px !important;
                width: 100%;
                box-sizing: border-box;
            }

            .input-with-suggestions {
                position: relative;
                width: 100%;
            }

            .suggestions-dropdown {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: var(--secondary-background-color);
                border: 1px solid var(--divider-color);
                border-top: none;
                border-radius: 0 0 3px 3px;
                max-height: 200px;
                overflow-y: auto;
                z-index: 1001;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                margin-top: 2px;
            }

            .suggestion-item {
                padding: 8px 10px;
                cursor: pointer;
                color: var(--primary-text-color);
                font-size: 12px;
                border-bottom: 1px solid var(--divider-color);
                display: flex;
                align-items: center;
                gap: 8px;
                transition: background 0.2s;
            }

            .suggestion-item:last-child {
                border-bottom: none;
            }

            .suggestion-item:hover:not(.disabled) {
                background: var(--primary-color);
                color: white;
            }

            .suggestion-item.disabled {
                color: var(--secondary-text-color);
                cursor: default;
            }

            .suggestion-item ha-icon {
                flex-shrink: 0;
            }

            .add-button { 
                margin-top: 10px; 
                width: 100%; 
                padding: 10px; 
                background: var(--primary-color); 
                color: white; 
                border: none; 
                border-radius: 4px; 
                cursor: pointer; 
                font-weight: bold; 
                transition: all 0.2s;
            }
            
            .add-button:hover { 
                opacity: 0.9;
            }

            .colors-section {
                margin-top: 20px;
                padding: 15px;
                background: var(--secondary-background-color);
                border-radius: 4px;
                border: 1px solid var(--divider-color);
            }

            .colors-section-title {
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 15px;
                color: var(--primary-text-color);
            }

            .color-config-row {
                margin-bottom: 12px;
                display: flex;
                flex-direction: column;
                gap: 5px;
            }

            .color-config-row label {
                font-size: 13px;
                font-weight: 600;
                color: var(--primary-text-color);
                margin: 0;
            }

            .color-input-group {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .color-preview {
                width: 40px;
                height: 40px;
                border-radius: 4px;
                border: 2px solid var(--divider-color);
                cursor: pointer;
                transition: transform 0.2s;
            }

            .color-preview:hover {
                transform: scale(1.05);
            }

            .color-hex-input {
                flex: 1;
                padding: 8px;
                border: 1px solid var(--divider-color);
                border-radius: 3px;
                background: var(--primary-background-color);
                color: var(--primary-text-color);
                font-family: monospace;
                font-size: 12px;
            }

            .color-picker-btn {
                width: 40px;
                height: 40px;
                padding: 0;
                background: var(--primary-background-color);
                border: 1px solid var(--divider-color);
                border-radius: 3px;
                cursor: pointer;
                font-size: 18px;
                transition: all 0.2s;
            }

            .color-picker-btn:hover {
                background: var(--secondary-background-color);
                border-color: var(--primary-color);
            }

            .color-picker-popup {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: var(--secondary-background-color);
                border: 2px solid var(--primary-color);
                border-radius: 8px;
                padding: 20px;
                z-index: 2000;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
                width: 90%;
                max-width: 350px;
            }

            .color-wheel-container {
                position: relative;
                width: 280px;
                height: 280px;
                margin: 0 auto 20px;
            }

            .color-wheel {
                display: block;
                cursor: crosshair;
                border-radius: 50%;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
            }

            .color-marker {
                position: absolute;
                width: 12px;
                height: 12px;
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 0 4px rgba(0,0,0,0.5);
                pointer-events: none;
            }

            .color-picker-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1999;
            }

            .brightness-control {
                margin-top: 15px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                text-align: center;
            }

            .brightness-control label {
                font-size: 12px;
                font-weight: 600;
                color: var(--primary-text-color);
            }

            .brightness-slider {
                width: 100%;
                height: 6px;
                border-radius: 3px;
                background: linear-gradient(to right, #000000, #808080, #FFFFFF);
                outline: none;
                -webkit-appearance: none;
            }

            .brightness-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: var(--primary-color);
                cursor: pointer;
                border: 2px solid var(--primary-text-color);
            }

            .brightness-slider::-moz-range-thumb {
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: var(--primary-color);
                cursor: pointer;
                border: 2px solid var(--primary-text-color);
            }
        `;

        const colorsSection = `
            <div class="colors-section">
                <div class="colors-section-title">${t('editor_colors_label')}</div>
                ${this.renderColorPicker('active_layer', t('editor_active_layer_label'))}
                ${this.renderColorPicker('inactive_layer', t('editor_inactive_layer_label'))}
                ${this.renderColorPicker('combined_folded_layer', t('editor_combined_folded_label'))}
                ${this.renderColorPicker('combined_unfolded_layer', t('editor_combined_unfolded_label'))}
                ${this.renderColorPicker('cursor', t('editor_cursor_label'))}
            </div>
        `;

        const entitiesHtml = this._entities.length > 0
            ? this._entities.map((ent, idx) => this.renderEntityRow(ent, idx)).join('')
            : `<div style="padding: 10px; color: var(--secondary-text-color); text-align: center;">${t('editor_no_entities')}</div>`;

        const html = `
            <style>${style}</style>
            <div class="config-row">
                <label>${t('editor_card_title')}</label>
                <input id="title-input" value="${this.escapeHtml(this._config?.title || "")}" placeholder="${t('editor_title_placeholder')}"/>
            </div>

            <div class="config-row">
                <label style="display:flex;align-items:center;gap:8px;">
                    <input type="checkbox" id="show-state-input" ${this._config.show_state_in_title !== false ? 'checked' : ''} style="width:auto;cursor:pointer;"/>
                    ${t('editor_show_state_in_title')}
                </label>
            </div>

            <div class="config-row">
                <label>${t('editor_entities_label')}</label>
                <div class="entity-list" id="entity-list">
                    ${entitiesHtml}
                </div>
                <button class="add-button" id="add-btn">
                    + ${t('editor_add_entity')}
                </button>
            </div>

            ${colorsSection}
        `;

        this.shadowRoot.innerHTML = html;
        this.attachListeners();
    }

    updateDropdown(inputElement, type) {
        const index = parseInt(inputElement.dataset.index);
        const container = inputElement.closest('.input-with-suggestions');
        if (!container) return;

        const filterText = inputElement.value || "";
        let items = "";

        // Generate filtered suggestions based on input text
        if (type === "entity") {
            const filtered = this.getFilteredEntities(filterText);
            if (filtered.length > 0) {
                items = filtered.map(e => {
                    return `<div class="suggestion-item entity-suggestion" data-index="${index}" data-value="${this.escapeHtml(e)}">${this.escapeHtml(e)}</div>`;
                }).join('');
            } else if (filterText.length > 0) {
                items = `<div class="suggestion-item disabled">${this.t('editor_no_entities_found')}</div>`;
            }
        } else if (type === "icon") {
            const filtered = this.getFilteredIcons(filterText);
            if (filtered.length > 0) {
                items = filtered.map(icon => {
                    return `<div class="suggestion-item icon-suggestion" data-index="${index}" data-value="${this.escapeHtml(icon)}"><ha-icon icon="${this.escapeHtml(icon)}"></ha-icon> ${this.escapeHtml(icon)}</div>`;
                }).join('');
            }
        }

        // Remove existing dropdown
        let existingDropdown = container.querySelector('.suggestions-dropdown');
        if (existingDropdown) existingDropdown.remove();

        // Create and insert new dropdown if there are items
        if (items) {
            const dropdown = document.createElement('div');
            dropdown.className = 'suggestions-dropdown';
            dropdown.innerHTML = items;
            container.appendChild(dropdown);

            // Attach click handlers to suggestion items
            dropdown.querySelectorAll('.suggestion-item:not(.disabled)').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const idx = parseInt(item.dataset.index);
                    const value = item.dataset.value;
                    const field = type === "entity" ? "entity" : "icon";
                    
                    // Update the entity data
                    this.updateEntity(idx, field, value);
                    inputElement.value = value;
                    
                    // Remove dropdown after selection
                    const dd = container.querySelector('.suggestions-dropdown');
                    if (dd) dd.remove();
                });

                // Add hover effect
                item.addEventListener('mouseenter', () => {
                    dropdown.querySelectorAll('.suggestion-item').forEach(i => i.style.background = '');
                    item.style.background = 'var(--primary-color)';
                    item.style.color = 'white';
                });

                item.addEventListener('mouseleave', () => {
                    item.style.background = '';
                    item.style.color = 'var(--primary-text-color)';
                });
            });
        }
    }

    drawColorWheel(canvas, colorKey) {
        // Safety checks
        if (!canvas || !colorKey) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const radius = 130;
        const centerX = 140;
        const centerY = 140;

        const currentColor = this._config.colors?.[colorKey] || DEFAULT_COLORS[colorKey];
        const rgb = this.hexToRgb(currentColor);
        const hsv = rgb ? this.rgbToHsv(rgb.r, rgb.g, rgb.b) : { h: 0, s: 100, v: 100 };

        for (let angle = 0; angle < 360; angle += 1) {
            const startAngle = (angle - 90) * Math.PI / 180;
            const endAngle = (angle + 1 - 90) * Math.PI / 180;

            for (let r = 0; r < radius; r += 2) {
                const saturation = (r / radius) * 100;
                const rgb1 = this.hsvToRgb(angle, saturation, hsv.v);
                const rgbColor = `rgb(${rgb1.r},${rgb1.g},${rgb1.b})`;

                ctx.fillStyle = rgbColor;
                ctx.beginPath();
                ctx.arc(centerX, centerY, r, startAngle, endAngle);
                ctx.lineTo(centerX, centerY);
                ctx.fill();
            }
        }

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
        ctx.fill();

        const angle = (hsv.h - 90) * Math.PI / 180;
        const distance = (hsv.s / 100) * radius;
        const markerX = centerX + distance * Math.cos(angle);
        const markerY = centerY + distance * Math.sin(angle);
        
        const marker = this.shadowRoot.querySelector(`#marker-${colorKey}`);
        if (marker) {
            marker.style.left = (markerX - 6) + 'px';
            marker.style.top = (markerY - 6) + 'px';
        }
    }
    
    handleWheelClick(e, colorKey) {
        const canvas = e.target;
        const rect = canvas.getBoundingClientRect();
        
        const x = e.clientX - rect.left - 140;
        const y = e.clientY - rect.top - 140;
        
        const distance = Math.sqrt(x * x + y * y);
        if (distance > 130) return;
    
        const angle = Math.atan2(y, x) * 180 / Math.PI + 90;
        const h = angle < 0 ? angle + 360 : angle;
        const s = (distance / 130) * 100;
    
        const brightnessSlider = this.shadowRoot.querySelector(`.brightness-slider[data-colorkey="${colorKey}"]`);
        const v = brightnessSlider ? parseInt(brightnessSlider.value) : 100;
    
        const rgb = this.hsvToRgb(h, s, v);
        const hex = this.rgbToHex(rgb.r, rgb.g, rgb.b);
        
        this.updateColor(colorKey, hex);
        this.drawColorWheel(canvas, colorKey);
    }

    attachListeners() {
        // Guard: wait for shadowRoot to be fully ready
        if (!this.shadowRoot) {
            return;
        }
        
        // Query all elements - these should exist after render()
        const titleInput = this.shadowRoot.querySelector("#title-input");
        const showStateInput = this.shadowRoot.querySelector("#show-state-input");
        const addBtn = this.shadowRoot.querySelector("#add-btn");
        
        // If elements don't exist, DOM isn't ready - retry with delay
        if (!titleInput || !showStateInput || !addBtn) {
            setTimeout(() => this.attachListeners(), 50);
            return;
        }

        // Title input listener
        titleInput.addEventListener("change", (e) => {
            this._config.title = e.target.value;
            this.fireConfigChanged();
        });

        // Show state checkbox listener
        showStateInput.addEventListener("change", (e) => {
            this._config.show_state_in_title = e.target.checked;
            this.fireConfigChanged();
        });

        // Add entity button listener
        addBtn.addEventListener("click", () => this.addEntity());

        // Edit button listeners
        this.shadowRoot.querySelectorAll(".edit-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                this.toggleEditForm(index);
            });
        });

        // Remove button listeners
        this.shadowRoot.querySelectorAll(".remove-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                this.removeEntity(index);
            });
        });

        // Regular entity input listeners (non-searchable)
        this.shadowRoot.querySelectorAll(".entity-input:not(.entity-search):not(.icon-search)").forEach(input => {
            input.addEventListener("change", (e) => {
                const index = parseInt(e.target.dataset.index);
                const field = e.target.dataset.field;
                this.updateEntity(index, field, e.target.value);
            });
        });

        // Entity search listeners - with REAL-TIME dropdown updates
        this.shadowRoot.querySelectorAll(".entity-search").forEach(input => {
            // Show dropdown immediately on focus
            input.addEventListener("focus", (e) => {
                this.updateDropdown(e.target, "entity");
            });

            // Update dropdown in real-time as user types
            input.addEventListener("input", (e) => {
                this.updateDropdown(e.target, "entity");
            });

            // Close dropdown when leaving the field
            input.addEventListener("blur", (e) => {
                setTimeout(() => {
                    const container = e.target.closest('.input-with-suggestions');
                    if (container) {
                        const dropdown = container.querySelector('.suggestions-dropdown');
                        if (dropdown) dropdown.remove();
                    }
                }, 150);
            });

            // Clear dropdown on escape key
            input.addEventListener("keydown", (e) => {
                if (e.key === "Escape") {
                    const container = e.target.closest('.input-with-suggestions');
                    if (container) {
                        const dropdown = container.querySelector('.suggestions-dropdown');
                        if (dropdown) dropdown.remove();
                    }
                }
            });
        });

        // Icon search listeners - with REAL-TIME dropdown updates
        this.shadowRoot.querySelectorAll(".icon-search").forEach(input => {
            // Show dropdown immediately on focus
            input.addEventListener("focus", (e) => {
                this.updateDropdown(e.target, "icon");
            });

            // Update dropdown in real-time as user types
            input.addEventListener("input", (e) => {
                this.updateDropdown(e.target, "icon");
            });

            // Close dropdown when leaving the field
            input.addEventListener("blur", (e) => {
                setTimeout(() => {
                    const container = e.target.closest('.input-with-suggestions');
                    if (container) {
                        const dropdown = container.querySelector('.suggestions-dropdown');
                        if (dropdown) dropdown.remove();
                    }
                }, 150);
            });

            // Clear dropdown on escape key
            input.addEventListener("keydown", (e) => {
                if (e.key === "Escape") {
                    const container = e.target.closest('.input-with-suggestions');
                    if (container) {
                        const dropdown = container.querySelector('.suggestions-dropdown');
                        if (dropdown) dropdown.remove();
                    }
                }
            });
        });

        // Color picker button listeners
        this.shadowRoot.querySelectorAll(".color-picker-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const colorKey = e.currentTarget.dataset.colorkey;
                this.toggleColorPicker(colorKey);
            });
        });

        // Color hex input listeners
        this.shadowRoot.querySelectorAll(".color-hex-input").forEach(input => {
            input.addEventListener("change", (e) => {
                const colorKey = e.target.dataset.colorkey;
                let value = e.target.value.toUpperCase();
                if (!this.isValidHex(value)) {
                    value = DEFAULT_COLORS[colorKey];
                }
                e.target.value = value;
                this.updateColor(colorKey, value);
            });

            input.addEventListener("input", (e) => {
                const colorKey = e.target.dataset.colorkey;
                const preview = this.shadowRoot.querySelector(`.color-preview[data-colorkey="${colorKey}"]`);
                let value = e.target.value.toUpperCase();
                if (this.isValidHex(value)) {
                    preview.style.backgroundColor = value;
                }
            });
        });

        // Color preview listeners
        this.shadowRoot.querySelectorAll(".color-preview").forEach(preview => {
            preview.addEventListener("click", (e) => {
                const colorKey = e.currentTarget.dataset.colorkey;
                this.toggleColorPicker(colorKey);
            });
        });

        // Color picker overlay close listener
        this.shadowRoot.querySelectorAll(".color-picker-overlay").forEach(overlay => {
            overlay.addEventListener("click", () => {
                this._colorPickerOpen = null;
                this.render();
            });
        });

        // Color wheel canvas rendering and interaction
        this.shadowRoot.querySelectorAll(".color-wheel").forEach(canvas => {
            const colorKey = canvas.dataset.colorkey;
            // Draw the color wheel
            this.drawColorWheel(canvas, colorKey);
            
            // Click to select color
            canvas.addEventListener("click", (e) => this.handleWheelClick(e, colorKey));
            
            // Drag to select color
            canvas.addEventListener("mousemove", (e) => {
                if (e.buttons === 1) this.handleWheelClick(e, colorKey);
            });
        });

        // Brightness slider listeners
        this.shadowRoot.querySelectorAll(".brightness-slider").forEach(slider => {
            slider.addEventListener("input", (e) => {
                const colorKey = e.target.dataset.colorkey;
                const v = parseInt(e.target.value);
                const valueDisplay = this.shadowRoot.querySelector(`#brightness-value-${colorKey}`);
                if (valueDisplay) valueDisplay.textContent = v;
                
                const currentColor = this._config.colors?.[colorKey] || DEFAULT_COLORS[colorKey];
                const rgb = this.hexToRgb(currentColor);
                if (rgb) {
                    const hsv = this.rgbToHsv(rgb.r, rgb.g, rgb.b);
                    const newRgb = this.hsvToRgb(hsv.h, hsv.s, v);
                    const hex = this.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
                    this.updateColor(colorKey, hex);
                }
            });
        });
    }
}

customElements.define("schedule-state-card", ScheduleStateCard);
customElements.define("schedule-state-card-editor", ScheduleStateCardEditor);
console.info("%c Schedule State Card %c v1.0.6 %c", "background:#2196F3;color:white;padding:2px 8px;border-radius:3px 0 0 3px;font-weight:bold", "background:#4CAF50;color:white;padding:2px 8px;border-radius:0 3px 3px 0", "background:none");
window.customCards = window.customCards || [];
window.customCards.push({
    type: "schedule-state-card",
    name: "Schedule State Card",
    description: "Visualizes schedules defined via AppDaemon schedule_parser with color customization."

});
