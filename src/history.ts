import type { WeatherPeriod } from "./period-store.js";

export interface HistorySample {
  s: string;
  lu?: number;
  lc?: number;
}

export interface HistoryPoint {
  time: number;
  value: number;
}

export function historyPoints(samples: HistorySample[]): HistoryPoint[] {
  return samples.flatMap((sample) => {
    const value = Number(sample.s);
    const seconds = sample.lu ?? sample.lc;
    return Number.isFinite(value) && typeof seconds === "number" ? [{ time: seconds * 1000, value }] : [];
  });
}

export function periodStart(period: WeatherPeriod, now = new Date()): Date {
  const days: Record<WeatherPeriod, number> = { day: 1, week: 7, month: 31, year: 365 };
  return new Date(now.getTime() - days[period] * 24 * 60 * 60 * 1000);
}
