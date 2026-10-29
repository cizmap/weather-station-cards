import "./weather-station-period-selector.js";
import "./weather-station-chart.js";
import "./weather-station-rain-summary.js";
import "./weather-station-rain-chart.js";
import "./weather-station-wind-compass.js";
import "./weather-station-wind-rose.js";

interface DashboardConfig { collection_key?: string; temperature_entity: string; humidity_entity: string; solar_entity: string; rain_daily_entity: string; rain_weekly_entity: string; rain_monthly_entity: string; rain_yearly_entity: string; wind_direction_entity: string; wind_speed_entity: string; wind_gust_entity: string; }

class WeatherStationDashboard extends HTMLElement {
  private config?: DashboardConfig;
  setConfig(config: DashboardConfig): void { this.config = { collection_key: "weather_station_main", ...config }; this.render(); }
  getCardSize(): number { return 12; }
  private card(tag: string, config: Record<string, unknown>, wide = false): HTMLElement { const card=document.createElement(tag) as HTMLElement & { setConfig?: (c: Record<string, unknown>)=>void }; card.setConfig?.({collection_key:this.config!.collection_key,...config}); if(wide)card.classList.add("wide"); return card; }
  private section(title: string, cards: HTMLElement[]): HTMLElement { const section=document.createElement("section"); const heading=document.createElement("h2"); heading.textContent=title; const grid=document.createElement("div"); grid.className="grid"; grid.append(...cards); section.append(heading,grid); return section; }
  private render(): void { if(!this.config)return; const c=this.config; const root=this.shadowRoot??this.attachShadow({mode:"open"}); root.replaceChildren(); const style=document.createElement("style"); style.textContent=`:host{display:block;max-width:1440px;margin:0 auto;padding:20px 24px 100px;box-sizing:border-box}h1{font-size:1.7rem;margin:0 0 28px}h2{font-size:1.05rem;margin:30px 0 12px;color:var(--secondary-text-color)}.grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px}.grid>*{grid-column:span 6}.grid>.wide{grid-column:1/-1}@media(max-width:800px){:host{padding:12px 12px 90px}.grid{grid-template-columns:1fr}.grid>*{grid-column:1}.grid>.wide{grid-column:1}}`;
    const title=document.createElement("h1"); title.textContent="Station météo";
    const summary=this.section("Aperçu",[this.card("weather-station-wind-compass",{title:"Vent",direction_entity:c.wind_direction_entity,speed_entity:c.wind_speed_entity,gust_entity:c.wind_gust_entity}),this.card("weather-station-rain-summary",{title:"Pluie",daily_entity:c.rain_daily_entity,weekly_entity:c.rain_weekly_entity,monthly_entity:c.rain_monthly_entity,yearly_entity:c.rain_yearly_entity})]);
    const wind=this.section("Vent & pluie",[this.card("weather-station-wind-rose",{title:"Rose des vents",entity:c.wind_direction_entity}),this.card("weather-station-rain-chart",{title:"Pluie par jour",entity:c.rain_daily_entity})]);
    const measures=this.section("Mesures",[this.card("weather-station-chart",{title:"Température extérieure",entity:c.temperature_entity,color:"#ef6c00"},true),this.card("weather-station-chart",{title:"Humidité extérieure",entity:c.humidity_entity,color:"#039be5"},true),this.card("weather-station-chart",{title:"Rayonnement solaire",entity:c.solar_entity,color:"#f9a825"},true)]);
    const selector=this.card("weather-station-period-selector",{fixed:true}); root.append(style,title,summary,wind,measures,selector);
  }
}
customElements.define("weather-station-dashboard",WeatherStationDashboard);
