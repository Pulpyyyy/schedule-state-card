console.info("%c 🙂 Schedule State Card %c v2.0.6 %c", "background:#2196F3;color:white;padding:2px 8px;border-radius:3px 0 0 3px;font-weight:bold", "background:#4CAF50;color:white;padding:2px 8px;border-radius:0 3px 3px 0", "background:none");

/**
 * DEBUG MODE - Activate with ?debug in URL
 * Example: http://localhost:8123?debug
 */
const DEBUG_MODE = typeof window !== 'undefined' && window.location?.search?.includes('debug');

/**
 * Conditional logger - only logs in debug mode
 * @param {string} prefix - Optional entity name prefix (e.g., entity friendly name)
 * @param {...any} args - Arguments to log
 */
const debugLog = (prefix = '', ...args) => {
    if (DEBUG_MODE) {
        if (prefix && typeof prefix === 'string' && prefix !== '') {
            console.log('[ScheduleStateCard DEBUG]', `[${prefix}]`, ...args);
        } else {
            console.log('[ScheduleStateCard DEBUG]', ...args);
        }
    }
};

/**
 * Conditional warn - only warns in debug mode
 * @param {string} prefix - Optional entity name prefix (e.g., entity friendly name)
 * @param {string} msg - Warning message
 * @param {...any} args - Additional arguments
 */
const debugWarn = (prefix = '', msg, ...args) => {
    if (DEBUG_MODE) {
        if (prefix && typeof prefix === 'string' && prefix !== '') {
            console.warn('[ScheduleStateCard WARN]', `[${prefix}]`, msg, ...args);
        } else {
            console.warn('[ScheduleStateCard WARN]', msg, ...args);
        }
    }
};

/**
 * Error logger - always logs errors
 * @param {string} prefix - Optional entity name prefix (e.g., entity friendly name)
 * @param {string} msg - Error message
 * @param {...any} args - Additional arguments
 */
const errorLog = (prefix = '', msg, ...args) => {
    if (prefix && typeof prefix === 'string' && prefix !== '') {
        console.error('[ScheduleStateCard ERROR]', `[${prefix}]`, msg, ...args);
    } else {
        console.error('[ScheduleStateCard ERROR]', msg, ...args);
    }
};

/**
 * ============================================================================
 * GLOBAL COLOR CACHE SINGLETON
 * ============================================================================
 * 
 * Shared color mapping cache across all card instances to avoid recalculating
 * colors for the same state+unit combinations.
 * 
 * Structure:
 * {
 *   "18|°C": { color: "hsl(...)", textColor: "#fff" },
 *   "21|°C": { color: "hsl(...)", textColor: "#000" },
 *   ...
 * }
 */
class ColorCacheSingleton {
    constructor() {
        if (ColorCacheSingleton.instance) {
            return ColorCacheSingleton.instance;
        }
        
        /**
         * Main cache: key="value|unit" => color object
         * @type {Map<string, {color: string, textColor: string}>}
         */
        this.cache = new Map();
        
        /**
         * Manual overrides: allows forcing specific colors for state+unit combinations
         * @type {Map<string, {color: string, textColor: string}>}
         */
        this.overrides = new Map();
        
        /**
         * Statistics for debugging
         */
        this.stats = {
            hits: 0,
            misses: 0,
            overrideUses: 0
        };
        
        ColorCacheSingleton.instance = this;
    }
    
    /**
     * Get color for a state+unit combination
     * @param {string} key - "value|unit" format
     * @returns {Object|null} {color, textColor} or null if not cached
     */
    get(key) {
        // Check overrides first
        if (this.overrides.has(key)) {
            this.stats.overrideUses++;
            return this.overrides.get(key);
        }
        
        if (this.cache.has(key)) {
            this.stats.hits++;
            return this.cache.get(key);
        }
        
        this.stats.misses++;
        return null;
    }
    
    /**
     * Store a calculated color
     * @param {string} key - "value|unit" format
     * @param {Object} colorData - {color, textColor}
     */
    set(key, colorData) {
        this.cache.set(key, colorData);
    }
    
    /**
     * Add or update a manual override
     * @param {string} key - "value|unit" format
     * @param {string} color - CSS color (hex, hsl, rgb, etc.)
     * @param {string} textColor - Text color for contrast
     */
    setOverride(key, color, textColor) {
        this.overrides.set(key, { color, textColor });
        debugLog(`Color override added: ${key} => ${color}`);
    }
    
    /**
     * Remove an override
     * @param {string} key - "value|unit" format
     */
    removeOverride(key) {
        this.overrides.delete(key);
        debugLog(`Color override removed: ${key}`);
    }
    
    /**
     * Get all overrides
     * @returns {Object} Plain object with overrides
     */
    getOverrides() {
        const result = {};
        for (const [key, value] of this.overrides) {
            result[key] = value;
        }
        return result;
    }
    
    /**
     * Set multiple overrides at once (from config)
     * @param {Object} overridesMap - {key: {color, textColor}, ...}
     */
    setOverridesFromConfig(overridesMap) {
        if (!overridesMap || typeof overridesMap !== 'object') return;
        
        for (const [key, value] of Object.entries(overridesMap)) {
            if (value && value.color) {
                this.setOverride(key, value.color, value.textColor || '#fff');
            }
        }
    }
    
    /**
     * Clear all caches (useful for testing)
     */
    clear() {
        this.cache.clear();
        this.overrides.clear();
        this.stats = { hits: 0, misses: 0, overrideUses: 0 };
    }
    
    /**
     * Get cache statistics
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) : 0;
        return {
            ...this.stats,
            hitRate: `${hitRate}%`,
            cacheSize: this.cache.size,
            overrideCount: this.overrides.size
        };
    }
}

// Create singleton instance
const COLOR_CACHE = new ColorCacheSingleton();

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
        editor_layout_label: "Layout",
        editor_layout_entities: "By Entities",
        editor_layout_days: "By Days",
        editor_override_title: "Color Overrides (Manual Mapping)",
        editor_override_description: "Map specific state+unit combinations to colors with custom background and text colors",
        editor_override_value_label: "Value",
        editor_override_unit_label: "Unit",
        editor_override_bg_label: "Background",
        editor_override_text_label: "Text",
        editor_override_add_button: "Add Override",
        editor_override_no_overrides: "No overrides configured",
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
        editor_layout_label: "Disposition",
        editor_layout_entities: "Par Entités",
        editor_layout_days: "Par Jours",
        editor_override_title: "Remplacements de Couleurs (Mapping Manuel)",
        editor_override_description: "Associer des combinaisons état+unité spécifiques à des couleurs avec fond et texte personnalisés",
        editor_override_value_label: "Valeur",
        editor_override_unit_label: "Unité",
        editor_override_bg_label: "Fond",
        editor_override_text_label: "Texte",
        editor_override_add_button: "Ajouter un Remplacement",
        editor_override_no_overrides: "Aucun remplacement configuré",
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
        editor_layout_label: "Layout",
        editor_layout_entities: "Nach Entitäten",
        editor_layout_days: "Nach Tagen",
        editor_override_title: "Farbüberschreibungen (Manuelle Zuordnung)",
        editor_override_description: "Bestimmte Status+Einheit-Kombinationen Farben mit benutzerdefiniertem Hintergrund und Text zuordnen",
        editor_override_value_label: "Wert",
        editor_override_unit_label: "Einheit",
        editor_override_bg_label: "Hintergrund",
        editor_override_text_label: "Text",
        editor_override_add_button: "Überschreibung Hinzufügen",
        editor_override_no_overrides: "Keine Überschreibungen konfiguriert",
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
        editor_layout_label: "Diseño",
        editor_layout_entities: "Por Entidades",
        editor_layout_days: "Por Días",
        editor_override_title: "Sobrescrituras de Color (Mapeo Manual)",
        editor_override_description: "Mapear combinaciones específicas de estado+unidad a colores con fondo y texto personalizados",
        editor_override_value_label: "Valor",
        editor_override_unit_label: "Unidad",
        editor_override_bg_label: "Fondo",
        editor_override_text_label: "Texto",
        editor_override_add_button: "Agregar Sobrescritura",
        editor_override_no_overrides: "No hay sobrescrituras configuradas",
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
        editor_layout_label: "Layout",
        editor_layout_entities: "Por Entidades",
        editor_layout_days: "Por Dias",
        editor_override_title: "Substituições de Cor (Mapeamento Manual)",
        editor_override_description: "Mapear combinações específicas de estado+unidade para cores com fundo e texto personalizados",
        editor_override_value_label: "Valor",
        editor_override_unit_label: "Unidade",
        editor_override_bg_label: "Fundo",
        editor_override_text_label: "Texto",
        editor_override_add_button: "Adicionar Substituição",
        editor_override_no_overrides: "Nenhuma substituição configurada",
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
        editor_layout_label: "Layout",
        editor_layout_entities: "Por Entidades",
        editor_layout_days: "Por Dias",
        editor_override_title: "Substituições de Cor (Mapeamento Manual)",
        editor_override_description: "Mapear combinações específicas de estado+unidade para cores com fundo e texto personalizados",
        editor_override_value_label: "Valor",
        editor_override_unit_label: "Unidade",
        editor_override_bg_label: "Fundo",
        editor_override_text_label: "Texto",
        editor_override_add_button: "Adicionar Substituição",
        editor_override_no_overrides: "Nenhuma substituição configurada",
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

const DAY_MAP = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

/**
 * Centralized translation patterns for condition text
 * Maps regex patterns to their translation handlers
 */
const CONDITION_TRANSLATION_PATTERNS = [
    // Time-based translations (order matters: sunrise before "sun" abbreviations)
    {
        pattern: /\bSunrise\s+condition\b/g,
        key: 'cond_sunrise',
        type: 'simple'
    },
    {
        pattern: /\bSunset\s+condition\b/g,
        key: 'cond_sunset',
        type: 'simple'
    },
    {
        pattern: /\bSunrise\s+after\s+/g,
        template: (t) => `${t('cond_sunrise')} ${t('cond_after')} `,
        type: 'template'
    },
    {
        pattern: /\bSunrise\s+before\s+/g,
        template: (t) => `${t('cond_sunrise')} ${t('cond_before')} `,
        type: 'template'
    },
    {
        pattern: /\bSunset\s+after\s+/g,
        template: (t) => `${t('cond_sunset')} ${t('cond_after')} `,
        type: 'template'
    },
    {
        pattern: /\bSunset\s+before\s+/g,
        template: (t) => `${t('cond_sunset')} ${t('cond_before')} `,
        type: 'template'
    },
    {
        pattern: /\bSunrise\s+>/g,
        template: (t) => `${t('cond_sunrise')} >`,
        type: 'template'
    },
    {
        pattern: /\bSunrise\s+</g,
        template: (t) => `${t('cond_sunrise')} <`,
        type: 'template'
    },
    {
        pattern: /\bSunset\s+>/g,
        template: (t) => `${t('cond_sunset')} >`,
        type: 'template'
    },
    {
        pattern: /\bSunset\s+</g,
        template: (t) => `${t('cond_sunset')} <`,
        type: 'template'
    },

    // Label translations (must come after sunrise/sunset to avoid conflicts)
    {
        pattern: /\bDays:/g,
        key: 'cond_days',
        type: 'labelSuffix'
    },
    {
        pattern: /\bMonth:/g,
        key: 'cond_month',
        type: 'labelSuffix'
    },

    // Logic operators
    {
        pattern: /\sAND\s/g,
        key: 'cond_and',
        type: 'operator'
    },
    {
        pattern: /\sOR\s/g,
        key: 'cond_or',
        type: 'operator'
    },
    {
        pattern: /\bNOT\s+\(/g,
        key: 'cond_not',
        type: 'notOperator'
    }
];

/**
 * Day abbreviations to full day key mapping
 * Used for translating day abbreviations in condition text
 */
const DAY_ABBREVIATION_MAP = {
    "Mon": "mon",
    "Tue": "tue",
    "Wed": "wed",
    "Thu": "thu",
    "Fri": "fri",
    "Sat": "sat",
    "Sun": "sun"
};

/**
 * Centralized layout constants
 * Eliminates magic numbers throughout the codebase
 */
const LAYOUT_CONSTANTS = {
    BLOCK_HEIGHT: 20,
    VERTICAL_GAP: 8,
    TOP_MARGIN: 4,
    BOTTOM_MARGIN: 20,
    ICON_COLUMN_WIDTH: 28,
    MOUSE_STABILIZATION_DELAY: 200,
    DEBOUNCE_DELAY_MS: 500,
    TIMELINE_UPDATE_INTERVAL_MS: 60000, // 1 minute
    MINUTES_PER_DAY: 1440, // 24 * 60
    COLOR_HUE_INCREMENT: 60,
    TOOLTIP_OFFSET_Y: 25,
    TOOLTIP_MARGIN_X: 10,
    TOOLTIP_HIDE_DELAY_MS: 50,
    TOOLTIP_SHOW_DELAY_MS: 200,
    TOGGLE_LOCK_MS: 300,
    HOURS_TO_SHOW: [6, 12, 18],
    MAX_ENTITIES: 50,
    MIN_BLOCK_WIDTH_PX: 30,
    TEXT_CHAR_WIDTH_PX: 6,
    TEXT_CHAR_MARGIN: 2
};

/**
 * Escape HTML special characters for safe text content display
 * "/" is NOT escaped as it's safe in text and common in units (€/kWh, m/s, etc.)
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for innerHTML
 */
function escapeHtml(text) {
    if (!text) return "";
    const str = String(text);
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    };
    return str.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Escape HTML special characters for safe attribute values
 * More strict than escapeHtml - escapes "/" to prevent attribute breakout
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for HTML attributes
 */
function escapeHtmlAttribute(text) {
    if (!text) return "";
    const str = String(text);
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "/": "&#x2F;"
    };
    return str.replace(/[&<>"'/]/g, char => map[char]);
}

class TimeHelper {
    constructor() {
        this.MINUTES_PER_DAY = 1440;
    }

    timeToMinutes(time) {
        if (!time || typeof time !== "string") return 0;
        const parts = time.split(":");
        if (parts.length < 2) return 0;
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        return hours * 60 + minutes;
    }

    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60) % 24;
        const mins = minutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }

    getTimePercentage(time) {
        const totalMinutes = parseInt(time.hours, 10) * 60 + parseInt(time.minutes, 10);
        return (totalMinutes / this.MINUTES_PER_DAY) * 100;
    }

    normalizeBlockTimes(block) {
        let startMin = this.timeToMinutes(block.start);
        let endMin = this.timeToMinutes(block.end);

        if ((block.end === "00:00" || block.end === "00:00:00") && endMin === 0) {
            endMin = this.MINUTES_PER_DAY;
        }
        if (block.end === "23:59" || block.end === "23:59:00") {
            endMin = this.MINUTES_PER_DAY;
        }

        return { startMin, endMin };
    }

    calculateBlockDimensions(startMin, endMin) {
        const left = (startMin / this.MINUTES_PER_DAY) * 100;
        const width = ((endMin - startMin) / this.MINUTES_PER_DAY) * 100;
        return { left, width };
    }

    calculateBorderRadius(width, startMin, endMin, isDefaultBg = false) {
        const MIN_PER_DAY = this.MINUTES_PER_DAY;

        if (width === 100) {
            return isDefaultBg ? "0" : "4px";
        }

        if (isDefaultBg) {
            if (startMin === 0 && endMin < MIN_PER_DAY) {
                return "0 4px 4px 0";
            } else if (startMin > 0 && endMin === MIN_PER_DAY) {
                return "4px 0 0 4px";
            }
            return "0";
        }

        if (endMin <= startMin) {
            return "4px";
        } else if (startMin === 0) {
            return "0 4px 4px 0";
        } else if (endMin === MIN_PER_DAY) {
            return "4px 0 0 4px";
        }

        return "4px";
    }

    _calculateContainerHeight(layerCount, blockHeight = 20, verticalGap = 8, topMargin = 4, bottomMargin = 20) {
        if (layerCount === 0) return topMargin + bottomMargin;
        return topMargin + layerCount * blockHeight + (layerCount - 1) * verticalGap + bottomMargin;
    }
}

class ConditionEvaluator {
    constructor(hass, selectedDay = "mon") {
        this.hass = hass;
        this.selectedDay = selectedDay;
    }

    evaluateCondition(condition) {
        try {
            if (!condition || typeof condition !== "object") return true;
            if (!this.hass) return false;

            const condType = condition.condition;

            if (condType === "time") {
                return this._evaluateTimeCondition(condition);
            }
            if (condType === "state") {
                return this._evaluateStateCondition(condition);
            }
            if (condType === "numeric_state") {
                return this._evaluateNumericStateCondition(condition);
            }
            if (condType === "or") {
                return condition.conditions?.some(c => this.evaluateCondition(c)) ?? true;
            }
            if (condType === "and") {
                return condition.conditions?.every(c => this.evaluateCondition(c)) ?? true;
            }
            if (condType === "not") {
                return !this.evaluateCondition(condition.conditions?.[0]);
            }

            return true;
        } catch (error) {
            errorLog("ConditionEvaluator: erreur évaluation condition", error, condition);
            return false;
        }
    }

