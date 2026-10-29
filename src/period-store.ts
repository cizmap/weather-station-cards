export type WeatherPeriod = "day" | "week" | "month" | "year";

type PeriodListener = (period: WeatherPeriod) => void;

export class PeriodStore {
  private readonly periods = new Map<string, WeatherPeriod>();
  private readonly listeners = new Map<string, Set<PeriodListener>>();

  getPeriod(collectionKey: string): WeatherPeriod {
    return this.periods.get(collectionKey) ?? "day";
  }

  setPeriod(collectionKey: string, period: WeatherPeriod): void {
    this.periods.set(collectionKey, period);
    for (const listener of this.listeners.get(collectionKey) ?? []) {
      listener(period);
    }
  }

  subscribe(collectionKey: string, listener: PeriodListener): () => void {
    const listeners = this.listeners.get(collectionKey) ?? new Set<PeriodListener>();
    listeners.add(listener);
    this.listeners.set(collectionKey, listeners);
    listener(this.getPeriod(collectionKey));
    return () => listeners.delete(listener);
  }
}

export const weatherPeriodStore = new PeriodStore();
