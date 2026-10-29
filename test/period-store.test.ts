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

  it("moves a period backwards and restores it with now", () => {
    const store = new PeriodStore(() => new Date("2026-10-29T12:00:00.000Z"));
    store.setPeriod("station-jardin", "week");
    store.shift("station-jardin", -1);

    const previous = store.getSelection("station-jardin");
    expect(previous.start.toISOString()).toBe("2026-10-19T00:00:00.000Z");
    expect(previous.end.toISOString()).toBe("2026-10-26T00:00:00.000Z");

    store.goToNow("station-jardin");
    expect(store.getSelection("station-jardin").end.toISOString()).toBe("2026-10-29T12:00:00.000Z");
  });
});
