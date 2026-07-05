const CARD_VERSION = "2.2.1";

console.info(`%c 🙂 Schedule State Card %c v${CARD_VERSION} %c`, "background:#2196F3;color:white;padding:2px 8px;border-radius:3px 0 0 3px;font-weight:bold", "background:#4CAF50;color:white;padding:2px 8px;border-radius:0 3px 3px 0", "background:none");

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
        if (msg === undefined) {
            // Single-argument call: the message was passed in the prefix slot
            console.warn('[ScheduleStateCard WARN]', prefix);
        } else if (prefix && typeof prefix === 'string' && prefix !== '') {
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
    if (msg === undefined) {
        // Single-argument call: the message was passed in the prefix slot
        console.error('[ScheduleStateCard ERROR]', prefix);
    } else if (prefix && typeof prefix === 'string' && prefix !== '') {
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
    static MAX_ENTRIES = 500;

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
     * Bounded cache: sensors with continuously varying values (prices, fine
     * temperatures) would otherwise grow the map forever during a session.
     * Colors are deterministic hashes, so evicting only costs a recompute.
     * @param {string} key - "value|unit" format
     * @param {Object} colorData - {color, textColor}
     */
    set(key, colorData) {
        if (this.cache.size >= ColorCacheSingleton.MAX_ENTRIES && !this.cache.has(key)) {
            // Map preserves insertion order: drop the oldest entry
            this.cache.delete(this.cache.keys().next().value);
        }
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
        invalid_data: "Invalid schedule data",
        dynamic_value: "Dynamic value",
        dynamic_ref_schedule: "schedule_state",
        dynamic_ref_sensor: "sensor",
        cond_month: "Month",
        cond_hour: "Hour(s)",
        cond_minute: "Minute(s)",
        cond_day: "Day(s)",
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
        invalid_data: "Données de planning invalides",
        dynamic_value: "Valeur dynamique",
        dynamic_ref_schedule: "état_planning",
        dynamic_ref_sensor: "capteur",
        cond_month: "Mois",
        cond_hour: "Heure(s)",
        cond_minute: "Minute(s)",
        cond_day: "Jour(s)",
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
        invalid_data: "Ungültige Zeitplandaten",
        dynamic_value: "Dynamischer Wert",
        dynamic_ref_schedule: "Zeitplan-Status",
        dynamic_ref_sensor: "Sensor",
        cond_month: "Monat",
        cond_hour: "Stunde(n)",
        cond_minute: "Minute(n)",
        cond_day: "Tag(e)",
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
        invalid_data: "Datos de horario inválidos",
        dynamic_value: "Valor dinámico",
        dynamic_ref_schedule: "estado_horario",
        dynamic_ref_sensor: "sensor",
        cond_month: "Mes",
        cond_hour: "Hora(s)",
        cond_minute: "Minuto(s)",
        cond_day: "Día(s)",
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
        invalid_data: "Dados de agenda inválidos",
        dynamic_value: "Valor dinâmico",
        dynamic_ref_schedule: "estado_agenda",
        dynamic_ref_sensor: "sensor",
        cond_month: "Mês",
        cond_hour: "Hora(s)",
        cond_minute: "Minuto(s)",
        cond_day: "Dia(s)",
        cond_and: "E",
        cond_or: "OU",
        cond_not: "NÃO",
        cond_sunrise: "Nascer do sol",
        cond_sunset: "Pôr do sol",
        cond_combined_result: "Agenda Combinada",
        cond_combined_schedule_toggle: "Resultado da Agenda Combinada (Clique para mostrar/ocultar regras)",
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
        editor_combined_folded_label: "Cor do Ícone Combinado (Recolhido)",
        editor_combined_unfolded_label: "Cor do Ícone Combinado (Expandido)",
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
        invalid_data: "Dados de programação inválidos",
        dynamic_value: "Valor dinâmico",
        dynamic_ref_schedule: "estado_programação",
        dynamic_ref_sensor: "sensor",
        cond_month: "Mês",
        cond_hour: "Hora(s)",
        cond_minute: "Minuto(s)",
        cond_day: "Dia(s)",
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
        editor_combined_folded_label: "Cor do Ícone Combinado (Recolhido)",
        editor_combined_unfolded_label: "Cor do Ícone Combinado (Expandido)",
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
        key: 'cond_day',
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
    TOOLTIP_AUTOHIDE_MS: 4000,
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
    if (text === null || text === undefined) return "";
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
    if (text === null || text === undefined) return "";
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

/**
 * Maps every Jinja2 now() attribute expression to its JS getter.
 * Used by both the JS fallback evaluator and the tooltip prettifier
 * so the "in range / in list" logic is written exactly once.
 *
 * Python weekday(): 0 = Monday … 6 = Sunday
 * Python isoweekday(): 1 = Monday … 7 = Sunday
 */
const NOW_ATTR_GETTERS = {
    'now().month':        () => new Date().getMonth() + 1,       // 1–12
    'now().hour':         () => new Date().getHours(),           // 0–23
    'now().minute':       () => new Date().getMinutes(),         // 0–59
    'now().second':       () => new Date().getSeconds(),         // 0–59
    'now().day':          () => new Date().getDate(),            // 1–31
    'now().year':         () => new Date().getFullYear(),
    'now().weekday()':    () => (new Date().getDay() + 6) % 7,  // 0=Mon … 6=Sun
    'now().isoweekday()': () => new Date().getDay() || 7,       // 1=Mon … 7=Sun
};

/**
 * Evaluate a Jinja2 "X in range(a,b)" or "X in [a,b,c]" (and their "not in"
 * variants) expression where X is one of the NOW_ATTR_GETTERS keys.
 *
 * Returns the boolean result, or null if the expression is not recognised.
 *
 * @param {string} inner - The stripped template content (no {{ }})
 * @returns {boolean|null}
 */
function evaluateNowInExpression(inner) {
    for (const [attr, getter] of Object.entries(NOW_ATTR_GETTERS)) {
        const esc = attr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        let m;

        // "not in" variants first — avoids false match on the "in" patterns
        m = inner.match(new RegExp(`^${esc}\\s+not\\s+in\\s+range\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)$`));
        if (m) { const v = getter(); return !(v >= +m[1] && v < +m[2]); }

        m = inner.match(new RegExp(`^${esc}\\s+not\\s+in\\s+\\[([^\\]]+)\\]$`));
        if (m) { return !m[1].split(',').map(n => +n.trim()).includes(getter()); }

        m = inner.match(new RegExp(`^${esc}\\s+in\\s+range\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)$`));
        if (m) { const v = getter(); return v >= +m[1] && v < +m[2]; }

        m = inner.match(new RegExp(`^${esc}\\s+in\\s+\\[([^\\]]+)\\]$`));
        if (m) { return m[1].split(',').map(n => +n.trim()).includes(getter()); }
    }
    return null;
}

class ConditionEvaluator {
    constructor(hass, selectedDay = "mon") {
        this.hass = hass;
        this.selectedDay = selectedDay;
        this.templateCache = new Map();  // value_template string → boolean
        this._templateCacheKey = null;   // invalidated when sensor last_update changes
    }

    /**
     * Evaluate all given template strings via HA's WebSocket (Jinja2 engine)
     * and store results in templateCache.
     *
     * Cache is invalidated whenever cacheKey changes — cacheKey should be the
     * sensor's last_update attribute, so the cache tracks HA's own evaluation
     * cycle (typically every minute) rather than a fixed time window.
     *
     * All templates are fetched in parallel in a single Promise.all().
     * Returns true only when at least one server result was fetched (triggers
     * re-render). Failed evaluations are cached with the JS fallback value so a
     * permanently failing template does not retry a WS round-trip on every
     * hass update.
     *
     * @param {Object} hass - Home Assistant hass object
     * @param {string[]} templates - List of value_template strings to evaluate
     * @param {string} cacheKey - Invalidation key (sensor last_update string)
     * @returns {Promise<boolean>} true if cache was updated with server results
     */
    async refreshTemplateCache(hass, templates, cacheKey) {
        if (this._templateCacheKey !== cacheKey) {
            this.templateCache.clear();
            this._templateCacheKey = cacheKey;
        }

        const uncached = templates.filter(t => !this.templateCache.has(t));
        if (!uncached.length) return false;

        let changed = false;
        await Promise.all(uncached.map(async (tmpl) => {
            try {
                const result = await this._evaluateTemplateViaWS(hass, tmpl);
                this.templateCache.set(tmpl, String(result).trim().toLowerCase() === 'true');
                changed = true;
            } catch (e) {
                errorLog('ConditionEvaluator', 'Template evaluation error via HA API:', tmpl, e);
                // Cache the same value _evaluateTemplateCondition would compute
                // live (JS fallback, else true) — no visual change, no WS retry spam.
                const inner = tmpl.replace(/^\s*\{\{\s*/, '').replace(/\s*\}\}\s*$/, '').trim();
                const fallback = evaluateNowInExpression(inner);
                this.templateCache.set(tmpl, fallback !== null ? fallback : true);
            }
        }));

        return changed;
    }

    /**
     * Evaluate a Jinja2 template via WebSocket (render_template).
     * Works for non-admin users, unlike the REST /api/template endpoint.
     */
    _evaluateTemplateViaWS(hass, template) {
        return new Promise((resolve, reject) => {
            let unsubscribe;
            let timedOut = false;
            const timer = setTimeout(() => {
                timedOut = true;
                if (unsubscribe) unsubscribe();
                reject(new Error('Template evaluation timeout'));
            }, 5000);

            hass.connection.subscribeMessage(
                (msg) => {
                    clearTimeout(timer);
                    if (unsubscribe) unsubscribe();
                    resolve(msg.result);
                },
                { type: 'render_template', template }
            ).then(u => {
                unsubscribe = u;
                // Subscription established AFTER the timeout fired: the promise is
                // already rejected — unsubscribe immediately so nothing leaks
                if (timedOut) unsubscribe();
            }).catch(e => {
                clearTimeout(timer);
                reject(e);
            });
        });
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
            if (condType === "template") {
                return this._evaluateTemplateCondition(condition);
            }

            return true;
        } catch (error) {
            errorLog("ConditionEvaluator", "Condition evaluation error:", error, condition);
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

    _evaluateTemplateCondition(condition) {
        const template = condition.value_template;
        if (!template || typeof template !== "string") return true;

        // Use HA-evaluated result if available (populated by refreshTemplateCache)
        if (this.templateCache.has(template)) {
            return this.templateCache.get(template);
        }

        // JS fallback for "now().X in range/list" patterns — covers any now() attribute.
        // Used only on the initial render before the async HA cache is populated.
        const inner = template.replace(/^\s*\{\{\s*/, '').replace(/\s*\}\}\s*$/, '').trim();
        const jsResult = evaluateNowInExpression(inner);
        if (jsResult !== null) return jsResult;

        // Unknown pattern and not yet cached — default to true, HA will correct it async
        debugWarn("ConditionEvaluator", "Unrecognized template, not yet cached — defaulting to true:", template);
        return true;
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
        // HA sends BCP47 codes ("pt-BR"); TRANSLATIONS keys use "_" ("pt_BR").
        // Try the normalized full code, then the base language, then English.
        const raw = this._hass?.locale?.language;
        if (!raw) return "en";
        const norm = raw.replace("-", "_");
        if (TRANSLATIONS[norm]) return norm;
        const base = norm.split("_")[0];
        return TRANSLATIONS[base] ? base : "en";
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
        // layerVisibility is intentionally KEPT: HA re-parents cards in the DOM
        // (masonry re-layout), and collapsing everything on each move is bad UX
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
        this._appliedOverrideKeys = null;

        this.currentTime = this.getCurrentTime();
        this.selectedDay = this.currentTime.day;
        this.selectedEntity = null;

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
    /**
     * Convert a Jinja2 now().month template condition into a human-readable string
     * using localized month names (via Intl.DateTimeFormat).
     *
     * Handles four patterns (with and without "not"):
     *   {{ now().month in range(4, 10) }}     → "Mois: Avril – Septembre"
     *   {{ now().month in [11, 12, 1, 2, 3] }} → "Mois: Novembre, Décembre, …"
     *   (same with "not in" → prefixed with ≠)
     *
     * Returns null if the text doesn't match any known month pattern,
     * so the caller can fall through to the normal translation pipeline.
     *
     * @param {string} text - Raw condition_text string
     * @returns {string|null}
     */
    /**
     * Convert a "now().X in range/list" Jinja2 condition to a human-readable label.
     * Uses Intl.DateTimeFormat for month and weekday names; raw numbers for the rest.
     * Returns null if the text doesn't match any supported now() pattern.
     *
     * @param {string} text - Raw condition_text (may start with "Custom: {{ … }}")
     * @returns {string|null}
     */
    _prettifyNowInConditionText(text) {
        const inner = text.replace(/^Custom:\s*/i, '').replace(/^\{\{\s*/, '').replace(/\s*\}\}$/, '').trim();
        const lang = this.getLanguage().replace("_", "-"); // BCP47 form for Intl ("pt_BR" would throw)

        // Per-attribute display: label shown before the values + formatter for each number
        const attrDisplay = {
            'now().month': {
                label: this.t('cond_month'),
                fmt: n => new Intl.DateTimeFormat(lang, { month: 'long' }).format(new Date(2000, n - 1, 1))
            },
            'now().weekday()': {
                label: this.t('cond_day'),
                // Python weekday() 0=Mon; Jan 3 2000 was a Monday
                fmt: n => new Intl.DateTimeFormat(lang, { weekday: 'long' }).format(new Date(2000, 0, 3 + n))
            },
            'now().isoweekday()': {
                label: this.t('cond_day'),
                // Python isoweekday() 1=Mon
                fmt: n => new Intl.DateTimeFormat(lang, { weekday: 'long' }).format(new Date(2000, 0, 2 + n))
            },
            'now().hour':   { label: this.t('cond_hour'),   fmt: n => String(n).padStart(2, '0') + 'h' },
            'now().minute': { label: this.t('cond_minute'), fmt: String },
            'now().day':    { label: this.t('cond_day'),    fmt: String },
        };

        for (const [attr, { label, fmt }] of Object.entries(attrDisplay)) {
            const esc = attr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            let m;

            m = inner.match(new RegExp(`^${esc}\\s+not\\s+in\\s+range\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)$`));
            if (m) return `${label}: ≠ ${fmt(+m[1])} – ${fmt(+m[2] - 1)}`;

            m = inner.match(new RegExp(`^${esc}\\s+not\\s+in\\s+\\[([^\\]]+)\\]$`));
            if (m) return `${label}: ≠ ${m[1].split(',').map(n => fmt(+n.trim())).join(', ')}`;

            m = inner.match(new RegExp(`^${esc}\\s+in\\s+range\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)$`));
            if (m) return `${label}: ${fmt(+m[1])} – ${fmt(+m[2] - 1)}`;

            m = inner.match(new RegExp(`^${esc}\\s+in\\s+\\[([^\\]]+)\\]$`));
            if (m) return `${label}: ${m[1].split(',').map(n => fmt(+n.trim())).join(', ')}`;
        }

        return null;
    }

    _translateConditionText(text) {
        if (!text) return "";

        // Prettify "now().X in range/list" patterns before generic translation
        const pretty = this._prettifyNowInConditionText(text);
        if (pretty !== null) return pretty;

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
        const tf = this._hass?.locale?.time_format;
        if (tf === "12") return true;
        if (tf === "24") return false;
        // "language" / "system" (or unset): let Intl decide from the locale,
        // so en-GB gets 24h while en-US gets 12h instead of forcing 12h on all English
        const locale = tf === "system" ? undefined : (this._hass?.locale?.language || "en").replace("_", "-");
        try {
            return new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hour12 === true;
        } catch (e) {
            return false;
        }
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
     * Build the layer-visibility key for an entity/day.
     * "days" layout shows one day at a time: keep the expanded state per ENTITY
     * so switching days preserves expansion (allows day-to-day comparison).
     * "entities" layout shows all 7 days at once, each with its own toggle,
     * so the key must include the day.
     * @param {string} entityId - Home Assistant entity ID
     * @param {string|null} dayId - Day identifier (defaults to selectedDay)
     * @returns {string} Visibility key
     */
    _visibilityKey(entityId, dayId = null) {
        if (this._config.layout === "entities") {
            return `${entityId}-${dayId || this.selectedDay}`;
        }
        return entityId;
    }

    /**
     * Toggle layer visibility for an entity on a specific day
     * @param {string} entityId - Home Assistant entity ID
     * @param {string} dayId - Day identifier
     */
    toggleLayerVisibility(entityId, dayId) {
        if (this._isToggling) return;
        this._isToggling = true;

        const visibilityKey = this._visibilityKey(entityId, dayId);
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

        // Apply color overrides to the global singleton cache (theme-like: shared
        // across all card instances on the page). Reconcile first: remove overrides
        // this card applied on a previous setConfig that are no longer in its
        // config, so YAML edits take effect without a full page reload.
        const newOverrideKeys = new Set(
            this._config.color_overrides && typeof this._config.color_overrides === 'object'
                ? Object.keys(this._config.color_overrides)
                : []
        );
        if (this._appliedOverrideKeys) {
            for (const key of this._appliedOverrideKeys) {
                if (!newOverrideKeys.has(key)) COLOR_CACHE.removeOverride(key);
            }
        }
        this._appliedOverrideKeys = newOverrideKeys;
        if (newOverrideKeys.size > 0) {
            COLOR_CACHE.setOverridesFromConfig(this._config.color_overrides);
            debugLog(`Applied ${newOverrideKeys.size} color overrides`);
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
                
                // Accept CSS variables (var(...)) — strict form only, same rule as
                // validateStyleValue, to prevent style-attribute breakout via config
                if (/^var\(--[a-z0-9-]+(\s*,\s*(#[0-9a-f]{6}|rgba?\([^()<>"';{}]+\)|hsla?\([^()<>"';{}]+\)))?\)$/i.test(strValue)) {
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
        const oldHass = this._hass;
        this.initializeServices(hass);
        this._hass = hass;
        this._langHelper.setHass(hass);
        if (this._config?.entities && !this.shadowRoot.querySelector("ha-card")) {
            this.render();
        }

        // Asynchronously pre-evaluate all template conditions via HA's Jinja2 engine.
        // On completion, updateContent() is called again so the card reflects the
        // server-evaluated results (any new templates that weren't yet cached).
        this._refreshTemplateConditions(hass);

        // Dirty-check: hass is replaced on ANY state change in the house. Skip the
        // full re-render unless something this card actually depends on changed:
        // configured sensors, entities referenced by conditions/templates, or locale.
        if (oldHass && oldHass.locale === hass.locale && !this._relevantStatesChanged(oldHass, hass)) {
            return;
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

    /**
     * Collect all unique `condition: template` value_template strings from every
     * entity layer and ask ConditionEvaluator to refresh their cached results via
     * HA's WebSocket render_template (works for non-admin users).
     *
     * The cache key is the most recent last_update across all configured entities.
     * This ties cache invalidation to HA's own evaluation cycle (every ~1 minute),
     * ensuring the card is always in sync with the server regardless of what the
     * templates contain (month, hour, weekday, state, …).
     *
     * Re-render is triggered only when refreshTemplateCache actually fetched new
     * results (i.e. the cache key changed or new templates appeared).
     *
     * @param {Object} hass - Home Assistant hass object
     */
    _refreshTemplateConditions(hass) {
        if (!this._config?.entities || !this.conditionEvaluator) return;

        const templates = new Set();
        let cacheKey = null;

        for (const entityConfig of this._config.entities) {
            const entityId = typeof entityConfig === 'string' ? entityConfig : entityConfig.entity;
            const state = hass.states[entityId];
            if (!state) continue;

            // Use last_update as invalidation signal — same cycle as HA's own evaluation
            const lastUpdate = state.attributes?.last_update;
            if (lastUpdate && (!cacheKey || lastUpdate > cacheKey)) {
                cacheKey = lastUpdate;
            }

            const layers = state.attributes?.layers;
            if (!layers) continue;
            for (const dayLayers of Object.values(layers)) {
                for (const layer of dayLayers) {
                    for (const block of layer.blocks || []) {
                        for (const cond of block.raw_conditions || []) {
                            if (cond.condition === 'template' && cond.value_template) {
                                templates.add(cond.value_template);
                            }
                        }
                    }
                }
            }
        }

        if (templates.size === 0) return;

        // No last_update attribute on any entity: fall back to minute resolution
        // so time-based templates are still re-evaluated periodically instead of
        // being frozen at their first result for the whole session.
        if (!cacheKey) {
            const now = new Date();
            cacheKey = `local-${now.getHours()}:${now.getMinutes()}`;
        }

        this.conditionEvaluator.refreshTemplateCache(hass, [...templates], cacheKey)
            .then(updated => { if (updated) this.updateContent(); })
            .catch(e => errorLog('ScheduleStateCard', 'Failed to refresh template conditions:', e));
    }

    /**
     * Collect every entity_id this card's rendering depends on: the configured
     * schedule sensors plus entities referenced inside their blocks' conditions
     * (state / numeric_state / nested and-or-not / template) and dynamic state
     * templates (states(...) / state_attr(...)).
     */
    _collectRelevantEntityIds(hass) {
        const ids = new Set();

        for (const entityConfig of this._config?.entities || []) {
            const entityId = typeof entityConfig === 'string' ? entityConfig : entityConfig.entity;
            if (!entityId) continue;
            ids.add(entityId);

            const layers = hass.states[entityId]?.attributes?.layers;
            if (!layers) continue;
            for (const dayLayers of Object.values(layers)) {
                for (const layer of dayLayers) {
                    for (const block of layer.blocks || []) {
                        for (const cond of block.raw_conditions || []) {
                            this._addConditionEntityIds(cond, ids);
                        }
                        const tmpl = block.raw_state_template || block.state_value;
                        if (typeof tmpl === 'string') {
                            for (const m of tmpl.matchAll(/(?:states|state_attr)\(\s*['"]([^'"]+)['"]/g)) {
                                ids.add(m[1]);
                            }
                        }
                    }
                }
            }
        }
        return ids;
    }

    _addConditionEntityIds(cond, ids) {
        if (!cond || typeof cond !== 'object') return;
        if (cond.entity_id) {
            const list = Array.isArray(cond.entity_id) ? cond.entity_id : [cond.entity_id];
            for (const id of list) ids.add(id);
        }
        if (typeof cond.value_template === 'string') {
            for (const m of cond.value_template.matchAll(/(?:states|state_attr)\(\s*['"]([^'"]+)['"]/g)) {
                ids.add(m[1]);
            }
        }
        if (Array.isArray(cond.conditions)) {
            for (const c of cond.conditions) this._addConditionEntityIds(c, ids);
        }
    }

    _relevantStatesChanged(oldHass, hass) {
        // HA state objects are immutable — identity comparison is enough
        for (const id of this._collectRelevantEntityIds(hass)) {
            if (oldHass.states[id] !== hass.states[id]) return true;
        }
        return false;
    }

    static async getConfigElement() {
        if (!customElements.get('schedule-state-card-editor')) {
            await import('./schedule-state-card-editor.js');
        }
        return document.createElement('schedule-state-card-editor');
    }

    static getStubConfig(hass, entities, entitiesFallback) {
        // HA 2026.6 entity-first card picker: pre-fill a schedule_state sensor.
        // Filter on the entity-registry platform so only entities created by the
        // schedule_state integration are picked (not every sensor).
        // 1) entity selected in the picker, 2) fallback list, 3) first available in hass.
        const isScheduleSensor = (id) => hass?.entities?.[id]?.platform === 'schedule_state';

        const pick = (list) => (list || []).filter(isScheduleSensor);

        let chosen = pick(entities);
        if (!chosen.length) chosen = pick(entitiesFallback);
        if (!chosen.length && hass?.entities) {
            chosen = Object.keys(hass.entities).filter(isScheduleSensor);
        }

        const entityId = chosen[0];
        if (entityId) {
            return {
                entities: [{
                    entity: entityId,
                    name: hass?.states?.[entityId]?.attributes?.friendly_name || entityId
                }],
                title: "Schedule Planning",
                colors: {
                    ...DEFAULT_COLORS
                }
            };
        }

        // No schedule_state sensor found: return an empty config and let the
        // user pick an entity in the editor (no broken hardcoded example)
        return {
            entities: [],
            title: "Schedule Planning",
            colors: {
                ...DEFAULT_COLORS
            }
        };
    }

    getCardSize() {
        return (this._config?.entities?.length ?? 1) + 2;
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
        if (/^var\(--[a-z0-9-]+(\s*,\s*(#[0-9a-f]{6}|rgba?\([^()<>"';{}]+\)|hsla?\([^()<>"';{}]+\)))?\)$/i.test(original)) {
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
        expr = expr.replace(/\band\b/gi, "&&").replace(/\bor\b/gi, "||").replace(/\bnot\b/gi, "!");
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

            // Tap display (touch devices have no mouseover): show immediately,
            // then auto-hide. Σ-toggle and room-name clicks returned above.
            if (e.type === "click" && tooltipTarget) {
                const tooltip = tooltipTarget.dataset.tooltip;
                if (tooltip) {
                    this.clearTooltipTimer();
                    this.showTooltip({ clientX: e.clientX, clientY: e.clientY }, tooltip);
                    const hideTimer = setTimeout(() => this.hideTooltip(), LAYOUT_CONSTANTS.TOOLTIP_AUTOHIDE_MS);
                    this._state.setTimer('tooltip', hideTimer);
                }
                return;
            }

            // Tap outside any tooltip target: dismiss an open tooltip
            if (e.type === "click") {
                this.clearTooltipTimer();
                this.hideTooltip();
                return;
            }

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
        return '<div class="room-timeline"><div class="room-header"><ha-icon icon="mdi:alert-circle"></ha-icon><span class="room-name" data-entity-id="' + escapeHtmlAttribute(entityId) + '" style="color:var(--error-color);">' + escapeHtml(entityId) + '</span></div><div class="timeline-container" style="padding:16px;text-align:center;"><div style="color:var(--secondary-text-color);">' + escapeHtml(message) + "</div></div></div>";
    }

    renderTimeline(roomName, roomIcon, allLayers, unitOfMeasurement, entityId, entityState, dayId = null) {
        const entityName = this.getEntityNameForLog(entityId);
        debugLog(entityName, "[renderTimeline] entityId:", entityId, "dayId:", dayId, "allLayers count:", allLayers.length);

        // Validate inputs first
        if (!this._validateTimelineInputs(roomName, allLayers, entityId)) {
            return this.renderErrorCard(entityId, this.t("invalid_data"));
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

    /**
     * Recursively describe an HA condition object for display (issue #16).
     *   1. cond.alias wins — even on an and/or/not wrapper.
     *   2. and/or/not: describe each sub-condition, join with the translated
     *      operator; groups of 2+ get parentheses.
     *   3. Leaf without alias: technical text built from the structured dict.
     * @param {Object} cond - Raw HA condition dict (from block.raw_conditions)
     * @returns {string}
     */
    describeCondition(cond) {
        if (!cond || typeof cond !== 'object') return "";

        // 1. Explicit alias always wins
        if (typeof cond.alias === 'string' && cond.alias.trim()) {
            return cond.alias.trim();
        }

        // 2. Logical wrappers: recurse and join with the translated operator
        const type = cond.condition;
        if (type === 'and' || type === 'or') {
            const parts = (cond.conditions || []).map(c => this.describeCondition(c)).filter(Boolean);
            if (!parts.length) return "";
            if (parts.length === 1) return parts[0];
            const op = type === 'and' ? this.t('cond_and') : this.t('cond_or');
            return `(${parts.join(` ${op} `)})`;
        }
        if (type === 'not') {
            const parts = (cond.conditions || []).map(c => this.describeCondition(c)).filter(Boolean);
            if (!parts.length) return "";
            return `${this.t('cond_not')} (${parts.join(` ${this.t('cond_and')} `)})`;
        }

        // 3. Technical leaf
        return this._describeLeafCondition(cond);
    }

    /**
     * Technical description of a leaf condition (no alias), built from the
     * structured dict instead of the server-flattened condition_text.
     */
    _describeLeafCondition(cond) {
        const type = cond.condition;
        const entityList = () => {
            const list = Array.isArray(cond.entity_id) ? cond.entity_id : [cond.entity_id];
            return list.filter(Boolean).join(', ');
        };

        if (type === 'state') {
            const states = Array.isArray(cond.state) ? cond.state.join('|') : cond.state;
            return `${entityList()} == ${states}`;
        }

        if (type === 'numeric_state') {
            const entity = entityList();
            if (cond.above !== undefined && cond.below !== undefined) {
                return `${cond.above} < ${entity} < ${cond.below}`;
            }
            if (cond.above !== undefined) return `${entity} > ${cond.above}`;
            if (cond.below !== undefined) return `${entity} < ${cond.below}`;
            return entity;
        }

        if (type === 'time') {
            const parts = [];
            if (Array.isArray(cond.weekday) && cond.weekday.length) {
                const days = this.t('days');
                parts.push(`${this.t('cond_day')}: ${cond.weekday.map(d => days[d] || d).join(', ')}`);
            }
            if (cond.after) parts.push(`${this.t('cond_after')} ${this._formatTimeForDisplay(String(cond.after))}`);
            if (cond.before) parts.push(`${this.t('cond_before')} ${this._formatTimeForDisplay(String(cond.before))}`);
            if (cond.month !== undefined && cond.month !== null) {
                const months = Array.isArray(cond.month) ? cond.month : [cond.month];
                const lang = this.getLanguage().replace('_', '-');
                const names = months.map(m => new Intl.DateTimeFormat(lang, { month: 'long' }).format(new Date(2000, m - 1, 1)));
                parts.push(`${this.t('cond_month')}: ${names.join(', ')}`);
            }
            return parts.join(', ');
        }

        if (type === 'template') {
            const tmpl = cond.value_template || '';
            const pretty = this._prettifyNowInConditionText(String(tmpl));
            if (pretty !== null) return pretty;
            const inner = String(tmpl).replace(/^\s*\{\{\s*/, '').replace(/\s*\}\}\s*$/, '').trim();
            return inner.length > 60 ? inner.slice(0, 57) + '…' : inner;
        }

        if (type === 'sun') {
            const evName = (ev) => ev === 'sunrise' ? this.t('cond_sunrise') : this.t('cond_sunset');
            const parts = [];
            if (cond.after) parts.push(`${this.t('cond_after')} ${evName(cond.after)}`);
            if (cond.before) parts.push(`${this.t('cond_before')} ${evName(cond.before)}`);
            return parts.join(', ');
        }

        // Unknown condition type
        return type || "";
    }

    /**
     * Condition text shown in the layer-number tooltip (issue #16).
     * Built from the structured raw_conditions (which carry the HA "alias"
     * field) via describeCondition; the event's condition list is an implicit
     * AND. Falls back to the server-flattened condition_text when no
     * structured conditions are available (compat).
     */
    _getLayerConditionText(layer) {
        if (!layer.is_combined_layer && this.conditionEvaluator) {
            const conditions = this.conditionEvaluator._collectUniqueConditions(layer.blocks || []);
            const parts = conditions.map(c => this.describeCondition(c)).filter(Boolean);
            if (parts.length) {
                const text = [...new Set(parts)].join(` ${this.t('cond_and')} `);
                // A single parenthesized group needs no outer parentheses
                const m = parts.length === 1 ? text.match(/^\((.*)\)$/) : null;
                return m ? m[1] : text;
            }
        }
        return this._translateConditionText(layer.condition_text || "");
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
                conditionText: this._getLayerConditionText(layer)
            });
        });

        return metadata;
    }

    _filterLayersForDisplay(allLayers, entityId, layersMetadata, dayId = null) {
        const visibilityKey = this._visibilityKey(entityId, dayId);
        this._state.initializeLayerVisibility(visibilityKey, false);
        const isExpanded = this._state.isLayerVisible(visibilityKey);

        const entityName = this.getEntityNameForLog(entityId);
        debugLog(entityName, "[_filterLayersForDisplay] entityId:", entityId, "dayId:", dayId, "visibilityKey:", visibilityKey, "isExpanded:", isExpanded);

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

        // Only rules NOT already in generateStylesheet()
        const additionalStyle = `
            .combined-layer-toggle{padding-left:0;padding-right:0}
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

        // Only rules NOT already in generateStylesheet()
        const additionalStyle = `
            .combined-layer-toggle{padding-left:0;padding-right:0}
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

        const foldedBg = this.validateStyleValue(this._colors.combined_folded_layer);
        const unfoldedBg = this.validateStyleValue(this._colors.combined_unfolded_layer);

        let toggleClass = "";
        let iconStyle = `background:${foldedBg};filter:brightness(1.1);`;

        if (!isSelectedDayToday) {
            iconStyle = `background:${foldedBg};opacity:0.5;filter:brightness(0.8);`;
        }

        if (hasCollapsibleLayers) {
            toggleClass = " combined-layer-toggle";

            const visibilityKey = this._visibilityKey(entityId, dayId);
            const isExpanded = this._state.isLayerVisible(visibilityKey);

            debugLog(entityName, "[_renderCombinedLayerIcon] entityId:", entityId, "dayId:", dayId, "visibilityKey:", visibilityKey, "isExpanded:", isExpanded);

            if (isExpanded) {
                iconStyle = `background:${unfoldedBg};filter:brightness(1.3);`;
                if (!isSelectedDayToday) {
                    iconStyle = `background:${unfoldedBg};opacity:0.5;filter:brightness(0.8);`;
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
            `background:${this.validateStyleValue(this._colors.active_layer)};filter:brightness(1.3);` :
            `background:${this.validateStyleValue(this._colors.inactive_layer)};opacity:0.5;`;

        const opacityAdjust = !isSelectedDayToday ? "opacity:0.5;" : "";
        const finalStyle = opacityAdjust ? `${iconStyle}${opacityAdjust}` : iconStyle;

        return `<div class="icon-row" style="top:${top}px;" data-tooltip="${escapeHtml(iconTooltipText)}"><span class="layer-number" style="${finalStyle}">${escapeHtml(displayLayerIndex)}</span></div>`;
    }

    _renderBlock(block, currentLayer, meta, top, containerWidth, unitOfMeasurement, isSelectedDayToday) {
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

        // Get state and color — "??" (not "||") so a state value of 0 is kept
        const rawState = block.state_value ?? "";
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

        // Get colors — explicit emptiness check so a state value of 0 keeps its own color
        const hasStateValue = resolvedState !== null && resolvedState !== undefined && String(resolvedState).trim() !== "";
        const colorData = this.getColorForState(hasStateValue ? resolvedState : "default", unit || unitOfMeasurement);
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

        let timelines = "";

        if (groupByDay) {
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

                const visibilityKey = this._visibilityKey(entityId);
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
        // Support for card_mod styles — string only, and strip "<" so the value
        // can never terminate the <style> block or inject HTML into shadowRoot
        const rawCardMod = this._config.card_mod?.style;
        const cardModStyle = typeof rawCardMod === 'string' ? rawCardMod.replace(/</g, '') : '';

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

        // HA re-parents cards in the DOM (masonry re-layout, view switches, edit
        // preview), which fires disconnectedCallback + connectedCallback on the
        // SAME element. disconnectedCallback detached every listener, so the card
        // must be fully rebuilt when it comes back, or it stays frozen.
        if (this._wasDisconnected && this._config?.entities && this._hass) {
            this._wasDisconnected = false;
            this.render();
        }
    }

    disconnectedCallback() {
        /**
         * Complete cleanup when component is removed from DOM
         * Ensures no memory leaks or lingering resources
         */

        // Mark for full rebuild on reconnection (HA re-parents cards in the DOM)
        this._wasDisconnected = true;

        // Stop timeline updates
        this.stopTimelineUpdate();

        // Detach listeners BEFORE resetOnDisconnect() nulls the stored references
        const container = this.shadowRoot?.querySelector("#content");
        if (container && this._state?.eventListener) {
            this._detachEventHandlers(container, this._state.eventListener);
        }

        const dayButtons = this.shadowRoot?.querySelectorAll(".day-button");
        if (dayButtons) {
            dayButtons.forEach((btn, idx) => {
                if (this._dayButtonHandlers[idx]) {
                    btn.removeEventListener("click", this._dayButtonHandlers[idx]);
                }
            });
        }
        this._dayButtonHandlers = [];

        if (this._entitySelectorHandler) {
            const selector = this.shadowRoot?.querySelector("#entity-selector");
            if (selector) {
                selector.removeEventListener("change", this._entitySelectorHandler);
            }
            this._entitySelectorHandler = null;
        }

        // Clear timers, caches and visibility state
        this._state?.resetOnDisconnect();

        // Clean up the tooltip appended to document.body
        if (this.tooltipElement) {
            this.tooltipElement.remove();
            this.tooltipElement = null;
        }
    }

}

customElements.define("schedule-state-card", ScheduleStateCard);

// Expose shared globals for the editor module (loaded via dynamic import as ES module,
// which cannot access top-level const from this classic script directly)
window._scheduleStateCardShared = { TRANSLATIONS, DEFAULT_COLORS, COLOR_CACHE, escapeHtml, DAY_ORDER };

window.customCards = window.customCards || [];
window.customCards.push({
    type: "schedule-state-card",
    name: "Schedule State Card",
    description: "Visualizes schedules defined via Schedule_state with color customization.",
    documentationURL: "https://github.com/Pulpyyyy/schedule-state-card",
    preview: true,
    // HA 2026.6 entity-first card picker: suggest this card only when a sensor
    // created by the schedule_state integration is selected (entity-registry platform).
    // Returns an array so the picker offers both layouts as separate variants.
    getEntitySuggestion: (hass, entityId) => {
        if (hass?.entities?.[entityId]?.platform !== 'schedule_state') {
            return null;
        }
        const state = hass.states[entityId];
        const entities = [{
            entity: entityId,
            name: state?.attributes?.friendly_name || entityId
        }];

        // Localized variant labels (same normalization as LanguageHelper)
        const norm = (hass?.locale?.language || 'en').replace('-', '_');
        const tr = TRANSLATIONS[norm] || TRANSLATIONS[norm.split('_')[0]] || TRANSLATIONS.en;

        return [
            {
                label: tr.editor_layout_days || TRANSLATIONS.en.editor_layout_days,
                config: {
                    type: 'custom:schedule-state-card',
                    entities: entities.map(e => ({ ...e })),
                    layout: 'days'
                }
            },
            {
                label: tr.editor_layout_entities || TRANSLATIONS.en.editor_layout_entities,
                config: {
                    type: 'custom:schedule-state-card',
                    entities: entities.map(e => ({ ...e })),
                    layout: 'entities'
                }
            }
        ];
    }
});
