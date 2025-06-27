import { InitializedStore } from "../store";
import { getAbsolutePoint, getCameraOffset } from "./brush";
import { EnqueueObject } from "../xstate-internal-types";
import { Rect, rectSchema } from "../geometry/rect";
import { getPixelSize } from "../canvas/realtime";
import { Camera, getZoomMultiplier } from "../camera";
import {
  getCompositePolygons,
  Polygon,
  rectToPolygonSchema,
} from "../geometry/polygon";
import { getUserPlots } from "./claimer.rest";

export function redrawPolygonTelegraph(
  ctx: CanvasRenderingContext2D,
  polygon: Polygon,
  pixelSize: number,
  camera: Camera,
) {
  const { xOffset, yOffset } = getCameraOffset(camera);

  ctx.beginPath();
  ctx.lineWidth = pixelSize / 5;

  for (let i = 1; i < polygon.vertices.length + 1; i++) {
    const prev = polygon.vertices[i - 1];
    const point = polygon.vertices[i % polygon.vertices.length];

    const x1 = prev[0],
      y1 = prev[1];
    const x2 = point[0],
      y2 = point[1];

    const xDiff = x2 - x1;
    const yDiff = y2 - y1;

    const diffType =
      xDiff === 0
        ? yDiff === 0
          ? "zero"
          : yDiff > 0
            ? "positiveY"
            : "negativeY"
        : xDiff > 0
          ? "positiveX"
          : "negativeX";

    ctx.moveTo(
      (x1 - camera.x + xOffset) * pixelSize +
        (diffType === "negativeX" || diffType === "positiveY" ? pixelSize : 0),
      (y1 - camera.y + yOffset) * pixelSize +
        (diffType === "negativeX" || diffType === "negativeY" ? pixelSize : 0),
    );
    ctx.lineTo(
      (x2 - camera.x + xOffset) * pixelSize +
        (diffType === "positiveX" || diffType === "positiveY" ? pixelSize : 0),
      (y2 - camera.y + yOffset) * pixelSize +
        (diffType === "negativeX" || diffType === "positiveY" ? pixelSize : 0),
    );

    ctx.stroke();
    ctx.closePath();
  }

  ctx.beginPath();
  for (let i = 1; i < polygon.vertices.length + 1; i++) {
    const prev = polygon.vertices[i - 1];
    const point = polygon.vertices[i % polygon.vertices.length];

    const x1 = prev[0],
      y1 = prev[1];
    const x2 = point[0],
      y2 = point[1];

    const xDiff = x2 - x1;
    const yDiff = y2 - y1;

    const diffType =
      xDiff === 0
        ? yDiff === 0
          ? "zero"
          : yDiff > 0
            ? "positiveY"
            : "negativeY"
        : xDiff > 0
          ? "positiveX"
          : "negativeX";

    ctx.moveTo(
      (x1 - camera.x + xOffset) * pixelSize +
        (diffType === "negativeX" || diffType === "positiveY" ? pixelSize : 0),
      (y1 - camera.y + yOffset) * pixelSize +
        (diffType === "negativeX" || diffType === "negativeY" ? pixelSize : 0),
    );
    ctx.lineTo(
      (x2 - camera.x + xOffset) * pixelSize +
        (diffType === "positiveX" || diffType === "positiveY" ? pixelSize : 0),
      (y2 - camera.y + yOffset) * pixelSize +
        (diffType === "negativeX" || diffType === "positiveY" ? pixelSize : 0),
    );
  }
  ctx.fill();
}

function redrawTelegraph(context: InitializedStore) {
  const ctx = context.canvas.telegraphCanvasContext;
  const canvas = context.canvas.telegraphCanvas;

  ctx.imageSmoothingEnabled = false;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (context.activeAction?.type !== "claimer-active") {
    return context;
  }

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
  polygons: Polygon[];
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
      : activeBrushAction.rects,
    nextRect: null,
  };
}

export function nextClaimerAction(
  activeBrushAction: ClaimerActive,
  nextRect: Rect,
): ClaimerActive {
  return {
    ...activeBrushAction,
    nextRect,
  };
}

export function completeRectangleClaimerAction(
  polygons: Polygon[],
): ClaimerComplete {
  return {
    type: "claimer-complete",
    polygons,
  };
}

function onPointerDown(
  e: PointerEvent,
  context: InitializedStore,
  _: EnqueueObject<{ type: string }>,
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

  return {
    ...context,
    activeAction: nextActiveAction,
  };
}

function onPointerMove(
  e: PointerEvent,
  context: InitializedStore,
  _: EnqueueObject<{ type: string }>,
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

  return {
    ...context,
    activeAction: nextActiveAction,
  };
}

function onWheel(
  e: WheelEvent,
  context: InitializedStore,
  _: EnqueueObject<{ type: string }>,
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

export { getUserPlots };
