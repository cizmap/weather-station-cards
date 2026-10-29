import { historyPoints, periodStart, rainBars, type RainBar, type HistorySample } from "./history.js";
import { weatherPeriodStore, type WeatherPeriod } from "./period-store.js";

interface HomeAssistant { states: Record<string, { state: string; attributes: Record<string, unknown> }>; callWS(message: Record<string, unknown>): Promise<Record<string, HistorySample[]>>; }
interface RainChartConfig { entity: string; collection_key?: string; title?: string; }
const labels: Record<WeatherPeriod, string> = { day: "24 h", week: "7 jours", month: "31 jours", quarter: "trimestre", year: "1 an" };

class WeatherStationRainChart extends HTMLElement {
  private config?: RainChartConfig; private hassValue?: HomeAssistant; private bars: RainBar[]=[]; private period: WeatherPeriod="day"; private selection=weatherPeriodStore.getSelection("default"); private unsubscribe?:()=>void; private loading=false;
  set hass(value: HomeAssistant){
    const initialConnection=!this.hassValue;
    this.hassValue=value;
    if(initialConnection) void this.refresh();
  }
  setConfig(config: RainChartConfig){if(!config.entity)throw new Error("entity is required");this.config=config;this.unsubscribe?.();this.unsubscribe=weatherPeriodStore.subscribeSelection(config.collection_key??"default",selection=>{this.period=selection.period;this.selection=selection;void this.refresh();});}
  disconnectedCallback(){this.unsubscribe?.();}
  getCardSize(){return 3;}
  private async refresh(){if(!this.hassValue||!this.config||this.loading)return;this.loading=true;this.render();try{const history=await this.hassValue.callWS({type:"history/history_during_period",start_time:this.selection.start.toISOString(),end_time:this.selection.end.toISOString(),entity_ids:[this.config.entity],minimal_response:true,no_attributes:true});this.bars=rainBars(historyPoints(history[this.config.entity]??[]));}catch{this.bars=[];}finally{this.loading=false;this.render();}}
  private render(){const root=this.shadowRoot??this.attachShadow({mode:"open"});root.replaceChildren();const card=document.createElement("ha-card");const title=document.createElement("div");title.className="title";title.textContent=`${this.config?.title??"Pluie"} · ${labels[this.period]}`;const graph=this.graph();const style=document.createElement("style");style.textContent=":host{display:block}ha-card{padding:16px}.title{color:var(--secondary-text-color);font-size:.9rem;margin-bottom:10px}svg{display:block;width:100%;height:150px}.bar{fill:#2196f3}.grid{stroke:var(--divider-color);stroke-width:1}.empty{fill:var(--secondary-text-color);font-size:14px}";card.append(title,graph);root.append(style,card);}
  private graph(){const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 320 150");if(this.loading||!this.bars.length){const text=document.createElementNS(svg.namespaceURI,"text");text.setAttribute("x","12");text.setAttribute("y","75");text.setAttribute("class","empty");text.textContent=this.loading?"Chargement…":"Pas de pluie enregistrée";svg.append(text);return svg;}const max=Math.max(...this.bars.map(b=>b.value),.1),width=312/this.bars.length;[30,75,120].forEach(y=>{const line=document.createElementNS(svg.namespaceURI,"line");line.setAttribute("x1","0");line.setAttribute("x2","320");line.setAttribute("y1",String(y));line.setAttribute("y2",String(y));line.setAttribute("class","grid");svg.append(line);});this.bars.forEach((bar,index)=>{const rect=document.createElementNS(svg.namespaceURI,"rect");const h=110*bar.value/max;rect.setAttribute("x",String(4+index*width));rect.setAttribute("y",String(125-h));rect.setAttribute("width",String(Math.max(2,width-2)));rect.setAttribute("height",String(h));rect.setAttribute("rx","2");rect.setAttribute("class","bar");const title=document.createElementNS(svg.namespaceURI,"title");title.textContent=`${bar.label}: ${bar.value.toFixed(1)} mm`;rect.append(title);svg.append(rect);});return svg;}
}
if(!customElements.get("weather-station-rain-chart"))customElements.define("weather-station-rain-chart",WeatherStationRainChart);
