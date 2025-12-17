# Schedule State Card

A powerful Home Assistant custom card that visualizes schedules with dynamic state values and conditions. Perfect for displaying HVAC setpoints, lighting schedules, or any time-based automation planning.

![Schedule State Card](.img/card.gif)


## ⚠️ Requirements

**This card requires the Schedule State custom component (modded version):**
- GitHub: https://github.com/Pulpyyyy/schedule_state

- This project includes a `schedule-state-card.js` card.
- **No external component needed** - everything is self-contained in this repository

## Features

- 📅 **Weekly Schedule Visualization** - View your complete schedule for each day of the week
- 🎨 **Dynamic State Colors** - Automatic color assignment based on state values (temperatures, modes, etc.)
- 📊 **Real-time Updates** - Live timeline with current time indicator
- 🔄 **Dynamic Values** - Support for Home Assistant templates and sensor references
- 🌡️ **Unit Display** - Show measurement units (°C, %, kW, etc.)
- 🎯 **Condition-based Layers** - Multiple schedule layers with conditions (time, entity state, numeric ranges)
- 🎭 **Combined Layer Visualization** - See the result of all stacked conditions in one Sigma (Σ) layer
- 📚 **Layer Stacking/Collapsing** - Click the Sigma (Σ) icon to toggle between detailed and combined view
- 🌐 **Multi-language** - English, French, German, Spanish, Portuguese, Brazilian Portuguese
- ⏰ **12/24 Hour Format** - Automatic detection based on Home Assistant locale
- 🎭 **Wrapping Events** - Support for schedules that span across midnight with visual indicators
- ✏️ **Visual Editor Support** - Configure easily using Home Assistant's built-in visual editor
  
## Installations

### Schedule state Installation

0. Clean Up Previous HACS Installation
If you previously installed a version of Schedule State via HACS (e.g., from another repository):

Go to HACS > Integrations.

Locate any existing Schedule State entry.

Click the three dots (⋮) and select Remove or Uninstall.

Important: If you were using a different version, ensure you delete any orphaned schedule_parser.py files in your /config/appdaemon/apps/ folder.

