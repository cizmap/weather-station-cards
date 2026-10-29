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

// src/history.ts
function historyPoints(samples) {
  return samples.flatMap((sample) => {
    const value = Number(sample.s);
    const seconds = sample.lu ?? sample.lc;
    return Number.isFinite(value) && typeof seconds === "number" ? [{ time: seconds * 1e3, value }] : [];
  });
}
function periodStart(period, now = /* @__PURE__ */ new Date()) {
  const days = { day: 1, week: 7, month: 31, year: 365 };
  return new Date(now.getTime() - days[period] * 24 * 60 * 60 * 1e3);
}

// src/weather-station-chart.ts
var labels2 = { day: "24 h", week: "7 jours", month: "31 jours", year: "1 an" };
var WeatherStationChart = class extends HTMLElement {
  config;
  hassValue;
  points = [];
  period = "day";
  unsubscribe;
  loading = false;
  set hass(value) {
    this.hassValue = value;
    void this.refresh();
  }
  setConfig(config) {
    if (!config.entity) throw new Error("entity is required");
    this.config = { ...config, entity: config.entity };
    this.unsubscribe?.();
    this.unsubscribe = weatherPeriodStore.subscribe(config.collection_key ?? "default", (period) => {
      this.period = period;
      void this.refresh();
    });
  }
  disconnectedCallback() {
    this.unsubscribe?.();
  }
  getCardSize() {
    return 3;
  }
  async refresh() {
    if (!this.hassValue || !this.config || this.loading) return;
    this.loading = true;
    this.render();
    try {
      const history = await this.hassValue.callWS({
        type: "history/history_during_period",
        start_time: periodStart(this.period).toISOString(),
        end_time: (/* @__PURE__ */ new Date()).toISOString(),
        entity_ids: [this.config.entity],
        minimal_response: true,
        no_attributes: true
      });
      this.points = historyPoints(history[this.config.entity] ?? []);
    } catch {
      this.points = [];
    } finally {
      this.loading = false;
      this.render();
    }
  }
  render() {
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    root.replaceChildren();
    const card = document.createElement("ha-card");
    const state = this.hassValue?.states[this.config?.entity ?? ""];
    const unit = String(state?.attributes.unit_of_measurement ?? "");
    const heading = document.createElement("div");
    heading.className = "heading";
    heading.textContent = `${this.config?.title ?? state?.attributes.friendly_name ?? "Historique"} \xB7 ${labels2[this.period]}`;
    const latest = document.createElement("div");
    latest.className = "latest";
    latest.textContent = state ? `${state.state} ${unit}`.trim() : "\u2014";
    const graph = this.graph();
    const style = document.createElement("style");
    style.textContent = `:host{display:block}ha-card{padding:16px}.heading{font-size:.9rem;color:var(--secondary-text-color)}.latest{font-size:1.8rem;font-weight:600;margin:4px 0 10px}svg{display:block;width:100%;height:140px}.grid{stroke:var(--divider-color);stroke-width:1}.line{fill:none;stroke:${this.config?.color ?? "var(--primary-color)"};stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.empty{fill:var(--secondary-text-color);font-size:14px}`;
    card.append(heading, latest, graph);
    root.append(style, card);
  }
  graph() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 320 140");
    if (this.loading || this.points.length < 2) {
      const text = document.createElementNS(svg.namespaceURI, "text");
      text.setAttribute("x", "12");
      text.setAttribute("y", "70");
      text.setAttribute("class", "empty");
      text.textContent = this.loading ? "Chargement\u2026" : "Historique indisponible";
      svg.append(text);
      return svg;
    }
    const values = this.points.map((p) => p.value), min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
    [20, 70, 120].forEach((y) => {
      const line = document.createElementNS(svg.namespaceURI, "line");
      line.setAttribute("x1", "0");
      line.setAttribute("x2", "320");
      line.setAttribute("y1", String(y));
      line.setAttribute("y2", String(y));
      line.setAttribute("class", "grid");
      svg.append(line);
    });
    const first = this.points[0].time, last = this.points[this.points.length - 1].time, timeSpan = last - first || 1;
    const path = document.createElementNS(svg.namespaceURI, "path");
    path.setAttribute("class", "line");
    path.setAttribute("d", this.points.map((p, i) => `${i ? "L" : "M"}${((p.time - first) / timeSpan * 312 + 4).toFixed(1)},${(124 - (p.value - min) / span * 108).toFixed(1)}`).join(" "));
    svg.append(path);
    return svg;
  }
};
if (!customElements.get("weather-station-chart")) customElements.define("weather-station-chart", WeatherStationChart);

