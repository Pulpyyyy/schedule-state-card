import appdaemon.plugins.hass.hassapi as hass
import yaml
from datetime import datetime
import re
import os
from collections import defaultdict

# --- Configuration AppDaemon requise pour ce script ---
# Dans apps.yaml (à placer dans votre dossier 'appdaemon/apps'):
# schedule_parser:
#   module: schedule_parser
#   class: ScheduleParser
#   schedules_file: /config/schedules.yaml # Chemin vers votre fichier de planification

class ScheduleParser(hass.Hass):

    def initialize(self):
        self.log("Schedule Parser - Initialization...")
        # Récupère le chemin du fichier de schedules défini dans apps.yaml
        self.schedules_file = self.args.get('schedules_file')
        self.secrets_file = self.args.get('secrets_file', '/config/secrets.yaml')
        
        # Vérification si une configuration est fournie (fichier ou directement dans args)
        if not self.schedules_file and not self.args.get('schedules'):
            self.log("Neither 'schedules_file' nor 'schedules' provided in apps.yaml. Aborting.", level="ERROR")
            return

        self._load_secrets(self.secrets_file)
        
        # On lance le premier parsing peu après le démarrage pour attendre HA
        self.run_in(self.parse_schedules, 10)
        # On relance le parsing toutes les heures pour rafraîchir
        self.run_every(self.parse_schedules, "now+60", 3600)
        # Événement pour forcer le rechargement via un service ou un autre appel
        self.listen_event(self.parse_schedules, "reload_schedules")
        
        self.log(f"Schedule Parser initialized.")

    def _load_secrets(self, secrets_file):
        """Charge les secrets depuis un fichier YAML."""
        self.secrets = {}
        if os.path.exists(secrets_file):
            try:
                with open(secrets_file, 'r', encoding='utf-8') as f:
                    # Remplacer les !secret par leur valeur (si nécessaire)
                    # Bien que yaml.safe_load ne gère pas nativement !secret, nous le chargeons
                    # tel quel. La gestion des secrets dans AppDaemon est souvent externe.
                    self.secrets = yaml.safe_load(f) or {}
                self.log(f"Loaded {len(self.secrets)} secrets from {secrets_file}.")
            except Exception as e:
                self.log(f"Error loading secrets file: {e}", level="ERROR")

    def _get_schedule_config(self):
        """
        Récupère la configuration des plannings.
        1. Tente de lire depuis le fichier configuré dans apps.yaml.
        2. Si le fichier n'est pas fourni, utilise la configuration 'schedules' directement dans apps.yaml.
        """
        if self.schedules_file:
            try:
                # 1. Lecture du fichier schedules
                if not os.path.exists(self.schedules_file):
                    self.log(f"Configuration file not found: {self.schedules_file}", level="ERROR")
                    return {}
                with open(self.schedules_file, 'r', encoding='utf-8') as f:
                    config = yaml.safe_load(f) or {}
                
                # Le format attendu est un dictionnaire de schedules sous la clé 'schedule' ou 'sensor' (pour compatibilité)
                # ou le document entier si c'est déjà un mapping d'entités
                return config.get('schedule') or config.get('sensor') or config

            except Exception as e:
                self.log(f"Error reading or parsing schedule config file {self.schedules_file}: {e}", level="ERROR")
                return {}
        else:
            # 2. Utilisation de la configuration 'schedules' directement dans apps.yaml
            return self.args.get('schedules') or {}

    def parse_schedules(self, *args, **kwargs):
        self.log("Starting parsing of schedules...")
        
        schedules_config = self._get_schedule_config()
        if not schedules_config:
            self.log("No valid schedules found. Aborting parse.", level="WARNING")
            return

        sensor_blocks = {}
        
        # Le format attendu est un dictionnaire: {entity_id: schedule_data}
        if isinstance(schedules_config, dict):
            # Tente de gérer le format liste [{- entite_id: data}, ...] s'il est au niveau racine
            # pour une meilleure compatibilité avec le formatage YAML d'un fichier séparé
            if all(isinstance(v, dict) and len(v) == 1 for v in schedules_config.values()):
                # On suppose que chaque élément est {entity_id: data}
                for item in schedules_config.values():
                     entity_id, schedule_data = next(iter(item.items()))
                     sensor_blocks[entity_id] = schedule_data
            else:
                # C'est déjà {entity_id: data}
                sensor_blocks = schedules_config
        # Si c'est une liste (format YAML typique):
        elif isinstance(schedules_config, list):
            # On convertit la liste en dictionnaire {entity_id: schedule_data}
            for item in schedules_config:
                if isinstance(item, dict) and len(item) == 1:
                    entity_id, schedule_data = next(iter(item.items()))
                    sensor_blocks[entity_id] = schedule_data
                else:
                    self.log(f"Invalid schedule block format (expected {{entity_id: data}}): {item}", level="WARNING")

        if not sensor_blocks:
             self.log("No valid sensor blocks to process.", level="WARNING")
             return

        for entity_id, schedule_data in sensor_blocks.items():
            self._process_schedule_block(entity_id, schedule_data)
            
        self.log(f"Finished parsing and updating {len(sensor_blocks)} schedules.")


    def _process_schedule_block(self, entity_id, schedule_data):
        """Traite un seul bloc de planification et met à jour l'entité capteur."""
        # 1. Normalisation de l'entity_id pour le capteur AppDaemon
        base_name = re.sub(r'[^a-z0-9_]+', '', self.clean_string(entity_id.lower()).replace('.', '_'))
        sensor_entity_id = f"sensor.schedule_state_{base_name}"
        
        # self.log(f"Processing schedule for {entity_id} -> {sensor_entity_id}") # Décommenter pour debug

        # 2. Extraction des couches (layers) et gestion de l'héritage
        schedule_events = schedule_data.get('schedule', [])
        parent_config = schedule_data.get('parent')
        
        if parent_config:
            # La fonction d'extraction de parent est conservée car elle gère la lecture de fichiers externes
            parent_events = self._extract_parent_schedule(parent_config)
            # On combine les événements parents (qui sont des bases) et les événements spécifiques (qui les écrasent si le layer est >)
            schedule_events = parent_events + schedule_events
        
        # 3. Construction des attributs
        default_state = schedule_data.get('default_state', 'unknown')
        layers = self._build_layers_for_day(schedule_events, default_state)
        
        attributes = {
            'layers': layers,
            'friendly_name': schedule_data.get('friendly_name', entity_id),
            'icon': schedule_data.get('icon', 'mdi:calendar-clock'),
            'unit_of_measurement': schedule_data.get('unit_of_measurement'),
            'current_state': default_state,
        }

        # 4. Mise à jour de l'entité
        # On utilise le 'default_state' comme état principal du capteur
        self.set_state(sensor_entity_id, state=default_state, attributes=attributes)
        # self.log(f"Updated sensor {sensor_entity_id} with {len(layers.get('mon', []))} layers for Monday.") # Décommenter pour debug


    def _extract_parent_schedule(self, parent_config):
        """
        Récupère les événements de la planification 'parent' à partir d'un fichier externe.
        """
        if not parent_config:
            return []
        
        if isinstance(parent_config, str):
            parent_config = {'file': parent_config}
        
        parent_file = parent_config.get('file')
        parent_key = parent_config.get('key')
        
        if not parent_file or not parent_key:
            self.log("Invalid parent schedule configuration (missing file or key).", level="ERROR")
            return []

        # Détermine le chemin complet du fichier parent
        # Si self.schedules_file existe, on utilise son répertoire comme base pour le fichier parent
        if self.schedules_file and os.path.exists(self.schedules_file):
            base_dir = os.path.dirname(self.schedules_file)
        else:
            base_dir = '/config' # Fallback si le fichier principal n'est pas chargé via chemin
            
        full_path = os.path.join(base_dir, parent_file)

        if not os.path.exists(full_path):
            self.log(f"Parent schedule file not found: {full_path}", level="ERROR")
            return []
            
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                parent_data = yaml.safe_load(f)
                
            # Les données parentes sont généralement une liste sous une clé spécifique dans le fichier
            parent_events = parent_data.get(parent_key, [])
            if not isinstance(parent_events, list):
                self.log(f"Parent key '{parent_key}' does not contain a list of events.", level="ERROR")
                return []

            self.log(f"Successfully loaded {len(parent_events)} events from parent schedule '{parent_key}' in {parent_file}.")
            return parent_events
            
        except Exception as e:
            self.log(f"Error loading parent schedule from {full_path}: {e}", level="ERROR")
            return []

    # --- Les fonctions utilitaires de temps et de nettoyage restent identiques ---

    def clean_string(self, s):
        """Supprime les accents et remplace les caractères non alphanumériques par _."""
        # Retire les accents
        s = re.sub(r'[àáâãäå]', 'a', s)
        s = re.sub(r'[èéêë]', 'e', s)
        s = re.sub(r'[ìíîï]', 'i', s)
        s = re.sub(r'[òóôõö]', 'o', s)
        s = re.sub(r'[ùúûü]', 'u', s)
        s = re.sub(r'[ýÿ]', 'y', s)
        s = re.sub(r'[ñ]', 'n', s)
        s = re.sub(r'[ç]', 'c', s)
        # Remplace tous les caractères non alphanumériques et underscores par un underscore
        s = re.sub(r'[^a-zA-Z0-9_]+', '_', s)
        # Supprime les underscores multiples consécutifs
        s = re.sub(r'_+', '_', s)
        return s.strip('_')

    def _time_to_minutes(self, time_str):
        """Convertit une chaîne de temps 'HH:MM' en minutes depuis minuit."""
        try:
            h, m = map(int, time_str.split(':'))
            return h * 60 + m
        except:
            return 0  # Fallback

    def _minutes_to_time(self, minutes):
        """Convertit les minutes depuis minuit en chaîne 'HH:MM'."""
        minutes = minutes % 1440 # Wrap around days (just in case)
        h = minutes // 60
        m = minutes % 60
        return f"{h:02d}:{m:02d}"

    def _get_weekdays_from_event(self, event):
        """Retourne la liste des jours de la semaine affectés par l'événement."""
        weekdays = event.get('weekdays')
        if not weekdays:
            return ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
        
        if isinstance(weekdays, str):
            weekdays = [d.strip() for d in weekdays.lower().split(',')]
            
        valid_days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
        return [d for d in weekdays if d in valid_days]
        
    def _create_layer_with_default(self, events, default_state):
        """
        Construit les couches d'une journée en insérant le 'default_state'
        dans les intervalles non couverts.
        """
        # Le temps est en minutes (0 à 1439)
        timeline = {}
        for event in events:
            # On ignore les événements sans heure ou sans état 
            if not event.get('from') or not event.get('to') or not event.get('state'):
                continue

            start_minutes = self._time_to_minutes(event['from'])
            end_minutes = self._time_to_minutes(event['to'])
            
            # Gère l'enveloppement (wrapping) sur minuit (22:00 -> 02:00)
            if start_minutes >= end_minutes:
                # Bloc 1: De l'heure de début à minuit (1439)
                # On utilise 'start_minutes' comme clé pour éviter d'écraser des événements qui commencent à la même heure
                timeline[f"{start_minutes}_0"] = {'start': start_minutes, 'end': 1440, 'data': event} # 1440 = minuit
                # Bloc 2: De minuit (0) à l'heure de fin
                timeline[f"0_1"] = {'start': 0, 'end': end_minutes, 'data': event}
            else:
                # Bloc normal
                timeline[f"{start_minutes}_0"] = {'start': start_minutes, 'end': end_minutes, 'data': event}

        # Trie les événements par heure de début
        sorted_events = sorted(timeline.values(), key=lambda x: x['start'])
        
        layers = []
        current_time = 0 # En minutes (début de la journée)

        for event in sorted_events:
            event_start = event['start']
            event_end = event['end']
            event_data = event['data']
            
            # 1. Insérer l'état par défaut (Layer 0) si l'intervalle est non couvert
            if event_start > current_time:
                # Évite d'insérer un bloc par défaut de 0 minute
                if self._minutes_to_time(event_start) != self._minutes_to_time(current_time):
                    layers.append({
                        'from': self._minutes_to_time(current_time),
                        'to': self._minutes_to_time(event_start),
                        'state': default_state,
                        'layer': 0, # Le layer 0 est l'état par défaut
                        'conditions': self.format_conditions(event_data.get('conditions', []))
                    })

            # 2. Insérer l'événement planifié
            # Assure que le bloc a une durée positive
            if event_end > event_start:
                 layers.append({
                    'from': self._minutes_to_time(event_start),
                    'to': self._minutes_to_time(event_end) if event_end < 1440 else '00:00',
                    'state': event_data['state'],
                    'layer': event_data.get('layer', 1), # Layer 1 par défaut
                    'conditions': self.format_conditions(event_data.get('conditions', []))
                })
            
            # 3. Mettre à jour le temps de début pour le prochain bloc
            current_time = max(current_time, event_end)

        # 4. Insérer le dernier état par défaut jusqu'à minuit
        if current_time < 1440:
             # Assure que le bloc a une durée positive
             if self._minutes_to_time(current_time) != '00:00':
                 layers.append({
                    'from': self._minutes_to_time(current_time),
                    'to': '00:00', # Représente la fin de la journée (1440 minutes)
                    'state': default_state,
                    'layer': 0,
                    'conditions': self.format_conditions([])
                })

        # Dernière passe : fusionner les blocs consécutifs de même état et même layer
        final_layers = []
        if layers:
            current_block = layers[0].copy()
            for next_block in layers[1:]:
                # Fusionner si l'état ET le layer sont identiques
                if (next_block['state'] == current_block['state'] and 
                    next_block['layer'] == current_block['layer'] and
                    next_block['conditions'] == current_block['conditions']): # Aussi les conditions pour la fusion
                    
                    # Étendre la période du bloc actuel
                    current_block['to'] = next_block['to']
                else:
                    # Ajouter le bloc actuel et commencer un nouveau
                    final_layers.append(current_block)
                    current_block = next_block.copy()
            final_layers.append(current_block) # Ajouter le dernier bloc

        return final_layers

    def _check_month_condition(self, event, month):
        """Vérifie si le mois actuel est inclus dans la condition de mois de l'événement."""
        condition_blocks = event.get('conditions', [])
        for cond in condition_blocks:
            if cond.get('condition') == 'time' and cond.get('after') and cond.get('before'):
                try:
                    after_month = int(cond['after'])
                    before_month = int(cond['before'])

                    if after_month <= before_month:
                        # Cas simple: Janvier à Décembre (ex: 03 à 09)
                        if after_month <= month <= before_month:
                            return True
                    else:
                        # Cas enveloppé: Décembre à Février (ex: 10 à 03)
                        if month >= after_month or month <= before_month:
                            return True
                except ValueError:
                    self.log(f"Invalid month value in condition: {cond}", level="WARNING")
                    return True # En cas d'erreur, on suppose que la condition est remplie
        return True # Si aucune condition de mois n'est spécifiée, l'événement est toujours actif

    def _build_layers_for_day(self, schedule_events, default_state):
        """
        Construit un dictionnaire de toutes les couches pour tous les jours de la semaine,
        en tenant compte des conditions de mois.
        """
        
        # Filtrer les événements pour le mois actuel (cela permet de réduire le traitement)
        current_month = datetime.now().month
        filtered_events = []
        for event in schedule_events:
            # On ne garde que les événements qui n'ont pas de conditions de mois OU qui correspondent au mois actuel
            if self._check_month_condition(event, current_month):
                filtered_events.append(event)
        
        # Grouper les événements par jour de la semaine (y compris les événements sans jours spécifiés)
        grouped_events = defaultdict(list)
        for event in filtered_events:
            weekdays = self._get_weekdays_from_event(event)
            for day in weekdays:
                grouped_events[day].append(event)

        # Construire les couches pour chaque jour
        layers_output = {}
        for day in ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']:
            # Tri par layer pour s'assurer que les layers supérieurs écrasent les inférieurs
            # Le tri est stable, donc l'ordre d'apparition dans le YAML est conservé pour les layers égaux.
            day_events = sorted(grouped_events[day], key=lambda x: x.get('layer', 1))
            
            # Création des couches pour cette journée
            layers_output[day] = self._create_layer_with_default(day_events, default_state)
            
        return layers_output
    
    
    def format_conditions(self, conditions):
        """Formate une liste de conditions HA en une chaîne lisible pour le JS."""
        parts = []
        weekday_names = {
            'mon': 'Lundi', 'tue': 'Mardi', 'wed': 'Mercredi', 'thu': 'Jeudi', 
            'fri': 'Vendredi', 'sat': 'Samedi', 'sun': 'Dimanche'
        }
        
        for cond in conditions:
            cond_type = cond.get('condition')
            
            # Le JavaScript ne s'occupe pas de la condition de temps de mois pour l'affichage
            if cond_type == 'time':
                weekdays = cond.get('weekday')
                if weekdays:
                    if isinstance(weekdays, list):
                        day_list = [weekday_names.get(d, d) for d in weekdays]
                        parts.append(f"Jours: {', '.join(day_list)}")
                    elif isinstance(weekdays, str):
                        parts.append(f"Jours: {weekday_names.get(weekdays, weekdays)}")
                continue # On ignore les autres paramètres de la condition de temps (after/before qui sont les mois)
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
                parts.append(f"{friendly} {' et '.join(conds)}")
            elif cond_type == 'or':
                or_conditions = cond.get('conditions', [])
                or_parts = []
                for or_cond in or_conditions:
                    or_text = self.format_conditions([or_cond])
                    if or_text:
                        or_parts.append(or_text)
                if or_parts:
                    parts.append(f"({' OU '.join(or_parts)})")
            # Ignorer toute autre condition qui n'est pas formatée
        
        return ' ET '.join(parts) if parts else ''

    def get_friendly_name(self, entity_id):
        """Récupère le nom convivial de l'entité."""
        try:
            # Tente de récupérer le nom convivial de HA
            return self.get_state(entity_id, attribute='friendly_name') or entity_id
        except Exception:
            # Fallback si l'entité n'est pas encore chargée
            return entity_id