import { BLACK_REF, COLOR_TABLE, TRANSPARENT_REF } from "../palette";
import { InitializedStore, store } from "../store";
import {
  bresenhamLine,
  getBrushPoints,
  getCanvasXY,
  isDuplicatePoint,
  pointsToPixels,
} from "./brush";
import { canvasToClient } from "../utils/clientToCanvasConversion";
import { getZoomMultiplier } from "../camera";
import { getPixelSize } from "../realtime";
import { EnqueueObject } from "../xstate-internal-types";
import { Point, pointSchema } from "../coord";
import { createAtom } from "@xstate/store";
import { newNewCoords } from "../utils/net-new-coords";
import { drawBrushOutline } from "./brush-rendering";

export const erasureSizeState = createAtom(1);

function redrawTelegraph(
  clientX: number,
  clientY: number,
  context: InitializedStore,
) {
  const { canvasX, canvasY } = getCanvasXY(clientX, clientY, context);
  const ctx = context.canvas.telegraphCanvasContext;
  const canvas = context.canvas.telegraphCanvas;

  const pixelSize = getPixelSize(getZoomMultiplier(context.camera));

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = COLOR_TABLE[BLACK_REF];

  const point = pointSchema.parse({
    x: canvasToClient(canvasX, context.camera.zoom),
    y: canvasToClient(canvasY, context.camera.zoom),
    camera: context.camera,
  });

  const erasureSize = erasureSizeState.get();

  ctx.strokeStyle = "black";
  drawBrushOutline(ctx, point, erasureSize, pixelSize);
  ctx.stroke();
}

export type ErasureActive = {
  type: "erasure-active";
  points: Point[];
  anchorPoints: Point[];
};

export function startErasureAction(
  anchorPoint: Point,
  erasurePoints: Point[],
): ErasureActive {
  return {
    type: "erasure-active",
    points: erasurePoints,
    anchorPoints: [anchorPoint],
  };
}

export function nextErasureAction(
  activeBrushAction: ErasureActive,
  newAnchorPoints: Point[],
  newErasurePoints: Point[],
): ErasureActive {
  return {
    ...activeBrushAction,
    anchorPoints: activeBrushAction.anchorPoints.concat(newAnchorPoints),
    points: activeBrushAction.points.concat(newErasurePoints),
  };
}

function onPointerDown(
  e: PointerEvent,
  context: InitializedStore,
  enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
  const { canvasX, canvasY } = getCanvasXY(e.clientX, e.clientY, context);

  const anchorPoint = pointSchema.parse({
    x: canvasX,
    y: canvasY,
    camera: context.camera,
  });
  const brushPoints = getBrushPoints([anchorPoint], erasureSizeState.get(), 1);

  const nextActiveAction = startErasureAction(anchorPoint, brushPoints);

  enqueue.effect(() => {
    store.trigger.newPixels({
      pixels: pointsToPixels(nextActiveAction.points, TRANSPARENT_REF),
    });
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
  const { canvasX, canvasY } = getCanvasXY(e.clientX, e.clientY, context);

  if (
    context.activeAction?.type !== "erasure-active" ||
    isDuplicatePoint(canvasX, canvasY, context)
  ) {
    return context;
  }

  const newAnchorPoints = bresenhamLine(
    context.activeAction.anchorPoints.at(-1)!.x,
    context.activeAction.anchorPoints.at(-1)!.y,
    canvasX,
    canvasY,
    context.camera,
  );

  const netNewAnchors = newNewCoords(
    context.activeAction.anchorPoints,
    newAnchorPoints,
  );
  const newBrushPoints = getBrushPoints(
    netNewAnchors,
    erasureSizeState.get(),
    1,
  );
  const netNewPixels = newNewCoords(
    context.activeAction.points,
    newBrushPoints,
  );
  const nextActiveAction = nextErasureAction(
    context.activeAction,
    newAnchorPoints,
    newBrushPoints,
  );
  enqueue.effect(() => {
    store.trigger.newPixels({
      pixels: pointsToPixels(netNewPixels, TRANSPARENT_REF),
    });
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
  const { canvasX, canvasY } = getCanvasXY(e.clientX, e.clientY, context);

  if (
    context.activeAction?.type !== "erasure-active" ||
    isDuplicatePoint(canvasX, canvasY, context)
  ) {
    return context;
  }

  const newAnchorPoints = bresenhamLine(
    context.activeAction.anchorPoints.at(-1)!.x,
    context.activeAction.anchorPoints.at(-1)!.y,
    canvasX,
    canvasY,
    context.camera,
  );

  const netNewAnchors = newNewCoords(
    context.activeAction.anchorPoints,
    newAnchorPoints,
  );
  const newBrushPoints = getBrushPoints(
    netNewAnchors,
    erasureSizeState.get(),
    1,
  );
  const netNewPixels = newNewCoords(
    context.activeAction.points,
    newBrushPoints,
  );
  const nextActiveAction = nextErasureAction(
    context.activeAction,
    newAnchorPoints,
    newBrushPoints,
  );
  enqueue.effect(() => {
    store.trigger.newPixels({
      pixels: pointsToPixels(netNewPixels, TRANSPARENT_REF),
    });
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
  if (context.activeAction?.type !== "erasure-active") return context;

  return {
    ...context,
    activeAction: null,
    actions: context.actions.concat(context.activeAction),
  };
}

function onPointerUp(
  _: PointerEvent,
  context: InitializedStore,
  __: EnqueueObject<{ type: string }>,
): InitializedStore {
  if (context.activeAction?.type !== "erasure-active") return context;

  return {
    ...context,
    activeAction: null,
    actions: context.actions.concat(context.activeAction),
  };
}

export const ErasureTool = {
  onPointerMove,
  onPointerDown,
  onPointerUp,
  onPointerOut,
  onWheel,
  redrawTelegraph,
};

export type ErasureTool = typeof ErasureTool;
