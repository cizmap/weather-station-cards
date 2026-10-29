export type WeatherPeriod = "day" | "week" | "month" | "quarter" | "year";
export interface PeriodSelection { period: WeatherPeriod; start: Date; end: Date; }
type PeriodListener = (period: WeatherPeriod) => void;
type SelectionListener = (selection: PeriodSelection) => void;
const milliseconds: Record<WeatherPeriod, number> = { day: 86400000, week: 7 * 86400000, month: 31 * 86400000, quarter: 92 * 86400000, year: 365 * 86400000 };

export class PeriodStore {
  private readonly selections = new Map<string, PeriodSelection>();
  private readonly listeners = new Map<string, Set<PeriodListener>>();
  private readonly selectionListeners = new Map<string, Set<SelectionListener>>();
  constructor(private readonly now: () => Date = () => new Date()) {}

  getPeriod(collectionKey: string): WeatherPeriod { return this.getSelection(collectionKey).period; }
  getSelection(collectionKey: string): PeriodSelection {
    const selection = this.selections.get(collectionKey);
    return selection ? { ...selection, start: new Date(selection.start), end: new Date(selection.end) } : this.forPeriod("day", this.now());
  }
  setPeriod(collectionKey: string, period: WeatherPeriod): void { this.publish(collectionKey, this.forPeriod(period, this.now())); }
  goToNow(collectionKey: string): void { this.setPeriod(collectionKey, this.getPeriod(collectionKey)); }
  shift(collectionKey: string, direction: -1 | 1): void {
    const current = this.getSelection(collectionKey);
    const delta = milliseconds[current.period];
    if (direction < 0) {
      const end = new Date(current.start);
      this.publish(collectionKey, { period: current.period, start: new Date(end.getTime() - delta), end });
      return;
    }
    if (current.end.getTime() + delta >= this.now().getTime()) { this.goToNow(collectionKey); return; }
    const start = new Date(current.end);
    this.publish(collectionKey, { period: current.period, start, end: new Date(start.getTime() + delta) });
  }
  setRange(collectionKey: string, start: Date, end: Date, forcedPeriod?: WeatherPeriod): void {
    const duration = Math.max(1, end.getTime() - start.getTime());
    const period = forcedPeriod ?? Object.entries(milliseconds).reduce((closest, [name, size]) => Math.abs(size - duration) < Math.abs(milliseconds[closest] - duration) ? name as WeatherPeriod : closest, "day" as WeatherPeriod);
    this.publish(collectionKey, { period, start: new Date(start), end: new Date(end) });
  }
  subscribe(collectionKey: string, listener: PeriodListener): () => void {
    const listeners = this.listeners.get(collectionKey) ?? new Set<PeriodListener>(); listeners.add(listener); this.listeners.set(collectionKey, listeners); listener(this.getPeriod(collectionKey)); return () => listeners.delete(listener);
  }
  subscribeSelection(collectionKey: string, listener: SelectionListener): () => void {
    const listeners = this.selectionListeners.get(collectionKey) ?? new Set<SelectionListener>(); listeners.add(listener); this.selectionListeners.set(collectionKey, listeners); listener(this.getSelection(collectionKey)); return () => listeners.delete(listener);
  }
  private forPeriod(period: WeatherPeriod, end: Date): PeriodSelection {
    const endCopy = new Date(end);
    const start = new Date(end);
    start.setUTCHours(0, 0, 0, 0);
    if (period === "week") start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
    if (period === "month") start.setUTCDate(1);
    if (period === "quarter") { start.setUTCMonth(Math.floor(start.getUTCMonth() / 3) * 3, 1); }
    if (period === "year") { start.setUTCMonth(0, 1); }
    const calendarEnd = new Date(start);
    if (period === "day") calendarEnd.setUTCDate(calendarEnd.getUTCDate() + 1);
    if (period === "week") calendarEnd.setUTCDate(calendarEnd.getUTCDate() + 7);
    if (period === "month") calendarEnd.setUTCMonth(calendarEnd.getUTCMonth() + 1);
    if (period === "quarter") calendarEnd.setUTCMonth(calendarEnd.getUTCMonth() + 3);
    if (period === "year") calendarEnd.setUTCFullYear(calendarEnd.getUTCFullYear() + 1);
    calendarEnd.setTime(calendarEnd.getTime() - 1);
    return { period, start, end: calendarEnd };
  }
  private publish(collectionKey: string, selection: PeriodSelection): void { this.selections.set(collectionKey, selection); for(const listener of this.listeners.get(collectionKey)??[])listener(selection.period); for(const listener of this.selectionListeners.get(collectionKey)??[])listener(this.getSelection(collectionKey)); }
}
export const weatherPeriodStore = new PeriodStore();
