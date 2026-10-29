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

    const menu = [...card.shadowRoot!.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.getAttribute("aria-label") === "Choisir la période");
    menu!.click();
    expect(card.shadowRoot!.textContent).toContain("Aujourd’hui");
  });
});
