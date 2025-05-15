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
import { pointsToPixels } from "./tools/brush";
import { Camera } from "./camera";

const testingCamera: Camera = { x: 0, y: 0, zoom: 100 };
const camera = testingCamera;

const points1to3 = [
  { x: 1, y: 1, camera },
  { x: 2, y: 2, camera },
  { x: 3, y: 3, camera },
];
const points4to6 = [
  { x: 4, y: 4, camera },
  { x: 5, y: 5, camera },
  { x: 6, y: 6, camera },
];
const points7to9 = [
  { x: 7, y: 7, camera },
  { x: 8, y: 8, camera },
  { x: 9, y: 9, camera },
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
