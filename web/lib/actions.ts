import { Pixel } from "./pixel";
import { Camera, Tool } from "./store";
import { BrushActive } from "./tools/brush";
import { ErasureActive } from "./tools/erasure";
import { pointsToPixels } from "./tools/brush";
import { TRANSPARENT_REF } from "./palette";

export type Action =
  | ErasureActive
  | BrushActive
  | {
      type: "camera-move";
      points: Camera[];
    }
  | {
      type: "tool-change";
      before: Tool;
      after: Tool;
    }
  | {
      type: "undo";
    }
  | {
      type: "redo";
    };

export function derivePixelsFromActions(actions: Action[]): Pixel[] {
  let undoBuffer: Action[] = [];

  const cleanedActions: Action[] = [];
  const pixels: Pixel[] = [];

  for (let index = 0; index < actions.length; index++) {
    const action = actions[index];

    if (action.type === "redo") {
      const undoAction = undoBuffer.pop();

      if (undoAction != null) {
        cleanedActions.push(undoAction);
      }
    } else if (action.type === "undo") {
      const action = cleanedActions.pop();

      if (action != null) {
        undoBuffer.push(action);
      }
    } else {
      undoBuffer = [];
      cleanedActions.push(action);
    }
  }

  for (let index = 0; index < cleanedActions.length; index++) {
    const action = cleanedActions[index];

    if (action.type === "brush-active") {
      pixels.push(...pointsToPixels(action.points, action.colorRef));
    } else if (action.type === "erasure-active") {
      pixels.push(...pointsToPixels(action.points, TRANSPARENT_REF));
    }
  }

  return pixels;
}
