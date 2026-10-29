import { weatherPeriodStore, type WeatherPeriod } from "./period-store.js";

const labels: Record<WeatherPeriod, string> = {
  day: "Jour",
  week: "Semaine",
  month: "Mois",
  year: "Année"
};

interface PeriodSelectorConfig {
  collection_key?: string;
}

class WeatherStationPeriodSelector extends HTMLElement {
  private config: Required<PeriodSelectorConfig> = { collection_key: "default" };
  private unsubscribe?: () => void;

  setConfig(config: PeriodSelectorConfig): void {
    this.config = { collection_key: config.collection_key ?? "default" };
    this.unsubscribe?.();
    this.unsubscribe = weatherPeriodStore.subscribe(this.config.collection_key, () => this.render());
    this.render();
  }

  connectedCallback(): void {
    this.render();
  }

  disconnectedCallback(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  getCardSize(): number {
    return 1;
  }

  private render(): void {
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

    (Object.keys(labels) as WeatherPeriod[]).forEach((period) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = labels[period];
      button.setAttribute("aria-pressed", String(period === active));
      button.addEventListener("click", () => weatherPeriodStore.setPeriod(this.config.collection_key, period));
      container.append(button);
    });

    root.append(style, container);
  }
}

if (!customElements.get("weather-station-period-selector")) {
  customElements.define("weather-station-period-selector", WeatherStationPeriodSelector);
}

declare global {
  interface HTMLElementTagNameMap {
    "weather-station-period-selector": WeatherStationPeriodSelector;
  }
}
