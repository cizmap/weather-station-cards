import { afterEach, describe, expect, it } from "vitest";
import { weatherPeriodStore } from "../src/period-store.js";
import "../src/weather-station-period-selector.js";

describe("weather-station-period-selector", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("publishes the selected period to its collection key", () => {
    const card = document.createElement("weather-station-period-selector") as HTMLElement & {
      setConfig(config: { collection_key: string }): void;
    };
    card.setConfig({ collection_key: "jardin" });
    document.body.append(card);

    const week = [...card.shadowRoot!.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "Semaine");
    week!.click();

    expect(weatherPeriodStore.getPeriod("jardin")).toBe("week");

    const now = [...card.shadowRoot!.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "Maintenant");
    now!.click();
    expect(weatherPeriodStore.getPeriod("jardin")).toBe("day");
  });
});