    evaluateLayer(layer) {
        if (layer.is_default_layer || layer.is_combined_layer) return false;
        if (!layer.blocks?.length) return true;

        const conditions = this._collectUniqueConditions(layer.blocks);
        if (!conditions.length) return true;

        return conditions.every(c => this.evaluateCondition(c));
    }

    blockAppliesToSelectedDay(block) {
        if (!block.raw_conditions?.length) return true;

        for (const cond of block.raw_conditions) {
            if (cond.condition === "time" && cond.weekday && Array.isArray(cond.weekday)) {
                if (!cond.weekday.includes(this.selectedDay)) {
                    return false;
                }
            }
        }

        return true;
    }

    setSelectedDay(day) {
        this.selectedDay = day;
    }

    _evaluateTimeCondition(condition) {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;

        if (condition.month !== undefined && condition.month !== null) {
            const months = condition.month;
            if (Array.isArray(months) && !months.includes(currentMonth)) return false;
            if (typeof months === "number" && currentMonth !== months) return false;
        }

        if (condition.weekday !== undefined && condition.weekday !== null) {
            const weekdays = condition.weekday;
            if (Array.isArray(weekdays) && !weekdays.includes(this.selectedDay)) return false;
        }

        return true;
    }

    _evaluateStateCondition(condition) {
        const entityId = condition.entity_id;
        if (!entityId || !this.hass.states) return false;

        const entities = Array.isArray(entityId) ? entityId : [entityId];

        if (condition.match === "all") {
            return entities.every(id => {
                const entity = this.hass.states[id];
                return entity?.state === condition.state;
            });
        }

        return entities.some(id => {
            const entity = this.hass.states[id];
            return entity?.state === condition.state;
        });
    }

    _evaluateNumericStateCondition(condition) {
        const entityId = condition.entity_id;
        if (!entityId || !this.hass.states) return false;

        const entities = Array.isArray(entityId) ? entityId : [entityId];

        return entities.some(id => {
            const entity = this.hass.states[id];
            if (!entity) return false;

            const value = parseFloat(entity.state);
            if (isNaN(value)) return false;

            if (condition.above !== undefined && value <= condition.above) return false;
            if (condition.below !== undefined && value >= condition.below) return false;

            return true;
        });
    }

    _collectUniqueConditions(blocks) {
        const conditions = [];
        const seen = new Set();

        for (const block of blocks) {
            if (block.raw_conditions?.length) {
                for (const cond of block.raw_conditions) {
                    const key = JSON.stringify(cond);
                    if (!seen.has(key)) {
                        seen.add(key);
                        conditions.push(cond);
                    }
                }
            }
        }

        return conditions;
    }
}

class CombinedLayerBuilder {
    constructor(timeHelper, conditionEvaluator) {
        this.timeHelper = timeHelper;
        this.conditionEvaluator = conditionEvaluator;
    }

    build(defaultLayer, activeConditionalLayers) {
        if (!defaultLayer) return null;

        const allBlocks = this._collectBlocks(defaultLayer, activeConditionalLayers);
        const sorted = this._sortBlocks(allBlocks, defaultLayer, activeConditionalLayers);
        const filled = this._fillGaps(sorted, defaultLayer, activeConditionalLayers);

        return {
            is_combined_layer: true,
            condition_text: "Combined Schedule",
            blocks: filled
        };
    }

    _collectBlocks(defaultLayer, activeConditionalLayers) {
        const result = [];

        for (const activeLayer of activeConditionalLayers) {
            if (!activeLayer.blocks) continue;

            for (const activeBlock of activeLayer.blocks) {
                if (this.conditionEvaluator.blockAppliesToSelectedDay(activeBlock)) {
                    result.push({
                        ...activeBlock,
                        _source_layer: activeLayer
                    });
                }
            }
        }

        if (defaultLayer.blocks) {
            for (const defBlock of defaultLayer.blocks) {
                result.push({
                    ...defBlock,
                    _source_layer: defaultLayer
                });
            }
        }

        return result;
    }

    _sortBlocks(blocks, defaultLayer, activeConditionalLayers) {
        return blocks.sort((a, b) => {
            const layerIdxA = activeConditionalLayers.indexOf(a._source_layer);
            const layerIdxB = activeConditionalLayers.indexOf(b._source_layer);

            const isADefault = a._source_layer === defaultLayer;
            const isBDefault = b._source_layer === defaultLayer;

            if (isADefault && !isBDefault) return 1;
            if (!isADefault && isBDefault) return -1;

            const startA = this.timeHelper.timeToMinutes(a.start);
            const startB = this.timeHelper.timeToMinutes(b.start);
            if (startA !== startB) return startA - startB;

            const idxA = a.event_idx !== undefined ? a.event_idx : -1;
            const idxB = b.event_idx !== undefined ? b.event_idx : -1;
            return idxB - idxA;
        });
    }

    _fillGaps(layerBlocks, defaultLayer, activeConditionalLayers) {
        if (!layerBlocks?.length) {
            return (defaultLayer.blocks || []).map(b => ({
                ...b,
                _source_layer: defaultLayer
            }));
        }

        const result = [];
        const breakpoints = new Set([0, this.timeHelper.MINUTES_PER_DAY]);

        for (const layer of activeConditionalLayers) {
            for (const block of layerBlocks) {
                if (block._source_layer !== layer) continue;

                const startMin = this.timeHelper.timeToMinutes(block.start);
                let endMin = this.timeHelper.timeToMinutes(block.end);
                if ((block.end === '00:00' || block.end === '00:00:00') && endMin === 0) endMin = this.timeHelper.MINUTES_PER_DAY;

                breakpoints.add(startMin);
                breakpoints.add(endMin);
            }
        }

        const defaultBlocks = defaultLayer.blocks || [];
        for (const defBlock of defaultBlocks) {
            const defStart = this.timeHelper.timeToMinutes(defBlock.start);
            let defEnd = this.timeHelper.timeToMinutes(defBlock.end);
            if ((defBlock.end === '00:00' || defBlock.end === '00:00:00') && defEnd === 0) defEnd = this.timeHelper.MINUTES_PER_DAY;

            breakpoints.add(defStart);
            breakpoints.add(defEnd);
        }

        const sortedBreakpoints = Array.from(breakpoints).sort((a, b) => a - b);

        for (let i = 0; i < sortedBreakpoints.length - 1; i++) {
            const segStart = sortedBreakpoints[i];
            const segEnd = sortedBreakpoints[i + 1];

            let coveringBlocks = [];
            for (const block of layerBlocks) {
                if (block._source_layer === defaultLayer) continue;

                const blockStart = this.timeHelper.timeToMinutes(block.start);
                let blockEnd = this.timeHelper.timeToMinutes(block.end);
                if ((block.end === '00:00' || block.end === '00:00:00') && blockEnd === 0) blockEnd = this.timeHelper.MINUTES_PER_DAY;

                if (blockStart <= segStart && segEnd <= blockEnd) {
                    coveringBlocks.push(block);
                }
            }

            if (coveringBlocks.length > 0) {
                coveringBlocks.sort((a, b) => {
                    const layerIdxA = activeConditionalLayers.indexOf(a._source_layer);
                    const layerIdxB = activeConditionalLayers.indexOf(b._source_layer);

                    if (layerIdxA !== layerIdxB) return layerIdxB - layerIdxA;

                    const aIdx = a.event_idx !== undefined ? a.event_idx : -1;
                    const bIdx = b.event_idx !== undefined ? b.event_idx : -1;
                    return bIdx - aIdx;
                });

                const coveringBlock = coveringBlocks[0];
                const segStartStr = this.timeHelper.minutesToTime(segStart);
                const segEndStr = segEnd === this.timeHelper.MINUTES_PER_DAY ? '00:00' : this.timeHelper.minutesToTime(segEnd);

                result.push({
                    ...coveringBlock,
                    start: segStartStr,
                    end: segEndStr,
                    is_default_bg: false
                });
            } else {
                for (const defBlock of defaultBlocks) {
                    const defStart = this.timeHelper.timeToMinutes(defBlock.start);
                    let defEnd = this.timeHelper.timeToMinutes(defBlock.end);
                    if ((defBlock.end === '00:00' || defBlock.end === '00:00:00') && defEnd === 0) defEnd = this.timeHelper.MINUTES_PER_DAY;

                    if (defStart <= segStart && segEnd <= defEnd) {
                        const segStartStr = this.timeHelper.minutesToTime(segStart);
                        const segEndStr = segEnd === this.timeHelper.MINUTES_PER_DAY ? '00:00' : this.timeHelper.minutesToTime(segEnd);

                        result.push({
                            ...defBlock,
                            start: segStartStr,
                            end: segEndStr,
                            _source_layer: defaultLayer,
                            is_default_bg: true
                        });
                        break;
                    }
                }
            }
        }

        return result;
    }
}

class LanguageHelper {
    /**
     * Centralized language management to eliminate code duplication
     * Used by both ScheduleStateCard and ScheduleStateCardEditor
     */
    constructor(hass) {
        this._hass = hass;
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

    setHass(hass) {
        this._hass = hass;
    }
}

class AppState {
    constructor() {
        // Layer visibility state - tracks which entity layers are expanded/collapsed
        this.layerVisibility = new Map();

        // Timer references - tracks all active timeouts
        this.timers = {
            debounce: null,
            tooltip: null
        };

        // Cache storage - for expensive calculations
        this.caches = {
            colors: new Map(), // Color calculations by state value
            dom: null // DOM metrics (container width, etc.)
        };

        // Timing tracking - for debounce logic
        this.lastUpdateTime = 0;

        // Event listener reference - for cleanup on disconnect
        this.eventListener = null;
    }

    /**
     * Check if a layer is visible (expanded) for a given entity
     * @param {string} entityId - Home Assistant entity ID
     * @returns {boolean} True if layer is visible
     */
    isLayerVisible(entityId) {
        return this.layerVisibility.get(entityId) === true;
    }

    /**
     * Toggle layer visibility for an entity
     * @param {string} entityId - Home Assistant entity ID
     */
    toggleLayerVisibility(entityId, dayId = null) {
        if (this._isToggling) return;
        this._isToggling = true;
        
        const targetDay = dayId || this.selectedDay;
        const visibilityKey = `${entityId}-${targetDay}`;
        
        this._state.toggleLayerVisibility(visibilityKey);
        this.updateContent();
        
        setTimeout(() => {
            this._isToggling = false;
        }, LAYOUT_CONSTANTS.TOGGLE_LOCK_MS);
    }

    /**
     * Set layer visibility state
     * @param {string} entityId - Home Assistant entity ID
     * @param {boolean} visible - New visibility state
     */
    setLayerVisibility(entityId, visible) {
        this.layerVisibility.set(entityId, visible);
    }

    /**
     * Initialize visibility for an entity if not already set
     * @param {string} entityId - Home Assistant entity ID
     * @param {boolean} defaultValue - Default visibility (typically true)
     */
    initializeLayerVisibility(entityId, defaultValue = true) {
        if (!this.layerVisibility.has(entityId)) {
            this.layerVisibility.set(entityId, defaultValue);
        }
    }

    /**
     * Set a timer and clear any previous timer with same key
     * @param {string} timerKey - Timer identifier ('debounce', 'tooltip', etc.)
     * @param {number} timeoutId - Timeout ID to track
     */
    setTimer(timerKey, timeoutId) {
        if (this.timers[timerKey]) {
            clearTimeout(this.timers[timerKey]);
        }
        this.timers[timerKey] = timeoutId;
    }

    /**
     * Clear a specific timer
     * @param {string} timerKey - Timer identifier
     */
    clearTimer(timerKey) {
        if (this.timers[timerKey]) {
            clearTimeout(this.timers[timerKey]);
            this.timers[timerKey] = null;
        }
    }

    /**
     * Clear all active timers
     */
    clearAllTimers() {
        Object.keys(this.timers).forEach(key => this.clearTimer(key));
    }

    /**
     * Invalidate DOM cache to force recalculation
     */
    invalidateDOMCache() {
        this.caches.dom = null;
    }

    /**
     * Set cached DOM metrics
     * @param {object} metrics - Object containing {containerWidth: number}
     */
    setDOMMetrics(metrics) {
        this.caches.dom = metrics;
    }

    /**
     * Get cached DOM metrics or null if not cached
     * @returns {object|null} Cached metrics or null
     */
    getDOMMetrics() {
        return this.caches.dom;
    }

    /**
     * Invalidate all caches to force recalculation
     */
    invalidateAllCaches() {
        this.caches.colors.clear();
        this.caches.dom = null;
    }

    /**
     * Update timing information for debounce logic
     * @param {number} timestamp - Current timestamp (from Date.now())
     */
    updateLastUpdateTime(timestamp) {
        this.lastUpdateTime = timestamp;
    }

    /**
     * Get elapsed time since last update
     * @returns {number} Milliseconds elapsed
     */
    getTimeSinceLastUpdate() {
        return Date.now() - this.lastUpdateTime;
    }

    /**
     * Complete cleanup for disconnection
     * Clears all timers, caches, and resets state
     */
    resetOnDisconnect() {
        this.clearAllTimers();
        this.invalidateAllCaches();
        this.layerVisibility.clear();
        this.eventListener = null;
        this.lastUpdateTime = 0;
    }

    /**
     * Log current state for debugging
     */
    debug() {
        debugLog('AppState Debug:', {
            visibleLayers: Array.from(this.layerVisibility.entries()),
            timers: Object.keys(this.timers).reduce((acc, key) => {
                acc[key] = this.timers[key] !== null ? 'active' : 'null';
                return acc;
            }, {}),
            cachedDOMMetrics: this.caches.dom !== null,
            colorCacheSize: this.caches.colors.size,
            lastUpdateTime: this.lastUpdateTime
        });
    }
}


class ScheduleStateCard extends HTMLElement {
    static get BLOCK_HEIGHT() {
        return LAYOUT_CONSTANTS.BLOCK_HEIGHT;
    }

    static get VERTICAL_GAP() {
        return LAYOUT_CONSTANTS.VERTICAL_GAP;
    }

    static get TOP_MARGIN() {
        return LAYOUT_CONSTANTS.TOP_MARGIN;
    }

    static get BOTTOM_MARGIN() {
        return LAYOUT_CONSTANTS.BOTTOM_MARGIN;
    }

    static get ICON_COLUMN_WIDTH() {
        return LAYOUT_CONSTANTS.ICON_COLUMN_WIDTH;
    }

    static get MOUSE_STABILIZATION_DELAY() {
        return LAYOUT_CONSTANTS.MOUSE_STABILIZATION_DELAY;
    }

    constructor() {
        super();
        this.attachShadow({
            mode: "open"
        });

        this._state = new AppState();
        this._langHelper = new LanguageHelper(null);

        this._config = {};
        this._hass = null;

        this.updateInterval = null;

        this.tooltipElement = null;

        this._colors = {
            ...DEFAULT_COLORS
        };

        this._isToggling = false;

        this.currentTime = this.getCurrentTime();
        this.selectedDay = this.currentTime.day;
        this.selectedEntity = null;

        this._blockMetricsCache = new Map();
        this.timeHelper = new TimeHelper();
        this.conditionEvaluator = null;
        this.combinedLayerBuilder = null;
        
        this._entitySelectorHandler = null;
        this._dayButtonHandlers = [];
    }

    getLanguage() {
        return this._langHelper.getLanguage();
    }

    t(key) {
        return this._langHelper.t(key);
    }

