import { describe, test, expect } from "vitest";
import {
  Action,
  Actions,
  derivePixelsFromActions,
  deriveUnsetPixelsFromActions,
} from "./actions";
import { Camera } from "./store";
import { pointsToPixels } from "./tools/brush";

const testingCamera: Camera = { x: 0, y: 0, zoom: 100 };
const camera = testingCamera;

const points1to3 = [
  { canvasX: 1, canvasY: 1, camera },
  { canvasX: 2, canvasY: 2, camera },
  { canvasX: 3, canvasY: 3, camera },
];
const points4to6 = [
  { canvasX: 1, canvasY: 1, camera },
  { canvasX: 2, canvasY: 2, camera },
  { canvasX: 3, canvasY: 3, camera },
];

describe("actions", () => {
  test("brushing and undoing unsets pixels", () => {
    const arr: Action[] = [
      Actions.brush(points1to3, 1),
      Actions.brush(points4to6, 1),
      Actions.undo(),
    ];

    expect(derivePixelsFromActions(arr)).toEqual(pointsToPixels(points1to3, 1));
    expect(deriveUnsetPixelsFromActions(arr)).toEqual(
      pointsToPixels(points4to6, 1),
    );
  });
  test("brushing and undoing and redoing doesn't unset pixels", () => {
    const arr: Action[] = [
      Actions.brush(points1to3, 1),
      Actions.brush(points4to6, 1),
      Actions.undo(),
      Actions.redo(),
    ];

    expect(derivePixelsFromActions(arr)).toEqual([
      ...pointsToPixels(points1to3, 1),
      ...pointsToPixels(points4to6, 1),
    ]);
    expect(deriveUnsetPixelsFromActions(arr)).toEqual([]);
  });
});