// src/weather-station-rain-summary.ts
var labels3 = { day: "Aujourd\u2019hui", week: "Cette semaine", month: "Ce mois", year: "Cette ann\xE9e" };
var field = { day: "daily_entity", week: "weekly_entity", month: "monthly_entity", year: "yearly_entity" };
var WeatherStationRainSummary = class extends HTMLElement {
  config;
  hassValue;
  period = "day";
  unsubscribe;
  set hass(value) {
    this.hassValue = value;
    this.render();
  }
  setConfig(config) {
    for (const key of Object.values(field)) if (!config[key]) throw new Error(`${key} is required`);
    this.config = config;
    this.unsubscribe?.();
    this.unsubscribe = weatherPeriodStore.subscribe(config.collection_key ?? "default", (period) => {
      this.period = period;
      this.render();
    });
  }
  disconnectedCallback() {
    this.unsubscribe?.();
  }
  getCardSize() {
    return 2;
  }
  render() {
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    root.replaceChildren();
    const card = document.createElement("ha-card");
    const entity = this.config?.[field[this.period]];
    const state = entity ? this.hassValue?.states[entity] : void 0;
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = this.config?.title ?? "Pluie";
    const value = document.createElement("div");
    value.className = "value";
    value.textContent = state ? `${state.state} ${state.attributes.unit_of_measurement ?? "mm"}` : "\u2014";
    const caption = document.createElement("div");
    caption.className = "caption";
    caption.textContent = labels3[this.period];
    const style = document.createElement("style");
    style.textContent = ":host{display:block}ha-card{padding:18px;background:linear-gradient(135deg,var(--card-background-color),color-mix(in srgb,var(--primary-color) 8%,var(--card-background-color)))}.title,.caption{color:var(--secondary-text-color)}.value{font-size:2.2rem;font-weight:700;margin:5px 0}";
    card.append(title, value, caption);
    root.append(style, card);
  }
};
if (!customElements.get("weather-station-rain-summary")) customElements.define("weather-station-rain-summary", WeatherStationRainSummary);

// src/weather-station-wind-compass.ts
function cardinal(degrees) {
  return ["N", "NE", "E", "SE", "S", "SO", "O", "NO"][Math.round((degrees % 360 + 360) % 360 / 45) % 8];
}
var WeatherStationWindCompass = class extends HTMLElement {
  config;
  hassValue;
  set hass(value) {
    this.hassValue = value;
    this.render();
  }
  setConfig(config) {
    if (!config.direction_entity || !config.speed_entity) throw new Error("direction_entity and speed_entity are required");
    this.config = config;
    this.render();
  }
  getCardSize() {
    return 3;
  }
  render() {
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    root.replaceChildren();
    const card = document.createElement("ha-card");
    const direction = Number(this.hassValue?.states[this.config?.direction_entity ?? ""]?.state);
    const speed = this.hassValue?.states[this.config?.speed_entity ?? ""];
    const gust = this.config?.gust_entity ? this.hassValue?.states[this.config.gust_entity] : void 0;
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = this.config?.title ?? "Vent";
    const compass = document.createElement("div");
    compass.className = "compass";
    const arrow = document.createElement("div");
    arrow.className = "arrow";
    arrow.style.transform = `rotate(${Number.isFinite(direction) ? direction : 0}deg)`;
    compass.append(arrow);
    const center = document.createElement("div");
    center.className = "center";
    center.textContent = Number.isFinite(direction) ? `${Math.round(direction)}\xB0
${cardinal(direction)}` : "\u2014";
    compass.append(center);
    const details = document.createElement("div");
    details.className = "details";
    details.textContent = `${speed?.state ?? "\u2014"} ${speed?.attributes.unit_of_measurement ?? "km/h"}  \xB7  rafales ${gust?.state ?? "\u2014"} ${gust?.attributes.unit_of_measurement ?? "km/h"}`;
    const style = document.createElement("style");
    style.textContent = ":host{display:block}ha-card{padding:16px;text-align:center}.title{color:var(--secondary-text-color);text-align:left}.compass{width:150px;height:150px;border:1px solid var(--divider-color);border-radius:50%;margin:12px auto;position:relative;background:radial-gradient(circle,transparent 58%,color-mix(in srgb,var(--primary-color) 12%,transparent) 59%,transparent 61%)}.arrow{position:absolute;top:18px;left:70px;width:10px;height:57px;background:var(--primary-color);clip-path:polygon(50% 0,100% 25%,65% 25%,65% 100%,35% 100%,35% 25%,0 25%);transform-origin:5px 57px}.center{position:absolute;inset:50px 0 auto;white-space:pre-line;font-size:1.1rem;font-weight:700}.details{color:var(--secondary-text-color);font-size:.9rem}";
    card.append(title, compass, details);
    root.append(style, card);
  }
};
if (!customElements.get("weather-station-wind-compass")) customElements.define("weather-station-wind-compass", WeatherStationWindCompass);

// src/index.ts
var cards = [
  { type: "weather-station-period-selector", name: "Weather Station Period Selector", description: "Synchronises the selected weather period across Weather Station Cards." },
  { type: "weather-station-chart", name: "Weather Station Chart", description: "Plots a weather-station sensor over the shared period." },
  { type: "weather-station-rain-summary", name: "Weather Station Rain Summary", description: "Shows rainfall total for the selected shared period." },
  { type: "weather-station-wind-compass", name: "Weather Station Wind Compass", description: "Shows the current wind direction, speed and gusts." }
];
window.customCards = window.customCards ?? [];
for (const card of cards) {
  if (!window.customCards.some((registered) => registered.type === card.type)) window.customCards.push(card);
}
