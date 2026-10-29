import { describe, expect, it } from "vitest";
import { historyPoints, periodStart } from "../src/history.js";

describe("history helpers", () => {
  it("keeps numeric history samples and returns their timestamps", () => {
    const points = historyPoints([
      { s: "unavailable", lu: 10 },
      { s: "10.4", lu: 20 },
      { s: "11", lu: 30 }
    ]);

    expect(points).toEqual([{ time: 20_000, value: 10.4 }, { time: 30_000, value: 11 }]);
  });

  it("maps the shared week selection to a start seven days ago", () => {
    const now = new Date("2026-10-29T12:00:00.000Z");
    expect(periodStart("week", now).toISOString()).toBe("2026-10-22T12:00:00.000Z");
  });
});
