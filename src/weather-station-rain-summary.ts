import { weatherPeriodStore, type WeatherPeriod } from "./period-store.js";

interface HomeAssistant { states: Record<string, { state: string; attributes: Record<string, unknown> }>; }
interface RainConfig { daily_entity: string; weekly_entity: string; monthly_entity: string; yearly_entity: string; collection_key?: string; title?: string; }
const labels: Record<WeatherPeriod, string> = { day: "Aujourd’hui", week: "Cette semaine", month: "Ce mois", year: "Cette année" };
const field: Record<WeatherPeriod, keyof RainConfig> = { day: "daily_entity", week: "weekly_entity", month: "monthly_entity", year: "yearly_entity" };

class WeatherStationRainSummary extends HTMLElement {
  private config?: RainConfig; private hassValue?: HomeAssistant; private period: WeatherPeriod = "day"; private unsubscribe?: () => void;
  set hass(value: HomeAssistant) { this.hassValue=value; this.render(); }
  setConfig(config: RainConfig): void { for(const key of Object.values(field)) if(!config[key]) throw new Error(`${key} is required`); this.config=config; this.unsubscribe?.(); this.unsubscribe=weatherPeriodStore.subscribe(config.collection_key??"default",period=>{this.period=period;this.render();}); }
  disconnectedCallback(): void { this.unsubscribe?.(); }
  getCardSize(): number { return 2; }
  private render(): void { const root=this.shadowRoot??this.attachShadow({mode:"open"});root.replaceChildren();const card=document.createElement("ha-card");const entity=this.config?.[field[this.period]];const state=entity?this.hassValue?.states[entity]:undefined;const title=document.createElement("div");title.className="title";title.textContent=this.config?.title??"Pluie";const value=document.createElement("div");value.className="value";value.textContent=state?`${state.state} ${state.attributes.unit_of_measurement??"mm"}`:"—";const caption=document.createElement("div");caption.className="caption";caption.textContent=labels[this.period];const style=document.createElement("style");style.textContent=":host{display:block}ha-card{padding:18px;background:linear-gradient(135deg,var(--card-background-color),color-mix(in srgb,var(--primary-color) 8%,var(--card-background-color)))}.title,.caption{color:var(--secondary-text-color)}.value{font-size:2.2rem;font-weight:700;margin:5px 0}";card.append(title,value,caption);root.append(style,card); }
}
if (!customElements.get("weather-station-rain-summary")) customElements.define("weather-station-rain-summary", WeatherStationRainSummary);
