// src/period-store.ts
var PeriodStore = class {
  periods = /* @__PURE__ */ new Map();
  listeners = /* @__PURE__ */ new Map();
  getPeriod(collectionKey) {
    return this.periods.get(collectionKey) ?? "day";
  }
  setPeriod(collectionKey, period) {
    this.periods.set(collectionKey, period);
    for (const listener of this.listeners.get(collectionKey) ?? []) {
      listener(period);
    }
  }
  subscribe(collectionKey, listener) {
    const listeners = this.listeners.get(collectionKey) ?? /* @__PURE__ */ new Set();
    listeners.add(listener);
    this.listeners.set(collectionKey, listeners);
    listener(this.getPeriod(collectionKey));
    return () => listeners.delete(listener);
  }
};
var weatherPeriodStore = new PeriodStore();

// src/weather-station-period-selector.ts
var labels = {
  day: "Jour",
  week: "Semaine",
  month: "Mois",
  year: "Ann\xE9e"
};
var WeatherStationPeriodSelector = class extends HTMLElement {
  config = { collection_key: "default" };
  unsubscribe;
  setConfig(config) {
    this.config = { collection_key: config.collection_key ?? "default" };
    this.unsubscribe?.();
    this.unsubscribe = weatherPeriodStore.subscribe(this.config.collection_key, () => this.render());
    this.render();
  }
  connectedCallback() {
    this.render();
  }
  disconnectedCallback() {
    this.unsubscribe?.();
    this.unsubscribe = void 0;
  }
  getCardSize() {
    return 1;
  }
  render() {
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    const active = weatherPeriodStore.getPeriod(this.config.collection_key);
    root.replaceChildren();
    const style = document.createElement("style");
    style.textContent = `
      :host { display: block; }
      .periods { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 12px; }
      button { border: 1px solid var(--divider-color); border-radius: 18px; padding: 8px 4px; color: var(--primary-text-color); background: var(--card-background-color); font: inherit; cursor: pointer; }
      button[aria-pressed="true"] { color: var(--text-primary-color); background: var(--primary-color); border-color: var(--primary-color); }
    `;
    const container = document.createElement("div");
    container.className = "periods";
    Object.keys(labels).forEach((period) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = labels[period];
      button.setAttribute("aria-pressed", String(period === active));
      button.addEventListener("click", () => weatherPeriodStore.setPeriod(this.config.collection_key, period));
      container.append(button);
    });
    root.append(style, container);
  }
};
if (!customElements.get("weather-station-period-selector")) {
  customElements.define("weather-station-period-selector", WeatherStationPeriodSelector);
}

// src/index.ts
window.customCards = window.customCards ?? [];
if (!window.customCards.some((card) => card.type === "weather-station-period-selector")) {
  window.customCards.push({
    type: "weather-station-period-selector",
    name: "Weather Station Period Selector",
    description: "Synchronises the selected weather period across Weather Station Cards."
  });
}
