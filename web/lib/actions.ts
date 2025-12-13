import { ACTION_TYPES } from "./action-types";
import { getUniqueChunksFromPoints } from "./canvas/chunk";
import { bresenhamLine } from "./geometry/bresenham-line";
import { AbsolutePoint, Pixel } from "./geometry/coord";
import { AbsolutePointTuple, absolutePointTupleToPixels } from "./line";
import { ColorRef, TRANSPARENT_REF } from "./palette";
import { BrushActive, getBrushPoints, pointsToPixels } from "./tools/brush/brush";
import { BucketActive } from "./tools/bucket/bucket";
import {
  ClaimerComplete,
  ClaimerCreate,
  ClaimerEdit,
  ClaimerNewRectCreate,
  ClaimerNewRectEdit,
  ClaimerResizeCreate,
  ClaimerResizeEdit,
} from "./tools/claimer/claimer";
import { ErasureActive } from "./tools/erasure/erasure";
import { LineActive, LineComplete } from "./tools/line/line";

export type Undo = { type: "undo"; chunkKeys: string[] };
export type Redo = { type: "redo"; chunkKeys: string[] };

export type EditableAction = ErasureActive | BrushActive | LineComplete | BucketActive;

export function isEditableAction(action: Action): action is EditableAction {
  return (
    action.type === ACTION_TYPES.BRUSH_ACTIVE ||
    action.type === ACTION_TYPES.ERASURE_ACTIVE ||
    action.type === ACTION_TYPES.LINE_COMPLETE ||
    action.type === ACTION_TYPES.BUCKET_ACTIVE
  );
}

export type Action =
  | EditableAction
  | LineActive
  | ClaimerCreate
  | ClaimerNewRectCreate
  | ClaimerNewRectEdit
  | ClaimerComplete
  | ClaimerEdit
  | ClaimerResizeEdit
  | ClaimerResizeCreate
  | {
      type: "realtime-active";
      pixels: Pixel[];
      chunkKeys: string[];
    }
  | Undo
  | Redo;

function create_brush_fixture(points: AbsolutePoint[], color_ref: ColorRef): BrushActive {
  return {
    action_id: "00000000-0000-0000-0000-000000000000",
    type: ACTION_TYPES.BRUSH_ACTIVE,
    color_ref,
    points,
    //todo(josh): these shouldn't be faked like this, update the function
    anchorPoints: points,
    chunkKeys: getUniqueChunksFromPoints(points),
  };
}
function create_erase_fixture(points: AbsolutePoint[]): ErasureActive {
  return {
    action_id: "11111111-1111-1111-1111-111111111111",
    type: ACTION_TYPES.ERASURE_ACTIVE,
    points,
    //todo(josh): these shouldn't be faked like this, update the function
    anchorPoints: points,
    chunkKeys: getUniqueChunksFromPoints(points),
  };
}
function undo(chunkKeys?: string[]): Undo {
  return { type: "undo", chunkKeys: chunkKeys ?? [] };
}
function redo(chunkKeys?: string[]): Redo {
  return { type: "redo", chunkKeys: chunkKeys ?? [] };
}

function create_line_fixture(points: AbsolutePoint[], color_ref: ColorRef): LineComplete {
  return {
    type: ACTION_TYPES.LINE_COMPLETE,
    action_id: "22222222-2222-2222-2222-222222222222",
    color_ref,
    vector: {
      x: 0,
      y: 0,
      magnitudeX: 0,
      magnitudeY: 0,
      toDOMRect: () => new DOMRect(),
    },
    size: 1,
    chunkKeys: [],
    anchorPoints: points,
    points,
  };
}

function create_bucket_fixture(points: AbsolutePointTuple[], color_ref: ColorRef): BucketActive {
  return {
    type: ACTION_TYPES.BUCKET_ACTIVE,
    action_id: "33333333-3333-3333-3333-333333333333",
    color_ref,
    chunkKeys: [],
    points,
  };
}

export const Actions = {
  brush: create_brush_fixture,
  erase: create_erase_fixture,
  line: create_line_fixture,
  bucket: create_bucket_fixture,
  undo,
  redo,
};

