import { Pixel, Point } from "./pixel";
import { Tool } from "./store";
import { BrushActive } from "./tools/brush";
import { ErasureActive } from "./tools/erasure";
import { pointsToPixels } from "./tools/brush";
import { ColorRef, TRANSPARENT_REF } from "./palette";
import { Camera } from "./camera";

type Undo = { type: "undo" };
type Redo = { type: "redo" };

export type Action =
  | ErasureActive
  | BrushActive
  | {
      type: "realtime-active";
      pixels: Pixel[];
    }
  | {
      type: "camera-move";
      points: Camera[];
    }
  | {
      type: "tool-change";
      before: Tool;
      after: Tool;
    }
  | Undo
  | Redo;

function brush(points: Point[], colorRef: ColorRef): BrushActive {
  return {
    type: "brush-active",
    colorRef,
    points,
  };
}
function erase(points: Point[]): ErasureActive {
  return {
    type: "erasure-active",
    points,
  };
}
function undo(): Undo {
  return { type: "undo" };
}
function redo(): Redo {
  return { type: "redo" };
}

export const Actions = {
  brush,
  erase,
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

    if (action.type === "brush-active") {
      pixels.push(...pointsToPixels(action.points, action.colorRef));
    } else if (action.type === "erasure-active") {
      pixels.push(...pointsToPixels(action.points, TRANSPARENT_REF));
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

        if (undoAction.type === "brush-active") {
          const undonePixels = pointsToPixels(
            undoAction.points,
            undoAction.colorRef,
          );
          unsetPixels = unsetPixels.filter(
            (pixel) =>
              !undonePixels.find(
                (undonePixel) =>
                  undonePixel.x === pixel.x && undonePixel.y === pixel.y,
              ),
          );
        } else if (undoAction.type === "erasure-active") {
          const undonePixels = pointsToPixels(
            undoAction.points,
            TRANSPARENT_REF,
          );
          unsetPixels = unsetPixels.filter(
            (pixel) =>
              !undonePixels.find(
                (undonePixel) =>
                  undonePixel.x === pixel.x && undonePixel.y === pixel.y,
              ),
          );
        }
      }
    } else if (action.type === "undo") {
      const action = completedActions.pop();

      if (action != null) {
        undoStack.push(action);
        if (action.type === "brush-active") {
          unsetPixels.push(...pointsToPixels(action.points, action.colorRef));
        } else if (action.type === "erasure-active") {
          unsetPixels.push(...pointsToPixels(action.points, TRANSPARENT_REF));
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
      undoStack.push({ type: "undo" });
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
): BrushActive | ErasureActive | null {
  return (
    [...resolveActions(prevActions)]
      .reverse()
      .find(
        (action) =>
          action.type === "brush-active" || action.type === "erasure-active",
      ) ?? null
  );
}

export function getActionToRedo(
  prevActions: Action[],
): BrushActive | ErasureActive | null {
  const reversedCollapsedPrevActions = [
    ...collapseUndoRedoCombos(prevActions),
  ].reverse();

  if (reversedCollapsedPrevActions.at(0)?.type != "undo") return null;
  return (
    [...resolveActions(prevActions.concat({ type: "redo" }))]
      .reverse()
      .find(
        (action) =>
          action.type === "brush-active" || action.type === "erasure-active",
      ) ?? null
  );
}
