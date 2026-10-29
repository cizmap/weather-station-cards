import { describe, expect, it } from "vitest";
import { PeriodStore } from "../src/period-store.js";

describe("PeriodStore", () => {
  it("shares a selected period with every subscriber using the same collection key", () => {
    const store = new PeriodStore();
    const observed: string[] = [];

    store.subscribe("station-jardin", (period) => observed.push(period));
    store.setPeriod("station-jardin", "week");

    expect(observed).toEqual(["day", "week"]);
    expect(store.getPeriod("station-jardin")).toBe("week");
  });
});
