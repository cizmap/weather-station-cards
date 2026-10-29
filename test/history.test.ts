import { describe, expect, it } from "vitest";
import { downsample, historyPoints, periodStart, rainBars, windRoseBins } from "../src/history.js";

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

  it("groups wind headings into eight cardinal bins", () => {
    const bins = windRoseBins([{ time: 1, value: 359 }, { time: 2, value: 4 }, { time: 3, value: 90 }]);
    expect(bins).toEqual([2, 0, 1, 0, 0, 0, 0, 0]);
  });
});
