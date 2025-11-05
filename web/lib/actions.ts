import { ACTION_TYPES } from './action-types';
import { Camera } from './camera';
import { bresenhamLine } from './geometry/bresenham-line';
import { AbsolutePoint, Pixel } from './geometry/coord';
import { ColorRef, TRANSPARENT_REF } from './palette';
import { Tool } from './tool-settings';
import {
    BrushActive,
    getBrushPoints,
    pointsToPixels,
} from './tools/brush/brush';
import {
    ClaimerComplete,
    ClaimerCreate,
    ClaimerEdit,
    ClaimerNewRectCreate,
    ClaimerNewRectEdit,
    ClaimerResizeCreate,
    ClaimerResizeEdit,
} from './tools/claimer/claimer';
import { ErasureActive } from './tools/erasure/erasure';
import { LineActive, LineComplete } from './tools/line/line';

type Undo = { type: 'undo' };
type Redo = { type: 'redo' };

export type Action =
    | ErasureActive
    | BrushActive
    | LineActive
    | LineComplete
    | ClaimerCreate
    | ClaimerNewRectCreate
    | ClaimerNewRectEdit
    | ClaimerComplete
    | ClaimerEdit
    | ClaimerResizeEdit
    | ClaimerResizeCreate
    | {
          type: 'realtime-active';
          pixels: Pixel[];
      }
    | {
          type: 'camera-move';
          points: Camera[];
      }
    | {
          type: 'tool-change';
          before: Tool;
          after: Tool;
      }
    | Undo
    | Redo;

function create_brush_fixture(
    points: AbsolutePoint[],
    color_ref: ColorRef,
): BrushActive {
    return {
        action_id: '00000000-0000-0000-0000-000000000000',
        type: ACTION_TYPES.BRUSH_ACTIVE,
        color_ref,
        points,
        //todo(josh): these shouldn't be faked like this, update the function
        anchorPoints: points,
    };
}
function create_erase_fixture(points: AbsolutePoint[]): ErasureActive {
    return {
        action_id: '11111111-1111-1111-1111-111111111111',
        type: ACTION_TYPES.ERASURE_ACTIVE,
        points,
        //todo(josh): these shouldn't be faked like this, update the function
        anchorPoints: points,
    };
}
function undo(): Undo {
    return { type: 'undo' };
}
function redo(): Redo {
    return { type: 'redo' };
}

export const Actions = {
    brush: create_brush_fixture,
    erase: create_erase_fixture,
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

        if (action.type === 'redo') {
            const undoAction = undoStack.pop();

            if (undoAction != null) {
                completedActions.push(undoAction);
            }
        } else if (action.type === 'undo') {
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
            const linePoints = bresenhamLine(
                action.vector.x,
                action.vector.y,
                action.vector.x + action.vector.magnitudeX,
                action.vector.y + action.vector.magnitudeY,
            );
            const brushPoints = getBrushPoints(linePoints, action.size, 1);
            pixels.push(...pointsToPixels(brushPoints, action.color_ref));
        } else if (action.type === 'realtime-active') {
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

        if (action.type === 'redo') {
            const undoAction = undoStack.pop();

            if (undoAction != null) {
                completedActions.push(undoAction);

                if (undoAction.type === ACTION_TYPES.BRUSH_ACTIVE) {
                    const undonePixels = pointsToPixels(
                        undoAction.points,
                        undoAction.color_ref,
                    );
                    unsetPixels = unsetPixels.filter(
                        (pixel) =>
                            !undonePixels.find(
                                (undonePixel) =>
                                    undonePixel.x === pixel.x &&
                                    undonePixel.y === pixel.y,
                            ),
                    );
                } else if (undoAction.type === ACTION_TYPES.ERASURE_ACTIVE) {
                    const undonePixels = pointsToPixels(
                        undoAction.points,
                        TRANSPARENT_REF,
                    );
                    unsetPixels = unsetPixels.filter(
                        (pixel) =>
                            !undonePixels.find(
                                (undonePixel) =>
                                    undonePixel.x === pixel.x &&
                                    undonePixel.y === pixel.y,
                            ),
                    );
                } else if (undoAction.type === ACTION_TYPES.LINE_COMPLETE) {
                    const undoneLinePoints = bresenhamLine(
                        undoAction.vector.x,
                        undoAction.vector.y,
                        undoAction.vector.x + undoAction.vector.magnitudeX,
                        undoAction.vector.y + undoAction.vector.magnitudeY,
                    );
                    const undoneBrushPoints = getBrushPoints(
                        undoneLinePoints,
                        undoAction.size,
                        1,
                    );
                    const undonePixels = pointsToPixels(
                        undoneBrushPoints,
                        undoAction.color_ref,
                    );
                    unsetPixels = unsetPixels.filter(
                        (pixel) =>
                            !undonePixels.find(
                                (undonePixel) =>
                                    undonePixel.x === pixel.x &&
                                    undonePixel.y === pixel.y,
                            ),
                    );
                }
            }
        } else if (action.type === 'undo') {
            const action = completedActions.pop();

            if (action != null) {
                undoStack.push(action);
                if (action.type === ACTION_TYPES.BRUSH_ACTIVE) {
                    unsetPixels.push(
                        ...pointsToPixels(action.points, action.color_ref),
                    );
                } else if (action.type === ACTION_TYPES.ERASURE_ACTIVE) {
                    unsetPixels.push(
                        ...pointsToPixels(action.points, TRANSPARENT_REF),
                    );
                } else if (action.type === ACTION_TYPES.LINE_COMPLETE) {
                    const linePoints = bresenhamLine(
                        action.vector.x,
                        action.vector.y,
                        action.vector.x + action.vector.magnitudeX,
                        action.vector.y + action.vector.magnitudeY,
                    );
                    const brushPoints = getBrushPoints(
                        linePoints,
                        action.size,
                        1,
                    );
                    unsetPixels.push(
                        ...pointsToPixels(brushPoints, action.color_ref),
                    );
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

        if (action.type === 'redo') {
            undoStack.pop();
        } else if (action.type === 'undo') {
            undoStack.push({ type: 'undo' });
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

        if (action.type === 'redo') {
            const undoAction = undoStack.pop();

            if (undoAction != null) {
                completedActions.push(undoAction);
            }
        } else if (action.type === 'undo') {
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
): BrushActive | ErasureActive | LineComplete | null {
    return (
        [...resolveActions(prevActions)]
            .reverse()
            .find(
                (action) =>
                    action.type === ACTION_TYPES.BRUSH_ACTIVE ||
                    action.type === ACTION_TYPES.ERASURE_ACTIVE ||
                    action.type === ACTION_TYPES.LINE_COMPLETE,
            ) ?? null
    );
}

export function getActionToRedo(
    prevActions: Action[],
): BrushActive | ErasureActive | LineComplete | null {
    const reversedCollapsedPrevActions = [
        ...collapseUndoRedoCombos(prevActions),
    ].reverse();

    if (reversedCollapsedPrevActions.at(0)?.type != 'undo') return null;
    return (
        [...resolveActions(prevActions.concat({ type: 'redo' }))]
            .reverse()
            .find(
                (action) =>
                    action.type === ACTION_TYPES.BRUSH_ACTIVE ||
                    action.type === ACTION_TYPES.ERASURE_ACTIVE ||
                    action.type === ACTION_TYPES.LINE_COMPLETE,
            ) ?? null
    );
}