/**
 * Find the pixels changes for a set of actions.
 */
export function derivePixelsFromActions(actions: Action[]): Pixel[] {
  let undoStack: Action[] = [];
  const completedActions: Action[] = [];
  const pixels: Pixel[] = [];

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    if (action.type === "redo") {
      const undoAction = undoStack.pop();

      if (undoAction != null) {
        completedActions.push(undoAction);
      }
    } else if (action.type === "undo") {
      const action = completedActions.pop();

      if (action != null) {
        undoStack.push(action);
      }
    } else {
      undoStack = [];
      completedActions.push(action);
    }
  }

  for (let i = 0; i < completedActions.length; i++) {
    const action = completedActions[i];

    if (action.type === ACTION_TYPES.BRUSH_ACTIVE) {
      pixels.push(...pointsToPixels(action.points, action.color_ref));
    } else if (action.type === ACTION_TYPES.ERASURE_ACTIVE) {
      pixels.push(...pointsToPixels(action.points, TRANSPARENT_REF));
    } else if (action.type === ACTION_TYPES.LINE_COMPLETE) {
      pixels.push(...pointsToPixels(action.points, action.color_ref));
    } else if (action.type === ACTION_TYPES.BUCKET_ACTIVE) {
      pixels.push(...absolutePointTupleToPixels(action.points, action.color_ref));
    } else if (action.type === "realtime-active") {
      pixels.push(...action.pixels);
    }
  }

  return pixels;
}

/**
 * Find the pixels set and unset for a set of actions
 */
export function deriveUnsetPixelsFromActions(actions: Action[]): Pixel[] {
  let undoStack: Action[] = [];
  const completedActions: Action[] = [];
  let unsetPixels: Pixel[] = [];

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    if (action.type === "redo") {
      const undoAction = undoStack.pop();

      if (undoAction != null) {
        completedActions.push(undoAction);

        if (
          undoAction.type === ACTION_TYPES.BRUSH_ACTIVE ||
          undoAction.type === ACTION_TYPES.ERASURE_ACTIVE
        ) {
          const undonePixels = pointsToPixels(
            undoAction.points,
            undoAction.type === ACTION_TYPES.ERASURE_ACTIVE
              ? TRANSPARENT_REF
              : undoAction.color_ref,
          );
          unsetPixels = unsetPixels.filter(
            (pixel) =>
              !undonePixels.find(
                (undonePixel) => undonePixel.x === pixel.x && undonePixel.y === pixel.y,
              ),
          );
        } else if (undoAction.type === ACTION_TYPES.LINE_COMPLETE) {
          const undoneLinePoints = bresenhamLine(
            undoAction.vector.x,
            undoAction.vector.y,
            undoAction.vector.x + undoAction.vector.magnitudeX,
            undoAction.vector.y + undoAction.vector.magnitudeY,
          );
          const undoneBrushPoints = getBrushPoints(undoneLinePoints, undoAction.size, 1);
          const undonePixels = pointsToPixels(undoneBrushPoints, undoAction.color_ref);
          unsetPixels = unsetPixels.filter(
            (pixel) =>
              !undonePixels.find(
                (undonePixel) => undonePixel.x === pixel.x && undonePixel.y === pixel.y,
              ),
          );
        } else if (undoAction.type === ACTION_TYPES.BUCKET_ACTIVE) {
          const undonePixels = absolutePointTupleToPixels(undoAction.points, undoAction.color_ref);
          unsetPixels = unsetPixels.filter(
            (pixel) =>
              !undonePixels.find(
                (undonePixel) => undonePixel.x === pixel.x && undonePixel.y === pixel.y,
              ),
          );
        }
      }
    } else if (action.type === "undo") {
      const action = completedActions.pop();

      if (action != null) {
        undoStack.push(action);
        if (action.type === ACTION_TYPES.BRUSH_ACTIVE) {
          unsetPixels.push(...pointsToPixels(action.points, action.color_ref));
        } else if (action.type === ACTION_TYPES.ERASURE_ACTIVE) {
          unsetPixels.push(...pointsToPixels(action.points, TRANSPARENT_REF));
        } else if (action.type === ACTION_TYPES.LINE_COMPLETE) {
          const linePoints = bresenhamLine(
            action.vector.x,
            action.vector.y,
            action.vector.x + action.vector.magnitudeX,
            action.vector.y + action.vector.magnitudeY,
          );
          const brushPoints = getBrushPoints(linePoints, action.size, 1);
          unsetPixels.push(...pointsToPixels(brushPoints, action.color_ref));
        } else if (action.type === ACTION_TYPES.BUCKET_ACTIVE) {
          unsetPixels.push(...absolutePointTupleToPixels(action.points, action.color_ref));
        }
      }
    } else {
      undoStack = [];
      completedActions.push(action);
    }
  }

  return unsetPixels;
}

