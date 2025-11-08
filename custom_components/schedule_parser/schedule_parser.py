import appdaemon.plugins.hass.hassapi as hass
import yaml
from datetime import datetime
import re
import os
from collections import defaultdict

class ScheduleParser(hass.Hass):

    def initialize(self):
        self.log("Schedule Parser - Initialization...")
        self.config_file = self.args.get('config_file')
        self.secrets_file = self.args.get('secrets_file', '/config/secrets.yaml')
        if not self.config_file:
            self.log("No config_file provided in apps.yaml. Aborting.", level="ERROR")
            return
        if not os.path.exists(self.config_file):
            self.log(f"Configuration file not found: {self.config_file}", level="ERROR")
            return

        self._load_secrets(self.secrets_file)
        self.run_in(self.parse_schedules, 10)
        self.run_every(self.parse_schedules, "now+60", 3600)
        self.listen_event(self.parse_schedules, "reload_schedules")
        
        self.log(f"Schedule Parser initialized using: {self.config_file}")

    def parse_schedules(self, *args, **kwargs):
        self.log(f"Starting parsing of {self.config_file}...")
        
        try:
            with open(self.config_file, 'r', encoding='utf-8') as f:
                raw = f.read()
        except Exception as e:
            self.log(f"Error reading config: {e}", level="ERROR")
            return

        config = {}
        try:
            config = yaml.safe_load(raw) or {}
        except yaml.YAMLError as e:
            self.log(f"Invalid global YAML: {e}, attempting extraction of sensor section...", level="WARNING")
            sensor_blocks = self._extract_sensor_blocks(raw)
            if not sensor_blocks:
                self.log("No sensor section found or extraction failed", level="WARNING")
                config = {}
            else:
                sensors = []
                for i, block in enumerate(sensor_blocks):
                    try:
                        loaded = yaml.safe_load(block)
                        if isinstance(loaded, dict) and 'sensor' in loaded:
                            s = loaded['sensor']
                            if isinstance(s, list):
                                sensors.extend(s)
                            elif isinstance(s, dict):
                                sensors.append(s)
                        elif isinstance(loaded, list):
                            sensors.extend(loaded)
                        elif isinstance(loaded, dict):
                            sensors.append(loaded)
                    except yaml.YAMLError as e:
                        self.log(f"Sensor block #{i} unreadable, skipped: {e}", level="ERROR")
                        continue
                config = {'sensor': sensors}

        if isinstance(config, dict):
            sensors_section = config.get('sensor', []) or []
        elif isinstance(config, list):
            sensors_section = []
            for item in config:
                if isinstance(item, dict) and 'sensor' in item:
                    s = item['sensor']
                    if isinstance(s, list):
                        sensors_section.extend(s)
                    elif isinstance(s, dict):
                        sensors_section.append(s)
                elif isinstance(item, dict) and item.get('platform') == 'schedule_state':
                    sensors_section.append(item)
        else:
            sensors_section = []

        if isinstance(sensors_section, dict):
            sensors_section = [sensors_section]
        elif not isinstance(sensors_section, list):
            sensors_section = []

        schedule_sensors = []
        for i, s in enumerate(sensors_section):
            try:
                if not isinstance(s, dict):
                    raise ValueError("sensor block is not a mapping")
                if s.get('platform') == 'schedule_state':
                    schedule_sensors.append(s)
            except Exception as e:
                self.log(f"Skipping invalid sensor block #{i}: {e}", level="ERROR")
                continue

        days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
        parsed_count = 0
        
        for sensor_cfg in schedule_sensors:
            try:
                self._process_sensor(sensor_cfg, days)
                parsed_count += 1
            except Exception as e:
                self.log(f"Error parsing sensor {sensor_cfg.get('name','?')}: {e}", level="ERROR")
                import traceback
                self.log(traceback.format_exc(), level="ERROR")
                continue
        
        self.log(f"Parsing completed: {parsed_count}/{len(schedule_sensors)} sensors processed successfully")

    def _process_sensor(self, sensor_cfg, days):
        sensor_name = sensor_cfg.get('name', 'Unknown')
        sensor_id = self.clean_string(sensor_name.lower().replace(' ', '_'))
        raw_default = sensor_cfg.get('default', sensor_cfg.get('default_state', 'unknown'))
        
        default_state = raw_default
        
        events = sensor_cfg.get('events', []) or []
        allow_wrap = sensor_cfg.get('allow_wrap', False)

        parent_sensor_id = self._extract_parent_schedule(raw_default)
        if parent_sensor_id:
            self.log(f"Sensor {sensor_name} will inherit schedule from {parent_sensor_id}")
            parent_events = self._get_parent_events(parent_sensor_id)
            if parent_events:
                events = parent_events + events

        layers_by_day = {}
        for day in days:
            layers_by_day[day] = self._build_layers_for_day(
                day, events, raw_default, allow_wrap
            )

        entity_id = f"sensor.schedule_{sensor_id}"
        total_events = sum(len(layers_by_day[day]) for day in days)

        unit_of_measurement = sensor_cfg.get('unit_of_measurement', '')
        
        if not unit_of_measurement:
            extra_attrs = sensor_cfg.get('extra_attributes', {})
            if isinstance(extra_attrs, dict):
                unit_of_measurement = extra_attrs.get('unit_of_measurement', '')
            elif isinstance(extra_attrs, str):
                unit_of_measurement = extra_attrs
            else:
                unit_of_measurement = str(extra_attrs) if extra_attrs else ''

        attributes = {
            'platform': 'schedule_state',
            'room': sensor_name,
            'default_state': default_state,
            'layers': layers_by_day,
            'events': events,
            'total_events': total_events,
            'icon': 'mdi:calendar-month',
            'friendly_name': f"{sensor_name} - Planning complet",
            'last_update': datetime.now().isoformat()
        }

        if unit_of_measurement:
            attributes['unit_of_measurement'] = unit_of_measurement
        
        extra_attrs = sensor_cfg.get('extra_attributes', {})
        if isinstance(extra_attrs, dict):
            attributes.update(extra_attrs)

        self.set_state(entity_id, state=total_events, attributes=attributes)
        
        for day in days:
            day_layers = layers_by_day[day]
            default_count = sum(1 for layer in day_layers if layer.get('is_default_layer', False))
            other_count = len(day_layers) - default_count
            self.log(f"  Day {day}: {other_count} regular layers + {default_count} default layers = {len(day_layers)} total", level="DEBUG")
        
        self.log(f"Sensor {entity_id}: {total_events} events - Unit: '{unit_of_measurement}'", level="INFO")

    def _build_layers_for_day(self, day, events, raw_default, allow_wrap=False):
        groups = defaultdict(list)
        
        for event_idx, event in enumerate(events):
            if not isinstance(event, dict):
                continue
            
            conditions = event.get('condition', []) or event.get('conditions', [])
            if not isinstance(conditions, list):
                conditions = [conditions] if conditions else []
            
            event_months = event.get('months')
            if event_months is not None:
                month_condition_exists = any(
                    isinstance(c, dict) and c.get('condition') == 'time' and 'month' in c
                    for c in conditions
                )
                if not month_condition_exists:
                    conditions.append({'condition': 'time', 'month': event_months})
            
            weekdays = self.get_weekdays_from_condition(conditions)
            if day not in weekdays:
                continue
            
            raw_state = event.get('state', '')
            unit = event.get('unit', '')
            condition_key = self._serialize_conditions(conditions)
            tooltip_text = event.get('tooltip', self.format_conditions(conditions))
            description = event.get('description', '')
            
            start_time = event.get('start', '00:00')
            end_time = event.get('end', '23:59')
            
            event_allow_wrap = event.get('allow_wrap', allow_wrap)

            if start_time == '00:00' and end_time == '00:00':
                end_time = '00:00'
                event_allow_wrap = False
            
            if event_allow_wrap:
                start_min = self._time_to_minutes(start_time)
                end_min = self._time_to_minutes(end_time)
                
                if end_min <= start_min:
                    groups[condition_key].append({
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
                        'condition_text': self.format_conditions(conditions),
                        'tooltip': tooltip_text,
                        'description': description,
                        'icon': event.get('icon', 'mdi:calendar'),
                    })
                    groups[condition_key].append({
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
                        'condition_text': self.format_conditions(conditions),
                        'tooltip': tooltip_text,
                        'description': description,
                        'icon': event.get('icon', 'mdi:calendar'),
                    })
                    continue
            
            groups[condition_key].append({
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
                'condition_text': self.format_conditions(conditions),
                'tooltip': tooltip_text,
                'description': description,
                'icon': event.get('icon', 'mdi:calendar'),
            })
        
        layers = []
        
        for condition_key in sorted(groups.keys()):
            blocks = groups[condition_key]
            
            blocks.sort(key=lambda b: (self._time_to_minutes(b['start']), b['event_idx']))
            
            layer_blocks = self._create_layer_with_default(blocks, raw_default)
            
            for block in layer_blocks:
                if block.get('is_default_bg'):
                    block['z_index'] = 1
                else:
                    block['z_index'] = 2
            
            layers.append({
                'condition_key': condition_key,
                'condition_text': blocks[0]['condition_text'] if blocks else '',
                'blocks': layer_blocks,
                'is_default_layer': False
            })
        
        # Créer un layer 0 par défaut (couvre toute la journée) - TOUJOURS EN DERNIER
        default_layer_blocks = [{
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
            'condition_text': '',
            'tooltip': 'État par défaut',
            'description': '',
            'icon': 'mdi:calendar-blank',
            'is_default_bg': True,
            'z_index': 1
        }]
        
        layers.append({
            'condition_key': 'default',
            'condition_text': '(default)',
            'blocks': default_layer_blocks,
            'is_default_layer': True
        })
        
        return layers

    def _create_layer_with_default(self, specific_blocks, raw_default):
        result = []
        
        breakpoints = set([0, 1440]) 
        
        for block in specific_blocks:
            start_min = self._time_to_minutes(block['start'])
            end_min = self._time_to_minutes(block['end'])
            
            if block['end'] == '00:00' and end_min == 0:
                end_min = 1440

            breakpoints.add(start_min)
            breakpoints.add(end_min)
        
        breakpoints = sorted(list(breakpoints))
        
        for i in range(len(breakpoints) - 1):
            seg_start_min = breakpoints[i]
            seg_end_min = breakpoints[i + 1]
            
            if seg_start_min >= seg_end_min:
                continue
            
            covering_block = None
            
            for block in specific_blocks:
                block_start_min = self._time_to_minutes(block['start'])
                block_end_min = self._time_to_minutes(block['end'])

                if block['end'] == '00:00' and block_end_min == 0:
                    block_end_min = 1440
                
                if block_start_min <= seg_start_min and seg_end_min <= block_end_min:
                    covering_block = block
                    break
            
            final_end_time_str = '00:00' if seg_end_min == 1440 else self._minutes_to_time(seg_end_min)
            
            # Limiter à 23:59 max pour les blocs non-default
            if seg_end_min == 1440:
                final_end_time_str = '23:59'
                seg_end_min = 1439
            
            if (covering_block):
                result.append({
                    'start': self._minutes_to_time(seg_start_min),
                    'end': final_end_time_str,
                    'original_start': covering_block['original_start'],
                    'original_end': covering_block['original_end'],
                    'wraps_start': covering_block.get('wraps_start', False),
                    'wraps_end': covering_block.get('wraps_end', False),
                    'is_end_of_day_wrap': covering_block.get('is_end_of_day_wrap', False),
                    'state_value': covering_block['state_value'],
                    'raw_state_template': covering_block['raw_state_template'],
                    'unit': covering_block['unit'],
                    'raw_conditions': covering_block['raw_conditions'],
                    'condition_text': covering_block['condition_text'],
                    'tooltip': covering_block['tooltip'],
                    'description': covering_block['description'],
                    'icon': covering_block['icon'],
                    'is_default_bg': False
                })
            else:
                result.append({
                    'start': self._minutes_to_time(seg_start_min),
                    'end': final_end_time_str,
                    'original_start': self._minutes_to_time(seg_start_min),
                    'original_end': final_end_time_str,
                    'wraps_start': False,
                    'wraps_end': False,
                    'is_end_of_day_wrap': (seg_end_min == 1440 and seg_start_min == 0),
                    'state_value': raw_default,
                    'raw_state_template': raw_default,
                    'unit': '',
                    'raw_conditions': [],
                    'condition_text': '',
                    'tooltip': 'État par défaut',
                    'description': '',
                    'icon': 'mdi:calendar-blank',
                    'is_default_bg': True
                })
        
        return result

    def _check_month_condition(self, conditions):
        current_month = datetime.now().month
        
        has_month_condition = False
        
        for cond in conditions:
            if not isinstance(cond, dict):
                continue
            
            if cond.get('condition') == 'time' and 'month' in cond:
                has_month_condition = True
                months = cond['month']
                
                if isinstance(months, list):
                    if current_month not in months:
                        return False
                elif isinstance(months, int):
                    if current_month != months:
                        return False
        
        return True

    def _time_to_minutes(self, time_str):
        if not time_str or ':' not in str(time_str):
            return 0
        parts = str(time_str).split(':')
        try:
            return int(parts[0]) * 60 + int(parts[1])
        except (ValueError, IndexError):
            return 0

    def _minutes_to_time(self, minutes):
        hours = (int(minutes) // 60) % 24
        mins = int(minutes) % 60
        return f"{hours:02d}:{mins:02d}"

    def _serialize_conditions(self, conditions):
        clean_conditions = []
        for cond in conditions:
            if cond.get('condition') == 'time':
                if 'month' in cond:
                    clean_conditions.append(cond)
            else:
                clean_conditions.append(cond)
        
        clean_conditions.sort(key=lambda c: c.get('condition', ''))

        return yaml.dump(clean_conditions, default_flow_style=False) if clean_conditions else "default"

    def _extract_parent_schedule(self, raw_default):
        match = re.search(r"states\(\s*['\"]sensor\.schedule_([^'\"]+)['\"]\s*\)", raw_default)
        return match.group(1) if match else None

    def _get_parent_events(self, parent_sensor_id):
        try:
            parent_entity_id = f"sensor.schedule_{parent_sensor_id}"
            return self.get_state(parent_entity_id, attribute='events') or []
        except Exception as e:
            self.log(f"Error reading events from parent {parent_sensor_id}: {e}", level="ERROR")
            return []

    def _load_secrets(self, secrets_path):
        self._secrets = {}
        if os.path.exists(secrets_path):
            try:
                with open(secrets_path, 'r', encoding='utf-8') as sf:
                    self._secrets = yaml.safe_load(sf) or {}
            except Exception:
                pass
        
        def secret_constructor(loader, node):
            key = loader.construct_scalar(node)
            return self._secrets.get(key, f"<secret {key}>")
        yaml.SafeLoader.add_constructor('!secret', secret_constructor)

    def _extract_sensor_blocks(self, raw):
        blocks = []
        m = re.search(r'(^sensor:\s*\n(?:\s+.*\n)+)', raw, flags=re.MULTILINE)
        if not m:
            return blocks
        sensor_section = m.group(1)
        lines = sensor_section.splitlines()[1:]
        current = []
        for line in lines:
            if re.match(r'^\s*-\s', line) and current:
                blocks.append("sensor:\n" + "\n".join(current) + "\n")
                current = [line]
            else:
                current.append(line)
        if current:
            blocks.append("sensor:\n" + "\n".join(current) + "\n")
        return blocks

    def clean_string(self, text):
        replacements = {
            'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
            'à': 'a', 'â': 'a', 'ä': 'a',
            'ù': 'u', 'û': 'u', 'ü': 'u',
            'ô': 'o', 'ö': 'o',
            'î': 'i', 'ï': 'i',
            'ç': 'c'
        }
        for old, new in replacements.items():
            text = text.replace(old, new)
        text = re.sub(r'[^a-z0-9_]', '_', text)
        return text

    def get_weekdays_from_condition(self, conditions):
        if not conditions:
            return ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
        weekdays = []
        for cond in conditions:
            if isinstance(cond, dict) and cond.get('condition') == 'time' and 'weekday' in cond:
                wd = cond['weekday']
                if isinstance(wd, list):
                    weekdays.extend(wd)
                else:
                    weekdays.append(wd)
        return weekdays or ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

    def format_conditions(self, conditions):
        if not conditions:
            return ''
        if isinstance(conditions, dict):
            conditions = [conditions]
        parts = []
        for cond in conditions:
            if not isinstance(cond, dict):
                continue
            cond_type = cond.get('condition')
            if cond_type == 'time':
                if 'month' in cond:
                    months = cond['month']
                    month_names = ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aout", "Sep", "Oct", "Nov", "Dec"]
                    if isinstance(months, list):
                        formatted_months = [month_names[m-1] for m in months if 1 <= m <= 12]
                        parts.append(f"Mois: {', '.join(formatted_months)}")
                    elif isinstance(months, int):
                        if 1 <= months <= 12:
                            parts.append(f"Mois: {month_names[months-1]}")
                if 'weekday' in cond:
                    weekdays = cond['weekday']
                    weekday_names = {"mon": "Lun", "tue": "Mar", "wed": "Mer", "thu": "Jeu", "fri": "Ven", "sat": "Sam", "sun": "Dim"}
                    if isinstance(weekdays, list):
                        formatted_days = [weekday_names.get(d, d) for d in weekdays]
                        parts.append(f"Jours: {', '.join(formatted_days)}")
                    elif isinstance(weekdays, str):
                        parts.append(f"Jours: {weekday_names.get(weekdays, weekdays)}")
                continue
            elif cond_type == 'state':
                entity_id = cond.get('entity_id', '')
                state_value = cond.get('state', '')
                friendly = self.get_friendly_name(entity_id)
                parts.append(f"{friendly} = {state_value}")
            elif cond_type == 'numeric_state':
                entity_id = cond.get('entity_id', '')
                conds = []
                if 'above' in cond:
                    conds.append(f"> {cond['above']}")
                if 'below' in cond:
                    conds.append(f"< {cond['below']}")
                friendly = self.get_friendly_name(entity_id)
                parts.append(f"{friendly} {' and '.join(conds)}")
            elif cond_type == 'or':
                or_conditions = cond.get('conditions', [])
                or_parts = []
                for or_cond in or_conditions:
                    or_text = self.format_conditions([or_cond])
                    if or_text:
                        or_parts.append(or_text)
                if or_parts:
                    parts.append(f"({' OU '.join(or_parts)})")
        return ' ET '.join(parts) if parts else ''

    def get_friendly_name(self, entity_id):
        try:
            return self.get_state(entity_id, attribute='friendly_name') or entity_id
        except Exception:
            return entity_id