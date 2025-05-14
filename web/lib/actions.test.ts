import { describe, test, expect } from "vitest";
import {
  Action,
  Actions,
  collapseUndoRedoCombos,
  derivePixelsFromActions,
  deriveUnsetPixelsFromActions,
  getActionToRedo,
  getActionToUndo,
  resolveActions,
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
  { canvasX: 4, canvasY: 4, camera },
  { canvasX: 5, canvasY: 5, camera },
  { canvasX: 6, canvasY: 6, camera },
];
const points7to9 = [
  { canvasX: 7, canvasY: 7, camera },
  { canvasX: 8, canvasY: 8, camera },
  { canvasX: 9, canvasY: 9, camera },
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
    expect(resolveActions(arr)).toEqual([Actions.brush(points1to3, 1)]);
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
    expect(resolveActions(arr)).toEqual([
      Actions.brush(points1to3, 1),
      Actions.brush(points4to6, 1),
    ]);
  });

  describe("getActionToUndo", () => {
    test("happy path", () => {
      const arr: Action[] = [
        Actions.brush(points1to3, 1),
        Actions.brush(points4to6, 1),
        Actions.undo(),
      ];

      expect(getActionToUndo(arr)).toEqual(Actions.brush(points1to3, 1));
    });

    test("null when all actions are undone", () => {
      const arr: Action[] = [
        Actions.brush(points1to3, 1),
        Actions.brush(points4to6, 1),
        Actions.undo(),
        Actions.undo(),
      ];

      expect(getActionToUndo(arr)).toBeNull();
    });

    test("works through collapsed values", () => {
      const arr: Action[] = [
        Actions.brush(points1to3, 1),
        Actions.brush(points4to6, 1),
        Actions.undo(),
        Actions.redo(),
      ];

      expect(getActionToUndo(arr)).toEqual(Actions.brush(points4to6, 1));
    });
  });
  describe("getActionToRedo", () => {
    test("happy path", () => {
      const arr: Action[] = [
        Actions.brush(points1to3, 1),
        Actions.brush(points4to6, 1),
        Actions.undo(),
      ];

      expect(getActionToRedo(arr)).toEqual(Actions.brush(points4to6, 1));
    });

    test("null when all actions are undone", () => {
      const arr: Action[] = [
        Actions.brush(points1to3, 1),
        Actions.brush(points4to6, 1),
        Actions.undo(),
        Actions.undo(),
      ];

      expect(getActionToRedo(arr)).toEqual(Actions.brush(points1to3, 1));
    });

    test("works through collapsed values", () => {
      const arr: Action[] = [
        Actions.brush(points1to3, 1),
        Actions.brush(points4to6, 1),
        Actions.undo(),
        Actions.redo(),
      ];

      expect(getActionToRedo(arr)).toBeNull();
    });
  });

  describe("collapseUndoRedoCombos", () => {
    test("happy path", () => {
      const arr: Action[] = [
        Actions.undo(),
        Actions.brush(points1to3, 1),
        Actions.brush(points4to6, 1),
        Actions.undo(),
        Actions.redo(),
        Actions.undo(),
      ];

      expect(collapseUndoRedoCombos(arr)).toEqual([
        Actions.undo(),
        Actions.brush(points1to3, 1),
        Actions.brush(points4to6, 1),
        Actions.undo(),
      ]);
    });
    test("undo/redo pyramid", () => {
      const arr: Action[] = [
        Actions.undo(),
        Actions.brush(points1to3, 1),
        Actions.brush(points4to6, 1),
        Actions.brush(points7to9, 1),
        Actions.undo(),
        Actions.undo(),
        Actions.undo(),
        Actions.redo(),
        Actions.redo(),
        Actions.redo(),
      ];

      expect(collapseUndoRedoCombos(arr)).toEqual([
        Actions.undo(),
        Actions.brush(points1to3, 1),
        Actions.brush(points4to6, 1),
        Actions.brush(points7to9, 1),
      ]);
    });
  });
});
