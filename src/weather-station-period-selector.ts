import { weatherPeriodStore, type PeriodSelection, type WeatherPeriod } from "./period-store.js";

const labels: Record<WeatherPeriod, string> = { day: "Jour", week: "Semaine", month: "Mois", year: "Année" };
interface PeriodSelectorConfig { collection_key?: string; }
type Preset = { label: string; start: (now: Date) => Date };
const presets: Preset[] = [
  { label: "Aujourd’hui", start: n => new Date(n.getFullYear(), n.getMonth(), n.getDate()) },
  { label: "Hier", start: n => new Date(n.getFullYear(), n.getMonth(), n.getDate() - 1) },
  { label: "Cette semaine", start: n => new Date(n.getFullYear(), n.getMonth(), n.getDate() - ((n.getDay() + 6) % 7)) },
  { label: "Ce mois-ci", start: n => new Date(n.getFullYear(), n.getMonth(), 1) },
  { label: "Ce trimestre", start: n => new Date(n.getFullYear(), Math.floor(n.getMonth() / 3) * 3, 1) },
  { label: "Cette année", start: n => new Date(n.getFullYear(), 0, 1) },
  { label: "7 derniers jours", start: n => new Date(n.getTime() - 6 * 86400000) },
  { label: "30 derniers jours", start: n => new Date(n.getTime() - 29 * 86400000) },
  { label: "365 derniers jours", start: n => new Date(n.getTime() - 364 * 86400000) }
];
const presetPeriod: Record<string, WeatherPeriod> = { "Aujourd’hui":"day", "Hier":"day", "Cette semaine":"week", "Ce mois-ci":"month", "Ce trimestre":"month", "Cette année":"year", "7 derniers jours":"week", "30 derniers jours":"month", "365 derniers jours":"year" };
const isoDate = (date: Date) => date.toISOString().slice(0, 10);

