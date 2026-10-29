import "./weather-station-period-selector.js";
import "./weather-station-chart.js";
import "./weather-station-rain-summary.js";
import "./weather-station-wind-compass.js";

interface CustomCardDescriptor {
  type: string;
  name: string;
  description: string;
}

declare global {
  interface Window {
    customCards?: CustomCardDescriptor[];
  }
}

const cards: CustomCardDescriptor[] = [
  { type: "weather-station-period-selector", name: "Weather Station Period Selector", description: "Synchronises the selected weather period across Weather Station Cards." },
  { type: "weather-station-chart", name: "Weather Station Chart", description: "Plots a weather-station sensor over the shared period." },
  { type: "weather-station-rain-summary", name: "Weather Station Rain Summary", description: "Shows rainfall total for the selected shared period." },
  { type: "weather-station-wind-compass", name: "Weather Station Wind Compass", description: "Shows the current wind direction, speed and gusts." }
];
window.customCards = window.customCards ?? [];
for (const card of cards) {
  if (!window.customCards.some((registered) => registered.type === card.type)) window.customCards.push(card);
}
