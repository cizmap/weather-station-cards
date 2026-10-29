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
var labels = { day: "Jour", week: "Semaine", month: "Mois", year: "Ann\xE9e" };
var orderedPeriods = ["day", "week", "month", "year"];
var WeatherStationPeriodSelector = class extends HTMLElement {
  config = { collection_key: "default" };
  period = "day";
  menuOpen = false;
  unsubscribe;
  setConfig(config) {
    this.config = { collection_key: config.collection_key ?? "default" };
    this.unsubscribe?.();
    this.unsubscribe = weatherPeriodStore.subscribe(this.config.collection_key, (period) => {
      this.period = period;
      this.render();
    });
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
  select(period) {
    this.menuOpen = false;
    weatherPeriodStore.setPeriod(this.config.collection_key, period);
  }
  rangeLabel() {
    const now = /* @__PURE__ */ new Date();
    const starts = { day: new Date(now), week: new Date(now.getTime() - 6 * 864e5), month: new Date(now.getTime() - 30 * 864e5), year: new Date(now.getTime() - 364 * 864e5) };
    const format = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
    return `${format.format(starts[this.period])} \u2013 ${format.format(now)}`;
  }
  render() {
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    root.replaceChildren();
    const card = document.createElement("ha-card");
    card.className = "toolbar";
    const range = document.createElement("div");
    range.className = "range";
    const icon = document.createElement("ha-icon");
    icon.setAttribute("icon", "mdi:calendar");
    const dates = document.createElement("div");
    const main = document.createElement("div");
    main.className = "dates";
    main.textContent = this.rangeLabel();
    const secondary = document.createElement("div");
    secondary.className = "period";
    secondary.textContent = labels[this.period];
    dates.append(main, secondary);
    range.append(icon, dates);
    const now = document.createElement("button");
    now.className = "now";
    now.textContent = "Maintenant";
    now.addEventListener("click", () => this.select("day"));
    const previous = document.createElement("button");
    previous.className = "icon";
    previous.setAttribute("aria-label", "P\xE9riode pr\xE9c\xE9dente");
    previous.textContent = "\u2039";
    previous.addEventListener("click", () => this.select(orderedPeriods[Math.max(0, orderedPeriods.indexOf(this.period) - 1)]));
    const next = document.createElement("button");
    next.className = "icon";
    next.setAttribute("aria-label", "P\xE9riode suivante");
    next.textContent = "\u203A";
    next.addEventListener("click", () => this.select(orderedPeriods[Math.min(orderedPeriods.length - 1, orderedPeriods.indexOf(this.period) + 1)]));
    const more = document.createElement("button");
    more.className = "icon";
    more.setAttribute("aria-label", "Choisir la p\xE9riode");
    more.textContent = "\u22EE";
    more.addEventListener("click", () => {
      this.menuOpen = !this.menuOpen;
      this.render();
    });
    const menu = document.createElement("div");
    menu.className = "menu";
    menu.hidden = !this.menuOpen;
    orderedPeriods.forEach((period) => {
      const button = document.createElement("button");
      button.textContent = labels[period];
      button.setAttribute("aria-pressed", String(period === this.period));
      button.addEventListener("click", () => this.select(period));
      menu.append(button);
    });
    const style = document.createElement("style");
    style.textContent = `:host{display:block;position:relative}.toolbar{min-height:56px;padding:0 10px;display:flex;align-items:center;gap:6px;box-shadow:var(--ha-card-box-shadow,0 2px 6px #0002)}.range{display:flex;align-items:center;gap:14px;flex:1;min-width:0}.range ha-icon{--mdc-icon-size:22px}.dates{font-size:1.08rem;font-weight:600;white-space:nowrap}.period{font-size:.78rem;font-weight:400;color:var(--secondary-text-color)}button{font:inherit;border:0;cursor:pointer}.now{background:color-mix(in srgb,var(--primary-color) 14%,transparent);color:var(--primary-color);font-weight:600;border-radius:20px;padding:9px 14px}.icon{background:transparent;color:var(--primary-text-color);font-size:30px;width:35px;height:42px;line-height:1}.menu{position:absolute;right:8px;top:62px;z-index:2;background:var(--card-background-color);border-radius:12px;box-shadow:0 5px 18px #0004;padding:6px;display:flex;flex-direction:column;min-width:130px}.menu button{background:transparent;color:var(--primary-text-color);padding:10px 14px;text-align:left;border-radius:8px}.menu button[aria-pressed="true"]{background:color-mix(in srgb,var(--primary-color) 15%,transparent);color:var(--primary-color);font-weight:600}@media(max-width:520px){.toolbar{gap:1px}.dates{font-size:.92rem}.now{padding:8px}.icon{width:29px}.range{gap:8px}}`;
    card.append(range, now, previous, next, more);
    root.append(style, card, menu);
  }
};
if (!customElements.get("weather-station-period-selector")) customElements.define("weather-station-period-selector", WeatherStationPeriodSelector);

// src/history.ts
function historyPoints(samples) {
  return samples.flatMap((sample) => {
    const value = Number(sample.s);
    const seconds = sample.lu ?? sample.lc;
    return Number.isFinite(value) && typeof seconds === "number" ? [{ time: seconds * 1e3, value }] : [];
  });
}
function windRoseBins(points, binCount = 8) {
  const bins = Array(binCount).fill(0);
  for (const point of points) {
    const heading = (point.value % 360 + 360) % 360;
    bins[Math.round(heading / (360 / binCount)) % binCount] += 1;
  }
  return bins;
}
function rainBars(points) {
  const grouped = /* @__PURE__ */ new Map();
  for (const point of points) {
    const label = new Date(point.time).toLocaleDateString("sv-SE");
    const existing = grouped.get(label);
    if (!existing || point.value > existing.value) grouped.set(label, { label, time: point.time, value: point.value });
  }
  return [...grouped.values()];
}
function downsample(points, maximum) {
  if (points.length <= maximum || maximum < 3) return points;
  return Array.from({ length: maximum }, (_, index) => points[Math.round(index * (points.length - 1) / (maximum - 1))]);
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
    const initialConnection = !this.hassValue;
    this.hassValue = value;
    if (initialConnection) void this.refresh();
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
      this.points = downsample(historyPoints(history[this.config.entity] ?? []), 240);
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
  stateValue = "";
  set hass(value) {
    const entity = this.config?.[field[this.period]];
    const nextValue = entity ? value.states[entity]?.state ?? "" : "";
    const changed = !this.hassValue || nextValue !== this.stateValue;
    this.hassValue = value;
    this.stateValue = nextValue;
    if (changed) this.render();
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

// src/weather-station-rain-chart.ts
var labels4 = { day: "24 h", week: "7 jours", month: "31 jours", year: "1 an" };
var WeatherStationRainChart = class extends HTMLElement {
  config;
  hassValue;
  bars = [];
  period = "day";
  unsubscribe;
  loading = false;
  set hass(value) {
    const initialConnection = !this.hassValue;
    this.hassValue = value;
    if (initialConnection) void this.refresh();
  }
  setConfig(config) {
    if (!config.entity) throw new Error("entity is required");
    this.config = config;
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
      const history = await this.hassValue.callWS({ type: "history/history_during_period", start_time: periodStart(this.period).toISOString(), end_time: (/* @__PURE__ */ new Date()).toISOString(), entity_ids: [this.config.entity], minimal_response: true, no_attributes: true });
      this.bars = rainBars(historyPoints(history[this.config.entity] ?? []));
    } catch {
      this.bars = [];
    } finally {
      this.loading = false;
      this.render();
    }
  }
  render() {
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    root.replaceChildren();
    const card = document.createElement("ha-card");
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = `${this.config?.title ?? "Pluie"} \xB7 ${labels4[this.period]}`;
    const graph = this.graph();
    const style = document.createElement("style");
    style.textContent = ":host{display:block}ha-card{padding:16px}.title{color:var(--secondary-text-color);font-size:.9rem;margin-bottom:10px}svg{display:block;width:100%;height:150px}.bar{fill:#2196f3}.grid{stroke:var(--divider-color);stroke-width:1}.empty{fill:var(--secondary-text-color);font-size:14px}";
    card.append(title, graph);
    root.append(style, card);
  }
  graph() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 320 150");
    if (this.loading || !this.bars.length) {
      const text = document.createElementNS(svg.namespaceURI, "text");
      text.setAttribute("x", "12");
      text.setAttribute("y", "75");
      text.setAttribute("class", "empty");
      text.textContent = this.loading ? "Chargement\u2026" : "Pas de pluie enregistr\xE9e";
      svg.append(text);
      return svg;
    }
    const max = Math.max(...this.bars.map((b) => b.value), 0.1), width = 312 / this.bars.length;
    [30, 75, 120].forEach((y) => {
      const line = document.createElementNS(svg.namespaceURI, "line");
      line.setAttribute("x1", "0");
      line.setAttribute("x2", "320");
      line.setAttribute("y1", String(y));
      line.setAttribute("y2", String(y));
      line.setAttribute("class", "grid");
      svg.append(line);
    });
    this.bars.forEach((bar, index) => {
      const rect = document.createElementNS(svg.namespaceURI, "rect");
      const h = 110 * bar.value / max;
      rect.setAttribute("x", String(4 + index * width));
      rect.setAttribute("y", String(125 - h));
      rect.setAttribute("width", String(Math.max(2, width - 2)));
      rect.setAttribute("height", String(h));
      rect.setAttribute("rx", "2");
      rect.setAttribute("class", "bar");
      const title = document.createElementNS(svg.namespaceURI, "title");
      title.textContent = `${bar.label}: ${bar.value.toFixed(1)} mm`;
      rect.append(title);
      svg.append(rect);
    });
    return svg;
  }
};
if (!customElements.get("weather-station-rain-chart")) customElements.define("weather-station-rain-chart", WeatherStationRainChart);

// src/weather-station-wind-compass.ts
function cardinal(degrees) {
  return ["N", "NE", "E", "SE", "S", "SO", "O", "NO"][Math.round((degrees % 360 + 360) % 360 / 45) % 8];
}
var WeatherStationWindCompass = class extends HTMLElement {
  config;
  hassValue;
  stateSignature = "";
  set hass(value) {
    const ids = this.config ? [this.config.direction_entity, this.config.speed_entity, this.config.gust_entity ?? ""] : [];
    const signature = ids.map((id) => value.states[id]?.state ?? "").join("|");
    const changed = !this.hassValue || signature !== this.stateSignature;
    this.hassValue = value;
    this.stateSignature = signature;
    if (changed) this.render();
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
    const compass2 = document.createElement("div");
    compass2.className = "compass";
    const arrow = document.createElement("div");
    arrow.className = "arrow";
    arrow.style.transform = `rotate(${Number.isFinite(direction) ? direction : 0}deg)`;
    compass2.append(arrow);
    const center = document.createElement("div");
    center.className = "center";
    center.textContent = Number.isFinite(direction) ? `${Math.round(direction)}\xB0
${cardinal(direction)}` : "\u2014";
    compass2.append(center);
    const details = document.createElement("div");
    details.className = "details";
    details.textContent = `${speed?.state ?? "\u2014"} ${speed?.attributes.unit_of_measurement ?? "km/h"}  \xB7  rafales ${gust?.state ?? "\u2014"} ${gust?.attributes.unit_of_measurement ?? "km/h"}`;
    const style = document.createElement("style");
    style.textContent = ":host{display:block}ha-card{padding:16px;text-align:center}.title{color:var(--secondary-text-color);text-align:left}.compass{width:150px;height:150px;border:1px solid var(--divider-color);border-radius:50%;margin:12px auto;position:relative;background:radial-gradient(circle,transparent 58%,color-mix(in srgb,var(--primary-color) 12%,transparent) 59%,transparent 61%)}.arrow{position:absolute;top:18px;left:70px;width:10px;height:57px;background:var(--primary-color);clip-path:polygon(50% 0,100% 25%,65% 25%,65% 100%,35% 100%,35% 25%,0 25%);transform-origin:5px 57px}.center{position:absolute;inset:50px 0 auto;white-space:pre-line;font-size:1.1rem;font-weight:700}.details{color:var(--secondary-text-color);font-size:.9rem}";
    card.append(title, compass2, details);
    root.append(style, card);
  }
};
if (!customElements.get("weather-station-wind-compass")) customElements.define("weather-station-wind-compass", WeatherStationWindCompass);

// src/weather-station-wind-rose.ts
var labels5 = { day: "24 h", week: "7 jours", month: "31 jours", year: "1 an" };
var compass = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
var WeatherStationWindRose = class extends HTMLElement {
  config;
  hassValue;
  bins = [];
  period = "day";
  unsub;
  loading = false;
  set hass(value) {
    const initialConnection = !this.hassValue;
    this.hassValue = value;
    if (initialConnection) void this.refresh();
  }
  setConfig(config) {
    if (!config.entity) throw new Error("entity is required");
    this.config = config;
    this.unsub?.();
    this.unsub = weatherPeriodStore.subscribe(config.collection_key ?? "default", (p) => {
      this.period = p;
      void this.refresh();
    });
  }
  disconnectedCallback() {
    this.unsub?.();
  }
  getCardSize() {
    return 3;
  }
  async refresh() {
    if (!this.hassValue || !this.config || this.loading) return;
    this.loading = true;
    this.render();
    try {
      const h = await this.hassValue.callWS({ type: "history/history_during_period", start_time: periodStart(this.period).toISOString(), end_time: (/* @__PURE__ */ new Date()).toISOString(), entity_ids: [this.config.entity], minimal_response: true, no_attributes: true });
      this.bins = windRoseBins(historyPoints(h[this.config.entity] ?? []));
    } catch {
      this.bins = [];
    } finally {
      this.loading = false;
      this.render();
    }
  }
  render() {
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    root.replaceChildren();
    const card = document.createElement("ha-card"), title = document.createElement("div");
    title.className = "title";
    title.textContent = `${this.config?.title ?? "Rose des vents"} \xB7 ${labels5[this.period]}`;
    card.append(title, this.svg());
    const style = document.createElement("style");
    style.textContent = ":host{display:block}ha-card{padding:16px}.title{color:var(--secondary-text-color);font-size:.9rem}svg{display:block;width:100%;height:210px}.axis{stroke:var(--divider-color);stroke-width:1}.petal{stroke:#26a69a;stroke-width:18;stroke-linecap:round}.label{fill:var(--secondary-text-color);font-size:12px;text-anchor:middle}.empty{fill:var(--secondary-text-color);font-size:14px}";
    root.append(style, card);
  }
  svg() {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 240 210");
    if (this.loading || !this.bins.some(Boolean)) {
      const t = document.createElementNS(s.namespaceURI, "text");
      t.setAttribute("x", "120");
      t.setAttribute("y", "105");
      t.setAttribute("class", "empty");
      t.textContent = this.loading ? "Chargement\u2026" : "Historique de vent indisponible";
      s.append(t);
      return s;
    }
    const cx = 120, cy = 110, max = Math.max(...this.bins, 1);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 - Math.PI / 2, outer = 75, r = 18 + this.bins[i] / max * 57;
      const axis = document.createElementNS(s.namespaceURI, "line");
      axis.setAttribute("x1", String(cx));
      axis.setAttribute("y1", String(cy));
      axis.setAttribute("x2", String(cx + Math.cos(a) * outer));
      axis.setAttribute("y2", String(cy + Math.sin(a) * outer));
      axis.setAttribute("class", "axis");
      s.append(axis);
      if (this.bins[i]) {
        const p = document.createElementNS(s.namespaceURI, "line");
        p.setAttribute("x1", String(cx + Math.cos(a) * 12));
        p.setAttribute("y1", String(cy + Math.sin(a) * 12));
        p.setAttribute("x2", String(cx + Math.cos(a) * r));
        p.setAttribute("y2", String(cy + Math.sin(a) * r));
        p.setAttribute("class", "petal");
        const tt = document.createElementNS(s.namespaceURI, "title");
        tt.textContent = `${compass[i]}: ${this.bins[i]} relev\xE9s`;
        p.append(tt);
        s.append(p);
      }
      const l = document.createElementNS(s.namespaceURI, "text");
      l.setAttribute("x", String(cx + Math.cos(a) * 95));
      l.setAttribute("y", String(cy + Math.sin(a) * 95 + 4));
      l.setAttribute("class", "label");
      l.textContent = compass[i];
      s.append(l);
    }
    return s;
  }
};
if (!customElements.get("weather-station-wind-rose")) customElements.define("weather-station-wind-rose", WeatherStationWindRose);

// src/index.ts
var cards = [
  { type: "weather-station-period-selector", name: "Weather Station Period Selector", description: "Synchronises the selected weather period across Weather Station Cards." },
  { type: "weather-station-chart", name: "Weather Station Chart", description: "Plots a weather-station sensor over the shared period." },
  { type: "weather-station-rain-summary", name: "Weather Station Rain Summary", description: "Shows rainfall total for the selected shared period." },
  { type: "weather-station-rain-chart", name: "Weather Station Rain Chart", description: "Displays daily rainfall bars for the shared period." },
  { type: "weather-station-wind-compass", name: "Weather Station Wind Compass", description: "Shows the current wind direction, speed and gusts." },
  { type: "weather-station-wind-rose", name: "Weather Station Wind Rose", description: "Shows wind-direction frequency over the shared period." }
];
window.customCards = window.customCards ?? [];
for (const card of cards) {
  if (!window.customCards.some((registered) => registered.type === card.type)) window.customCards.push(card);
}
