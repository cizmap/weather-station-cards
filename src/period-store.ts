export type WeatherPeriod = "day" | "week" | "month" | "year";
export interface PeriodSelection { period: WeatherPeriod; start: Date; end: Date; }
type PeriodListener = (period: WeatherPeriod) => void;
type SelectionListener = (selection: PeriodSelection) => void;
const milliseconds: Record<WeatherPeriod, number> = { day: 86400000, week: 7 * 86400000, month: 31 * 86400000, year: 365 * 86400000 };

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
    const candidateEnd = new Date(current.end.getTime() + direction * delta);
    const end = candidateEnd > this.now() ? this.now() : candidateEnd;
    this.publish(collectionKey, { period: current.period, start: new Date(end.getTime() - delta), end });
  }
  setRange(collectionKey: string, start: Date, end: Date): void {
    const duration = Math.max(1, end.getTime() - start.getTime());
    const period = (Object.entries(milliseconds).reduce((closest, [name, size]) => Math.abs(size - duration) < Math.abs(milliseconds[closest] - duration) ? name as WeatherPeriod : closest, "day" as WeatherPeriod));
    this.publish(collectionKey, { period, start: new Date(start), end: new Date(end) });
  }
  subscribe(collectionKey: string, listener: PeriodListener): () => void {
    const listeners = this.listeners.get(collectionKey) ?? new Set<PeriodListener>(); listeners.add(listener); this.listeners.set(collectionKey, listeners); listener(this.getPeriod(collectionKey)); return () => listeners.delete(listener);
  }
  subscribeSelection(collectionKey: string, listener: SelectionListener): () => void {
    const listeners = this.selectionListeners.get(collectionKey) ?? new Set<SelectionListener>(); listeners.add(listener); this.selectionListeners.set(collectionKey, listeners); listener(this.getSelection(collectionKey)); return () => listeners.delete(listener);
  }
  private forPeriod(period: WeatherPeriod, end: Date): PeriodSelection { const endCopy=new Date(end); return { period, end:endCopy, start:new Date(endCopy.getTime()-milliseconds[period]) }; }
  private publish(collectionKey: string, selection: PeriodSelection): void { this.selections.set(collectionKey, selection); for(const listener of this.listeners.get(collectionKey)??[])listener(selection.period); for(const listener of this.selectionListeners.get(collectionKey)??[])listener(this.getSelection(collectionKey)); }
}
export const weatherPeriodStore = new PeriodStore();
