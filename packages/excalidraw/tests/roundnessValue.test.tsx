import React from "react";

import { ROUNDNESS } from "@excalidraw/common";

import {
  actionChangeRoundness,
  actionChangeRoundnessValue,
} from "../actions/actionProperties";
import { restoreElements } from "../data/restore";
import { Excalidraw } from "../index";

import { API } from "./helpers/api";
import { UI } from "./helpers/ui";
import { act, render } from "./test-utils";

import type { Action } from "../actions/types";

const { h } = window;

// [lukis] The "Radius" slider under "Edges".
describe("corner radius slider", () => {
  beforeEach(async () => {
    await render(<Excalidraw handleKeyboardGlobally={true} />);
  });

  const run = (action: Action, value: unknown) =>
    act(() => {
      h.app.actionManager.executeAction(action, "ui", value as any);
    });
  const slider = () =>
    document.querySelector('[data-testid="roundness-value"]');

  it("sets the radius of selected round shapes, and survives restore", () => {
    const rect = API.createElement({
      type: "rectangle",
      width: 200,
      height: 100,
      roundness: { type: ROUNDNESS.ADAPTIVE_RADIUS },
    });
    const line = API.createElement({
      type: "line",
      roundness: { type: ROUNDNESS.PROPORTIONAL_RADIUS },
    });
    API.setElements([rect, line]);
    API.setSelectedElements([rect, line]);

    run(actionChangeRoundnessValue, 40);

    const [nextRect, nextLine] = h.elements;
    expect(nextRect.roundness).toEqual({
      type: ROUNDNESS.ADAPTIVE_RADIUS,
      value: 40,
    });
    expect(nextRect.version).toBeGreaterThan(rect.version);
    // Lines have no radius to set.
    expect(nextLine.roundness).toEqual({ type: ROUNDNESS.PROPORTIONAL_RADIUS });
    expect(h.state.currentItemRoundnessValue).toBe(40);

    const [restored] = restoreElements([nextRect], null);
    expect(restored.roundness).toEqual({
      type: ROUNDNESS.ADAPTIVE_RADIUS,
      value: 40,
    });
  });

  it("only shows for round shapes that can take a radius", () => {
    const rect = API.createElement({ type: "rectangle", roundness: null });
    API.setElements([rect]);
    API.setSelectedElements([rect]);
    expect(slider()).toBeNull();

    run(actionChangeRoundness, "round");
    expect(slider()).not.toBeNull();

    const ellipse = API.createElement({ type: "ellipse" });
    API.setElements([ellipse]);
    API.setSelectedElements([ellipse]);
    expect(slider()).toBeNull();
  });

  it("keeps the radius when a shape is made sharp and round again", () => {
    const rect = API.createElement({
      type: "rectangle",
      roundness: { type: ROUNDNESS.ADAPTIVE_RADIUS },
    });
    API.setElements([rect]);
    API.setSelectedElements([rect]);

    run(actionChangeRoundnessValue, 16);
    run(actionChangeRoundness, "sharp");
    expect(h.elements[0].roundness).toBeNull();
    run(actionChangeRoundness, "round");
    expect(h.elements[0].roundness).toEqual({
      type: ROUNDNESS.ADAPTIVE_RADIUS,
      value: 16,
    });
  });

  it("gives new shapes the last radius picked", () => {
    API.setAppState({
      currentItemRoundness: "round",
      currentItemRoundnessValue: 24,
    });

    const rect = UI.createElement("rectangle", { size: 100 });
    const diamond = UI.createElement("diamond", { x: 200, size: 100 });
    const arrow = UI.createElement("arrow", { x: 400, size: 100 });

    expect(rect.get().roundness).toEqual({
      type: ROUNDNESS.ADAPTIVE_RADIUS,
      value: 24,
    });
    expect(diamond.get().roundness).toEqual({
      type: ROUNDNESS.PROPORTIONAL_RADIUS,
      value: 24,
    });
    expect(arrow.get().roundness?.value).toBeUndefined();
  });
});
