import { EnqueueObject } from "@xstate/store";
import { BLACK_REF, COLOR_TABLE, TRANSPARENT_REF } from "../palette";
import { InitializedStore, Point, store } from "../store";
import {
  bresenhamLine,
  getCanvasXY,
  isDuplicatePoint,
  pointsToPixels,
} from "./brush";
import { canvasToClient } from "../utils/clientToCanvasConversion";
import { getZoomMultiplier } from "../camera";
import { getPixelSize } from "../realtime";

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
  ctx.fillRect(
    canvasToClient(canvasX, context.camera.zoom),
    canvasToClient(canvasY, context.camera.zoom),
    pixelSize,
    pixelSize,
  );
}

export function startErasureAction(
  canvasX: number,
  canvasY: number,
  context: InitializedStore,
): ErasureActive {
  return {
    type: "erasure-active",
    points: [{ canvasX, canvasY, camera: context.camera }],
  };
}

function onPointerDown(
  e: PointerEvent,
  context: InitializedStore,
  enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
  const { canvasX, canvasY } = getCanvasXY(e.clientX, e.clientY, context);

  const nextActiveAction = startErasureAction(canvasX, canvasY, context);

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

export type ErasureActive = {
  type: "erasure-active";
  points: Point[];
};

export function nextErasureAction(
  activeErasureAction: ErasureActive,
  newPoints: Point[],
): ErasureActive {
  return {
    ...activeErasureAction,
    points: activeErasureAction.points.concat(newPoints),
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

  const newPoints = bresenhamLine(
    context.activeAction.points.at(-1)!.canvasX,
    context.activeAction.points.at(-1)!.canvasY,
    canvasX,
    canvasY,
    context.camera,
  );
  const nextActiveAction = nextErasureAction(context.activeAction, newPoints);
  enqueue.effect(() => {
    store.trigger.newPixels({
      pixels: pointsToPixels(newPoints, TRANSPARENT_REF),
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

  const newPoints = bresenhamLine(
    context.activeAction.points.at(-1)!.canvasX,
    context.activeAction.points.at(-1)!.canvasY,
    canvasX,
    canvasY,
    context.camera,
  );
  const nextActiveAction = nextErasureAction(context.activeAction, newPoints);
  enqueue.effect(() => {
    store.trigger.newPixels({
      pixels: pointsToPixels(newPoints, TRANSPARENT_REF),
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
