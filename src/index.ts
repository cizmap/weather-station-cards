import "./weather-station-period-selector.js";

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

window.customCards = window.customCards ?? [];
if (!window.customCards.some((card) => card.type === "weather-station-period-selector")) {
  window.customCards.push({
    type: "weather-station-period-selector",
    name: "Weather Station Period Selector",
    description: "Synchronises the selected weather period across Weather Station Cards."
  });
}
