/**
 * Action type constants for all actions in the application.
 * Using constants instead of magic strings helps prevent typos and makes refactoring easier.
 */
export const ACTION_TYPES = {
  // Brush tool actions
  BRUSH_ACTIVE: "brush-active",

  // Erasure tool actions
  ERASURE_ACTIVE: "erasure-active",

  // Line tool actions
  LINE_ACTIVE: "line-active",
  LINE_COMPLETE: "line-complete",

  // Claimer tool actions
  CLAIMER_COMPLETE: "claimer-complete",
  CLAIMER_EDIT: "claimer-edit",
  CLAIMER_RESIZE_EDIT: "claimer-resize-edit",
  CLAIMER_RESIZE_CREATE: "claimer-resize-create",
  CLAIMER_CREATE: "claimer-create",
  CLAIMER_NEW_RECT_CREATE: "claimer-new-rect-create",
  CLAIMER_NEW_RECT_EDIT: "claimer-new-rect-edit",

  // Bucket tool actions
  BUCKET_ACTIVE: "bucket-active",

  // Rectangle tool actions
  RECTANGLE_ACTIVE: "rectangle-active",
  RECTANGLE_COMPLETE: "rectangle-complete",
  RECTANGLE_FILL_ACTIVE: "rectangle-fill-active",
  RECTANGLE_FILL_COMPLETE: "rectangle-fill-complete",

  // Ellipse tool actions
  ELLIPSE_ACTIVE: "ellipse-active",
  ELLIPSE_COMPLETE: "ellipse-complete",
  ELLIPSE_FILL_ACTIVE: "ellipse-fill-active",
  ELLIPSE_FILL_COMPLETE: "ellipse-fill-complete",

  // Other actions
  REALTIME_ACTIVE: "realtime-active",
  UNDO: "undo",
  REDO: "redo",
} as const;

// Type-safe action type values
export type ActionType = (typeof ACTION_TYPES)[keyof typeof ACTION_TYPES];
