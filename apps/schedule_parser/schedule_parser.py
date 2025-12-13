import appdaemon.plugins.hass.hassapi as hass
import yaml
from datetime import datetime
import re
import os
from collections import OrderedDict
from typing import Optional, Dict, List, Any, Set, Tuple

class ScheduleParser(hass.Hass):
    """
    AppDaemon App to parse schedule configurations from a YAML file 
    and create 'schedule_state' sensors in Home Assistant.
    """

    def initialize(self) -> None:
        """Application initialization."""
        self.log("Schedule Parser - Initialization...")
        
        self.config_file: Optional[str] = self.args.get('config_file')
        self.secrets_file: str = self.args.get('secrets_file', '/config/secrets.yaml')
        self.schedule_sensor_names: Set[str] = set()
        self.dynamic_entities: Set[str] = set()
        self.schedule_state_entities: Set[str] = set()
        self._secrets: Dict[str, Any] = {}

        if not self.config_file:
            self.log("No config_file provided in apps.yaml. Aborting.", level="ERROR")
            return
        
        if not os.path.exists(self.config_file):
            self.log(f"Configuration file not found: {self.config_file}", level="ERROR")
            return

        self._load_secrets(self.secrets_file)
        
        # Run parsing 10 seconds after startup
        self.run_in(self.parse_schedules, 10)
        # Run parsing every hour (3600 seconds)
        self.run_every(self.parse_schedules, "now+60", 3600)
        # Listen for an event to manually reload
        self.listen_event(self.parse_schedules, "reload_schedules")
        
        self.log(f"Schedule Parser initialized using: {self.config_file}")

    def parse_schedules(self, *args, **kwargs) -> None:
        """
        Parses the configuration file, extracts 'schedule_state' sensors, 
        and triggers their processing.
        """
        if not self.config_file:
            self.log("Config file not set, aborting parse.", level="ERROR")
            return

        self.log(f"Starting parsing of {self.config_file}...")
        
        # Reset dynamic entities lists for each run
        self.dynamic_entities.clear()
        self.schedule_state_entities.clear()
        
        raw_config: str = ""
        try:
            with open(self.config_file, 'r', encoding='utf-8') as f:
                raw_config = f.read()
        except Exception as e:
            self.log(f"Error reading config file '{self.config_file}': {e}", level="ERROR")
            return

        # --- FIX: Remplacer les espaces insécables ('\xa0') par des espaces standards ---
        raw_config = raw_config.replace('\xa0', ' ')

        config: Dict[str, Any] = {}
        try:
            # Tente le chargement complet
            config = yaml.safe_load(raw_config) or {}
        # --- FIX: Catch toute erreur (ValueError, YAMLError, etc.) pour tomber sur le parsing partiel ---
        except Exception as e: 
            self.log(f"Error loading global YAML (likely due to !include/secrets or indentation): {e}. Attempting extraction of sensor section...", level="WARNING")
            config = self._load_partial_sensors(raw_config)
        
        schedule_sensors: List[Dict[str, Any]] = self._extract_schedule_sensors(config)

        # PRE-PASS: Register all potential schedule_state entities (including variants)
        self._register_schedule_state_entities(schedule_sensors)
        
        # PASS 1: Build the complete list of dynamic entities
        self._build_dynamic_entities_list(schedule_sensors)

        days: List[str] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
        parsed_count: int = 0
        
        # PASS 2: Process sensors with the complete list of dynamic entities
        for sensor_cfg in schedule_sensors:
            try:
                self._process_sensor(sensor_cfg, days)
                parsed_count += 1
            except Exception as e:
                sensor_name = sensor_cfg.get('name', '?')
                self.log(f"Error parsing sensor '{sensor_name}': {e}", level="ERROR")
                import traceback
                self.log(traceback.format_exc(), level="ERROR")
                continue
        
        self.log(f"Parsing completed: {parsed_count}/{len(schedule_sensors)} sensors processed successfully")

    def _load_partial_sensors(self, raw_config: str) -> Dict[str, List[Dict[str, Any]]]:
        """Tries to extract the 'sensor' section if the global YAML is invalid."""
        sensor_blocks: List[str] = self._extract_sensor_blocks(raw_config)
        if not sensor_blocks:
            self.log("No sensor section found or extraction failed.", level="WARNING")
            return {}
        
        sensors: List[Dict[str, Any]] = []
        for i, block in enumerate(sensor_blocks):
            
            # --- AJOUT: Ignorer les blocs qui contiennent une clé 'sensor:' imbriquée (e.g. template) ---
            # Le bloc commence déjà par 'sensor:\n', nous recherchons donc une autre instance indentée.
            if re.search(r'^\s{2,}sensor:', block, flags=re.MULTILINE):
                 self.log(f"Sensor block #{i} skipped: Contains nested 'sensor:' key (likely from template/packages).", level="DEBUG")
                 continue
            # --- FIN AJOUT ---

            try:
                # Le bloc est censé être lisible maintenant
                loaded = yaml.safe_load(block)
                if isinstance(loaded, dict) and 'sensor' in loaded:
                    s = loaded['sensor']
                    sensors.extend(s) if isinstance(s, list) else (sensors.append(s) if isinstance(s, dict) else None)
                elif isinstance(loaded, list):
                    sensors.extend(loaded)
                elif isinstance(loaded, dict):
                    sensors.append(loaded)
            except yaml.YAMLError as e:
                # Ce bloc capture la YAMLError, par exemple si l'indentation est incorrecte dans le bloc extrait.
                # Nous dégradons le niveau à DEBUG pour ne pas encombrer les logs en cas d'erreur attendue.
                self.log(f"Sensor block #{i} unreadable, skipped: {e}", level="DEBUG")
        
        return {'sensor': sensors}

    def _extract_schedule_sensors(self, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extracts 'schedule_state' sensor configurations."""
        sensors_section: List[Any] = []
        
        if isinstance(config, dict):
            sensors_section = config.get('sensor', []) or []
        elif isinstance(config, list):
            for item in config:
                if isinstance(item, dict):
                    if 'sensor' in item:
                        s = item['sensor']
                        sensors_section.extend(s) if isinstance(s, list) else (sensors_section.append(s) if isinstance(s, dict) else None)
                    elif item.get('platform') == 'schedule_state':
                        sensors_section.append(item)
        
        if isinstance(sensors_section, dict):
            sensors_section = [sensors_section]
        elif not isinstance(sensors_section, list):
            sensors_section = []

        schedule_sensors: List[Dict[str, Any]] = []
        for i, s in enumerate(sensors_section):
            try:
                if not isinstance(s, dict):
                    raise ValueError("sensor block is not a mapping")
                if s.get('platform') == 'schedule_state':
                    schedule_sensors.append(s)
                    sensor_name: Optional[str] = s.get('name')
                    if sensor_name:
                        self.schedule_sensor_names.add(sensor_name)
            except Exception as e:
                self.log(f"Skipping invalid sensor block #{i}: {e}", level="ERROR")
                continue
        
        return schedule_sensors

    def _register_schedule_state_entities(self, schedule_sensors: List[Dict[str, Any]]) -> None:
        """Adds all potential schedule_state entities to the monitored entities."""
        for sensor_cfg in schedule_sensors:
            sensor_name: str = sensor_cfg.get('name', 'Unknown')
            sensor_id: str = self._clean_sensor_id(sensor_name)
            
            # Add all variants for dynamic detection
            self.schedule_state_entities.add(f"sensor.schedule_{sensor_id}")
            # Maintain compatibility with consigne_* naming
            self.schedule_state_entities.add(f"sensor.{sensor_id}")

    def _build_dynamic_entities_list(self, schedule_sensors: List[Dict[str, Any]]) -> None:
        """Builds the complete list of entities referenced in the schedules."""
        for sensor_cfg in schedule_sensors:
            sensor_name: str = sensor_cfg.get('name', 'Unknown')
            sensor_id: str = self._clean_sensor_id(sensor_name)
            schedule_entity_id: str = f"sensor.schedule_{sensor_id}"
            self.dynamic_entities.add(schedule_entity_id)
            
            events: List[Dict[str, Any]] = sensor_cfg.get('events', []) or []
            self._extract_dynamic_entities(events)
            
            raw_default: str = sensor_cfg.get('default', sensor_cfg.get('default_state', 'unknown'))
            self._extract_dynamic_entities([{'state': raw_default}])

    def _extract_dynamic_entities(self, items: List[Dict[str, Any]]) -> None:
            """Extracts all entities referenced in items (events, states)."""
            if not items:
                return
            
            for item in items:
                if not isinstance(item, dict):
                    continue
                
                for key in ['state', 'state_value', 'raw_state_template', 'default_state']:
                    if key in item:
                        value: Any = item[key]
                        if isinstance(value, str):
                            # Search for states()
                            entities: List[str] = re.findall(r"states\s*\(\s*['\"]([^'\"]+)['\"]\s*\)", value)
                            # Search for state_attr()
                            entities += re.findall(r"state_attr\s*\(\s*['\"]([^'\"]+)['\"]", value)
                            # # Search for is_state() (Ajout pour capturer les dépendances dans les conditions Jinja)
                            # entities += re.findall(r"is_state\s*\(\s*['\"]([^'\"]+)['\"]", value)
                            
                            self.dynamic_entities.update(entities)
                
                if 'events' in item:
                    self._extract_dynamic_entities(item['events'])

    def _process_sensor(self, sensor_cfg: Dict[str, Any], days: List[str]) -> None:
        """Processes a sensor configuration and updates its Home Assistant state."""
        sensor_name: str = sensor_cfg.get('name', 'Unknown')
        
        # Clean ID to create the target entity_id
        sensor_id: str = self._clean_sensor_id(sensor_name)
        
        raw_default: str = sensor_cfg.get('default', sensor_cfg.get('default_state', 'unknown'))
        default_state: str = raw_default
        events: List[Dict[str, Any]] = sensor_cfg.get('events', []) or []
        allow_wrap: bool = sensor_cfg.get('allow_wrap', False)

        # Handle schedule inheritance
        parent_sensor_id: Optional[str] = self._extract_parent_schedule(raw_default)
        if parent_sensor_id:
            self.log(f"Sensor '{sensor_name}' will inherit schedule from '{parent_sensor_id}'")
            parent_events: List[Dict[str, Any]] = self._get_parent_events(parent_sensor_id)
            if parent_events:
                events = parent_events + events  # Local events take precedence

        layers_by_day: Dict[str, List[Dict[str, Any]]] = {}
        for day in days:
            layers_by_day[day] = self._build_layers_for_day(
                day, events, raw_default, allow_wrap
            )

        entity_id: str = f"sensor.schedule_{sensor_id}"
        total_events: int = sum(len(layers_by_day[day]) for day in days)
        unit_of_measurement: str = self._get_unit_of_measurement(sensor_cfg)

        attributes: Dict[str, Any] = {
            'platform': 'schedule_state',
            'room': sensor_name,
            'default_state': default_state,
            'layers': layers_by_day,
            'events': events,
            'total_events': total_events,
            'icon': 'mdi:calendar-month',
            # French friendly name for HA display (translated from name)
            'friendly_name': sensor_name, 
            'last_update': datetime.now().isoformat()
        }

        if unit_of_measurement:
            attributes['unit_of_measurement'] = unit_of_measurement
        
        extra_attrs: Any = sensor_cfg.get('extra_attributes', {})
        if isinstance(extra_attrs, dict):
            attributes.update(extra_attrs)

        # Update the Home Assistant sensor state
        self.set_state(entity_id, state=total_events, attributes=attributes)
        
        for day in days:
            day_layers = layers_by_day[day]
            default_count = sum(1 for layer in day_layers if layer.get('is_default_layer', False))
            other_count = len(day_layers) - default_count
            self.log(f"  Day {day}: {other_count} regular layers + {default_count} default layers = {len(day_layers)} total", level="DEBUG")
        
        self.log(f"Sensor '{entity_id}': {total_events} events - Unit: '{unit_of_measurement}'", level="INFO")

    def _clean_sensor_id(self, sensor_name: str) -> str:
        """Normalizes the sensor name to get a clean ID."""
        sensor_id: str = self.clean_string(sensor_name.lower().replace(' ', '_'))
        # Remove multiple/redundant prefixes
        sensor_id = sensor_id.replace('sensor_schedule_state_', '')
        sensor_id = sensor_id.replace('sensor_schedule_', '')
        sensor_id = sensor_id.replace('schedule_state_', '')
        return sensor_id

    def _get_unit_of_measurement(self, sensor_cfg: Dict[str, Any]) -> str:
        """Retrieves the unit of measurement from the configuration."""
        unit_of_measurement: str = sensor_cfg.get('unit_of_measurement', '')
        
        if not unit_of_measurement:
            extra_attrs: Any = sensor_cfg.get('extra_attributes', {})
            if isinstance(extra_attrs, dict):
                unit_of_measurement = extra_attrs.get('unit_of_measurement', '')
            elif isinstance(extra_attrs, str):
                unit_of_measurement = extra_attrs
            else:
                unit_of_measurement = str(extra_attrs) if extra_attrs else ''
        return unit_of_measurement

    def _build_layers_for_day(self, day: str, events: List[Dict[str, Any]], raw_default: str, allow_wrap: bool = False) -> List[Dict[str, Any]]:
        """Builds the event blocks for a given day."""
        # Use OrderedDict to preserve the order of conditions/groups
        groups: OrderedDict[str, List[Dict[str, Any]]] = OrderedDict()
        
        for event_idx, event in enumerate(events):
            if not isinstance(event, dict):
                continue
            
            conditions: List[Any] = event.get('condition', []) or event.get('conditions', [])
            if not isinstance(conditions, list):
                conditions = [conditions] if conditions else []
            
            # Simplified month handling (added to conditions if present)
            event_months: Optional[Any] = event.get('months')
            if event_months is not None:
                month_condition_exists: bool = any(
                    isinstance(c, dict) and c.get('condition') == 'time' and 'month' in c
                    for c in conditions
                )
                if not month_condition_exists:
                    conditions.append({'condition': 'time', 'month': event_months})
            
            # Filter by day of the week
            weekdays: List[str] = self.get_weekdays_from_condition(conditions)
            if day not in weekdays:
                continue
            
            raw_state: str = event.get('state', '')
            unit: str = event.get('unit', '')
            condition_key: str = self._serialize_conditions(conditions)
            # The tooltip text is the source for translation in the JS
            tooltip_text: str = event.get('tooltip', self._format_conditions_en(conditions))
            description: str = event.get('description', '')
            
            dynamic_color_type: str | bool = self._is_dynamic_color(raw_state)
            if dynamic_color_type:
                tooltip_text = f"🔄 {tooltip_text}" if tooltip_text else "🔄"
            
            start_time: str = event.get('start', '00:00')
            end_time: str = event.get('end', '23:59')
            
            event_allow_wrap: bool = event.get('allow_wrap', allow_wrap)

            # Special case where start and end are '00:00' (prevents unintentional wrapping)
            if start_time == '00:00' and end_time == '00:00':
                event_allow_wrap = False
            
            block_icon: str = self._get_block_icon(dynamic_color_type, event.get('icon'))

            if condition_key not in groups:
                groups[condition_key] = []
            
            # Handle wrapping of events that cross midnight
            if event_allow_wrap and self._time_to_minutes(end_time) <= self._time_to_minutes(start_time):
                self._add_wrapped_blocks(groups[condition_key], event_idx, start_time, end_time, raw_state, unit, conditions, tooltip_text, description, block_icon, dynamic_color_type)
            else:
                groups[condition_key].append(self._create_block(event_idx, start_time, end_time, raw_state, unit, conditions, tooltip_text, description, block_icon, dynamic_color_type))
        
        layers: List[Dict[str, Any]] = []
        
        # Process specific condition layers
        for condition_key, blocks in groups.items():
            # Sort by start time
            blocks.sort(key=lambda b: (self._time_to_minutes(b['start']), b['event_idx']))
            
            # _create_layer_with_default crée maintenant la couche conditionnelle SANS les blocs par défaut (créneau vide)
            layer_blocks: List[Dict[str, Any]] = self._create_layer_with_default(blocks, raw_default)
            
            # Suppression de la boucle redondante, z_index est défini dans _create_specific_segment
            
            layers.append({
                'condition_key': condition_key,
                'condition_text': blocks[0]['condition_text'] if blocks else '',
                'blocks': layer_blocks,
                'is_default_layer': False
            })
        
        # Add the default layer (background layer)
        layers.append(self._create_default_layer(raw_default))
        
        return layers

    def _get_block_icon(self, dynamic_color_type: str | bool, explicit_icon: Optional[str]) -> str:
        """Determines the appropriate icon for the block."""
        if dynamic_color_type == 'schedule_state':
            return 'mdi:refresh'
        if dynamic_color_type == 'dynamic':
            return 'mdi:calendar'
        return explicit_icon if explicit_icon else 'mdi:calendar'

    def _create_block(self, event_idx: int, start_time: str, end_time: str, raw_state: str, unit: str, conditions: List[Any], tooltip: str, description: str, icon: str, is_dynamic_color: str | bool) -> Dict[str, Any]:
        """Creates a standard event block."""
        return {
            'event_idx': event_idx,
            'start': start_time,
            'end': end_time,
            'original_start': start_time,
            'original_end': end_time,
            'wraps_start': False,
            'wraps_end': False,
            'is_end_of_day_wrap': (end_time == '00:00' and start_time == '00:00'),
            'state_value': raw_state,
            'raw_state_template': raw_state,
            'unit': unit,
            'raw_conditions': conditions,
            'condition_text': self._format_conditions_en(conditions), # Use EN format for condition_text
            'tooltip': tooltip,
            'description': description,
            'icon': icon,
            'is_dynamic_color': bool(is_dynamic_color),
        }

    def _add_wrapped_blocks(self, blocks: List[Dict[str, Any]], event_idx: int, start_time: str, end_time: str, raw_state: str, unit: str, conditions: List[Any], tooltip: str, description: str, icon: str, is_dynamic_color: str | bool) -> None:
        """Adds the two blocks for an event that crosses midnight (wrap)."""
        condition_text_en = self._format_conditions_en(conditions)
        
        # Block 1: start -> 00:00
        blocks.append({
            'event_idx': event_idx,
            'start': start_time,
            'end': '00:00',
            'original_start': start_time,
            'original_end': end_time,
            'wraps_start': False,
            'wraps_end': True,
            'is_end_of_day_wrap': True,
            'state_value': raw_state,
            'raw_state_template': raw_state,
            'unit': unit,
            'raw_conditions': conditions,
            'condition_text': condition_text_en,
            'tooltip': tooltip,
            'description': description,
            'icon': icon,
            'is_dynamic_color': bool(is_dynamic_color),
        })
        # Block 2: 00:00 -> end
        blocks.append({
            'event_idx': event_idx,
            'start': '00:00',
            'end': end_time,
            'original_start': start_time,
            'original_end': end_time,
            'wraps_start': True,
            'wraps_end': False,
            'is_end_of_day_wrap': False,
            'state_value': raw_state,
            'raw_state_template': raw_state,
            'unit': unit,
            'raw_conditions': conditions,
            'condition_text': condition_text_en,
            'tooltip': tooltip,
            'description': description,
            'icon': icon,
            'is_dynamic_color': bool(is_dynamic_color),
        })

    def _create_default_layer(self, raw_default: str) -> Dict[str, Any]:
        """Creates the default layer block (background)."""
        dynamic_type: str | bool = self._is_dynamic_color(raw_default)
        icon: str = 'mdi:refresh' if dynamic_type == 'schedule_state' else 'mdi:calendar' if dynamic_type == 'dynamic' else 'mdi:calendar-blank'

        return {
            'condition_key': 'default',
            # Use English key/text internally
            'condition_text': 'default', 
            'blocks': [{
                'start': '00:00',
                'end': '23:59',
                'original_start': '00:00',
                'original_end': '23:59',
                'wraps_start': False,
                'wraps_end': False,
                'is_end_of_day_wrap': False,
                'state_value': raw_default,
                'raw_state_template': raw_default,
                'unit': '',
                'raw_conditions': [],
                'condition_text': 'default', # Use English key/text internally
                'tooltip': 'Default state', # Use English key/text internally
                'description': '',
                'icon': icon,
                'is_default_bg': True,
                'z_index': 1, # Z-index pour les couches par défaut (le plus bas)
                'is_dynamic_color': bool(dynamic_type)
            }],
            'is_default_layer': True
        }

    def _create_layer_with_default(self, specific_blocks: List[Dict[str, Any]], raw_default: str) -> List[Dict[str, Any]]:
        """
        Creates a layer by combining specific blocks and periods 
        of the default state (where there is no specific block).
        MODIFIÉ: Maintenant, pour les couches conditionnelles (qui seront empilées au-dessus du L0), 
        cette fonction ne conserve QUE les blocs spécifiques de cette condition, 
        tout en résolvant les chevauchements internes. Les espaces (gaps) sont laissés vides 
        pour être comblés par la couche par défaut (Layer 0) lors de la combinaison.
        """
        result: List[Dict[str, Any]] = []
        
        # Breakpoints in minutes (0 to 1440)
        breakpoints: Set[int] = {0, 1440} 
        
        for block in specific_blocks:
            start_min: int = self._time_to_minutes(block['start'])
            end_min: int = self._time_to_minutes(block['end'])
            
            # If end time is 00:00 (and not the start), it must be treated as 1440 minutes
            if block['end'] == '00:00' and end_min == 0:
                end_min = 1440

            breakpoints.add(start_min)
            breakpoints.add(end_min)
        
        sorted_breakpoints: List[int] = sorted(list(breakpoints))
        
        for i in range(len(sorted_breakpoints) - 1):
            seg_start_min: int = sorted_breakpoints[i]
            seg_end_min: int = sorted_breakpoints[i + 1]
            
            if seg_start_min >= seg_end_min:
                continue
            
            covering_block: Optional[Dict[str, Any]] = None
            
            # Find the specific block that covers this segment
            for block in specific_blocks:
                block_start_min: int = self._time_to_minutes(block['start'])
                block_end_min: int = self._time_to_minutes(block['end'])

                if block['end'] == '00:00' and block_end_min == 0:
                    block_end_min = 1440
                
                if block_start_min <= seg_start_min and seg_end_min <= block_end_min:
                    covering_block = block
                    break
            
            final_end_time_str: str = '00:00' if seg_end_min == 1440 else self._minutes_to_time(seg_end_min)
            seg_start_time_str: str = self._minutes_to_time(seg_start_min)
            
            if covering_block:
                # Period covered by a specific block -> Add it (Layer > 0)
                result.append(self._create_specific_segment(seg_start_time_str, final_end_time_str, seg_start_min, seg_end_min, covering_block))
            else:
                # Period not covered (Gap) -> DO NOT ADD ANYTHING. The space remains empty.
                pass
        
        return result

    def _create_specific_segment(self, start_time: str, end_time: str, start_min: int, end_min: int, covering_block: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a time segment for a period covered by a specific block."""
        is_eod_wrap: bool = (end_min == 1440 and start_min == 0) 
        
        # The segment might be a part of a wrapped block, we must preserve wraps_X from the original
        segment: Dict[str, Any] = {
            'start': start_time,
            'end': end_time,
            'original_start': covering_block['original_start'],
            'original_end': covering_block['original_end'],
            'wraps_start': covering_block.get('wraps_start', False) and start_time == '00:00',
            'wraps_end': covering_block.get('wraps_end', False) and end_time == '00:00',
            'is_end_of_day_wrap': is_eod_wrap,
            'state_value': covering_block['state_value'],
            'raw_state_template': covering_block['raw_state_template'],
            'unit': covering_block['unit'],
            'raw_conditions': covering_block['raw_conditions'],
            'condition_text': covering_block['condition_text'],
            'tooltip': covering_block['tooltip'],
            'description': covering_block['description'],
            'icon': covering_block.get('icon', 'mdi:calendar'),
            'is_default_bg': False,
            'z_index': 2, # Z-index pour les blocs spécifiques (Priorité élevée)
            'is_dynamic_color': covering_block.get('is_dynamic_color', False)
        }
        return segment

    def _create_default_segment(self, start_time: str, end_time: str, start_min: int, end_min: int, raw_default: str) -> Dict[str, Any]:
        """Creates a time segment for a period covered by the default state."""
        dynamic_type: str | bool = self._is_dynamic_color(raw_default)
        icon: str = 'mdi:refresh' if dynamic_type == 'schedule_state' else 'mdi:calendar' if dynamic_type == 'dynamic' else 'mdi:calendar-blank'
        is_eod_wrap: bool = (end_min == 1440 and start_min == 0)

        segment: Dict[str, Any] = {
            'start': start_time,
            'end': end_time,
            'original_start': start_time,
            'original_end': end_time,
            'wraps_start': False,
            'wraps_end': False,
            'is_end_of_day_wrap': is_eod_wrap,
            'state_value': raw_default,
            'raw_state_template': raw_default,
            'unit': '',
            'raw_conditions': [],
            'condition_text': 'default', # Use English key/text internally
            'tooltip': 'Default state', # Use English key/text internally
            'description': '',
            'icon': icon,
            'is_default_bg': True,
            'z_index': 1, # Z-index pour les blocs par défaut (Priorité basse)
            'is_dynamic_color': bool(dynamic_type)
        }
        return segment

    def _is_dynamic_color(self, state_value: Any) -> str | bool:
        """
        Detects if the state value is dynamic (template or reference to a dynamic entity).
        Returns the type: 'schedule_state', 'dynamic', or False
        """
        if not state_value or not isinstance(state_value, str):
            return False
        
        state_str: str = str(state_value).strip()
        
        # Jinja template detection
        if 'states(' in state_str or 'state_attr(' in state_str or '{{' in state_str or '{%' in state_str:
            entity_matches: List[str] = re.findall(r"states\s*\(\s*['\"]([^'\"]+)['\"]\s*\)", state_str)
            entity_matches += re.findall(r"state_attr\s*\(\s*['\"]([^'\"]+)['\"]", state_str)
            
            # First check if it's a reference to another schedule_state
            for entity_id in entity_matches:
                if entity_id in self.schedule_state_entities:
                    return 'schedule_state'
            
            # Then check if it's a reference to any other dynamic entity
            if entity_matches:
                # If the template references an entity, it's dynamic
                return 'dynamic'
            
            # If it's a template ({{...}} or {%...%}) but without states() or state_attr()
            if '{{' in state_str or '{%' in state_str:
                return 'dynamic'
        
        return False

    def _time_to_minutes(self, time_str: str) -> int:
        """Converts an 'HH:MM' string to minutes from midnight."""
        if not time_str or ':' not in str(time_str):
            return 0
        try:
            parts: List[str] = str(time_str).split(':')
            return int(parts[0]) * 60 + int(parts[1])
        except (ValueError, IndexError):
            return 0

    def _minutes_to_time(self, minutes: int) -> str:
        """Converts minutes from midnight to 'HH:MM' string."""
        hours: int = (int(minutes) // 60) % 24
        mins: int = int(minutes) % 60
        return f"{hours:02d}:{mins:02d}"

    def _serialize_conditions(self, conditions: List[Dict[str, Any]]) -> str:
        """Serializes the list of conditions to create a unique group key."""
        clean_conditions: List[Dict[str, Any]] = []
        for cond in conditions:
            # We only include conditions that affect grouping (not days, which are already filtered)
            if cond.get('condition') == 'time' and 'month' in cond:
                clean_conditions.append(cond)
            elif cond.get('condition') != 'time':
                clean_conditions.append(cond)

        # Use yaml.dump for consistent and ordered serialization
        return yaml.dump(clean_conditions, default_flow_style=False, sort_keys=True) if clean_conditions else "default"

    def _extract_parent_schedule(self, raw_default: str) -> Optional[str]:
        """Extracts the parent sensor ID if the default state is a schedule reference."""
        match: Optional[re.Match[str]] = re.search(r"states\(\s*['\"]sensor\.schedule_([^'\"]+)['\"]\s*\)", raw_default)
        return match.group(1) if match else None

    def _get_parent_events(self, parent_sensor_id: str) -> List[Dict[str, Any]]:
        """Retrieves the list of events from the parent sensor."""
        try:
            parent_entity_id: str = f"sensor.schedule_{parent_sensor_id}"
            # Uses self.get_state which is an AppDaemon function
            return self.get_state(parent_entity_id, attribute='events') or []
        except Exception as e:
            self.log(f"Error reading events from parent '{parent_sensor_id}': {e}", level="ERROR")
            return []

    def _load_secrets(self, secrets_path: str) -> None:
        """Loads secrets and adds the !secret constructor to SafeLoader."""
        if os.path.exists(secrets_path):
            try:
                with open(secrets_path, 'r', encoding='utf-8') as sf:
                    self._secrets = yaml.safe_load(sf) or {}
            except Exception:
                self.log(f"Warning: Could not load secrets file at {secrets_path}", level="WARNING")
        
        def secret_constructor(loader, node):
            key: str = loader.construct_scalar(node)
            return self._secrets.get(key, f"<secret {key}>")
            
        # Must be called on SafeLoader for yaml.safe_load to work
        yaml.SafeLoader.add_constructor('!secret', secret_constructor)

    def _extract_sensor_blocks(self, raw: str) -> List[str]:
        """Tries to extract individual 'sensor:' blocks from a malformed configuration."""
        blocks: List[str] = []
        # Search for the 'sensor:' section
        m: Optional[re.Match[str]] = re.search(r'(^sensor:\s*\n(?:\s+.*\n)+)', raw, flags=re.MULTILINE)
        if not m:
            return blocks
        
        sensor_section: str = m.group(1)
        lines: List[str] = sensor_section.splitlines()[1:] # Ignore the 'sensor:' line
        current: List[str] = []
        
        # Group individual sensors (starting with '-')
        for line in lines:
            # Note: The raw input is now cleaned of \xa0, so \s* is standard whitespace.
            if re.match(r'^\s*-\s', line) and current:
                blocks.append("sensor:\n" + "\n".join(current) + "\n")
                current = [line]
            else:
                current.append(line)
        
        if current:
            blocks.append("sensor:\n" + "\n".join(current) + "\n")
        
        return blocks

    def clean_string(self, text: str) -> str:
        """
        Cleans the string by replacing accented and non-alphanumeric characters 
        with unaccented equivalents or underscores.
        """
        replacements: Dict[str, str] = {
            'é': 'e', 'è': 'e', 'e': 'e', 'ë': 'e',
            'à': 'a', 'â': 'a', 'ä': 'a',
            'ù': 'u', 'û': 'u', 'ü': 'u',
            'ô': 'o', 'ö': 'o',
            'î': 'i', 'ï': 'i',
            'ç': 'c'
        }
        cleaned_text: str = text
        for old, new in replacements.items():
            cleaned_text = cleaned_text.replace(old, new)
        # Replace any character not a-z, 0-9, or underscore with an underscore
        cleaned_text = re.sub(r'[^a-z0-9_]', '_', cleaned_text)
        return cleaned_text

    def get_weekdays_from_condition(self, conditions: List[Dict[str, Any]]) -> List[str]:
        """Extracts the list of weekdays from time conditions."""
        all_days: List[str] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
        if not conditions:
            return all_days
        
        weekdays: List[str] = []
        for cond in conditions:
            if isinstance(cond, dict) and cond.get('condition') == 'time' and 'weekday' in cond:
                wd: Any = cond['weekday']
                if isinstance(wd, list):
                    weekdays.extend(wd)
                elif isinstance(wd, str):
                    weekdays.append(wd)
        
        # If a day condition is specified, only return those days.
        # Otherwise, it means the condition is not day-specific, so it applies to all.
        return weekdays or all_days

    def _format_conditions_en(self, conditions: List[Any]) -> str:
        """Formats conditions into a readable English string for internal use."""
        if not conditions:
            return ''
        if isinstance(conditions, dict):
            conditions = [conditions]
        
        parts: List[str] = []
        for cond in conditions:
            if not isinstance(cond, dict):
                continue
            
            cond_type: Optional[str] = cond.get('condition')
            
            if cond_type == 'time':
                parts.extend(self._format_time_condition_en(cond))
            elif cond_type == 'state':
                parts.append(self._format_state_condition_en(cond))
            elif cond_type == 'numeric_state':
                parts.append(self._format_numeric_state_condition_en(cond))
            elif cond_type == 'or':
                parts.append(self._format_or_condition_en(cond))
        
        return ' AND '.join([p for p in parts if p]) if parts else ''

    def _format_time_condition_en(self, cond: Dict[str, Any]) -> List[str]:
        """Formats time sub-conditions (month, weekday)."""
        parts: List[str] = []
        month_names: List[str] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        weekday_names: Dict[str, str] = {"mon": "Mon", "tue": "Tue", "wed": "Wed", "thu": "Thu", "fri": "Fri", "sat": "Sat", "sun": "Sun"}

        if 'month' in cond:
            months: Any = cond['month']
            if isinstance(months, list):
                formatted_months: List[str] = [month_names[m-1] for m in months if 1 <= m <= 12]
                parts.append(f"Month: {', '.join(formatted_months)}")
            elif isinstance(months, int) and 1 <= months <= 12:
                parts.append(f"Month: {month_names[months-1]}")
        
        if 'weekday' in cond:
            weekdays: Any = cond['weekday']
            if isinstance(weekdays, list):
                formatted_days: List[str] = [weekday_names.get(d, str(d)) for d in weekdays]
                parts.append(f"Days: {', '.join(formatted_days)}")
            elif isinstance(weekdays, str):
                parts.append(f"Days: {weekday_names.get(weekdays, weekdays)}")
                
        return parts

    def _format_state_condition_en(self, cond: Dict[str, Any]) -> str:
        """Formats a simple state condition."""
        entity_id: str = cond.get('entity_id', '')
        state_value: str = cond.get('state', '')
        friendly: str = self.get_friendly_name(entity_id)
        return f"{friendly} = {state_value}"

    def _format_numeric_state_condition_en(self, cond: Dict[str, Any]) -> str:
        """Formats a numeric state condition."""
        entity_id: str = cond.get('entity_id', '')
        conds: List[str] = []
        if 'above' in cond:
            conds.append(f"> {cond['above']}")
        if 'below' in cond:
            conds.append(f"< {cond['below']}")
        friendly: str = self.get_friendly_name(entity_id)
        return f"{friendly} {' AND '.join(conds)}"

    def _format_or_condition_en(self, cond: Dict[str, Any]) -> str:
        """Formats a nested 'OR' condition."""
        or_conditions: List[Dict[str, Any]] = cond.get('conditions', [])
        or_parts: List[str] = []
        for or_cond in or_conditions:
            # Prudent recursion
            or_text: str = self._format_conditions_en([or_cond])
            if or_text:
                or_parts.append(or_text)
        
        return f"({' OR '.join(or_parts)})" if or_parts else ''

    def get_friendly_name(self, entity_id: str) -> str:
        """Tries to retrieve the entity's friendly name."""
        try:
            # Uses self.get_state which is an AppDaemon function
            return self.get_state(entity_id, attribute='friendly_name') or entity_id
        except Exception:
            # If retrieval fails, returns the entity_id
            return entity_id
