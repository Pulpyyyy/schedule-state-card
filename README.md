# Schedule State Card

Visualizes schedules defined via AppDaemon schedule_parser with support for:
- Multi-layer scheduling
- Dynamic values from sensors
- Conditional time periods
- Default states with hatching pattern
- 24-hour timeline with time cursor
- Multi-language support (EN, FR, DE, ES)

## Installation

### Via HACS
1. Add this repository to HACS as a custom repository
2. Search for "Schedule State Card"
3. Click Install

### Manual
1. Download `schedule-state-card.js`
2. Place in `/config/www/schedule-state-card/`
3. Add to your Lovelace configuration:
```yaml
resources:
  - url: /www/schedule-state-card/schedule-state-card.js
    type: module
```

## Usage

Add to your Lovelace UI:
```yaml
type: custom:schedule-state-card
title: "Planning"
entities:
  - entity: sensor.schedule_rdc
    name: "RDC"
    icon: mdi:thermometer
```

## Features

- **Multi-layer support**: Display multiple schedules with conditions
- **Dynamic values**: Show real-time sensor data (🔄 indicator)
- **Default states**: Hatched pattern for fallback values
- **Responsive design**: Adapts to different screen sizes
- **Timezone aware**: Respects Home Assistant locale settings
- **12/24h format**: Automatically switches based on locale

## Configuration

See [schedule_parser.py](../schedule_parser.py) for backend configuration.

## License

MIT License - See LICENSE file