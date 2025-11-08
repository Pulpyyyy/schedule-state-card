# Schedule State Card

Advanced Home Assistant card for visualizing complex schedules with support for multiple layers, dynamic values, and conditional time periods.

![Schedule State Card](.img/card.png)

## ⚠️ Requirements

**This card requires the Schedule State custom component:**
- GitHub: https://github.com/aneeshd/schedule_state
- This component provides the `schedule_state` platform for sensors
- Install it before using this card

## Features

✨ **Multi-layer Scheduling**
- Display multiple schedules with different conditions
- Layer 0 (default) with hatching pattern
- Conditional layers based on time, state, and numeric conditions

📊 **Dynamic Values**
- Real-time sensor data integration
- Template support for complex calculations
- 🔄 Indicator for dynamic values

⏰ **24-Hour Timeline**
- Visual timeline with hour markers (6h, 12h, 18h)
- Current time cursor
- Day selector for week view

🌍 **Multi-Language**
- English, French, German, Spanish
- 12/24 hour format support
- Locale-aware time formatting

📱 **Responsive Design**
- Adapts to different screen sizes
- Smooth animations
- Touch-friendly interface

## Installation

### ⚠️ PREREQUISITE - Schedule State Component

This card **requires** the Schedule State custom component. Install it first:

**Via HACS:**
1. Open HACS in Home Assistant
2. Go to "Integrations" → "Custom repositories"
3. Add: `https://github.com/aneeshd/schedule_state`
4. Select category: `Integration`
5. Install "Schedule State"
6. Restart Home Assistant

**Manual:**
1. Clone or download: `https://github.com/aneeshd/schedule_state`
2. Copy `schedule_state` folder to `/config/custom_components/`
3. Restart Home Assistant

---

### Frontend (Lovelace Card) - Via HACS

1. Open HACS in Home Assistant
2. Go to "Frontend" → "Custom repositories"
3. Add: `https://github.com/Pulpyyyy/schedule-state-card`
4. Select category: `Lovelace`
5. Click "Install"
6. Restart Home Assistant

### Backend (Schedule Parser) - Via AppDaemon

#### Prerequisites
- AppDaemon 4.0+ installed in Home Assistant
- **Schedule State component installed** (see above)

#### Installation Steps

1. **Copy the script to AppDaemon**

   Place `schedule_parser.py` in your AppDaemon apps directory:
   ```
   /config/appdaemon/apps/schedule_parser.py
   ```

2. **Create configuration file**

   Create `/config/schedule.yaml` with your schedules:
   ```yaml
   sensor:
     - platform: schedule_state
       name: "Living Room Schedule"
       default: "20°C"
       events:
         - start: "06:00"
           end: "09:00"
           state: "22°C"
         - start: "18:00"
           end: "23:00"
           state: "21°C"
   ```

3. **Configure AppDaemon**

   Add to `/config/appdaemon/apps/apps.yaml`:
   ```yaml
   schedule_parser:
     module: schedule_parser
     class: ScheduleParser
     config_file: /config/schedule.yaml
   ```

4. **Restart AppDaemon**

   AppDaemon will now parse your schedules and create sensor entities

### Add Card to Dashboard

Add this to your Lovelace configuration:

```yaml
type: custom:schedule-state-card
title: "Schedule Planning"
entities:
  - entity: sensor.schedule_living_room_schedule
    name: "Living Room"
    icon: mdi:thermometer
  - entity: sensor.schedule_kitchen_schedule
    name: "Kitchen"
    icon: mdi:kitchen-appliance
```

## Configuration Guide

### Schedule File Format

```yaml
sensor:
  - platform: schedule_state
    name: "Room Name"
    default: "default_value"  # Fallback state
    unit_of_measurement: "°C"  # Optional
    events:
      - start: "HH:MM"
        end: "HH:MM"
        state: "value"
        description: "Optional description"  # Shows in tooltip
        condition:
          - condition: time
            weekday:
              - mon
              - tue
              - wed
              - thu
              - fri
        allow_wrap: false  # Allow events spanning midnight

      - start: "22:00"
        end: "06:00"
        state: "18°C"
        allow_wrap: true  # Spans from 22:00 to next day 06:00
        condition:
          - condition: time
            weekday:
              - mon
              - tue
              - wed
              - thu
              - fri
```

### Condition Examples

**Time-based (specific weekdays):**
```yaml
condition:
  - condition: time
    weekday: [mon, tue, wed, thu, fri]
```

**Time-based (specific months):**
```yaml
condition:
  - condition: time
    month: [12, 1]  # December and January
```

**State-based (entity state):**
```yaml
condition:
  - condition: state
    entity_id: input_boolean.away_mode
    state: "on"
```

**Numeric state (sensor value):**
```yaml
condition:
  - condition: numeric_state
    entity_id: sensor.temperature
    below: 15
```

**Combining conditions (AND):**
```yaml
condition:
  - condition: time
    weekday: [mon, tue, wed, thu, fri]
  - condition: state
    entity_id: input_boolean.heating_enabled
    state: "on"
```

## Examples

### Basic Heating Schedule

```yaml
sensor:
  - platform: schedule_state
    name: "Heating"
    default: "16°C"
    unit_of_measurement: "°C"
    events:
      # Weekday heating
      - start: "06:00"
        end: "09:00"
        state: "21°C"
        condition:
          - condition: time
            weekday: [mon, tue, wed, thu, fri]

      - start: "18:00"
        end: "23:00"
        state: "21°C"
        condition:
          - condition: time
            weekday: [mon, tue, wed, thu, fri]

      # Weekend heating
      - start: "08:00"
        end: "23:00"
        state: "20°C"
        condition:
          - condition: time
            weekday: [sat, sun]

      # Night cooling
      - start: "23:00"
        end: "06:00"
        state: "18°C"
        allow_wrap: true
```

### Dynamic Values (using Jinja2 templates)

```yaml
sensor:
  - platform: schedule_state
    name: "Adaptive Heating"
    default: "16°C"
    unit_of_measurement: "°C"
    events:
      - start: "06:00"
        end: "09:00"
        state: "{{ states('input_number.morning_temp') }}"  # Sensor value
        condition:
          - condition: time
            weekday: [mon, tue, wed, thu, fri]
```

## Troubleshooting

### Card not showing?
- Check browser console for errors (F12)
- Verify resource URL is correct
- Clear browser cache
- Check Home Assistant logs

### Sensors not created?
- **First: Install Schedule State component** from https://github.com/aneeshd/schedule_state
- Check AppDaemon logs: `Configuration → Logs → AppDaemon`
- Verify `config_file` path is correct in `apps.yaml`
- Check YAML syntax in `schedule.yaml`
- Ensure `schedule_parser.py` is in correct location
- Verify Schedule State component is enabled

### Values not updating?
- Restart AppDaemon
- Check condition syntax
- Verify entity IDs exist in Home Assistant

## Support

- 🐛 Report bugs: [GitHub Issues](https://github.com/Pulpyyyy/schedule-state-card/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/Pulpyyyy/schedule-state-card/discussions)
- 📚 Documentation: [GitHub Wiki](https://github.com/Pulpyyyy/schedule-state-card/wiki)

## License

MIT License - See [LICENSE](LICENSE) file