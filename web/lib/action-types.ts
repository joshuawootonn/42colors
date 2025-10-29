/**
 * Action type constants for all actions in the application.
 * Using constants instead of magic strings helps prevent typos and makes refactoring easier.
 */
export const ACTION_TYPES = {
    // Brush tool actions
    BRUSH_ACTIVE: 'brush-active',

    // Erasure tool actions
    ERASURE_ACTIVE: 'erasure-active',

    // Claimer tool actions
    CLAIMER_ACTIVE: 'claimer-active',
    CLAIMER_COMPLETE: 'claimer-complete',
    CLAIMER_EDIT: 'claimer-edit',
    CLAIMER_RESIZE: 'claimer-resize',

    // Other actions
    REALTIME_ACTIVE: 'realtime-active',
    CAMERA_MOVE: 'camera-move',
    TOOL_CHANGE: 'tool-change',
    UNDO: 'undo',
    REDO: 'redo',
} as const;

// Type-safe action type values
export type ActionType = (typeof ACTION_TYPES)[keyof typeof ACTION_TYPES];
