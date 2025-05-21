import { InitializedStore, store } from "../store";
import { getAbsolutePoint, getCameraOffset } from "./brush";
import { EnqueueObject } from "../xstate-internal-types";
import { Rect, rectSchema } from "../rect";
import { getPixelSize } from "../realtime";
import { Camera, getZoomMultiplier } from "../camera";

function redrawRectTelegraph(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  pixelSize: number,
  camera: Camera,
) {
  const { xOffset, yOffset } = getCameraOffset(camera);
  const oX = (rect.origin.x - camera.x + xOffset) * pixelSize;
  const oY = (rect.origin.y - camera.y + yOffset) * pixelSize;
  const tX = (rect.target.x - camera.x + xOffset) * pixelSize;
  const tY = (rect.target.y - camera.y + yOffset) * pixelSize;
  ctx.beginPath();
  ctx.lineWidth = pixelSize / 3;
  ctx.moveTo(oX, oY);
  ctx.lineTo(tX, oY);
  ctx.lineTo(tX, tY);
  ctx.lineTo(oX, tY);
  ctx.lineTo(oX, oY);
  ctx.stroke();
}

function redrawTelegraph(context: InitializedStore) {
  const ctx = context.canvas.telegraphCanvasContext;
  const canvas = context.canvas.telegraphCanvas;

  if (context.activeAction?.type !== "claimer-active") {
    return context;
  }

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "yellow";

  const pixelSize = getPixelSize(getZoomMultiplier(context.camera));
  for (let i = 0; i < context.activeAction.rects.length; i++) {
    const rect = context.activeAction.rects[i];

    redrawRectTelegraph(ctx, rect, pixelSize, context.camera);
  }

  if (context.activeAction.nextRect != null) {
    redrawRectTelegraph(
      ctx,
      context.activeAction.nextRect,
      pixelSize,
      context.camera,
    );
  }
}

export type ClaimerComplete = {
  type: "claimer-complete";
  rects: Rect[];
};

export type ClaimerActive = {
  type: "claimer-active";
  rects: Rect[];
  nextRect: Rect | null;
};

export function startClaimerAction(rect: Rect): ClaimerActive {
  return {
    type: "claimer-active",
    rects: [],
    nextRect: rect,
  };
}
export function newRectAction(
  activeBrushAction: ClaimerActive,
  rect: Rect,
): ClaimerActive {
  return {
    type: "claimer-active",
    rects: activeBrushAction.rects,
    nextRect: rect,
  };
}

export function completeRectAction(
  activeBrushAction: ClaimerActive,
): ClaimerActive {
  return {
    type: "claimer-active",
    rects: activeBrushAction.nextRect
      ? activeBrushAction.rects.concat(activeBrushAction.nextRect)
      : [],
    nextRect: null,
  };
}

export function nextClaimerAction(
  activeBrushAction: ClaimerActive,
  nextRect: Rect,
): ClaimerActive {
  return {
    ...activeBrushAction,
    nextRect: nextRect,
  };
}

export function completeRectangleClaimerAction(
  activeBrushAction: ClaimerActive,
): ClaimerComplete {
  return {
    type: "claimer-complete",
    rects: activeBrushAction.rects,
  };
}

function onPointerDown(
  e: PointerEvent,
  context: InitializedStore,
  enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
  const absolutePoint = getAbsolutePoint(e.clientX, e.clientY, context);

  const rect = rectSchema.parse({
    origin: absolutePoint,
    target: absolutePoint,
  });

  const nextActiveAction =
    context.activeAction?.type !== "claimer-active"
      ? startClaimerAction(rect)
      : newRectAction(context.activeAction, rect);

  enqueue.effect(() => {
    store.trigger.redrawRealtimeCanvas();
  });
  return {
    ...context,
    activeAction: nextActiveAction,
  };
}

function onPointerMove(
  e: PointerEvent,
  context: InitializedStore,
  enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
  const absolutePoint = getAbsolutePoint(e.clientX, e.clientY, context);

  if (
    context.activeAction?.type !== "claimer-active" ||
    context.activeAction.nextRect == null
  ) {
    return context;
  }

  const rect = rectSchema.parse({
    origin: context.activeAction.nextRect.origin,
    target: absolutePoint,
  });

  const nextActiveAction = nextClaimerAction(context.activeAction, rect);

  enqueue.effect(() => {
    store.trigger.redrawRealtimeCanvas();
  });

  return {
    ...context,
    activeAction: nextActiveAction,
  };
}

function onWheel(
  e: WheelEvent,
  context: InitializedStore,
  enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
  const absolutePoint = getAbsolutePoint(e.clientX, e.clientY, context);

  if (
    context.activeAction?.type !== "claimer-active" ||
    context.activeAction.nextRect == null
  ) {
    return context;
  }

  const rect = rectSchema.parse({
    origin: context.activeAction.nextRect.origin,
    target: absolutePoint,
  });

  const nextActiveAction = nextClaimerAction(context.activeAction, rect);
  enqueue.effect(() => {
    store.trigger.redrawRealtimeCanvas();
  });

  return {
    ...context,
    activeAction: nextActiveAction,
  };
}

function onPointerOut(
  _: PointerEvent,
  context: InitializedStore,
  __: EnqueueObject<{ type: string }>,
): InitializedStore {
  if (context.activeAction?.type !== "claimer-active") {
    return context;
  }

  return {
    ...context,
    activeAction: completeRectAction(context.activeAction),
  };
}

function onPointerUp(
  _: PointerEvent,
  context: InitializedStore,
  __: EnqueueObject<{ type: string }>,
): InitializedStore {
  if (context.activeAction?.type !== "claimer-active") {
    return context;
  }

  return {
    ...context,
    activeAction: completeRectAction(context.activeAction),
  };
}

export const ClaimerTool = {
  onPointerMove,
  onPointerDown,
  onPointerUp,
  onPointerOut,
  onWheel,
  redrawTelegraph,
};

export type ClaimerTool = typeof ClaimerTool;
