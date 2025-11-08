# Schedule State Card

Advanced Home Assistant card for visualizing complex schedules with support for multiple layers, dynamic values, and conditional time periods.

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

### Via HACS (Recommended)

1. Open HACS in Home Assistant
2. Go to "Frontend" → "Custom repositories"
3. Add: `https://github.com/Pulpyyyy/schedule-state-card`
4. Select category: `Lovelace`
5. Install "Schedule State Card"
6. Go to "Integrations" and add "Schedule Parser"
7. Create `/config/schedule.yaml` with your schedules
8. Add to `configuration.yaml`:
```yaml
schedule_parser:
  config_file: /config/schedule.yaml
```

9. Restart Home Assistant

### Manual Installation

**Frontend:**
1. Download `schedule-state-card.js` from releases
2. Place in `/config/www/schedule-state-card/`
3. Add to Lovelace resources:
```yaml
resources:
  - url: /www/schedule-state-card/schedule-state-card.js
    type: module
```

**Backend:**
1. Copy `custom_components/schedule_parser/` to `/config/custom_components/`
2. Create `/config/schedule.yaml`
3. Add to `configuration.yaml`:
```yaml
schedule_parser:
  config_file: /config/schedule.yaml
```

4. Restart Home Assistant

## Usage

Add to your Lovelace dashboard:
```yaml
type: custom:schedule-state-card
title: "Planning"
entities:
  - entity: sensor.schedule_rdc
    name: "Living Room"
    icon: mdi:thermometer
  - entity: sensor.schedule_kitchen
    name: "Kitchen"
    icon: mdi:kitchen-appliance
```

## Configuration

See `custom_components/schedule_parser/schedule_parser.py` for backend configuration.

## Troubleshooting

**Card not showing?**
- Check browser console for errors (F12)
- Verify resource URL is correct
- Clear browser cache

**Values not updating?**
- Ensure sensor entity ID is correct
- Check Home Assistant logs for errors
- Restart Home Assistant

## Support

- 🐛 Report bugs: [GitHub Issues](https://github.com/Pulpyyyy/schedule-state-card/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/Pulpyyyy/schedule-state-card/discussions)

## License

MIT License - See [LICENSE](LICENSE) file

---

Made with ❤️ by Pulpyyyy