export function collapseUndoRedoCombos(actions: Action[]): Action[] {
  let undoStack: Action[] = [];
  const completedActions: Action[] = [];

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    if (action.type === "redo") {
      undoStack.pop();
    } else if (action.type === "undo") {
      undoStack.push({ type: "undo", chunkKeys: action.chunkKeys });
    } else {
      completedActions.push(...undoStack);
      undoStack = [];
      completedActions.push(action);
    }
  }
  completedActions.push(...undoStack);

  return completedActions;
}

export function resolveActions(actions: Action[]): Action[] {
  let undoStack: Action[] = [];
  const completedActions: Action[] = [];

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    if (action.type === "redo") {
      const undoAction = undoStack.pop();

      if (undoAction != null) {
        completedActions.push(undoAction);
      }
    } else if (action.type === "undo") {
      const action = completedActions.pop();

      if (action != null) {
        undoStack.push(action);
      }
    } else {
      undoStack = [];
      completedActions.push(action);
    }
  }
  return completedActions;
}

export function getActionToUndo(
  prevActions: Action[],
): BrushActive | ErasureActive | LineComplete | BucketActive | null {
  return (
    [...resolveActions(prevActions)].reverse().find((action) => isEditableAction(action)) ?? null
  );
}

export function getActionToRedo(
  prevActions: Action[],
): BrushActive | ErasureActive | LineComplete | BucketActive | null {
  const reversedCollapsedPrevActions = [...collapseUndoRedoCombos(prevActions)].reverse();

  if (reversedCollapsedPrevActions.at(0)?.type != "undo") return null;
  return (
    [...resolveActions(prevActions.concat({ type: "redo", chunkKeys: [] }))]
      .reverse()
      .find((action) => isEditableAction(action)) ?? null
  );
}

export function updateActionBasedOnRejectedPixels(
  actions: Action[],
  rejected_pixels: Pixel[],
  action_id: string,
): Action[] {
  return actions.map((action) => {
    if (
      action.type !== ACTION_TYPES.BRUSH_ACTIVE &&
      action.type !== ACTION_TYPES.ERASURE_ACTIVE &&
      action.type !== ACTION_TYPES.LINE_COMPLETE &&
      action.type !== ACTION_TYPES.BUCKET_ACTIVE
    )
      return action;

    if (action.action_id !== action_id) return action;

    if (action.type === ACTION_TYPES.BRUSH_ACTIVE || action.type === ACTION_TYPES.ERASURE_ACTIVE) {
      const rejected_coords = new Set(rejected_pixels.map((p) => `${p.x},${p.y}`));
      const points = action.points.filter((point) => !rejected_coords.has(`${point.x},${point.y}`));
      return { ...action, points };
    }
    if (action.type === ACTION_TYPES.LINE_COMPLETE) {
      const rejected_coords = new Set(rejected_pixels.map((p) => `${p.x},${p.y}`));
      const filteredBrushPoints = action.points.filter(
        (point) => !rejected_coords.has(`${point.x},${point.y}`),
      );

      return {
        ...action,
        points: filteredBrushPoints,
      };
    } else if (action.type === ACTION_TYPES.BUCKET_ACTIVE) {
      const rejected_coords = new Set(rejected_pixels.map((p) => `${p.x},${p.y}`));

      const points = action.points.filter(
        (point) => !rejected_coords.has(`${point[0]},${point[1]}`),
      );

      return {
        ...action,
        points,
      };
    }
    return action;
  });
}
