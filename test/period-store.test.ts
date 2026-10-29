import { describe, expect, it } from "vitest";
import { PeriodStore } from "../src/period-store.js";

describe("PeriodStore", () => {
  it("shares a selected period with every subscriber using the same collection key", () => {
    const store = new PeriodStore(() => new Date("2026-10-29T12:00:00.000Z"));
    const observed: string[] = [];

    store.subscribe("station-jardin", (period) => observed.push(period));
    store.setPeriod("station-jardin", "week");

    expect(observed).toEqual(["day", "week"]);
    expect(store.getPeriod("station-jardin")).toBe("week");
  });

  it("preserves the requested weekly scale for a partial current week", () => {
    const store = new PeriodStore(() => new Date("2026-10-29T12:00:00.000Z"));
    store.setRange("station-jardin", new Date("2026-10-26T00:00:00.000Z"), new Date("2026-10-29T12:00:00.000Z"), "week");
    store.shift("station-jardin", -1);
    expect(store.getSelection("station-jardin").period).toBe("week");
    expect(store.getSelection("station-jardin").start.toISOString()).toBe("2026-10-19T00:00:00.000Z");
  });
});
