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

export interface RainBar {
  label: string;
  time: number;
  value: number;
}

export function rainBars(points: HistoryPoint[]): RainBar[] {
  const grouped = new Map<string, RainBar>();
  for (const point of points) {
    const label = new Date(point.time).toLocaleDateString("sv-SE");
    const existing = grouped.get(label);
    if (!existing || point.value > existing.value) grouped.set(label, { label, time: point.time, value: point.value });
  }
  return [...grouped.values()];
}

export function downsample(points: HistoryPoint[], maximum: number): HistoryPoint[] {
  if (points.length <= maximum || maximum < 3) return points;
  return Array.from({ length: maximum }, (_, index) => points[Math.round(index * (points.length - 1) / (maximum - 1))]);
}

export function periodStart(period: WeatherPeriod, now = new Date()): Date {
  const days: Record<WeatherPeriod, number> = { day: 1, week: 7, month: 31, year: 365 };
  return new Date(now.getTime() - days[period] * 24 * 60 * 60 * 1000);
}
