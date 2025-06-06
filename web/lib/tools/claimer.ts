import { InitializedStore, store } from "../store";
import { getAbsolutePoint, getCameraOffset } from "./brush";
import { EnqueueObject } from "../xstate-internal-types";
import { Rect, rectSchema } from "../rect";
import { getPixelSize } from "../realtime";
import { Camera, getZoomMultiplier } from "../camera";
import { getCompositePolygons, Polygon, rectToPolygonSchema } from "../polygon";
import { throttle } from "../utils/throttle";

function redrawPolygonTelegraph(
  ctx: CanvasRenderingContext2D,
  polygon: Polygon,
  pixelSize: number,
  camera: Camera,
) {
  const { xOffset, yOffset } = getCameraOffset(camera);

  ctx.beginPath();
  ctx.lineWidth = pixelSize / 3;

  for (let i = 0; i < polygon.lines.length; i++) {
    const line = polygon.lines[i];
    const x1 = line[0][0],
      y1 = line[0][1];
    const x2 = line[1][0],
      y2 = line[1][1];
    ctx.moveTo(
      (x1 - camera.x + xOffset) * pixelSize,
      (y1 - camera.y + yOffset) * pixelSize,
    );
    ctx.lineTo(
      (x2 - camera.x + xOffset) * pixelSize,
      (y2 - camera.y + yOffset) * pixelSize,
    );
    ctx.stroke();
    ctx.closePath();
  }

  ctx.beginPath();
  for (let i = 0; i < polygon.lines.length; i++) {
    const line = polygon.lines[i];
    const x1 = line[0][0],
      y1 = line[0][1];
    const x2 = line[1][0],
      y2 = line[1][1];
    if (i === 0) {
      ctx.moveTo(
        (x1 - camera.x + xOffset) * pixelSize,
        (y1 - camera.y + yOffset) * pixelSize,
      );
    }
    ctx.lineTo(
      (x2 - camera.x + xOffset) * pixelSize,
      (y2 - camera.y + yOffset) * pixelSize,
    );
  }
  ctx.fillStyle = "rgba(246, 240, 74, 0.2)";
  ctx.fill();
}

function redrawTelegraph(context: InitializedStore) {
  const ctx = context.canvas.telegraphCanvasContext;
  const canvas = context.canvas.telegraphCanvas;

  if (context.activeAction?.type !== "claimer-active") {
    return context;
  }

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgb(246, 240, 74)";
  ctx.fillStyle = "rgba(246, 240, 74, 0.2)";

  const pixelSize = getPixelSize(getZoomMultiplier(context.camera));

  const rects = [...context.activeAction.rects];
  if (context.activeAction.nextRect != null) {
    rects.push(context.activeAction.nextRect);
  }

  const polygons = rects.map((rect) => rectToPolygonSchema.parse(rect));

  const aggregatedPolygons = getCompositePolygons(polygons);

  for (let i = 0; i < aggregatedPolygons.length; i++) {
    redrawPolygonTelegraph(
      ctx,
      aggregatedPolygons[i],
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
  redrawTelegraph: throttle(redrawTelegraph, 17),
};

export type ClaimerTool = typeof ClaimerTool;