    /**
     * Translate condition text by applying all translation patterns sequentially
     * Patterns are applied in order to avoid conflicts (e.g., sunrise before sun)
     * Replace the old _translateConditionText method with this one
     * 
     * @param {string} text - Raw condition text to translate
     * @returns {string} Fully translated condition text
     */
    _translateConditionText(text) {
        if (!text) return "";

        let translated = text;

        // Apply all translation patterns in sequence with "g" flag to replace all
        for (const pattern of CONDITION_TRANSLATION_PATTERNS) {
            if (pattern.type === 'simple') {
                // Simple key translation: replace with t(key) + ":"
                const replacement = this.t(pattern.key) + ":";
                translated = translated.replace(pattern.pattern, replacement);
            } else if (pattern.type === 'template') {
                // Template translation: use function to generate replacement
                const replacement = pattern.template(this.t.bind(this));
                translated = translated.replace(pattern.pattern, replacement);
            } else if (pattern.type === 'labelSuffix') {
                // Label suffix: replace with t(key) + ":"
                const replacement = this.t(pattern.key) + ":";
                // Use single replace only (not global) to avoid double translation
                translated = translated.replace(pattern.pattern, replacement);
            } else if (pattern.type === 'operator') {
                // Operator: add spaces around translated operator
                const replacement = ` ${this.t(pattern.key)} `;
                translated = translated.replace(pattern.pattern, replacement);
            } else if (pattern.type === 'notOperator') {
                // NOT operator: no space after
                const replacement = `${this.t(pattern.key)} (`;
                translated = translated.replace(pattern.pattern, replacement);
            }
        }

        // Translate day abbreviations (after sunrise/sunset to avoid "Sun" conflicts)
        const dayTranslations = this.t("days");
        for (const [abbr, dayKey] of Object.entries(DAY_ABBREVIATION_MAP)) {
            const translatedDay = dayTranslations[dayKey];
            if (translatedDay) {
                // Use word boundary to avoid matching "Sun" in "Sunrise"
                translated = translated.replace(
                    new RegExp(`\\b${abbr}\\b`, 'g'),
                    translatedDay
                );
            }
        }

        // Clean up any multiple spaces
        translated = translated.replace(/\s+/g, ' ').trim();

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

    /**
     * Get the friendly name of an entity for logging purposes
     * @param {string} entityId - Home Assistant entity ID
     * @returns {string} Friendly name or entity ID if not found
     */
    getEntityNameForLog(entityId) {
        if (!entityId) return '';
        if (!this._hass || !this._hass.states) return entityId;

        const stateObj = this._hass.states[entityId];
        if (!stateObj) return entityId;

        return stateObj.attributes?.friendly_name || entityId;
    }

    /**
     * Toggle layer visibility for an entity on a specific day
     * @param {string} entityId - Home Assistant entity ID
     * @param {string} dayId - Day identifier
     */
    toggleLayerVisibility(entityId, dayId) {
        if (this._isToggling) return;
        this._isToggling = true;

        const visibilityKey = `${entityId}-${dayId}`;
        const currentState = this._state.layerVisibility.get(visibilityKey);
        const newState = !currentState;

        const entityName = this.getEntityNameForLog(entityId);
        debugLog(entityName, "[toggleLayerVisibility] entityId:", entityId, "dayId:", dayId);
        debugLog(entityName, "[toggleLayerVisibility] visibilityKey:", visibilityKey, "currentState:", currentState, "newState:", newState);

        this._state.layerVisibility.set(visibilityKey, newState);
        this.updateContent();

        setTimeout(() => {
            this._isToggling = false;
        }, LAYOUT_CONSTANTS.TOGGLE_LOCK_MS);
    }

    setConfig(config) {
        if (!config || typeof config !== 'object') {
            throw new Error("Invalid configuration: config must be an object");
        }

        let entities = config.entities || [];
        if (!Array.isArray(entities)) {
            throw new Error("Invalid configuration: entities must be an array");
        }
        if (entities.length > LAYOUT_CONSTANTS.MAX_ENTITIES) {
            debugWarn(`Too many entities (${entities.length}), limiting to ${LAYOUT_CONSTANTS.MAX_ENTITIES}`);
            entities = entities.slice(0, LAYOUT_CONSTANTS.MAX_ENTITIES);
        }

        const validatedEntities = entities
            .map((e, idx) => this._validateEntity(e, idx))
            .filter(e => e !== null);

        if (validatedEntities.length === 0 && entities.length > 0) {
            debugWarn(" No valid entities found in configuration");
        }

        const validatedColors = this._validateColors(config.colors);
        const validatedTitle = this._validateTitle(config.title);
        const layout = config.layout === "entities" ? "entities" : "days";

        this._config = {
            type: config.type,
            title: validatedTitle,
            entities: validatedEntities,
            show_state_in_title: config.show_state_in_title !== false,
            colors: validatedColors,
            layout: layout,
            color_overrides: config.color_overrides || {},
            card_mod: config.card_mod || null
        };

        this._colors = {
            ...DEFAULT_COLORS,
            ...this._config.colors
        };

        // Apply color overrides to the global singleton cache
        if (this._config.color_overrides && typeof this._config.color_overrides === 'object') {
            COLOR_CACHE.setOverridesFromConfig(this._config.color_overrides);
            debugLog(`Applied ${Object.keys(this._config.color_overrides).length} color overrides`);
        }

        if (this._hass) this.render();
    }

    initializeServices(hass) {
        if (!this.timeHelper) {
            this.timeHelper = new TimeHelper();
        }
        if (!this.conditionEvaluator) {
            this.conditionEvaluator = new ConditionEvaluator(hass, this.selectedDay);
        } else {
            this.conditionEvaluator.hass = hass;
            this.conditionEvaluator.setSelectedDay(this.selectedDay);
        }
        if (!this.combinedLayerBuilder) {
            this.combinedLayerBuilder = new CombinedLayerBuilder(this.timeHelper, this.conditionEvaluator);
        }
    }

    _validateEntity(entity, index) {
        /**
         * Validate a single entity configuration object
         * Returns validated entity or null if invalid
         */
        try {
            // Handle string entity IDs
            if (typeof entity === 'string') {
                const trimmedId = entity.trim();
                if (!trimmedId) {
                    debugWarn(` Entity at index ${index} is empty`);
                    return null;
                }
                if (!trimmedId.includes('.')) {
                    debugWarn(` Invalid entity ID format: "${trimmedId}"`);
                    return null;
                }
                return {
                    entity: trimmedId,
                    name: '',
                    icon: ''
                };
            }

            // Handle object entity configs
            if (typeof entity !== 'object' || entity === null) {
                debugWarn(` Entity at index ${index} must be string or object`);
                return null;
            }

            const entityId = String(entity.entity || '').trim();
            if (!entityId) {
                debugWarn(` Entity at index ${index} missing 'entity' field`);
                return null;
            }
            if (!entityId.includes('.')) {
                debugWarn(` Invalid entity ID format: "${entityId}"`);
                return null;
            }

            return {
                entity: entityId,
                name: String(entity.name || '').trim().substring(0, 200),
                icon: String(entity.icon || '').trim().substring(0, 100)
            };
        } catch (error) {
            errorLog(` Error validating entity at index ${index}:`, error);
            return null;
        }
    }

    _validateColors(colors) {
        /**
         * Validate color configuration
         * Returns valid colors or defaults
         * Accepts: hex colors, CSS variables, and color names
         */
        if (!colors || typeof colors !== 'object') {
            return {
                ...DEFAULT_COLORS
            };
        }

        const validated = {
            ...DEFAULT_COLORS
        };

        for (const [key, value] of Object.entries(colors)) {
            try {
                if (!value) continue;
                
                const strValue = String(value).trim();
                
                // Accept CSS variables (var(...))
                if (strValue.includes('var(')) {
                    validated[key] = strValue;
                    continue;
                }
                
                // Accept hex colors
                if (/^#[0-9A-F]{6}$/i.test(strValue)) {
                    validated[key] = strValue;
                    continue;
                }
                
                // Accept RGB/RGBA colors
                if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/.test(strValue)) {
                    validated[key] = strValue;
                    continue;
                }
                
                // Accept HSL/HSLA colors
                if (/^hsla?\(\s*\d+(\.\d+)?\s*,\s*\d+(\.\d+)?%\s*,\s*\d+(\.\d+)?%\s*(,\s*[\d.]+)?\s*\)$/.test(strValue)) {
                    validated[key] = strValue;
                    continue;
                }
                
                // If color format is invalid, use default
                debugWarn(` Invalid color format for key "${key}": "${strValue}". Using default.`);
                
            } catch (error) {
                debugWarn(` Error validating color for key "${key}":`, error);
            }
        }

        return validated;
    }

    _validateTitle(title) {
        /**
         * Validate card title
         * Limit length to prevent memory issues
         */
        if (!title) return '';

        try {
            const str = String(title).trim();
            // Limit title to 500 characters
            return str.substring(0, 500);
        } catch (error) {
            errorLog("Schedule State Card: Error validating title:", error);
            return '';
        }
    }

    set hass(hass) {
        this.initializeServices(hass);
        this._hass = hass;
        this._langHelper.setHass(hass);
        if (this._config?.entities && !this.shadowRoot.querySelector("ha-card")) {
            this.render();
        }

        const now = Date.now();
        const timeSinceLastUpdate = this._state.getTimeSinceLastUpdate();

        if (timeSinceLastUpdate < 500) {
            const newTimer = setTimeout(() => {
                this.updateContent();
                this._state.updateLastUpdateTime(Date.now());
            }, 500);

            this._state.setTimer('debounce', newTimer);
        } else {
            this.updateContent();
            this._state.updateLastUpdateTime(now);
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
            colors: {
                ...DEFAULT_COLORS
            }
        };
    }

    getCardSize() {
        return this._config.entities.length + 2;
    }

    get type() {
        return this._config.type || 'custom:schedule-state-card';
    }

    getDays() {
        const dayTranslations = this.t("days");
        return DAY_ORDER.map(id => ({
            id,
            label: dayTranslations[id]
        }));
    }

    getCurrentTime() {
        const now = new Date();
        return {
            day: DAY_MAP[now.getDay()],
            hours: String(now.getHours()).padStart(2, "0"),
            minutes: String(now.getMinutes()).padStart(2, "0")
        };
    }

    isToday() {
        return this.selectedDay === this.currentTime.day;
    }

    /**
     * Updated startTimelineUpdate method - use LAYOUT_CONSTANTS
     * Replace the existing startTimelineUpdate method with this one
     */
    startTimelineUpdate() {
        // Always stop existing interval first to prevent duplicates
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // Create new interval using centralized constant
        this.updateInterval = setInterval(() => {
            const previousDay = this.currentTime.day;
            this.currentTime = this.getCurrentTime();

            // Auto-sync selectedDay if we were viewing today and day changed (midnight passed)
            // This ensures cursor remains visible when day transitions
            if (this.selectedDay === previousDay && previousDay !== this.currentTime.day) {
                this.selectedDay = this.currentTime.day;
                // Re-render content for the new day to update timeline containers
                this.updateContent();
                return; // updateContent already calls updateTimeline
            }

            this.updateTimeline();
        }, LAYOUT_CONSTANTS.TIMELINE_UPDATE_INTERVAL_MS);
    }

    /**
     * Updated stopTimelineUpdate method
     * This is already correct but keep it as-is
     */
    stopTimelineUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Lifecycle hook - called when component is removed from DOM
     * Cleans all listeners and timers to prevent memory leaks
     */
    disconnectedCallback() {
        // Stop timeline updates
        this.stopTimelineUpdate();

        // Clean all timers stored in _state
        if (this._state && this._state.timers) {
            if (this._state.timers.debounce) {
                clearTimeout(this._state.timers.debounce);
            }
            if (this._state.timers.tooltip) {
                clearTimeout(this._state.timers.tooltip);
            }
        }

        // Clean global event listener from content
        if (this._state && this._state.eventListener) {
            const content = this.shadowRoot?.querySelector("#content");
            if (content) {
                this._detachEventHandlers(content, this._state.eventListener);
            }
        }

        // Clean day button handlers
        if (this._dayButtonHandlers && this._dayButtonHandlers.length > 0) {
            const buttons = this.shadowRoot?.querySelectorAll(".day-button");
            if (buttons) {
                buttons.forEach((btn, idx) => {
                    if (this._dayButtonHandlers[idx]) {
                        btn.removeEventListener("click", this._dayButtonHandlers[idx]);
                    }
                });
            }
        }

        // Clean entity selector handler
        if (this._entitySelectorHandler) {
            const selector = this.shadowRoot?.querySelector("#entity-selector");
            if (selector) {
                selector.removeEventListener("change", this._entitySelectorHandler);
            }
        }

        // Clean references
        this._state = null;
        this._dayButtonHandlers = [];
        this._entitySelectorHandler = null;
        this.tooltipElement = null;
    }

    /**
     * Updated updateTimeline method
     * Replace the existing updateTimeline method with this one
     */
    updateTimeline() {
        const timePercentage = this.timeHelper.getTimePercentage(this.currentTime);
        this._updateTimelineCursors(timePercentage);
    }

