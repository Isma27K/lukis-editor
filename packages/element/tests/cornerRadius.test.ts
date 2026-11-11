import { DEFAULT_ADAPTIVE_RADIUS, ROUNDNESS } from "@excalidraw/common";

import { API } from "@excalidraw/excalidraw/tests/helpers/api";

import { getCornerRadius, getDiamondCornerOffsets } from "../src/utils";

import type { ExcalidrawElement } from "../src/types";

// [lukis] An explicit `roundness.value` sets the corner radius exactly.
// API.createElement rebuilds `roundness` without its value, so it's set on
// the created element instead.
const withRoundness = <T extends ExcalidrawElement>(
  element: T,
  roundness: ExcalidrawElement["roundness"],
): T => ({ ...element, roundness });

describe("getCornerRadius", () => {
  const rectangle = withRoundness(
    API.createElement({ type: "rectangle", width: 200, height: 100 }),
    null,
  );
  const diamond = withRoundness(API.createElement({ type: "diamond" }), null);
  const line = withRoundness(API.createElement({ type: "line" }), null);

  it("keeps upstream's rounding without a value", () => {
    const adaptive = withRoundness(rectangle, {
      type: ROUNDNESS.ADAPTIVE_RADIUS,
    });
    // 32px once the side is past 128px, 25% of it below that.
    expect(getCornerRadius(200, adaptive)).toBe(DEFAULT_ADAPTIVE_RADIUS);
    expect(getCornerRadius(100, adaptive)).toBe(25);
    expect(getCornerRadius(40, adaptive)).toBe(10);
    expect(getCornerRadius(100, rectangle)).toBe(0);

    const roundDiamond = withRoundness(diamond, {
      type: ROUNDNESS.PROPORTIONAL_RADIUS,
    });
    expect(getCornerRadius(100, roundDiamond)).toBe(25);
  });

  it("uses the value, up to half the side", () => {
    const set = (value: number) =>
      withRoundness(rectangle, { type: ROUNDNESS.ADAPTIVE_RADIUS, value });
    expect(getCornerRadius(100, set(12))).toBe(12);
    // Upstream would cap this at 25% of the side.
    expect(getCornerRadius(100, set(45))).toBe(45);
    expect(getCornerRadius(100, set(500))).toBe(50);
    expect(getCornerRadius(100, set(0))).toBe(0);
    expect(getCornerRadius(100, set(-5))).toBe(0);
  });

  it("applies to diamonds but not to lines or legacy roundness", () => {
    expect(
      getCornerRadius(
        100,
        withRoundness(diamond, {
          type: ROUNDNESS.PROPORTIONAL_RADIUS,
          value: 30,
        }),
      ),
    ).toBe(30);
    expect(
      getCornerRadius(
        100,
        withRoundness(line, { type: ROUNDNESS.PROPORTIONAL_RADIUS, value: 30 }),
      ),
    ).toBe(25);
    expect(
      getCornerRadius(
        100,
        withRoundness(rectangle, { type: ROUNDNESS.LEGACY, value: 30 }),
      ),
    ).toBe(25);
  });
});

// [lukis] Diamonds take the radius along their edges.
describe("getDiamondCornerOffsets", () => {
  const diamond = withRoundness(API.createElement({ type: "diamond" }), null);
  const round = (value?: number) =>
    withRoundness(diamond, {
      type: ROUNDNESS.PROPORTIONAL_RADIUS,
      ...(value !== undefined && { value }),
    });

  it("keeps upstream's 25% of each half without a value", () => {
    expect(getDiamondCornerOffsets(round(), 120, 50)).toEqual([30, 12.5]);
  });

  it("splits the value by the edge's slope, so corners stay on the edge", () => {
    // A 3:4 diamond has edges of length 5 per unit.
    const [x, y] = getDiamondCornerOffsets(round(25), 60, 80);
    expect(x).toBeCloseTo(15);
    expect(y).toBeCloseTo(20);
    expect(x / y).toBeCloseTo(60 / 80);
  });

  it("caps at half the edge", () => {
    const [x, y] = getDiamondCornerOffsets(round(1000), 60, 80);
    expect(x).toBeCloseTo(30);
    expect(y).toBeCloseTo(40);
    expect(getDiamondCornerOffsets(round(10), 0, 0)).toEqual([0, 0]);
  });
});
