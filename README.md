# Weather Station Cards

Reusable, lightweight Lovelace cards for Home Assistant weather stations.

The first public release provides a **shared period selector**. It lets several Weather Station Cards use the same period (`Jour`, `Semaine`, `Mois`, `Année`) through a common `collection_key`.

## Installation with HACS

Until the repository is accepted into the default HACS catalog:

1. Open **HACS → Dashboard** in Home Assistant.
2. Open the three-dot menu, then **Custom repositories**.
3. Add this repository URL and choose the **Dashboard** category.
4. Download **Weather Station Cards**.
5. Restart Home Assistant, then refresh the browser cache.
6. Add the resource shown by HACS if Home Assistant does not do so automatically.

The resource URL is normally:

```text
/hacsfiles/weather-station-cards/weather-station-cards.js
```

## Period selector

```yaml
type: custom:weather-station-period-selector
collection_key: weather_station_main
```

All Weather Station Cards that use `collection_key: weather_station_main` will receive the selected period.

## Roadmap

- Temperature, apparent-temperature and humidity chart
- Rainfall bar chart and cumulative rainfall
- Wind direction compass and gusts
- Wind rose
- Solar radiation chart

## Development

```bash
npm install
npm test
npm run build
```

## License

MIT