[![HACS Installation](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Pulpyyyy&repository=schedule-state&category=integration)

1. Open Home Assistant and HACS

Go to your Home Assistant dashboard. In the sidebar, click on HACS.

2. Add the Custom Repository

In HACS, click on top right (⋮).
Scroll down to Custom repositories. In the Repository URL field, enter: `https://github.com/Pulpyyyy/schedule_state``

In the Category dropdown, select: `Integration``

Click Add.

3. Install the Integration 

Go back to the Integrations section in HACS.
Search for schedule_state (the new one !). Click on it and then click Install.
Wait for the installation to complete.

4. Restart Home Assistant 

After installation, restart Home Assistant to apply changes

5. Configure the Integration

Once restarted, go to Settings → Devices & Services.
Click Add Integration and search for Schedule State.
Follow the configuration steps as needed.

### Card Installation

[![HACS Installation](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Pulpyyyy&repository=schedule-state-card&category=plugin)

## Card Configuration

### Basic Configuration

```yaml
type: custom:schedule-state-card
title: "My Schedules"
entities:
  - entity: sensor.schedule_living_room
    name: "Living Room"
    icon: mdi:sofa
  - entity: sensor.schedule_bedroom
    name: "Bedroom"
    icon: mdi:bed
```

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `title` | string | Card title (leave empty to hide) |
| `entities` | list | List of schedule sensors to display |
| `entities[].entity` | string | Entity ID of the schedule sensor |
| `entities[].name` | string | Custom display name |
| `entities[].icon` | string | MDI icon identifier |
| `colors` | object | Color configuration (see below) |

### Colors Configuration

Customize the appearance of the card with color settings:

```yaml
type: custom:schedule-state-card
title: "My Schedules"
entities:
  - entity: sensor.schedule_living_room

colors:
  active_layer: "#2196F3"              # Active conditional layer color (Bright blue)
  inactive_layer: "#BDBDBD"            # Inactive conditional layer color (Gray)
  combined_folded_layer: "#FF9800"     # Combined icon color when collapsed (Orange)
  combined_unfolded_layer: "#2196F3"   # Combined icon color when expanded (Blue)
  cursor: "#FDD835"                    # Current time indicator color (Yellow)
```

#### Color Options

| Color | Used For | Default |
|-------|----------|---------|
| `active_layer` | Active conditional layers (icon highlight) | `#2196F3` (Blue) |
| `inactive_layer` | Inactive conditional layers (dimmed icon) | `#BDBDBD` (Gray) |
| `combined_folded_layer` | Sigma (Σ) icon when layers are collapsed | `#FF9800` (Orange) |
| `combined_unfolded_layer` | Sigma (Σ) icon when layers are expanded | `#2196F3` (Blue) |
| `cursor` | Timeline cursor (current time line) | `#FDD835` (Yellow) |

**Note:** Schedule block colors are automatically generated based on their state values, ensuring visual distinction between different states.

## Understanding the Schedule Display

### Layer System

Schedules are organized in **layers** - each layer represents a planning element that groups events with identical conditions. This allows stacking multiple schedules with different logic:

- **Layer 0** (Default Layer) - Base layer that provides the default value when no other conditions match

- **Layer 1+** (Conditional Layers) - Specific planning elements with optional conditions (time-based, state-based, numeric ranges)
- **Σ (Sigma - Combined Layer)** - Visual result showing what value is actually active after all conditions are evaluated and layers are stacked

### How Layers Work

```
Example: Smart Thermostat Schedule

Layer 0 (Default):     18°C all day (base temperature)
  ├─ Mon-Fri 08:00-18:00: 20°C (work presence)
  └─ 22:00-06:00: 16°C (night mode)

Resulting Σ (Combined):
  ├─ 00:00-06:00: 16°C (night)
  ├─ 06:00-08:00: 18°C (default)
  ├─ 08:00-18:00: 20°C (work, Mon-Fri) / 18°C (weekends)
  ├─ 18:00-22:00: 18°C (default)
  └─ 22:00-00:00: 16°C (night)
```

### Layer Interaction

Click the **Σ (Sigma)** icon to toggle layer visibility:

- **Expanded view**: See Layer 0, all conditional layers, and the combined result
- **Collapsed view**: See only the combined result (Σ layer)
- **Visual feedback**: Icon color changes based on state
  - `combined_folded_layer` color when collapsed
  - `combined_unfolded_layer` color when expanded

### Layer Colors and States

- **Bright colored icon** - Layer is active (condition matches)
- **Dimmed/Gray icon** - Layer is inactive (condition not met)
- **Sigma (Σ) icon** - Shows the combined result of all active layers
  - Changes color based on `combined_folded_layer` (collapsed) or `combined_unfolded_layer` (expanded)

## Schedule YAML Configuration

### Complete Event Example

```yaml
sensor:
  - platform: schedule_state
    name: "Bedroom Temperature"
    default_state: "18"
    unit_of_measurement: "°C"
    allow_wrap: false
    extra_attributes:
      custom_attr: "value"
    events:
      - start: "06:00"
        end: "08:00"
        state: "19"
        condition:
          - condition: time
            weekday: [mon, tue, wed, thu, fri]
            month: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
          - condition: state
            entity_id: "input_boolean.heating_enabled"
            state: "on"
```

### Event Options Reference

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `start` | time | ✓ | Event start time (HH:MM format) |
| `end` | time | ✓ | Event end time (HH:MM format) |
| `state` | string | ✓ | State value (supports Jinja2 templates) |
| `unit` | string | | Unit of measurement (overrides sensor unit) |
| `description` | string | | Tooltip description |
| `icon` | string | | MDI icon for dynamic value indicator |
| `tooltip` | string | | Custom tooltip text |
| `allow_wrap` | bool | | Event wraps past midnight (no border radius applied) |
| `condition` | list | | Conditions for this layer to be active |
| `months` | list | | Legacy month filter (use in time condition instead) |

### Condition Reference

#### Time Condition

```yaml
condition: time
weekday: [mon, tue, wed, thu, fri, sat, sun]
month: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
```

#### State Condition

```yaml
condition: state
entity_id: "binary_sensor.presence"
state: "on"
```

#### Numeric State Condition

```yaml
condition: numeric_state
entity_id: "sensor.temperature"
above: 20
below: 30
```

#### OR Condition (nested)

```yaml
condition: or
conditions:
  - condition: state
    entity_id: "input_boolean.vacation"
    state: "on"
  - condition: numeric_state
    entity_id: "sensor.outdoor_temp"
    below: 0
```

## Template Support

State values support Home Assistant Jinja2 templates with automatic resolution:

```yaml
# Simple entity reference
state: "{{ states('sensor.current_temp') }}"

# State attribute access
state: "{{ state_attr('climate.living_room', 'current_temperature') }}"

# Math operations
state: "{{ (states('input_number.base') | float(0) + 2) | round(1) }}"

# Conditional logic
state: "{% if is_state('binary_sensor.home', 'on') %}21{% else %}18{% endif %}"

# Reference another schedule sensor
state: "{{ states('sensor.schedule_master_schedule') }}"
```

### Dynamic Value Indicators

The card automatically detects and displays dynamic values:

- **🔄 Icon** - Schedule state reference (sensor references another schedule sensor)
- **📊 Icon** - Other sensor reference (templates referencing regular sensors)
- **No Icon** - Static values

## Wrapping Events

Handle events that span midnight. When `allow_wrap: true` is set, the card will:
- Split the event into two internal blocks (before and after midnight)
- Display without rounded corners to indicate wrapping
- Show both time ranges in the tooltip

```yaml
events:
  - start: "22:00"
    end: "06:00"
    state: "night_mode"
    allow_wrap: true
    # Visual display will show:
    # - 22:00 to 00:00 (no left border radius)
    # - 00:00 to 06:00 (no right border radius)
    # Tooltip will indicate: "22:00 - 06:00 (wrapping)"
```

### Data Structure

The modded component generates entities with the following attributes:

```javascript
{
  state: "current_value",
  attributes: {
    friendly_name: "Schedule Name",
    unit_of_measurement: "°C",
    icon: "mdi:thermometer",
    layers: {
      mon: [ /* array of layer objects */ ],
      tue: [ /* array of layer objects */ ],
      // ... one per day
      sun: [ /* array of layer objects */ ]
    }
  }
}
```

Each layer in `layers[day]` is a planning element containing:
- Events with identical conditions grouped together
- Condition information for evaluation
- Block timing and state values

## Advanced Features

### Schedule Inheritance

Inherit events from a parent schedule:

```yaml
sensor:
  - platform: schedule_state
    name: "Master Schedule"
    default_state: "0"
    events:
      - start: "08:00"
        end: "18:00"
        state: "1"

  - platform: schedule_state
    name: "Child Schedule"
    default_state: "{{ states('sensor.schedule_master_schedule') }}"
    events:
      - start: "12:00"
        end: "13:00"
        state: "2"
        # This schedule inherits all events from Master Schedule
        # Plus adds its own overriding event
```

### Secrets Support

Reference secrets in your configuration:

```yaml
sensor:
  - platform: schedule_state
    name: "Secure Schedule"
    default_state: !secret default_temp
    events:
      - start: "08:00"
        end: "18:00"
        state: !secret work_temp
```

## Icons and Display

### Block Icons

- 📅 - Regular event
- 🔄 - Dynamic value (schedule state reference)
- 📊 - Dynamic value (other sensor)
- 🎨 - Custom icon

### Layer Icons

- **Colored circle** - Layer is active
- **Dimmed circle** - Layer is inactive
- **Σ (Sigma)** - Combined layer toggle
- **0** - Default layer

## Troubleshooting

### Schedule not appearing

1. Check entity ID in Home Assistant Dev Tools → States
2. Verify AppDaemon logs:
   ```bash
   tail -f /config/logs/appdaemon.log
   ```

### Wrong colors or values displaying

- Check that template syntax is valid
- Verify entity IDs exist in Home Assistant
- Use Dev Tools → Templates to test your Jinja2 templates

### Icons not showing

- 🔄 only appears for `schedule_state` sensors
- 📊 appears for regular sensors with templates
- Ensure referenced entities exist and have correct attributes

### Click/Toggle not working

- Ensure JavaScript console is clear of errors
- Try hard-refreshing the browser (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser compatibility (Chrome/Edge/Firefox recommended)

### AppDaemon parsing errors

- Enable DEBUG logging in AppDaemon:
  ```yaml
  logs:
    appdaemon.schedule_parser: DEBUG
  ```
- Check for invalid YAML indentation
- Verify all referenced entity IDs exist

## Browser Support

- ✅ Chrome/Chromium (v90+)
- ✅ Firefox (v88+)
- ✅ Safari (v14+)
- ✅ Edge (v90+)

## Performance Notes

- Timeline updates every **60 seconds** (configurable)
- Tooltips stabilize after **200ms** mouse movement
- Click debouncing: **300ms** to prevent double-toggles
- Large schedules (100+ events) may require optimization

## License

MIT License - feel free to use and modify!

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Support

- 📖 [Home Assistant Documentation](https://www.home-assistant.io/)
- 📖 [AppDaemon Documentation](https://appdaemon.readthedocs.io/)
- 🐛 [Report Issues](https://github.com/Pulpyyyy/schedule-state-card/issues)
- 💬 [Discussions](https://github.com/Pulpyyyy/schedule-state-card/discussions)
