import { downsample, historyPoints, periodStart, type HistoryPoint, type HistorySample } from "./history.js";
import { weatherPeriodStore, type WeatherPeriod } from "./period-store.js";

interface HomeAssistant {
  states: Record<string, { state: string; attributes: Record<string, unknown> }>;
  callWS(message: Record<string, unknown>): Promise<Record<string, HistorySample[]>>;
}

interface ChartConfig {
  entity: string;
  title?: string;
  collection_key?: string;
  color?: string;
}

const labels: Record<WeatherPeriod, string> = { day: "24 h", week: "7 jours", month: "31 jours", quarter: "trimestre", year: "1 an" };

class WeatherStationChart extends HTMLElement {
  private config?: Required<Pick<ChartConfig, "entity">> & ChartConfig;
  private hassValue?: HomeAssistant;
  private points: HistoryPoint[] = [];
  private period: WeatherPeriod = "day";
  private selection = weatherPeriodStore.getSelection("default");
  private unsubscribe?: () => void;
  private loading = false;

  set hass(value: HomeAssistant) {
    const initialConnection = !this.hassValue;
    this.hassValue = value;
    if (initialConnection) void this.refresh();
  }
  setConfig(config: ChartConfig): void {
    if (!config.entity) throw new Error("entity is required");
    this.config = { ...config, entity: config.entity };
    this.unsubscribe?.();
    this.unsubscribe = weatherPeriodStore.subscribeSelection(config.collection_key ?? "default", (selection) => {
      this.period = selection.period;
      this.selection = selection;
      void this.refresh();
    });
  }
  disconnectedCallback(): void { this.unsubscribe?.(); }
  getCardSize(): number { return 3; }

  private async refresh(): Promise<void> {
    if (!this.hassValue || !this.config || this.loading) return;
    this.loading = true;
    this.render();
    try {
      const history = await this.hassValue.callWS({
        type: "history/history_during_period",
        start_time: this.selection.start.toISOString(),
        end_time: this.selection.end.toISOString(),
        entity_ids: [this.config.entity],
        minimal_response: true,
        no_attributes: true
      });
      this.points = downsample(historyPoints(history[this.config.entity] ?? []), 240);
    } catch {
      this.points = [];
    } finally { this.loading = false; this.render(); }
  }

  private render(): void {
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    root.replaceChildren();
    const card = document.createElement("ha-card");
    const state = this.hassValue?.states[this.config?.entity ?? ""];
    const unit = String(state?.attributes.unit_of_measurement ?? "");
    const heading = document.createElement("div"); heading.className = "heading";
    heading.textContent = `${this.config?.title ?? state?.attributes.friendly_name ?? "Historique"} · ${labels[this.period]}`;
    const latest = document.createElement("div"); latest.className = "latest";
    latest.textContent = state ? `${state.state} ${unit}`.trim() : "—";
    const graph = this.graph();
    const style = document.createElement("style"); style.textContent = `:host{display:block}ha-card{padding:16px}.heading{font-size:.9rem;color:var(--secondary-text-color)}.latest{font-size:1.8rem;font-weight:600;margin:4px 0 10px}svg{display:block;width:100%;height:140px}.grid{stroke:var(--divider-color);stroke-width:1}.line{fill:none;stroke:${this.config?.color ?? "var(--primary-color)"};stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.empty{fill:var(--secondary-text-color);font-size:14px}`;
    card.append(heading, latest, graph); root.append(style, card);
  }

  private graph(): SVGSVGElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", "0 0 320 140");
    if (this.loading || this.points.length < 2) { const text=document.createElementNS(svg.namespaceURI,"text");text.setAttribute("x","12");text.setAttribute("y","70");text.setAttribute("class","empty");text.textContent=this.loading?"Chargement…":"Historique indisponible";svg.append(text);return svg; }
    const values=this.points.map(p=>p.value), min=Math.min(...values), max=Math.max(...values), span=max-min||1;
    [20,70,120].forEach(y=>{const line=document.createElementNS(svg.namespaceURI,"line");line.setAttribute("x1","0");line.setAttribute("x2","320");line.setAttribute("y1",String(y));line.setAttribute("y2",String(y));line.setAttribute("class","grid");svg.append(line)});
    const first=this.points[0].time,last=this.points[this.points.length-1].time, timeSpan=last-first||1;
    const path=document.createElementNS(svg.namespaceURI,"path");path.setAttribute("class","line");path.setAttribute("d",this.points.map((p,i)=>`${i?"L":"M"}${((p.time-first)/timeSpan*312+4).toFixed(1)},${(124-(p.value-min)/span*108).toFixed(1)}`).join(" "));svg.append(path);return svg;
  }
}
if (!customElements.get("weather-station-chart")) customElements.define("weather-station-chart", WeatherStationChart);
