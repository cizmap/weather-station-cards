import { weatherPeriodStore, type PeriodSelection, type WeatherPeriod } from "./period-store.js";

const labels: Record<WeatherPeriod, string> = { day: "Jour", week: "Semaine", month: "Mois", year: "Année" };
const orderedPeriods: WeatherPeriod[] = ["day", "week", "month", "year"];
interface PeriodSelectorConfig { collection_key?: string; }

class WeatherStationPeriodSelector extends HTMLElement {
  private config: Required<PeriodSelectorConfig> = { collection_key: "default" };
  private selection: PeriodSelection = weatherPeriodStore.getSelection("default");
  private menuOpen = false;
  private unsubscribe?: () => void;

  setConfig(config: PeriodSelectorConfig): void {
    this.config = { collection_key: config.collection_key ?? "default" };
    this.unsubscribe?.();
    this.unsubscribe = weatherPeriodStore.subscribeSelection(this.config.collection_key, (selection) => { this.selection = selection; this.render(); });
  }
  connectedCallback(): void { this.render(); }
  disconnectedCallback(): void { this.unsubscribe?.(); this.unsubscribe = undefined; }
  getCardSize(): number { return 1; }

  private select(period: WeatherPeriod): void { this.menuOpen = false; weatherPeriodStore.setPeriod(this.config.collection_key, period); }
  private rangeLabel(): string {
    const format = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
    return `${format.format(this.selection.start)} – ${format.format(this.selection.end)}`;
  }

  private render(): void {
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" }); root.replaceChildren();
    const card = document.createElement("ha-card"); card.className = "toolbar";
    const range = document.createElement("div"); range.className = "range";
    const icon = document.createElement("ha-icon"); icon.setAttribute("icon", "mdi:calendar");
    const dates = document.createElement("div"); const main = document.createElement("div"); main.className = "dates"; main.textContent = this.rangeLabel(); const secondary = document.createElement("div"); secondary.className = "period"; secondary.textContent = labels[this.selection.period]; dates.append(main, secondary); range.append(icon, dates);
    const now = document.createElement("button"); now.className = "now"; now.textContent = "Maintenant"; now.addEventListener("click", () => weatherPeriodStore.goToNow(this.config.collection_key));
    const previous = document.createElement("button"); previous.className = "icon"; previous.setAttribute("aria-label", "Période précédente"); previous.textContent = "‹"; previous.addEventListener("click", () => weatherPeriodStore.shift(this.config.collection_key, -1));
    const next = document.createElement("button"); next.className = "icon"; next.setAttribute("aria-label", "Période suivante"); next.textContent = "›"; next.addEventListener("click", () => weatherPeriodStore.shift(this.config.collection_key, 1));
    const more = document.createElement("button"); more.className = "icon"; more.setAttribute("aria-label", "Choisir la période"); more.textContent = "⋮"; more.addEventListener("click", () => { this.menuOpen = !this.menuOpen; this.render(); });
    const menu = document.createElement("div"); menu.className = "menu"; menu.hidden = !this.menuOpen;
    orderedPeriods.forEach((period) => { const button = document.createElement("button"); button.textContent = labels[period]; button.setAttribute("aria-pressed", String(period === this.selection.period)); button.addEventListener("click", () => this.select(period)); menu.append(button); });
    const style = document.createElement("style"); style.textContent = `:host{display:block;position:relative}.toolbar{min-height:56px;padding:0 10px;display:flex;align-items:center;gap:6px;box-shadow:var(--ha-card-box-shadow,0 2px 6px #0002)}.range{display:flex;align-items:center;gap:14px;flex:1;min-width:0}.range ha-icon{--mdc-icon-size:22px}.dates{font-size:1.08rem;font-weight:600;white-space:nowrap}.period{font-size:.78rem;font-weight:400;color:var(--secondary-text-color)}button{font:inherit;border:0;cursor:pointer}.now{background:color-mix(in srgb,var(--primary-color) 14%,transparent);color:var(--primary-color);font-weight:600;border-radius:20px;padding:9px 14px}.icon{background:transparent;color:var(--primary-text-color);font-size:30px;width:35px;height:42px;line-height:1}.menu{position:absolute;right:8px;top:62px;z-index:2;background:var(--card-background-color);border-radius:12px;box-shadow:0 5px 18px #0004;padding:6px;display:flex;flex-direction:column;min-width:130px}.menu button{background:transparent;color:var(--primary-text-color);padding:10px 14px;text-align:left;border-radius:8px}.menu button[aria-pressed="true"]{background:color-mix(in srgb,var(--primary-color) 15%,transparent);color:var(--primary-color);font-weight:600}@media(max-width:520px){.toolbar{gap:1px}.dates{font-size:.92rem}.now{padding:8px}.icon{width:29px}.range{gap:8px}}`;
    card.append(range, now, previous, next, more); root.append(style, card, menu);
  }
}
if (!customElements.get("weather-station-period-selector")) customElements.define("weather-station-period-selector", WeatherStationPeriodSelector);
declare global { interface HTMLElementTagNameMap { "weather-station-period-selector": WeatherStationPeriodSelector; } }