    getPerceivedLuminance(h, s, l) {
        const c = (s / 100) * (1 - Math.abs(2 * (l / 100) - 1));
        const h_prime = h / 60;
        let r_prime, g_prime, b_prime;
        if (h_prime <= 1) {
            r_prime = c;
            g_prime = c * h_prime;
            b_prime = 0;
        } else if (h_prime <= 2) {
            r_prime = c * (2 - h_prime);
            g_prime = c;
            b_prime = 0;
        } else if (h_prime <= 3) {
            r_prime = 0;
            g_prime = c;
            b_prime = c * (h_prime - 2);
        } else if (h_prime <= 4) {
            r_prime = 0;
            g_prime = c * (4 - h_prime);
            b_prime = c;
        } else if (h_prime <= 5) {
            r_prime = c * (h_prime - 4);
            g_prime = 0;
            b_prime = c;
        } else {
            r_prime = c;
            g_prime = 0;
            b_prime = c * (6 - h_prime);
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
        const cacheKey = `${stateValue}|${unit}`;

        // Check GLOBAL singleton cache first (shared across all instances)
        let cachedColor = COLOR_CACHE.get(cacheKey);
        if (cachedColor) {
            debugLog(`Color cache HIT: ${cacheKey} => ${cachedColor.color}`);
            return cachedColor;
        }

        // Calculate color (existing logic)
        let valueStr = String(stateValue === null || stateValue === undefined ? "" : stateValue).trim();
        const numMatch = valueStr.match(/^[\d.]+/);
        if (numMatch) valueStr = String(parseFloat(numMatch[0]));

        const unitStr = String(unit === null || unit === undefined ? "" : unit).trim();

        let str;
        if (unitStr) {
            str = valueStr ? `V:${valueStr}|U:${unitStr}` : `V:${unitStr}|U:${unitStr}`;
        } else {
            str = valueStr ? `V:${valueStr}` : "";
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

        const result = {
            color: hsl,
            textColor: textColor
        };

        // Store in GLOBAL singleton cache
        COLOR_CACHE.set(cacheKey, result);
        debugLog(`Color cache MISS + STORE: ${cacheKey} => ${hsl}`);

        return result;
    }

    /**
     * Build CSS style string for a schedule block
     * Centralizes block styling logic
     * 
     * @param {Object} params - Style parameters object
     * @returns {string} CSS style string
     */
    _buildBlockStyle(params) {
        const {
            left,
            width,
            top,
            borderRadius,
            textColor,
            backgroundColor
        } = params;

        const validatedBgColor = this.validateStyleValue(backgroundColor);
        const validatedTextColor = this.validateStyleValue(textColor);

        return `left:${left}%;width:${width}%;top:${top}px;border-radius:${borderRadius};color:${validatedTextColor};background-color:${validatedBgColor};`;
    }

    /**
     * Format time for display by removing seconds if present
     * @param {string} time - Time string (e.g., "14:30:00" or "14:30")
     * @returns {string} Formatted time without seconds (e.g., "14:30")
     */
    _formatTimeForDisplay(time) {
        if (!time) return time;
        // Remove seconds if present (HH:MM:SS -> HH:MM)
        return time.substring(0, 5);
    }

    /**
     * Generate tooltip text for a schedule block
     * Centralizes tooltip generation logic
     *
     * @param {Object} params - Tooltip parameters object
     * @returns {string} Formatted tooltip text
     */
    _buildBlockTooltip(params) {
        const {
            block,
            isWrapped,
            isDynamic,
            isCombined,
            isDefault,
            escapedState,
            escapedUnit
        } = params;

        let tooltipText = this.t("time_label") + ": ";

        // Time portion
        if (isWrapped) {
            const originalStart = this._formatTimeForDisplay(block.original_start || block.start);
            const originalEnd = this._formatTimeForDisplay(block.original_end || block.end);
            tooltipText += `${originalStart} - ${originalEnd} (${this.t("wrapping")})`;
        } else {
            const displayStart = this._formatTimeForDisplay(block.start);
            const displayEnd = this._formatTimeForDisplay(block.end);
            tooltipText += `${displayStart} - ${displayEnd}`;
        }

        // State portion
        tooltipText += `\n🌡️ ${this.t("state_label")}: ${escapedState}`;
        if (escapedUnit) tooltipText += ` ${escapedUnit}`;

        // Layer source
        if (isCombined) {
            tooltipText += `\n(${this.t("cond_combined_result")})`;
        } else if (isDefault) {
            tooltipText += `\n(${this.t("default_state_label")})`;
        }

        // Dynamic value reference
        if (isDynamic) {
            const entity = this.extractEntityFromTemplate(block.raw_state_template || block.state_value);
            const blockIcon = block.icon || "mdi:calendar";

            if (blockIcon === "mdi:refresh") {
                const refText = entity ? ` (${this.t("dynamic_ref_schedule")}: ${escapeHtml(entity)})` : "";
                tooltipText += `\n🔄 ${this.t("dynamic_value")}${refText}`;
            } else {
                const refText = entity ? ` (${this.t("dynamic_ref_sensor")}: ${escapeHtml(entity)})` : "";
                tooltipText += `\n📊 ${this.t("dynamic_value")}${refText}`;
            }
        }

        // Block description
        if (block.description) {
            tooltipText += `\n💬 ${escapeHtml(block.description)}`;
        }

        return tooltipText;
    }

    sanitizeUrl(url) {
        // Handle empty/null
        if (!url) return "";

        const str = String(url).trim().toLowerCase();

        // Block dangerous protocols
        if (str.startsWith("javascript:") ||
            str.startsWith("data:") ||
            str.startsWith("vbscript:") ||
            str.startsWith("file:")) {
            debugWarn("Blocked unsafe URL protocol:", url);
            return "";
        }

        // Allow safe URLs
        if (str.startsWith("http://") ||
            str.startsWith("https://") ||
            str.startsWith("/") ||
            str.startsWith("./") ||
            str.startsWith("../")) {
            return url;
        }

        // Default: allow if no protocol (relative URLs)
        return url;
    }

    createSafeElement(tagName, attributes = {}, textContent = "") {
        // Create the element
        const element = document.createElement(tagName);

        // Set attributes safely
        for (const [key, value] of Object.entries(attributes)) {
            // Skip dangerous attributes
            if (key.toLowerCase().startsWith("on")) {
                debugWarn("Blocked event handler attribute:", key);
                continue;
            }

            // Sanitize URLs in href/src
            if (key.toLowerCase() === "href" || key.toLowerCase() === "src") {
                const sanitized = this.sanitizeUrl(value);
                if (sanitized) {
                    element.setAttribute(key, sanitized);
                }
                continue;
            }

            // Set other attributes
            element.setAttribute(key, String(value));
        }

        // Set text content (NOT innerHTML) to prevent XSS
        if (textContent) {
            element.textContent = textContent;
        }

        return element;
    }

    /**
     * Generate CSS style string for layer icon
     * Centralizes icon styling logic
     * 
     * @param {Object} params - Icon style parameters object
     * @returns {string} CSS style string
     */
    _buildIconStyle(params) {
        const {
            isActive,
            isCombined,
            isUnfolded,
            isSelectedDayToday
        } = params;

        let bgColor;
        let filter = "filter:brightness(1.1);";

        if (isCombined) {
            bgColor = isUnfolded ?
                this._colors.combined_unfolded_layer :
                this._colors.combined_folded_layer;
            filter = isUnfolded ? "filter:brightness(1.3);" : "filter:brightness(1.1);";
        } else {
            bgColor = isActive ?
                this._colors.active_layer :
                this._colors.inactive_layer;
            filter = isActive ? "filter:brightness(1.3);" : "";
        }

        const opacity = !isSelectedDayToday ? "opacity:0.5;" : "";
        const brightnessAdjust = !isSelectedDayToday ? "filter:brightness(0.8);" : filter;

        return `background:${bgColor};${opacity}${brightnessAdjust}`;
    }

    /**
     * Update timeline cursor position if today is selected
     * Centralizes cursor update logic with bounds checking
     * 
     * @param {number} timePercentage - Current time as percentage of day
     */
    _updateTimelineCursors(timePercentage) {
        const allContainers = this.shadowRoot?.querySelectorAll(".blocks-container");
        if (!allContainers || allContainers.length === 0) {
            return;
        }

        // In layout "entities", each day has its own container with data-day attribute
        // In layout "days", only one day is shown at a time
        const currentDay = this.currentTime.day;

        allContainers.forEach((container) => {
            let cursor = container.querySelector(".time-cursor");
            const containerDay = container.getAttribute("data-day");

            // Show cursor only if:
            // - No data-day attribute (layout "days") AND we're viewing today
            // - data-day matches current day (layout "entities")
            const shouldShowCursor =
                (!containerDay && this.isToday()) ||
                (containerDay === currentDay);

            if (!shouldShowCursor) {
                // Hide cursor for this container
                if (cursor) {
                    cursor.style.display = "none";
                }
                return;
            }

            // Show and position cursor for current day
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

    validateStyleValue(value) {
        /**
         * SECURITY FIX: Whitelist approach for CSS values
         * Prevents CSS injection attacks
         * Now accepts CSS variables with proper validation
         */
        if (!value) return "";

        const original = String(value).trim();
        const lower = original.toLowerCase();

        // Allow CSS variables (they're safe when properly formed)
        if (/^var\(--[a-z0-9-]+(\s*,\s*#[0-9a-f]{6}|rgba?\([^)]+\)|hsla?\([^)]+\))?\)$/i.test(original)) {
            return original;
        }

        // Blacklist: Reject dangerous patterns
        const dangerousPatterns = [
            "expression(",
            "javascript:",
            "behavior:",
            "binding(",
            "@import",
            "-webkit-binding",
        ];

        for (const pattern of dangerousPatterns) {
            if (lower.includes(pattern)) {
                debugWarn("CSS validation: Blocked dangerous CSS pattern:", pattern);
                return "";
            }
        }

        // Whitelist: Accept known safe formats

        // HSL color format
        if (/^hsl\(\s*\d+(\.\d+)?\s*,\s*\d+(\.\d+)?%\s*,\s*\d+(\.\d+)?%\s*\)$/.test(original)) {
            return original;
        }

        // Hex color format
        if (/^#[0-9A-F]{6}$/i.test(original)) {
            return original;
        }

        // RGB/RGBA color format
        if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/.test(original)) {
            return original;
        }

        // Pixel/em/rem/percent units
        if (/^\d+(\.\d+)?(px|em|rem|%|vh|vw|ch)$/i.test(original)) {
            return original;
        }

        // Plain numbers (for opacity, etc)
        if (/^\d+(\.\d+)?(px|em|rem|%|vh|vw|ch)?$/.test(original)) {
            return original;
        }

        // If not in whitelist, reject
        debugWarn("CSS validation: Rejected non-whitelisted CSS value:", value);
        return "";
    }

    decodeHtmlEntities(text) {
        const map = {
            "&amp;": "&",
            "&lt;": "<",
            "&gt;": ">",
            "&quot;": '"',
            "&#39;": "'"
        };
        return String(text).replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, m => map[m]);
    }

    truncateText(text, maxWidthPx) {
        if (!text || typeof text !== "string") return text;
        if (maxWidthPx < LAYOUT_CONSTANTS.MIN_BLOCK_WIDTH_PX) return "...";

        const maxChars = Math.floor(maxWidthPx / LAYOUT_CONSTANTS.TEXT_CHAR_WIDTH_PX) 
                         - LAYOUT_CONSTANTS.TEXT_CHAR_MARGIN;

        if (maxChars <= 0) return "...";
        if (text.length <= maxChars) return text;

        // Return truncated text (caller will escape)
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

    getCachedDOMMetrics() {
        // Get from centralized cache
        let metrics = this._state.getDOMMetrics();

        if (metrics) {
            return metrics;
        }

        // Calculate metrics if not cached
        const container = this.shadowRoot.querySelector(".timeline-container");

        // Safety check: if container doesn't exist, use default width
        if (!container) {
            debugWarn("Timeline container not found, using default width");
            metrics = {
                containerWidth: 800
            };
        } else {
            // Get actual container width from DOM
            const containerWidth = container.offsetWidth || 800;
            metrics = {
                containerWidth
            };
        }

        // Store in centralized cache
        this._state.setDOMMetrics(metrics);

        return metrics;
    }

    invalidateDOMMetrics() {
        // ✅ INVALIDATE CENTRALIZED CACHE
        this._state.invalidateDOMCache();
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
            errorLog("Schedule card: Math eval failed:", cleanedExpr, e);
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
            errorLog("Schedule card: condition evaluation failed", e);
            return false;
        }
    }


    _evaluateConditionsForLayer(layer) {
        if (!this.conditionEvaluator) return true;
        this.conditionEvaluator.setSelectedDay(this.selectedDay);
        return this.conditionEvaluator.evaluateLayer(layer);
    }

    _evaluateCondition(condition) {
        if (!this.conditionEvaluator) return true;
        this.conditionEvaluator.setSelectedDay(this.selectedDay);
        return this.conditionEvaluator.evaluateCondition(condition);
    }

    createCombinedLayer(layers, selectedDay) {
        if (!this.combinedLayerBuilder) return null;

        const defaultLayer = layers.find(l => l.is_default_layer);
        const activeConditionalLayers = layers.filter(l => 
            !l.is_default_layer && 
            !l.is_combined_layer && 
            this._evaluateConditionsForLayer(l)
        );

        return this.combinedLayerBuilder.build(defaultLayer, activeConditionalLayers);
    }

    _getBlockMetrics(block) {
        const startMin = this.timeHelper.timeToMinutes(block.start);
        let endMin = this.timeHelper.timeToMinutes(block.end);

        if ((block.end === "00:00" || block.end === "00:00:00") && endMin === 0) {
            endMin = LAYOUT_CONSTANTS.MINUTES_PER_DAY;
        }
        const dimensions = this.timeHelper.calculateBlockDimensions(startMin, endMin);
        const borderRadius = this.timeHelper.calculateBorderRadius(
            dimensions.width,
            startMin,
            endMin,
            block.is_default_bg || false
        );
        return {
            startMin,
            endMin,
            dimensions,
            borderRadius
        };
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

    ensureTooltipElement() {
        // Check if tooltip exists and is still in the DOM
        if (!this.tooltipElement || !document.body.contains(this.tooltipElement)) {
            this.tooltipElement = document.createElement("div");
            this.tooltipElement.className = "custom-tooltip";

            this.tooltipElement.style.cssText = `
                position:fixed;
                background:var(--primary-background-color,#1a1a1a);
                color:var(--primary-text-color,white);
                padding:8px 12px;
                border-radius:4px;
                border:1px solid var(--divider-color,#333);
                font-size:12px;
                z-index:9999;
                max-width:300px;
                word-wrap:break-word;
                box-shadow:0 2px 8px rgba(0,0,0,0.3);
                pointer-events:none;
                white-space:pre-line;
                display:none;
            `;

            // Append to document.body for proper fixed positioning
            document.body.appendChild(this.tooltipElement);
        }

        return this.tooltipElement;
    }

    colorizeParentheses(text) {
        let result = "";
        let depth = 0;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            if (char === "(") {
                const hue = (depth * 60) % 360;
                // Validate hue value to prevent CSS injection
                const safeHue = this.validateStyleValue(String(hue));
                const color = `hsl(${safeHue}, 80%, 70%)`;

                // Use single quotes for style attribute to avoid double escaping issues
                result += `<span style='color:${this.validateStyleValue(color)};font-weight:bold;'>(</span>`;
                depth++;
            } else if (char === ")") {
                depth = Math.max(0, depth - 1);
                const hue = (depth * 60) % 360;
                // Validate hue value to prevent CSS injection
                const safeHue = this.validateStyleValue(String(hue));
                const color = `hsl(${safeHue}, 80%, 70%)`;

                // Use single quotes for style attribute
                result += `<span style='color:${this.validateStyleValue(color)};font-weight:bold;'>)</span>`;
            } else if (char === "<") {
                result += "&lt;";
            } else if (char === ">") {
                result += "&gt;";
            } else if (char === "&") {
                result += "&amp;";
            } else if (char === '"') {
                result += "&quot;";
            } else if (char === "'") {
                result += "&#39;";
            } else if (char === "\n") {
                result += "<br>";
            } else {
                result += char;
            }
        }

        return result;
    }

    showTooltip(event, text) {
        const tooltip = this.ensureTooltipElement();

        // SECURITY FIX: Use textContent instead of innerHTML to prevent XSS
        // This eliminates all HTML/script injection vectors since no HTML parsing occurs
        const decoded = this.decodeHtmlEntities(text);
        const textWithNewlines = decoded.replace(/\\n/g, "\n");

        tooltip.textContent = textWithNewlines;

        // Temporarily show tooltip to get dimensions (invisible but rendered)
        tooltip.style.visibility = "hidden";
        tooltip.style.display = "block";

        const x = event.clientX;
        const y = event.clientY;
        const tooltipRect = tooltip.getBoundingClientRect();

        let top = y - tooltipRect.height - LAYOUT_CONSTANTS.TOOLTIP_OFFSET_Y;
        if (top < 0) top = y + LAYOUT_CONSTANTS.TOOLTIP_OFFSET_Y;

        let left = x + 15;
        if (left + tooltipRect.width > window.innerWidth - LAYOUT_CONSTANTS.TOOLTIP_MARGIN_X) {
            left = window.innerWidth - tooltipRect.width - LAYOUT_CONSTANTS.TOOLTIP_MARGIN_X;
        }

        if (typeof left === "number" && isFinite(left)) {
            tooltip.style.left = left + "px";
        }
        if (typeof top === "number" && isFinite(top)) {
            tooltip.style.top = top + "px";
        }

        // Make tooltip visible
        tooltip.style.visibility = "visible";
        tooltip.style.display = "block";
    }

    hideTooltip() {
        if (this.tooltipElement) {
            this.tooltipElement.style.display = "none";
        }
    }

    clearTooltipTimer() {
        // ✅ USE CENTRALIZED STATE for timer management
        this._state.clearTimer('tooltip');
    }

    /**
     * Updated scheduleTooltipDisplay method - use LAYOUT_CONSTANTS
     * Replace the existing scheduleTooltipDisplay method with this one
     */
    scheduleTooltipDisplay(event, text) {
        // Clear any pending tooltip timer
        this.clearTooltipTimer();

        // Schedule new tooltip with stabilization delay
        const timerId = setTimeout(() => {
            this.showTooltip(event, text);
        }, LAYOUT_CONSTANTS.MOUSE_STABILIZATION_DELAY);

        // Store timer reference in centralized state
        this._state.setTimer('tooltip', timerId);
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

    /**
     * Attaches the same event listeners to an element for multiple events
     * @param {HTMLElement} element - Target element
     * @param {Function} handler - The handler function
     * @param {string[]} events - Events to attach (default: click, mouseover, mouseout)
     */
    _attachEventHandlers(element, handler, events = ["click", "mouseover", "mouseout"]) {
        if (!element || !handler) return;
        events.forEach(event => {
            element.addEventListener(event, handler);
        });
    }

    /**
     * Detaches the same event listeners from an element for multiple events
     * @param {HTMLElement} element - Target element
     * @param {Function} handler - The handler function
     * @param {string[]} events - Events to detach (default: click, mouseover, mouseout)
     */
    _detachEventHandlers(element, handler, events = ["click", "mouseover", "mouseout"]) {
        if (!element || !handler) return;
        events.forEach(event => {
            element.removeEventListener(event, handler);
        });
    }

    /**
     * Safe access to shadowRoot.querySelector
     * @param {string} selector - CSS selector to query
     * @returns {HTMLElement|null} The element or null if shadowRoot is absent
     */
    _queryShadowRoot(selector) {
        if (!this.shadowRoot) {
            debugWarn(`Shadow DOM not available for selector: ${selector}`);
            return null;
        }
        try {
            return this.shadowRoot.querySelector(selector);
        } catch (e) {
            errorLog(`querySelector error for ${selector}:`, e);
            return null;
        }
    }

    /**
     * Safe access to shadowRoot.querySelectorAll
     * @param {string} selector - CSS selector to query
     * @returns {NodeList} List of elements (empty if shadowRoot is absent)
     */
    _queryShadowRootAll(selector) {
        if (!this.shadowRoot) {
            debugWarn(`Shadow DOM not available for selector: ${selector}`);
            return [];
        }
        try {
            return this.shadowRoot.querySelectorAll(selector);
        } catch (e) {
            errorLog(`querySelectorAll error for ${selector}:`, e);
            return [];
        }
    }

    attachAllListeners() {
        const container = this._queryShadowRoot("#content");

        if (!container) return;

        // Remove old listener if it exists (CRITICAL: prevents memory leaks)
        // Clean old listeners
        if (this._state.eventListener) {
            this._detachEventHandlers(container, this._state.eventListener);
        }

        // Define unified event handler - MUST be arrow function to preserve 'this'
        const handler = (e) => {
            // Ensure this is the ScheduleStateCard instance
            if (!this.toggleLayerVisibility) {
                errorLog("Handler context error: toggleLayerVisibility not found");
                return;
            }

            // Room name click - open entity info dialog
            const roomNameTarget = e.target.closest(".room-name");
            if (e.type === "click" && roomNameTarget) {
                const entityId = roomNameTarget.dataset.entityId;
                if (entityId && this._hass) {
                    this.fireEvent(this, 'hass-more-info', {
                        entityId: entityId
                    });
                }
                e.stopPropagation();
                e.preventDefault();
                return;
            }

            // Combined layer toggle click
            const toggleTarget = e.target.closest(".combined-layer-toggle");
            if (e.type === "click" && toggleTarget) {
                this.clearTooltipTimer();
                this.hideTooltip();
                const entityId = toggleTarget.dataset.entityId;
                const dayId = toggleTarget.dataset.day;
                const entityName = this.getEntityNameForLog(entityId);

                debugLog(entityName, "[Toggle Click] entityId:", entityId, "dayId:", dayId, "hasDataDay:", !!toggleTarget.dataset.day);

                if (entityId && dayId) {
                    debugLog(entityName, "[Toggle Click] Calling toggleLayerVisibility");
                    this.toggleLayerVisibility(entityId, dayId);
                } else if (entityId) {
                    debugLog(entityName, "[Toggle Click] Missing dayId, falling back to selectedDay:", this.selectedDay);
                    this.toggleLayerVisibility(entityId, this.selectedDay);
                }
                e.stopPropagation();
                return;
            }

            // Tooltip hover display
            const tooltipTarget = e.target.closest(".schedule-block, .icon-row[data-tooltip]");

            if (e.type === "mouseover" && tooltipTarget) {
                const tooltip = tooltipTarget.dataset.tooltip;
                this.clearTooltipTimer();

                if (tooltip) {
                    const eventData = {
                        clientX: e.clientX,
                        clientY: e.clientY
                    };
                    this.scheduleTooltipDisplay(eventData, tooltip);
                }
            }
            // Tooltip hide on mouse leave
            else if (e.type === "mouseout") {
                this.clearTooltipTimer();
                setTimeout(() => this.hideTooltip(), LAYOUT_CONSTANTS.TOOLTIP_HIDE_DELAY_MS);
            }
        };

        // Attacher les handlers en utilisant la helper
        this._attachEventHandlers(container, handler);

        // Store listener reference in centralized state for cleanup
        this._state.eventListener = handler;
    }

    attachDayButtonListeners() {
        const dayButtons = this.shadowRoot.querySelectorAll(".day-button");
        dayButtons.forEach((button, idx) => {
            if (this._dayButtonHandlers[idx]) {
                button.removeEventListener("click", this._dayButtonHandlers[idx]);
            }
            this._dayButtonHandlers[idx] = (e) => {
                const newDay = e.target.dataset.day;
                if (newDay !== this.selectedDay) {
                    dayButtons.forEach(btn => btn.classList.remove("active"));
                    e.target.classList.add("active");
                    this.selectedDay = newDay;
                    this.updateContent();
                }
            };
            button.addEventListener("click", this._dayButtonHandlers[idx]);
        });
    }

    attachEntitySelectorListener() {
        const selector = this.shadowRoot.querySelector("#entity-selector");

        if (selector) {
            if (this._entitySelectorHandler) {
                selector.removeEventListener("change", this._entitySelectorHandler);
            }
            this._entitySelectorHandler = (e) => {
                this.selectedEntity = e.target.value;
                this.updateContent();
            };
            selector.addEventListener("change", this._entitySelectorHandler);

            // Force the select to open on click (swipe-card workaround)
            selector.addEventListener("click", (e) => {
                e.stopPropagation();
                // Force the select to open
                setTimeout(() => {
                    if (selector.showPicker) {
                        try {
                            selector.showPicker();
                        } catch (err) {
                            selector.focus();
                        }
                    } else {
                        selector.focus();
                    }
                }, 0);
            }, { capture: true });

            // Prevent swipe-card from intercepting drag/swipe on the selector
            const handleMove = (e) => {
                // Block swipe movements, but not clicks
                e.stopPropagation();
                e.stopImmediatePropagation();
            };

            selector.addEventListener("touchmove", handleMove, { capture: true, passive: false });
            selector.addEventListener("mousemove", handleMove, { capture: true });

            // Also protect the wrapper from swipes
            const wrapper = this.shadowRoot.querySelector(".entity-selector-wrapper");
            if (wrapper) {
                wrapper.addEventListener("touchmove", handleMove, { capture: true, passive: false });
                wrapper.addEventListener("mousemove", handleMove, { capture: true });
            }
        }
    }

    renderErrorCard(entityId, message) {
        return '<div class="room-timeline"><div class="room-header"><ha-icon icon="mdi:alert-circle"></ha-icon><span class="room-name" data-entity-id="' + entityId + '" style="color:var(--error-color);">' + entityId + '</span></div><div class="timeline-container" style="padding:16px;text-align:center;"><div style="color:var(--secondary-text-color);">' + message + "</div></div></div>";
    }

    renderTimeline(roomName, roomIcon, allLayers, unitOfMeasurement, entityId, entityState, dayId = null) {
        const entityName = this.getEntityNameForLog(entityId);
        debugLog(entityName, "[renderTimeline] entityId:", entityId, "dayId:", dayId, "allLayers count:", allLayers.length);

        // Validate inputs first
        if (!this._validateTimelineInputs(roomName, allLayers, entityId)) {
            return this.renderErrorCard(entityId, "Invalid timeline data");
        }

        // Handle empty layers case
        if (!allLayers || allLayers.length === 0) {
            return this._renderEmptyTimeline(roomName, roomIcon, entityState, unitOfMeasurement, entityId);
        }

        // Prepare metadata once (reuse everywhere)
        const layersMetadata = this._prepareLayersMetadata(allLayers);
        const layersToDisplay = this._filterLayersForDisplay(allLayers, entityId, layersMetadata, dayId);

        // If nothing to display, show empty state
        if (layersToDisplay.length === 0) {
            return this._renderEmptyTimeline(roomName, roomIcon, entityState, unitOfMeasurement, entityId);
        }

        // Pre-calculate all dimensions
        const containerHeight = this.timeHelper._calculateContainerHeight(
            layersToDisplay.length,
            LAYOUT_CONSTANTS.BLOCK_HEIGHT,
            LAYOUT_CONSTANTS.VERTICAL_GAP,
            LAYOUT_CONSTANTS.TOP_MARGIN,
            LAYOUT_CONSTANTS.BOTTOM_MARGIN
        );
        const {
            containerWidth
        } = this.getCachedDOMMetrics();

        // Render components
        const headerHtml = this.renderRoomHeader(roomName, roomIcon, entityState, unitOfMeasurement, entityId);
        const hourLabels = this._renderHourLabels();
        const {
            blockHtml,
            iconHtml
        } = this._renderAllBlocksAndIcons(
            layersToDisplay,
            allLayers,
            layersMetadata,
            containerWidth,
            unitOfMeasurement,
            entityId,
            dayId // Passer dayId pour le collapse/expand
        );

        // Assembly - simple concatenation
        return `<div class="room-timeline"><div class="room-header">${headerHtml}</div><div class="timeline-wrapper"><div class="icon-column" style="height:${containerHeight}px;position:relative;">${iconHtml}</div><div class="timeline-container" style="height:${containerHeight}px;flex:1;"><div class="timeline-grid">${hourLabels}</div><div class="blocks-container" data-day="${dayId || ''}" style="position:relative;height:${containerHeight}px;">${blockHtml}</div></div></div></div>`;
    }

    _validateTimelineInputs(roomName, allLayers, entityId) {
        if (!roomName || typeof roomName !== "string") return false;
        if (!Array.isArray(allLayers)) return false;
        if (!entityId || typeof entityId !== "string") return false;
        return true;
    }

    _renderEmptyTimeline(roomName, roomIcon, entityState, unitOfMeasurement, entityId) {
        const headerHtml = this.renderRoomHeader(roomName, roomIcon, entityState, unitOfMeasurement, entityId);
        return `<div class="room-timeline"><div class="room-header">${headerHtml}</div><div class="timeline-container"><div class="no-schedule">${this.t("no_schedule")}</div></div></div>`;
    }

    _prepareLayersMetadata(allLayers) {
        const metadata = new Map();

        allLayers.forEach((layer, idx) => {
            const isDefault = layer.is_default_layer === true;
            const isCombined = layer.is_combined_layer === true;
            const isActive = !isDefault && !isCombined ?
                this._evaluateConditionsForLayer(layer) :
                null;

            metadata.set(layer, {
                index: idx,
                isDefault,
                isCombined,
                isActive,
                conditionText: this._translateConditionText(layer.condition_text || "")
            });
        });

        return metadata;
    }

    _filterLayersForDisplay(allLayers, entityId, layersMetadata, dayId = null) {
        // Use dayId if provided, otherwise use selectedDay
        const keyDay = dayId || this.selectedDay;
        const visibilityKey = `${entityId}-${keyDay}`;
        this._state.initializeLayerVisibility(visibilityKey, false);
        const isExpanded = this._state.isLayerVisible(visibilityKey);

        const entityName = this.getEntityNameForLog(entityId);
        debugLog(entityName, "[_filterLayersForDisplay] entityId:", entityId, "dayId:", dayId, "keyDay:", keyDay, "visibilityKey:", visibilityKey, "isExpanded:", isExpanded);

        const result = [];

        if (!isExpanded) {
            debugLog(entityName, "[_filterLayersForDisplay] Collapsed - showing only combined layer");
            return allLayers.filter(l => l.is_combined_layer === true);
        }

        debugLog(entityName, "[_filterLayersForDisplay] Expanded - showing all layers");

        const defaultLayer = allLayers.find(l => l.is_default_layer);
        if (defaultLayer) {
            result.push(defaultLayer);
        }

        for (const layer of allLayers) {
            if (!layer.is_default_layer && !layer.is_combined_layer) {
                result.push(layer);
            }
        }

        const combinedLayer = allLayers.find(l => l.is_combined_layer);
        if (combinedLayer) {
            result.push(combinedLayer);
        }

        debugLog(entityName, "[_filterLayersForDisplay] Returning", result.length, "layers");

        return result;
    }

    _renderHourLabels() {
        const hours = Array.from({
            length: 24
        }, (_, i) => i);

        // Show labels at these hours for optimal spacing
        // formatHour() handles both 12h (AM/PM) and 24h formats
        const hoursToShow = LAYOUT_CONSTANTS.HOURS_TO_SHOW;

        return hours.map(h =>
            hoursToShow.includes(h) ?
            `<div class="timeline-hour">${escapeHtml(this.formatHour(h))}</div>` :
            '<div class="timeline-hour"></div>'
        ).join("");
    }

    _renderAllBlocksAndIcons(layersToDisplay, allLayers, layersMetadata, containerWidth, unitOfMeasurement, entityId, dayId = null) {
        const blockParts = [];
        const iconParts = [];
        const isSelectedDayToday = dayId ? (dayId === this.currentTime.day) : this.isToday();

        for (let layerIdx = 0; layerIdx < layersToDisplay.length; layerIdx++) {
            const currentLayer = layersToDisplay[layerIdx];
            const meta = layersMetadata.get(currentLayer);

            if (!meta || !currentLayer.blocks) continue;

            // Calculate vertical position
            const top = LAYOUT_CONSTANTS.TOP_MARGIN +
                layerIdx * (LAYOUT_CONSTANTS.BLOCK_HEIGHT + LAYOUT_CONSTANTS.VERTICAL_GAP);

            // Render icon for this layer
            const iconHtml = this._renderLayerIcon(
                currentLayer,
                meta,
                allLayers,
                layersToDisplay,
                top,
                isSelectedDayToday,
                entityId,
                dayId // Passer dayId
            );
            if (iconHtml) iconParts.push(iconHtml);

            // Render all blocks in this layer
            for (const block of currentLayer.blocks) {
                const blockHtml = this._renderBlock(
                    block,
                    currentLayer,
                    meta,
                    top,
                    containerWidth,
                    unitOfMeasurement,
                    isSelectedDayToday
                );
                if (blockHtml) blockParts.push(blockHtml);
            }
        }

        return {
            blockHtml: blockParts.join(""),
            iconHtml: iconParts.join("")
        };
    }

    _renderLayerIcon(currentLayer, meta, allLayers, layersToDisplay, top, isSelectedDayToday, entityId, dayId = null) {
        if (meta.isCombined) {
            return this._renderCombinedLayerIcon(currentLayer, meta, allLayers, layersToDisplay, top, isSelectedDayToday, entityId, dayId);
        } else {
            return this._renderConditionalLayerIcon(currentLayer, meta, allLayers, layersToDisplay, top, isSelectedDayToday);
        }
    }

    renderLayoutSelector() {
        if (this._config.layout !== "entities" || !this._config.entities || this._config.entities.length === 0) {
            return "";
        }

        const options = this._config.entities.map(entityConfig => {
            const entityId = typeof entityConfig === "string" ? entityConfig : entityConfig.entity;
            const state = this._hass.states[entityId];
            const customName = typeof entityConfig === "object" ? entityConfig.name : null;
            const name = customName || state?.attributes?.friendly_name || entityId;
            return `<option value="${escapeHtml(entityId)}" ${this.selectedEntity === entityId ? "selected" : ""}>${escapeHtml(name)}</option>`;
        }).join("");

        return `<div class="entity-selector-wrapper"><select id="entity-selector" class="entity-selector">${options}</select></div>`;
    }

    renderDaysLayout() {
        const days = this.getDays();
        const showTitle = this._config.title?.trim().length > 0;

        const blockHeight = LAYOUT_CONSTANTS.BLOCK_HEIGHT;
        const iconColumnWidth = LAYOUT_CONSTANTS.ICON_COLUMN_WIDTH;

        const baseStylesheet = this.generateStylesheet();
        
        const dynamicStyles = `
            :host {
                --sch-bh: ${blockHeight}px;
                --sch-icw: ${iconColumnWidth}px;
            }
        `;

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

        const styleContent = dynamicStyles + baseStylesheet + additionalStyle;

        const htmlContent = '<ha-card><div class="card-header' + (showTitle ? "" : " hidden") + '"><div class="card-title">' + escapeHtml(this._config.title || "") + '</div></div><div class="day-selector">' + days.map(day => '<button class="day-button' + (day.id === this.selectedDay ? " active" : "") + '" data-day="' + day.id + '">' + escapeHtml(day.label) + "</button>").join("") + '</div><div id="content"></div></ha-card>';
        
        this.shadowRoot.innerHTML = '<style>' + styleContent + "</style>" + htmlContent;
        this.updateContent();
        this.startTimelineUpdate();

        requestAnimationFrame(() => {
            this.attachDayButtonListeners();
        });
    }

    renderEntitiesLayout() {
        const blockHeight = LAYOUT_CONSTANTS.BLOCK_HEIGHT;
        const iconColumnWidth = LAYOUT_CONSTANTS.ICON_COLUMN_WIDTH;
        const showTitle = this._config.title?.trim().length > 0;

        const baseStylesheet = this.generateStylesheet();
        
        const dynamicStyles = `
            :host {
                --sch-bh: ${blockHeight}px;
                --sch-icw: ${iconColumnWidth}px;
            }
        `;

        const additionalStyle = `
            .schedule-block.combined-layer-block{opacity:1;border:1px dashed var(--primary-text-color);box-shadow:0 0 10px var(--info-color);z-index:1!important}
            .icon-row.combined-icon-row .layer-number{cursor:pointer;position:relative;font-size:16px!important;line-height:24px;overflow:hidden}
            .icon-row.combined-icon-row .layer-number:hover{filter:brightness(1.3)}
            .combined-layer-toggle{padding-left:0;padding-right:0}
            .sch-z-default{z-index:1}
            .sch-z-layer{z-index:1}
            .sch-z-combined{z-index:1}
            .layer-number{width:24px;height:24px;color:white;border-radius:50%;font-size:11px;font-weight:bold;display:flex;align-items:center;justify-content:center;transition:all .2s}
            .entity-selector-wrapper{margin-bottom: 16px;display:flex;justify-content:center;touch-action: manipulation;}
            .entity-selector{padding:8px 12px;border:1px solid var(--divider-color);border-radius:4px;background:var(--primary-background-color);color:var(--primary-text-color);font-size:14px;min-width:200px;touch-action: manipulation;pointer-events: auto;}
            .entity-selector:focus{outline:none;border-color:var(--primary-color);box-shadow:0 0 0 2px var(--primary-color)33;}
        `;

        const styleContent = dynamicStyles + baseStylesheet + additionalStyle;
        const selectorHtml = this.renderLayoutSelector();
        const htmlContent = '<ha-card><div class="card-header' + (showTitle ? "" : " hidden") + '"><div class="card-title">' + escapeHtml(this._config.title || "") + '</div></div>' + selectorHtml + '<div id="content"></div></ha-card>';
        
        this.shadowRoot.innerHTML = '<style>' + styleContent + "</style>" + htmlContent;
        
        if (this._config.entities && this._config.entities.length > 0) {
            const firstEntityConfig = this._config.entities[0];
            const firstEntityId = typeof firstEntityConfig === "string" ? firstEntityConfig : firstEntityConfig.entity;
            this.selectedEntity = this.selectedEntity || firstEntityId;
        }
        
        this.updateContent();
        this.startTimelineUpdate();

        requestAnimationFrame(() => {
            this.attachEntitySelectorListener();
        });
    }

    _renderCombinedLayerIcon(currentLayer, meta, allLayers, layersToDisplay, top, isSelectedDayToday, entityId, dayId = null) {
        const entityName = this.getEntityNameForLog(entityId);
        const defaultLayer = allLayers.find(l => l.is_default_layer);
        const conditionalLayers = allLayers.filter(l => !l.is_default_layer && !l.is_combined_layer);
        const hasCollapsibleLayers = defaultLayer || conditionalLayers.length > 0;

        let toggleClass = "";
        let iconStyle = `background:${this._colors.combined_folded_layer};filter:brightness(1.1);`;

        if (!isSelectedDayToday) {
            iconStyle = `background:${this._colors.combined_folded_layer};opacity:0.5;filter:brightness(0.8);`;
        }

        if (hasCollapsibleLayers) {
            toggleClass = " combined-layer-toggle";

            // Use dayId if provided, otherwise use selectedDay
            const keyDay = dayId || this.selectedDay;
            const visibilityKey = `${entityId}-${keyDay}`;
            const isExpanded = this._state.isLayerVisible(visibilityKey);

            debugLog(entityName, "[_renderCombinedLayerIcon] entityId:", entityId, "dayId:", dayId, "keyDay:", keyDay, "visibilityKey:", visibilityKey, "isExpanded:", isExpanded);

            if (isExpanded) {
                iconStyle = `background:${this._colors.combined_unfolded_layer};filter:brightness(1.3);`;
                if (!isSelectedDayToday) {
                    iconStyle = `background:${this._colors.combined_unfolded_layer};opacity:0.5;filter:brightness(0.8);`;
                }
            }
        }

        const iconTooltip = escapeHtml(this.t("cond_combined_schedule_toggle"));

        // Add data-day attribute so toggleLayerVisibility knows which day to modify
        const dataDay = dayId ? ` data-day="${dayId}"` : "";

        debugLog(entityName, "[_renderCombinedLayerIcon] Rendering icon with dataDay:", dataDay, "entityId:", entityId);

        return `<div class="icon-row combined-icon-row" style="top:${top}px;" data-tooltip="${iconTooltip}"><span class="layer-number combined-layer-toggle" data-entity-id="${escapeHtml(entityId)}"${dataDay} style="${iconStyle}">Σ</span></div>`;
    }

    _renderConditionalLayerIcon(currentLayer, meta, allLayers, layersToDisplay, top, isSelectedDayToday) {
        const conditionalLayers = allLayers.filter(l => !l.is_default_layer && !l.is_combined_layer);

        let displayLayerIndex = "";
        let iconTooltipText = "";

        if (meta.isDefault) {
            displayLayerIndex = "0";
            iconTooltipText = this.t("layer_label") + " 0";

            if (meta.conditionText) {
                iconTooltipText += meta.isActive ? "\n✅ " : "\n❌ ";
                iconTooltipText += this.t("condition_label") + ": " + meta.conditionText;
            } else {
                iconTooltipText += "\n" + this.t("default_state_label");
            }
        } else {
            const condLayerIndex = conditionalLayers.findIndex(l => l === currentLayer);
            displayLayerIndex = String(condLayerIndex + 1);

            iconTooltipText = this.t("layer_label") + " " + displayLayerIndex;
            if (meta.conditionText) {
                iconTooltipText += meta.isActive ? "\n✅ " : "\n❌ ";
                iconTooltipText += this.t("condition_label") + ": " + meta.conditionText;
            } else {
                iconTooltipText += "\n" + this.t("no_specific_condition");
            }
        }

        const iconStyle = meta.isActive ?
            `background:${this._colors.active_layer};filter:brightness(1.3);` :
            `background:${this._colors.inactive_layer};opacity:0.5;`;

        const opacityAdjust = !isSelectedDayToday ? "opacity:0.5;" : "";
        const finalStyle = opacityAdjust ? `${iconStyle}${opacityAdjust}` : iconStyle;

        return `<div class="icon-row" style="top:${top}px;" data-tooltip="${escapeHtml(iconTooltipText)}"><span class="layer-number" style="${finalStyle}">${escapeHtml(displayLayerIndex)}</span></div>`;
    }

    _renderBlock(block, currentLayer, meta, top, containerWidth, unitOfMeasurement, isSelectedDayToday) {
        // PERFORMANCE OPTIMIZATION: Use cached block metrics
        // This eliminates redundant time parsing and calculations
        const metrics = this._getBlockMetrics(block);
        const {
            startMin,
            endMin,
            dimensions,
            borderRadius
        } = metrics;
        const {
            left,
            width
        } = dimensions;

        // Get state and color
        const rawState = block.state_value || "";
        const rawTemplate = block.raw_state_template || rawState;
        const isDynamic = this.isDynamicTemplate(rawTemplate);
        const resolvedState = this.resolveTemplate(rawState);
        const unit = block.unit || unitOfMeasurement || "";

        // Use escapeHtml for text content (preserves "/" for units like €/kWh)
        const escapedState = escapeHtml(resolvedState);
        const escapedUnit = escapeHtml(unit);
        const stateDisplay = escapedState?.trim() ?
            (escapedUnit ? escapedState + " " + escapedUnit : escapedState) :
            "";

        // Get colors
        const colorData = this.getColorForState(resolvedState || "default", unit || unitOfMeasurement);
        const color = block.color || colorData.color;
        const textColor = colorData.textColor;

        // Build CSS classes - PRESERVE HATCHING FOR DEFAULT BLOCKS IN COMBINED LAYER
        let blockClass = "schedule-block";

        // Add layer-specific styling
        if (meta.isCombined) {
            blockClass += " combined-layer-block sch-z-combined";

            // CRITICAL FIX: Preserve hatching pattern for default blocks in combined layer
            if (block.is_default_bg) {
                blockClass += " default-block";
            }
        } else if (block.is_default_bg) {
            // Default layer: add hatching
            blockClass += " default-block sch-z-default";
        } else {
            // Conditional layer: solid color
            blockClass += " sch-z-layer";
        }

        // Add dynamic indicator
        if (isDynamic) blockClass += " dynamic";

        // Build styles
        const style = `left:${left}%;width:${width}%;top:${top}px;border-radius:${borderRadius};color:${this.validateStyleValue(textColor)};background-color:${this.validateStyleValue(color)};`;

        // Truncate text to fit block width
        const blockWidthPx = (width / 100) * containerWidth;
        const displayText = this.truncateText(stateDisplay, blockWidthPx);

        // Build tooltip (with escapeHtmlAttribute for data attribute)
        const tooltip = this._buildBlockTooltip({
            block,
            isWrapped: block.wraps_start || block.wraps_end,
            isDynamic,
            isCombined: meta.isCombined,
            isDefault: block.is_default_bg,
            escapedState,
            escapedUnit
        });

        // Display only text on block (no icon)
        return `<div class="${blockClass}" style="${style}" data-tooltip="${escapeHtmlAttribute(tooltip)}"><span class="block-center">${escapeHtml(displayText)}</span></div>`;
    }

    updateContent() {
        const entityName = this.getEntityNameForLog(this.selectedEntity);
        debugLog(entityName, "[updateContent] Layout:", this._config.layout, "selectedDay:", this.selectedDay, "selectedEntity:", this.selectedEntity);

        if (this._config.layout === "entities") {
            this.updateContentEntitiesLayout();
        } else {
            this.updateContentDaysLayout();
        }
        this.updateTimeline();
    }

    renderRoomHeader(roomName, roomIcon, entityState, unitOfMeasurement, entityId) {
        const showStateInTitle = this._config.show_state_in_title !== false;
        let stateValue = "";

        if (showStateInTitle && entityState) {
            const attrs = entityState.attributes || {};
            const state = entityState.state || "";
            const unit = unitOfMeasurement || attrs.unit_of_measurement || "";

            // Use escapeHtml (not escapeHtmlAttribute) for text content
            const escapedState = escapeHtml(state);
            const escapedUnit = escapeHtml(unit);

            stateValue = escapedState ?
                (escapedUnit ? escapedState + " " + escapedUnit : escapedState) : "";
        }

        // Use escapeHtmlAttribute for attribute values
        const escapedRoomName = escapeHtml(roomName);
        const escapedRoomIcon = escapeHtmlAttribute(roomIcon || "");
        const escapedEntityId = escapeHtmlAttribute(entityId);

        // Build header HTML with proper escaping
        let headerHtml = "";

        if (escapedRoomIcon) {
            headerHtml += '<ha-icon icon="' + escapedRoomIcon + '"></ha-icon>';
        }

        headerHtml += '<span class="room-name" data-entity-id="' + escapedEntityId + '">' + escapedRoomName + '</span>';

        if (stateValue) {
            headerHtml += '<span class="room-state">' + stateValue + '</span>';
        }

        return headerHtml;
    }

    _buildLayersForDay(dayLayers) {
        // Find default layer
        const defaultLayer = dayLayers.find(l => l.is_default_layer);
        
        // Get all conditional layers (non-default, non-combined)
        const allConditionalLayers = dayLayers.filter(layer =>
            !layer.is_default_layer && !layer.is_combined_layer
        );

        // Filter to only active conditional layers (those whose conditions are met)
        const activeConditionalLayers = allConditionalLayers.filter(layer =>
            this._evaluateConditionsForLayer(layer)
        );

        // Build combined layer from default + active conditionals
        const combinedLayer = this.combinedLayerBuilder.build(defaultLayer, activeConditionalLayers);

        // Start with all non-combined layers
        let allLayers = dayLayers.filter(l => !l.is_combined_layer);

        // Add combined layer at the end if it exists
        if (combinedLayer) {
            allLayers = [...allLayers, combinedLayer];
        }

        return allLayers;
    }

    _renderSchedules(groupByDay = false) {
        if (!this._hass) return "";
        
        const content = this.shadowRoot.querySelector("#content");
        if (!content) return "";
        
        if (this._state.eventListener) {
            this._detachEventHandlers(content, this._state.eventListener);
            this._state.eventListener = null;
        }

        this._state.invalidateDOMCache();
        if (this._blockMetricsCache) {
            this._blockMetricsCache.clear();
        }

        let timelines = "";

        if (groupByDay) {
            const days = this.getDays();
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

                const visibilityKey = `${entityId}-${this.selectedDay}`;
                this._state.initializeLayerVisibility(visibilityKey, false);

                this.conditionEvaluator.setSelectedDay(this.selectedDay);

                let dayLayers = layers[this.selectedDay] || [];
                const allLayers = this._buildLayersForDay(dayLayers);

                const entityName = this.getEntityNameForLog(entityId);
                debugLog(entityName, "[Days Layout] Rendering timeline for entityId:", entityId, "selectedDay:", this.selectedDay, "allLayers count:", allLayers.length);

                timelines += this.renderTimeline(roomName, roomIcon, allLayers, unitOfMeasurement, entityId, state, this.selectedDay);
            }
        } else {
            if (!this.selectedEntity) {
                return "";
            }

            const state = this._hass.states[this.selectedEntity];
            if (!state) {
                timelines = this.renderErrorCard(this.selectedEntity, this.t("entity_not_found"));
            } else {
                const attrs = state.attributes || {};
                const layers = attrs.layers || {};

                const entityConfig = this._config.entities.find(e => {
                    const id = typeof e === "string" ? e : e.entity;
                    return id === this.selectedEntity;
                });

                const customName = typeof entityConfig === "object" ? entityConfig.name : null;
                const customIcon = typeof entityConfig === "object" ? entityConfig.icon : null;
                const roomName = customName || attrs.room || attrs.friendly_name || this.selectedEntity;
                const roomIcon = customIcon || attrs.icon || "mdi:thermometer";
                const unitOfMeasurement = attrs.unit_of_measurement || "";

                const days = this.getDays();
                for (const day of days) {
                    const dayId = day.id;
                    this.conditionEvaluator.setSelectedDay(dayId);

                    let dayLayers = layers[dayId] || [];
                    const allLayers = this._buildLayersForDay(dayLayers);

                    const entityName = this.getEntityNameForLog(this.selectedEntity);
                    debugLog(entityName, "[Entities Layout] Rendering timeline for entityId:", this.selectedEntity, "dayId:", dayId, "allLayers count:", allLayers.length);

                    const dayLabel = day.label;
                    const dayTimelines = this.renderTimeline(dayLabel, roomIcon, allLayers, unitOfMeasurement, this.selectedEntity, state, dayId);
                    timelines += dayTimelines;
                }
            }
        }

        const newHTML = `<div class="schedules-container">${timelines}</div>`;

        if (content.innerHTML !== newHTML) {
            content.innerHTML = newHTML;
        }
        // Always re-attach listeners since they are detached at line 3470
        this.attachAllListeners();
    }

    updateContentDaysLayout() {
        this._renderSchedules(true);
    }

    updateContentEntitiesLayout() {
        this._renderSchedules(false);
    }

    generateStylesheet() {
        // Support for card_mod styles
        const cardModStyle = this._config.card_mod?.style || '';

        return `
            :host {
                display: block;
                --sch-block-height: var(--sch-bh);
                --sch-icon-col-width: var(--sch-icw);
            }

            ha-card {
                padding: 16px;
            }

            ${cardModStyle}

            .card-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 16px;
            }

            .card-header.hidden {
                display: none;
            }

            .card-title {
                font-size: 24px;
                font-weight: bold;
                margin: 0;
            }

            .day-selector {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-bottom: 16px;
                justify-content: center;
            }

            .day-button {
                padding: 8px 6px;
                border: none;
                border-radius: 8px;
                background: var(--primary-background-color);
                color: var(--primary-text-color);
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s;
                border: 1px solid var(--divider-color);
            }

            .day-button:hover {
                background: var(--secondary-background-color);
                border-color: var(--primary-color);
            }

            .day-button.active {
                background: var(--primary-color);
                color: white;
                border-color: var(--primary-color);
            }

            .schedules-container {
                display: flex;
                flex-direction: column;
                gap: 24px;
            }

            .room-timeline {
                margin-bottom: 12px;
            }

            .room-header {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 0 8px;
                justify-content: space-between;
            }

            .room-name {
                font-weight: 600;
                font-size: 14px;
                color: var(--primary-text-color);
                flex-grow: 1;
                cursor: pointer;
                transition: color 0.2s;
            }

            .room-name:hover {
                color: var(--primary-color);
                text-decoration: underline;
            }

            .room-state {
                font-weight: 600;
                font-size: 14px;
                color: var(--primary-color);
                margin-left: auto;
            }

            .timeline-wrapper {
                display: flex;
                gap: 0;
                align-items: stretch;
            }

            .icon-column {
                position: relative;
                width: var(--sch-icon-col-width);
                flex-shrink: 0;
                display: flex;
                flex-direction: column;
                z-index: 1;
            }

            .icon-row {
                position: absolute;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: help;
                width: 100%;
                height: var(--sch-block-height);
                transition: all 0.2s;
                top: 0;
                margin-top: 6px;
                z-index: 1;
            }

            .icon-row:hover .layer-number {
                filter: brightness(1.3) !important;
            }

            .layer-number {
                width: 24px;
                height: 24px;
                color: white;
                border-radius: 50%;
                font-size: 11px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            .timeline-container {
                position: relative;
                background: var(--secondary-background-color);
                border-radius: 8px;
                border: 1px solid var(--divider-color);
                overflow: visible;
                padding: 4px;
                flex: 1;
            }

            .timeline-grid {
                position: absolute;
                inset: 0;
                display: flex;
                pointer-events: none;
                z-index: 0;
            }

            .blocks-container {
                position: absolute;
                inset: 0;
                overflow: visible;
            }

            .timeline-hour {
                position: relative;
                flex: 1;
                border-right: 1px solid var(--secondary-text-color);
                opacity: 0.4;
                font-size: 11px;
                color: var(--secondary-text-color);
                display: flex;
                align-items: flex-end;
                justify-content: center;
                font-weight: 600;
                padding-bottom: 4px;
            }

            .timeline-hour:empty {
                font-size: 0;
            }

            .timeline-hour:last-child {
                border-right: none;
            }

            .schedule-block {
                position: absolute;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 500;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
                cursor: help;
                text-align: center;
                font-size: 12px;
                overflow: hidden;
                height: var(--sch-block-height);
            }

            .schedule-block.default-block {
                background-image: repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 6px,
                    rgba(0, 0, 0, 0.15) 6px,
                    rgba(0, 0, 0, 0.15) 12px
                ) !important;
                color: white;
                font-weight: 500;
            }

            .schedule-block.combined-layer-block {
                opacity: 1;
                border: 1px dashed var(--primary-text-color);
                box-shadow: 0 0 10px var(--info-color);
                z-index: 1 !important;
            }

            .block-center {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                max-width: 95%;
                text-overflow: ellipsis;
                white-space: nowrap;
                overflow: hidden;
            }

            .no-schedule {
                font-size: 14px;
                color: var(--secondary-text-color);
                text-align: center;
                padding: 12px 0;
            }

            .time-cursor {
                position: absolute;
                top: 0;
                bottom: 0;
                width: 2px;
                background-color: var(--label-badge-yellow);
                z-index: 2;
                pointer-events: none;
            }

            .combined-layer-toggle {
                cursor: pointer;
                position: relative;
                font-size: 16px !important;
                line-height: 24px;
                overflow: hidden;
            }

            .combined-layer-toggle:hover {
                filter: brightness(1.3) !important;
            }

            .icon-row.combined-icon-row .layer-number {
                cursor: pointer;
                position: relative;
                font-size: 16px !important;
                line-height: 24px;
                overflow: hidden;
            }

            .sch-z-default {
                z-index: 1;
            }

            .sch-z-layer {
                z-index: 1;
            }

            .sch-z-combined {
                z-index: 1;
            }
        `;
    }


    render() {
        if (this._config.layout === "entities") {
            this.renderEntitiesLayout();
        } else {
            this.renderDaysLayout();
        }
    }

    connectedCallback() {
        this.startTimelineUpdate();
    }

    disconnectedCallback() {
        /**
         * Complete cleanup when component is removed from DOM
         * Ensures no memory leaks or lingering resources
         */

        // Stop timeline updates
        this.stopTimelineUpdate();

        // âœ… COMPLETE CLEANUP VIA CENTRALIZED STATE
        this._state.resetOnDisconnect();

        // Clean up UI elements
        if (this.tooltipElement) {
            this.tooltipElement.remove();
            this.tooltipElement = null;
        }

        // PERFORMANCE FIX: Clear metrics cache to free memory
        if (this._blockMetricsCache) {
            this._blockMetricsCache.clear();
            this._blockMetricsCache = null;
        }

        // Detach remaining listeners
        const container = this.shadowRoot?.querySelector("#content");
        if (container && this._state.eventListener) {
            container.removeEventListener("click", this._state.eventListener);
            container.removeEventListener("mouseover", this._state.eventListener);
            container.removeEventListener("mouseout", this._state.eventListener);
        }
    }

}

class ScheduleStateCardEditor extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({
            mode: "open"
        });
        this._config = {};
        this._hass = null;
        this._entities = [];
        this._editingIndex = null;
        this._colorPickerOpen = null;
        this._iconsCache = null;
        this._lastUpdateTime = 0;
        this._updateDebounceTimer = null;
    }

    getDays() {
        const dayTranslations = this.t("days");
        return DAY_ORDER.map(id => ({
            id,
            label: dayTranslations[id]
        }));
    }

    getLanguage() {
        if (this._hass?.locale?.language) {
            return TRANSLATIONS[this._hass.locale.language] ? this._hass.locale.language : "en";
        }
        return "en";
    }

    t(key) {
        const lang = this.getLanguage();
        return TRANSLATIONS[lang] && TRANSLATIONS[lang][key] ? TRANSLATIONS[lang][key] : TRANSLATIONS.en[key] || key;
    }

    setConfig(config) {
        if (!config) throw new Error("Invalid configuration");
        let entities = config.entities || [];
        this._config = {
            ...config,
            entities: Array.isArray(entities) ? entities.map(e => typeof e === "string" ? {
                entity: e
            } : e) : [],
            show_state_in_title: config.show_state_in_title !== false
        };
        if (config.colors) {
            this._colors = {
                ...DEFAULT_COLORS,
                ...config.colors
            };
        } else {
            this._colors = {
                ...DEFAULT_COLORS
            };
        }
        if (this._hass) this.render();
    }

    set hass(hass) {
        this._hass = hass;
        if (this._config?.entities && !this.shadowRoot.querySelector("ha-card")) {
            this.render();
        }
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

    getAllMDIIcons() {
        if (this._iconsCache) return this._iconsCache;
        let iconList = [];
        try {
            const resources = this._hass?.resources;
            if (resources) {
                for (const [key, value] of Object.entries(resources)) {
                    if (typeof value === 'object' && value !== null) {
                        const icons = Object.keys(value).filter(icon => icon.startsWith('mdi:'));
                        iconList.push(...icons);
                    }
                }
            }
        } catch (e) {
            errorLog("Error retrieving icons:", e);
        }
        if (iconList.length === 0) {
            iconList = ["mdi:calendar-clock", "mdi:thermometer", "mdi:lightbulb", "mdi:power", "mdi:weather-sunny", "mdi:water", "mdi:motion-sensor", "mdi:door", "mdi:window-closed", "mdi:fan", "mdi:air-conditioner", "mdi:television", "mdi:music", "mdi:lock", "mdi:shield", "mdi:alarm", "mdi:clock", "mdi:timer", "mdi:play", "mdi:stop", "mdi:pause", "mdi:volume-high", "mdi:brightness-7", "mdi:home", "mdi:sofa", "mdi:bed", "mdi:check", "mdi:close"];
        }
        const uniqueIcons = [...new Set(iconList)].sort();
        this._iconsCache = uniqueIcons;
        return uniqueIcons;
    }

    fireConfigChanged() {
        this._config.entities = this._entities;
        this.dispatchEvent(new CustomEvent("config-changed", {
            detail: {
                config: this._config
            }
        }));
    }

    addEntity() {
        this._entities.push({
            entity: "",
            name: "",
            icon: ""
        });
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
        }
    }

    updateColor(colorKey, value) {
        // Gérer les couleurs override séparément
        if (colorKey.startsWith('override-')) {
            const input = this.shadowRoot?.querySelector(`#${colorKey}-input`);
            const btn = this.shadowRoot?.querySelector(`#${colorKey}-btn`);
            if (input) input.value = value;
            if (btn) btn.style.background = value;
            // No need to fireConfigChanged as these colors are not in the config
            // until the user clicks "+"
            this.render();
            return;
        }

        // Normal card colors
        if (!this._config.colors) {
            this._config.colors = {
                ...DEFAULT_COLORS
            };
        }
        this._config.colors[colorKey] = value;
        this.fireConfigChanged();
        this.render();
    }

    /**
     * Add a new color override
     */
    addColorOverride() {
        const valueInput = this.shadowRoot?.querySelector("#override-value-input");
        const unitInput = this.shadowRoot?.querySelector("#override-unit-input");
        const bgColorInput = this.shadowRoot?.querySelector("#override-bg-color-input");
        const textColorInput = this.shadowRoot?.querySelector("#override-text-color-input");

        if (!valueInput || !unitInput || !bgColorInput || !textColorInput) return;

        const value = valueInput.value.trim();
        const unit = unitInput.value.trim();
        const bgColor = bgColorInput.value.trim();
        const textColor = textColorInput.value.trim();

        // If no value, do nothing
        if (!value) return;

        // Valider les formats de couleur (validation hex de base)
        if (!/^#[0-9A-F]{6}$/i.test(bgColor)) return;
        if (!/^#[0-9A-F]{6}$/i.test(textColor)) return;

        // Create key in format "value|unit" (always include | even if unit is empty)
        const key = `${value}|${unit}`;

        if (!this._config.color_overrides) {
            this._config.color_overrides = {};
        }

        this._config.color_overrides[key] = {
            color: bgColor,
            textColor: textColor
        };

        // Update global cache
        COLOR_CACHE.setOverride(key, bgColor, textColor);

        // Clear value and unit fields, but keep colors to facilitate quick additions
        valueInput.value = '';
        unitInput.value = '';

        debugLog(`Added color override: ${key} => bg:${bgColor}, text:${textColor}`);
        this.fireConfigChanged();
        this.render();
    }

    /**
     * Delete a color override
     */
    deleteColorOverride(key) {
        if (!this._config.color_overrides) return;

        delete this._config.color_overrides[key];

        // Update global cache
        COLOR_CACHE.removeOverride(key);

        debugLog(`Deleted color override: ${key}`);
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

    isValidHex(hex) {
        if (!hex || typeof hex !== 'string') return false;
        
        // Accept CSS variables with fallback colors
        if (hex.includes('var(')) {
            return true; // CSS variables are valid
        }
        
        // Accept hex color format (#RRGGBB)
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
        let h = 0,
            s = 0;
        const v = max;
        const d = max - min;
        s = max === 0 ? 0 : d / max;
        if (max === min) {
            h = 0;
        } else {
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }
        return {
            h: h * 360,
            s: s * 100,
            v: v * 100
        };
    }

    hsvToRgb(h, s, v) {
        h = h / 360;
        s = s / 100;
        v = v / 100;
        const c = v * s;
        const x = c * (1 - Math.abs((h * 6) % 2 - 1));
        const m = v - c;
        let r = 0,
            g = 0,
            b = 0;
        if (h < 1 / 6) {
            r = c;
            g = x;
            b = 0;
        } else if (h < 2 / 6) {
            r = x;
            g = c;
            b = 0;
        } else if (h < 3 / 6) {
            r = 0;
            g = c;
            b = x;
        } else if (h < 4 / 6) {
            r = 0;
            g = x;
            b = c;
        } else if (h < 5 / 6) {
            r = x;
            g = 0;
            b = c;
        } else {
            r = c;
            g = 0;
            b = x;
        }
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);
        return {
            r,
            g,
            b
        };
    }

    renderEditForm(entityConfig, index) {
        const t = this.t.bind(this);
        const entityId = entityConfig.entity || "";
        return `<div class="entity-edit-form"><div class="input-group"><label>${t('editor_entity_id_label')}:</label><div class="input-with-suggestions"><input type="text" class="entity-input entity-search" data-index="${index}" data-field="entity" value="${escapeHtml(entityId)}" placeholder="light.my_light" autocomplete="off"></div></div><div class="input-group"><label>${t('editor_name_label')}:</label><input type="text" class="entity-input" data-index="${index}" data-field="name" value="${escapeHtml(entityConfig.name || '')}" placeholder="${t('editor_placeholder_name')}" autocomplete="off"></div><div class="input-group"><label>${t('editor_icon_label')}:</label><div class="input-with-suggestions"><input type="text" class="entity-input icon-search" data-index="${index}" data-field="icon" value="${escapeHtml(entityConfig.icon || '')}" placeholder="mdi:calendar-clock" autocomplete="off"></div></div></div>`;
    }

    renderEntityRow(entityConfig, index) {
        const t = this.t.bind(this);
        const entityId = entityConfig.entity || "";
        const entityState = this._hass?.states[entityId];
        const name = entityConfig.name || entityState?.attributes?.friendly_name || entityId || t('editor_default_entity_name');
        const icon = entityConfig.icon || entityState?.attributes?.icon || "mdi:calendar-clock";
        const isEditing = this._editingIndex === index;
        return `<div class="entity-row"><div class="handle">≡</div><div class="icon-name"><ha-icon icon="${escapeHtml(icon)}"></ha-icon><span>${escapeHtml(name)}</span></div><div class="entity-id">${escapeHtml(entityId)}</div><div class="actions"><button class="action-button edit-btn" data-index="${index}" title="${t('common.edit') || 'Edit'}"><ha-icon icon="mdi:pencil"></ha-icon></button><button class="action-button remove-btn" data-index="${index}" title="${t('common.delete') || 'Delete'}"><ha-icon icon="mdi:close"></ha-icon></button></div></div>${isEditing ? this.renderEditForm(entityConfig, index) : ''}`;
    }


    renderColorPicker(colorKey, colorLabel) {
        const currentColor = this._config.colors?.[colorKey] || DEFAULT_COLORS[colorKey];
        const isOpen = this._colorPickerOpen === colorKey;
        const rgb = this.hexToRgb(currentColor);
        const hsv = rgb ? this.rgbToHsv(rgb.r, rgb.g, rgb.b) : {
            h: 0,
            s: 100,
            v: 100
        };
        const pickerHtml = isOpen ? `<div class="color-picker-overlay" data-colorkey="${colorKey}"></div><div class="color-picker-popup"><div class="color-wheel-container"><canvas id="color-wheel-${colorKey}" class="color-wheel" width="280" height="280" data-colorkey="${colorKey}"></canvas><div class="color-marker" id="marker-${colorKey}" style="position: absolute; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.5); pointer-events: none;"></div></div><div class="brightness-control"><label>Brightness: <span id="brightness-value-${colorKey}">${Math.round(hsv.v)}</span>%</label><input type="range" class="brightness-slider" id="brightness-${colorKey}" min="0" max="100" value="${Math.round(hsv.v)}" data-colorkey="${colorKey}" /></div></div>` : '';
        return `<div class="color-config-row" style="position: relative;"><label>${colorLabel}</label><div class="color-input-group"><div class="color-preview" style="background-color: ${currentColor};" data-colorkey="${colorKey}"></div><input type="text" class="color-hex-input" value="${currentColor}" data-colorkey="${colorKey}" maxlength="7" placeholder="#000000" /></div>${pickerHtml}</div>`;
    }

    /**
     * Render the color overrides configuration section
     */
    renderColorOverridesSection(t) {
        const overrides = this._config.color_overrides || {};
        const overridesList = Object.entries(overrides).map(([key, value]) => {
            // Extract value and unit from key (format: "value|unit")
            const bgColor = value?.color || '#cccccc';
            const textColor = value?.textColor || '#ffffff';
            const displayValue = key.split('|')[0] || key;
            const displayUnit = key.split('|')[1] || '';

            return `<div class="override-row">
                <span class="override-key">${escapeHtml(displayValue)}${displayUnit ? ' ' + escapeHtml(displayUnit) : ''}</span>
                <div class="override-colors-preview">
                    <div class="override-color-preview" style="background-color: ${bgColor}; color: ${textColor};" title="${t('editor_override_bg_label')}: ${bgColor}">${escapeHtml(displayValue)}</div>
                </div>
                <button class="override-delete" data-override-key="${escapeHtml(key)}">✕</button>
            </div>`;
        }).join('');

        // Render color pickers for override buttons
        const bgColorKey = 'override-bg-color';
        const textColorKey = 'override-text-color';
        const bgColorValue = this.shadowRoot?.querySelector('#override-bg-color-input')?.value || '#2196F3';
        const textColorValue = this.shadowRoot?.querySelector('#override-text-color-input')?.value || '#ffffff';

        const bgColorPickerHtml = this.renderOverrideColorPicker(bgColorKey, bgColorValue);
        const textColorPickerHtml = this.renderOverrideColorPicker(textColorKey, textColorValue);

        return `<div class="divider"></div><div class="form-section">
            <div class="section-title">${t('editor_override_title')}</div>
            <div style="font-size: 12px; color: var(--secondary-text-color); margin-bottom: 12px;">
                ${t('editor_override_description')}
            </div>
            <div id="overrides-list" style="margin-bottom: 12px;">
                ${overridesList || `<div style="text-align: center; padding: 10px; color: var(--secondary-text-color);">${t('editor_override_no_overrides')}</div>`}
            </div>
            <div class="override-row" style="margin-bottom: 12px; display: flex; align-items: center; gap: 6px; width: 100%; background: #1a1a1a; padding: 8px; border-radius: 6px; box-sizing: border-box; position: relative;">
                <input type="text" id="override-value-input" placeholder="18" style="flex: 1; min-width: 0; padding: 6px 4px; border: 1px solid var(--divider-color); border-radius: 4px; background: var(--primary-background-color); color: var(--primary-text-color); font-size: 12px; text-align: left;" />
                <input type="text" id="override-unit-input" placeholder="°C" style="flex: 1; min-width: 0; padding: 6px 4px; border: 1px solid var(--divider-color); border-radius: 4px; background: var(--primary-background-color); color: var(--primary-text-color); font-size: 12px; text-align: left;" />
                <span style="color: var(--secondary-text-color); white-space: nowrap; font-size: 12px; margin-left: auto;">${t('editor_override_bg_label')}:</span>
                <button id="override-bg-color-btn" data-colorkey="${bgColorKey}" style="width: 26px; height: 26px; border: none; border-radius: 4px; cursor: pointer; background: ${bgColorValue}; flex-shrink: 0;" title="${t('editor_override_bg_label')}"></button>
                <input type="hidden" id="override-bg-color-input" value="${bgColorValue}" data-colorkey="${bgColorKey}" />
                <span style="color: var(--secondary-text-color); white-space: nowrap; font-size: 12px;">${t('editor_override_text_label')}:</span>
                <button id="override-text-color-btn" data-colorkey="${textColorKey}" style="width: 26px; height: 26px; border: none; border-radius: 4px; cursor: pointer; background: ${textColorValue}; flex-shrink: 0;" title="${t('editor_override_text_label')}"></button>
                <input type="hidden" id="override-text-color-input" value="${textColorValue}" data-colorkey="${textColorKey}" />
                <button id="add-override-btn" style="background: #ffa500; color: white; border: none; width: 32px; height: 32px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 16px; flex-shrink: 0;">+</button>
                ${bgColorPickerHtml}
                ${textColorPickerHtml}
            </div>
        </div>`;
    }

    renderOverrideColorPicker(colorKey, currentColor) {
        const isOpen = this._colorPickerOpen === colorKey;
        if (!isOpen) return '';

        const rgb = this.hexToRgb(currentColor);
        const hsv = rgb ? this.rgbToHsv(rgb.r, rgb.g, rgb.b) : { h: 0, s: 100, v: 100 };

        return `<div class="color-picker-overlay" data-colorkey="${colorKey}"></div>
            <div class="color-picker-popup">
                <div class="color-wheel-container">
                    <canvas id="color-wheel-${colorKey}" class="color-wheel" width="280" height="280" data-colorkey="${colorKey}"></canvas>
                    <div class="color-marker" id="marker-${colorKey}" style="position: absolute; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.5); pointer-events: none;"></div>
                </div>
                <div class="brightness-control">
                    <label>Brightness: <span id="brightness-value-${colorKey}">${Math.round(hsv.v)}</span>%</label>
                    <input type="range" class="brightness-slider" id="brightness-${colorKey}" min="0" max="100" value="${Math.round(hsv.v)}" data-colorkey="${colorKey}" />
                </div>
            </div>`;
    }
                                                                                    
    render() {
        const t = this.t.bind(this);
        if (this._config?.entities) this._entities = this._config.entities;
        const entityRows = this._entities.map((entity, index) => this.renderEntityRow(entity, index)).join('');
        const colorConfigsHtml = [
            this.renderColorPicker('active_layer', t('editor_active_layer_label')),
            this.renderColorPicker('inactive_layer', t('editor_inactive_layer_label')),
            this.renderColorPicker('combined_folded_layer', t('editor_combined_folded_label')),
            this.renderColorPicker('combined_unfolded_layer', t('editor_combined_unfolded_label')),
            this.renderColorPicker('cursor', t('editor_cursor_label'))
        ].join('');

        // Render layout selector
        const layoutSelectorHtml = `<div class="form-section"><div class="section-title">${t('editor_layout_label')}</div><div class="input-group"><select id="layout-selector" class="layout-selector"><option value="entities" ${this._config.layout === 'entities' ? 'selected' : ''}>${t('editor_layout_entities')}</option><option value="days" ${this._config.layout === 'days' ? 'selected' : ''}>${t('editor_layout_days')}</option></select></div></div><div class="divider"></div>`;

        // Render color overrides section
        const colorOverridesHtml = this.renderColorOverridesSection(t);

        const styleContent = `:host { display: block; } ha-card { padding: 16px; } .editor-header { font-size: 20px; font-weight: bold; margin-bottom: 16px; } .form-section { margin-bottom: 24px; } .section-title { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: var(--primary-text-color); } .input-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; } .input-group label { font-weight: 500; font-size: 14px; color: var(--primary-text-color); } .input-group input[type="text"], .input-group input[type="checkbox"], .layout-selector { padding: 8px; border: 1px solid var(--divider-color); border-radius: 4px; background: var(--primary-background-color); color: var(--primary-text-color); font-size: 14px; } .input-group input[type="checkbox"] { width: auto; margin-top: 4px; } .layout-selector { cursor: pointer; } .input-group input:focus, .layout-selector:focus { outline: none; border-color: var(--primary-color); box-shadow: 0 0 0 2px var(--primary-color)33; } .input-with-suggestions { position: relative; width: 100%; } .suggestions-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: var(--primary-background-color); border: 1px solid var(--divider-color); border-top: none; border-radius: 0 0 4px 4px; max-height: 250px; overflow-y: auto; z-index: 1000; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); } .suggestion-item { padding: 8px 12px; cursor: pointer; color: var(--primary-text-color); display: flex; align-items: center; gap: 8px; transition: background 0.2s; } .suggestion-item:hover:not(.disabled) { background: var(--primary-color); color: white; } .suggestion-item.disabled { opacity: 0.5; cursor: default; } .entity-row { display: flex; gap: 12px; align-items: center; padding: 12px; background: var(--secondary-background-color); border: 1px solid var(--divider-color); border-radius: 6px; margin-bottom: 8px; } .handle { cursor: grab; color: var(--secondary-text-color); font-weight: bold; user-select: none; } .icon-name { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; } .entity-id { flex: 1; font-size: 12px; color: var(--secondary-text-color); font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .actions { display: flex; gap: 4px; } .action-button { background: transparent; border: 1px solid var(--divider-color); border-radius: 4px; padding: 4px 8px; cursor: pointer; display: flex; align-items: center; color: var(--primary-text-color); transition: all 0.2s; } .action-button:hover { background: var(--primary-color); border-color: var(--primary-color); color: white; } .entity-edit-form { background: var(--primary-background-color); padding: 12px; border-radius: 4px; margin-top: 8px; border: 1px solid var(--primary-color); } .entity-input { width: 100%; padding: 8px; border: 1px solid var(--divider-color); border-radius: 4px; background: var(--primary-background-color); color: var(--primary-text-color); font-size: 14px; box-sizing: border-box; } .entity-input:focus { outline: none; border-color: var(--primary-color); } .add-button { background: var(--primary-color); color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.2s; width: 100%; } .add-button:hover { opacity: 0.9; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); } .color-config-row { display: flex; flex-direction: column; gap: 8px; padding: 12px; background: var(--secondary-background-color); border: 1px solid var(--divider-color); border-radius: 6px; margin-bottom: 8px; } .color-config-row label { font-weight: 500; font-size: 13px; } .color-input-group { display: flex; gap: 8px; align-items: center; } .color-preview { width: 40px; height: 40px; border: 1px solid var(--divider-color); border-radius: 4px; cursor: pointer; transition: all 0.2s; } .color-preview:hover { box-shadow: 0 0 8px rgba(0, 0, 0, 0.3); } .color-hex-input { flex: 1; padding: 8px; border: 1px solid var(--divider-color); border-radius: 4px; background: var(--primary-background-color); color: var(--primary-text-color); font-size: 14px; font-family: monospace; } .color-hex-input:focus { outline: none; border-color: var(--primary-color); } .color-picker-popup { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--primary-background-color); border: 1px solid var(--divider-color); border-radius: 6px; padding: 12px; z-index: 1001; box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2); margin-top: 0; } .color-picker-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 999; } .color-wheel-container { position: relative; width: 280px; height: 280px; margin-bottom: 12px; } .color-wheel { cursor: crosshair; border-radius: 50%; } .brightness-control { display: flex; flex-direction: column; gap: 6px; } .brightness-control label { font-size: 13px; } .brightness-slider { width: 100%; height: 6px; border-radius: 3px; outline: none; -webkit-appearance: none; appearance: none; } .brightness-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--primary-color); cursor: pointer; } .brightness-slider::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: var(--primary-color); cursor: pointer; border: none; } .override-row { display: flex; gap: 4px; align-items: center; padding: 10px; background: var(--primary-background-color); border: 1px solid var(--divider-color); border-radius: 4px; margin-bottom: 6px; } .override-key { flex: 1; padding: 6px; font-family: monospace; font-size: 12px; background: var(--secondary-background-color); border-radius: 3px; } .override-colors-preview { display: flex; gap: 4px; } .override-color-preview { min-width: 60px; height: 32px; padding: 4px 8px; border: 1px solid var(--divider-color); border-radius: 3px; display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 11px; font-weight: bold; } .override-delete { background: transparent; border: 1px solid #e74c3c; color: #e74c3c; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 12px; } .override-delete:hover { background: #e74c3c; color: white; } .divider { height: 1px; background: var(--divider-color); margin: 16px 0; }`;

        const htmlContent = `<div class="editor-header">${t('editor_title')}</div><div class="form-section"><div class="section-title">${t('editor_card_title')}</div><div class="input-group"><input type="text" id="title-input" value="${escapeHtml(this._config.title || '')}" placeholder="${t('editor_title_placeholder')}"></div></div><div class="form-section"><div class="input-group"><label><input type="checkbox" id="show-state-input" ${this._config.show_state_in_title ? 'checked' : ''}>${t('editor_show_state_in_title')}</label></div></div><div class="divider"></div>${layoutSelectorHtml}<div class="form-section"><div class="section-title">${t('editor_entities_label')}</div><div id="entities-list">${entityRows || '<div style="color: var(--secondary-text-color); text-align: center; padding: 20px;">' + t('editor_no_entities') + '</div>'}</div><button class="add-button" id="add-btn">+ ${t('editor_add_entity')}</button></div><div class="divider"></div><div class="form-section"><div class="section-title">${t('editor_colors_label')}</div>${colorConfigsHtml}</div>${colorOverridesHtml}`;

        this.shadowRoot.innerHTML = `<style>${styleContent}</style><ha-card>${htmlContent}</ha-card>`;

        requestAnimationFrame(() => {
            this.attachListeners();
        });
    }

    // Draw color wheel canvas with HSV color space
    drawColorWheel(canvas, colorKey) {
        if (!canvas || !colorKey) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const radius = 130;
        const centerX = 140;
        const centerY = 140;

        // Get current color: for overrides, read from hidden input; for normal colors, read from config
        let currentColor;
        if (colorKey.startsWith('override-')) {
            const input = this.shadowRoot?.querySelector(`#${colorKey}-input`);
            currentColor = input ? input.value : '#cccccc';
        } else {
            currentColor = this._config.colors?.[colorKey] || DEFAULT_COLORS[colorKey];
        }

        const rgb = this.hexToRgb(currentColor);
        const hsv = rgb ? this.rgbToHsv(rgb.r, rgb.g, rgb.b) : {
            h: 0,
            s: 100,
            v: 100
        };
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

    // Handle color wheel click/drag to select color
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

    // Update dropdown suggestions for entity/icon search
    updateDropdown(inputElement, type) {
        const index = parseInt(inputElement.dataset.index);
        const container = inputElement.closest('.input-with-suggestions');
        if (!container) return;
        const filterText = inputElement.value || "";
        let items = "";
        let existingDropdown = container.querySelector('.suggestions-dropdown');
        if (existingDropdown) existingDropdown.remove();
        if (type === "entity") {
            const filtered = this.getFilteredEntities(filterText);
            if (filtered.length > 0) {
                items = filtered.map(e => `<div class="suggestion-item entity-suggestion" data-index="${index}" data-value="${escapeHtml(e)}">${escapeHtml(e)}</div>`).join('');
            } else if (filterText.length > 0) {
                items = `<div class="suggestion-item disabled">${this.t('editor_no_entities_found')}</div>`;
            }
        } else if (type === "icon") {
            const filtered = this.getFilteredIcons(filterText);
            if (filtered.length > 0) {
                items = filtered.map(icon => `<div class="suggestion-item icon-suggestion" data-index="${index}" data-value="${escapeHtml(icon)}"><ha-icon icon="${escapeHtml(icon)}"></ha-icon> ${escapeHtml(icon)}</div>`).join('');
            }
        }
        if (items) {
            const dropdown = document.createElement('div');
            dropdown.className = 'suggestions-dropdown';
            dropdown.innerHTML = items;
            container.appendChild(dropdown);
            dropdown.querySelectorAll('.suggestion-item:not(.disabled)').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const idx = parseInt(item.dataset.index);
                    const value = item.dataset.value;
                    const field = type === "entity" ? "entity" : "icon";
                    this.updateEntity(idx, field, value);
                    inputElement.value = value;
                    dropdown.remove();
                });
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

    // Attach all event listeners to form controls and color picker
    _attachInputListener(selector, field, handler) {
        this.shadowRoot.querySelectorAll(selector).forEach(input => {
            input.removeEventListener("change", handler);
            input.addEventListener("change", handler);
        });
    }

    _attachClickListener(selector, handler) {
        this.shadowRoot.querySelectorAll(selector).forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
        this.shadowRoot.querySelectorAll(selector).forEach(btn => {
            btn.addEventListener("click", handler);
        });
    }

    _attachSearchListener(selector, type) {
        this.shadowRoot.querySelectorAll(selector).forEach(input => {
            input.replaceWith(input.cloneNode(true));
        });
        
        this.shadowRoot.querySelectorAll(selector).forEach(input => {
            const focusHandler = (e) => this.updateDropdown(e.target, type);
            const inputHandler = (e) => this.updateDropdown(e.target, type);
            const blurHandler = (e) => {
                setTimeout(() => {
                    const container = e.target.closest('.input-with-suggestions');
                    if (container) {
                        const dropdown = container.querySelector('.suggestions-dropdown');
                        if (dropdown) dropdown.remove();
                    }
                }, 150);
            };
            const keydownHandler = (e) => {
                if (e.key === "Escape") {
                    const container = e.target.closest('.input-with-suggestions');
                    if (container) {
                        const dropdown = container.querySelector('.suggestions-dropdown');
                        if (dropdown) dropdown.remove();
                    }
                }
            };

            input.addEventListener("focus", focusHandler);
            input.addEventListener("input", inputHandler);
            input.addEventListener("blur", blurHandler);
            input.addEventListener("keydown", keydownHandler);
        });
    }

    _attachColorWheelListener(colorKey) {
        const canvas = this.shadowRoot.querySelector(`#color-wheel-${colorKey}`);
        if (!canvas) return;

        // Initialize handler storage if needed
        if (!this._colorWheelHandlers) {
            this._colorWheelHandlers = {};
        }

        // Clean old handlers if they exist
        if (this._colorWheelHandlers[colorKey]) {
            canvas.removeEventListener("click", this._colorWheelHandlers[colorKey].click);
            canvas.removeEventListener("mousemove", this._colorWheelHandlers[colorKey].move);
            delete this._colorWheelHandlers[colorKey];
        }

        // Create new handlers
        const clickHandler = (e) => this.handleWheelClick(e, colorKey);
        const moveHandler = (e) => {
            if (e.buttons === 1) this.handleWheelClick(e, colorKey);
        };

        // Store references
        this._colorWheelHandlers[colorKey] = {
            click: clickHandler,
            move: moveHandler
        };

        // Dessiner et attacher les listeners
        setTimeout(() => {
            this.drawColorWheel(canvas, colorKey);
        }, 0);

        canvas.addEventListener("click", clickHandler);
        canvas.addEventListener("mousemove", moveHandler);
    }

    attachListeners() {
        if (!this.shadowRoot) return;

        const titleInput = this.shadowRoot.querySelector("#title-input");
        const showStateInput = this.shadowRoot.querySelector("#show-state-input");
        const layoutSelector = this.shadowRoot.querySelector("#layout-selector");
        const addBtn = this.shadowRoot.querySelector("#add-btn");

        if (!titleInput || !showStateInput || !layoutSelector || !addBtn) {
            setTimeout(() => this.attachListeners(), 50);
            return;
        }

        this._attachInputListener("#title-input", "title", (e) => {
            this._config.title = e.target.value;
            this.fireConfigChanged();
        });

        this._attachInputListener("#show-state-input", "showState", (e) => {
            this._config.show_state_in_title = e.target.checked;
            this.fireConfigChanged();
        });

        this._attachInputListener("#layout-selector", "layout", (e) => {
            this._config.layout = e.target.value;
            this.fireConfigChanged();
        });

        this._attachClickListener("#add-btn", () => this.addEntity());

        // Add color overrides listeners
        this._attachClickListener("#add-override-btn", () => this.addColorOverride());
        this._attachClickListener(".override-delete", (e) => {
            const key = e.currentTarget.dataset.overrideKey;
            this.deleteColorOverride(key);
        });

        // Color picker buttons for override colors - utiliser le picker personnalisé
        this._attachClickListener("#override-bg-color-btn", () => {
            this.toggleColorPicker('override-bg-color');
        });
        this._attachClickListener("#override-text-color-btn", () => {
            this.toggleColorPicker('override-text-color');
        });

        this._attachClickListener(".edit-btn", (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            this.toggleEditForm(index);
        });

        this._attachClickListener(".remove-btn", (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            this.removeEntity(index);
        });

        this._attachInputListener(".entity-input:not(.entity-search):not(.icon-search)", "entity", (e) => {
            const index = parseInt(e.target.dataset.index);
            const field = e.target.dataset.field;
            this.updateEntity(index, field, e.target.value);
        });

        this._attachSearchListener(".entity-search", "entity");
        this._attachSearchListener(".icon-search", "icon");

        this.shadowRoot.querySelectorAll(".color-hex-input").forEach(input => {
            // Simply reattach listeners (no need to removeEventListener with null)
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

        this._attachClickListener(".color-preview", (e) => {
            const colorKey = e.currentTarget.dataset.colorkey;
            this.toggleColorPicker(colorKey);
        });

        this._attachClickListener(".color-picker-overlay", () => {
            this._colorPickerOpen = null;
            this.render();
        });

        this.shadowRoot.querySelectorAll(".color-wheel").forEach(canvas => {
            const colorKey = canvas.dataset.colorkey;
            this._attachColorWheelListener(colorKey);
        });

        this.shadowRoot.querySelectorAll(".brightness-slider").forEach(slider => {
            // Simply reattach listener (no need to removeEventListener with null)
            slider.addEventListener("input", (e) => {
                const colorKey = e.target.dataset.colorkey;
                const v = parseInt(e.target.value);
                const valueDisplay = this.shadowRoot.querySelector(`#brightness-value-${colorKey}`);
                if (valueDisplay) valueDisplay.textContent = v;

                // Get current color: for overrides, read from hidden input; for normal colors, read from config
                let currentColor;
                if (colorKey.startsWith('override-')) {
                    const input = this.shadowRoot?.querySelector(`#${colorKey}-input`);
                    currentColor = input ? input.value : '#cccccc';
                } else {
                    currentColor = this._config.colors?.[colorKey] || DEFAULT_COLORS[colorKey];
                }

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
window.customCards = window.customCards || [];
window.customCards.push({
    type: "schedule-state-card",
    name: "Schedule State Card",
    description: "Visualizes schedules defined via Schedule_state with color customization."
});