class WeatherStationPeriodSelector extends HTMLElement {
  private config: Required<PeriodSelectorConfig> = { collection_key: "default" };
  private selection: PeriodSelection = weatherPeriodStore.getSelection("default");
  private pickerOpen = false;
  private unsubscribe?: () => void;
  setConfig(config: PeriodSelectorConfig): void { this.config = { collection_key: config.collection_key ?? "default" }; this.unsubscribe?.(); this.unsubscribe = weatherPeriodStore.subscribeSelection(this.config.collection_key, selection => { this.selection = selection; this.render(); }); }
  connectedCallback(): void { this.render(); }
  disconnectedCallback(): void { this.unsubscribe?.(); this.unsubscribe = undefined; }
  getCardSize(): number { return 1; }
  private rangeLabel(): string { const f = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }); return `${f.format(this.selection.start)} – ${f.format(this.selection.end)}`; }
  private openPicker(): void { this.pickerOpen = true; this.render(); }
  private selectRange(start: Date, end: Date, period?: WeatherPeriod): void { this.pickerOpen = false; weatherPeriodStore.setRange(this.config.collection_key, start, end, period); }

  private render(): void {
    const root = this.shadowRoot ?? this.attachShadow({ mode: "open" }); root.replaceChildren();
    const card = document.createElement("ha-card"); card.className = "toolbar";
    const calendar = document.createElement("button"); calendar.className = "calendar"; calendar.setAttribute("aria-label", "Choisir la période"); calendar.innerHTML = '<ha-icon icon="mdi:calendar"></ha-icon>'; calendar.addEventListener("click", () => this.openPicker());
    const block = document.createElement("div"); const date = document.createElement("div"); date.className = "dates"; date.textContent = this.rangeLabel(); const subtitle = document.createElement("div"); subtitle.className = "subtitle"; subtitle.textContent = labels[this.selection.period]; block.append(date, subtitle);
    const now = document.createElement("button"); now.className = "now"; now.textContent = "Maintenant"; now.addEventListener("click", () => weatherPeriodStore.goToNow(this.config.collection_key));
    const previous = document.createElement("button"); previous.className = "icon"; previous.textContent = "‹"; previous.setAttribute("aria-label", "Période précédente"); previous.addEventListener("click", () => weatherPeriodStore.shift(this.config.collection_key, -1));
    const next = document.createElement("button"); next.className = "icon"; next.textContent = "›"; next.setAttribute("aria-label", "Période suivante"); next.addEventListener("click", () => weatherPeriodStore.shift(this.config.collection_key, 1));
    const more = document.createElement("button"); more.className = "icon"; more.textContent = "⋮"; more.setAttribute("aria-label", "Choisir la période"); more.addEventListener("click", () => this.openPicker());
    card.append(calendar, block, now, previous, next, more);
    const style = document.createElement("style"); style.textContent = `:host{display:block}.toolbar{min-height:56px;padding:0 12px;display:flex;align-items:center;gap:10px}.calendar,.icon{border:0;background:transparent;color:var(--primary-text-color);font:inherit;cursor:pointer}.calendar ha-icon{--mdc-icon-size:23px}.dates{font-weight:600;white-space:nowrap}.subtitle{font-size:.78rem;color:var(--secondary-text-color)}.now{margin-left:auto;border:0;border-radius:20px;padding:9px 14px;background:color-mix(in srgb,var(--primary-color) 14%,transparent);color:var(--primary-color);font:inherit;font-weight:600;cursor:pointer}.icon{font-size:30px;width:30px}.backdrop{position:fixed;z-index:99;inset:0;background:#0004;display:grid;place-items:center}.picker{width:min(760px,94vw);min-height:410px;background:var(--card-background-color);border-radius:20px;box-shadow:0 12px 35px #0006;display:grid;grid-template-columns:210px 1fr;overflow:hidden}.presets{padding:14px;border-right:1px solid var(--divider-color);display:flex;flex-direction:column;gap:2px}.presets button{border:0;background:transparent;color:var(--primary-text-color);font:inherit;text-align:left;padding:10px;border-radius:8px;cursor:pointer}.presets button:hover{background:color-mix(in srgb,var(--primary-color) 12%,transparent)}.form{padding:28px;display:flex;flex-direction:column;gap:20px}.form h3{margin:0}.fields{display:grid;grid-template-columns:1fr 1fr;gap:12px}.fields label{display:flex;flex-direction:column;gap:6px;color:var(--secondary-text-color);font-size:.85rem}.fields input{font:inherit;padding:10px;border:1px solid var(--divider-color);border-radius:8px;color:var(--primary-text-color);background:var(--card-background-color)}.actions{margin-top:auto;display:flex;justify-content:flex-end;gap:12px}.actions button{border:0;border-radius:22px;padding:10px 16px;font:inherit;cursor:pointer}.apply{background:var(--primary-color);color:var(--text-primary-color)}@media(max-width:600px){.picker{grid-template-columns:1fr;max-height:90vh;overflow:auto}.presets{border-right:0;border-bottom:1px solid var(--divider-color);display:grid;grid-template-columns:1fr 1fr}.dates{font-size:.92rem}.now{padding:8px}.icon{width:25px}}`;
    root.append(style, card); if (this.pickerOpen) this.renderPicker(root);
  }

  private renderPicker(root: ShadowRoot): void {
    const backdrop = document.createElement("div"); backdrop.className = "backdrop"; const picker = document.createElement("div"); picker.className = "picker"; picker.addEventListener("click", event => event.stopPropagation());
    const list = document.createElement("div"); list.className = "presets"; presets.forEach(preset => { const button = document.createElement("button"); button.textContent = preset.label; button.addEventListener("click", () => { const now = new Date(); const start = preset.start(now); const end = preset.label === "Hier" ? new Date(now.getFullYear(), now.getMonth(), now.getDate()) : now; this.selectRange(start, end, presetPeriod[preset.label]); }); list.append(button); });
    const form = document.createElement("div"); form.className = "form"; const title = document.createElement("h3"); title.textContent = "Sélectionner une période"; const fields = document.createElement("div"); fields.className = "fields"; const start = document.createElement("input"); start.type = "date"; start.value = isoDate(this.selection.start); const end = document.createElement("input"); end.type = "date"; end.value = isoDate(this.selection.end); for (const [label, input] of [["Du", start], ["Au", end]] as const) { const wrapper=document.createElement("label"); wrapper.textContent=label; wrapper.append(input); fields.append(wrapper); }
    const actions = document.createElement("div"); actions.className = "actions"; const cancel=document.createElement("button"); cancel.textContent="Annuler"; cancel.addEventListener("click",()=>{this.pickerOpen=false;this.render();}); const apply=document.createElement("button"); apply.className="apply";apply.textContent="Sélectionner";apply.addEventListener("click",()=>{const from=new Date(`${start.value}T00:00:00`),to=new Date(`${end.value}T23:59:59`);if(!Number.isNaN(from.getTime())&&!Number.isNaN(to.getTime())&&from<=to)this.selectRange(from,to);}); actions.append(cancel,apply); form.append(title,fields,actions); picker.append(list,form); backdrop.append(picker); backdrop.addEventListener("click",()=>{this.pickerOpen=false;this.render();}); root.append(backdrop);
  }
}
if (!customElements.get("weather-station-period-selector")) customElements.define("weather-station-period-selector", WeatherStationPeriodSelector);
declare global { interface HTMLElementTagNameMap { "weather-station-period-selector": WeatherStationPeriodSelector; } }
