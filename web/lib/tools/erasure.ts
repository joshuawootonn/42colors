import { EnqueueObject } from "@xstate/store";
import { CANVAS_PIXEL_RATIO } from "../constants";
import { COLOR_TABLE, TRANSPARENT_REF } from "../palette";
import { InitializedStore, Point, store } from "../store";
import { canvasToClient } from "../utils/clientToCanvasConversion";
import { bresenhamLine, getCanvasXY, isDuplicatePoint, pointsToPixels } from "./brush";

function drawUnactiveTelegraph(
  canvasX: number,
  canvasY: number,
  context: InitializedStore,
) {
  context.canvas.telegraphCanvasContext.clearRect(
    0,
    0,
    context.canvas.telegraphCanvasContext.canvas.width,
    context.canvas.telegraphCanvasContext.canvas.height,
  );

  const zoomMultiplier = context.camera.zoom / 100;
  context.canvas.telegraphCanvasContext.fillStyle =
    COLOR_TABLE[context.currentColorRef];
  context.canvas.telegraphCanvasContext.strokeRect(
    canvasToClient(canvasX, context.camera.zoom),
    canvasToClient(canvasY, context.camera.zoom),
    CANVAS_PIXEL_RATIO * zoomMultiplier,
    CANVAS_PIXEL_RATIO * zoomMultiplier,
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
  drawUnactiveTelegraph(canvasX, canvasY, context);

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
  drawUnactiveTelegraph(canvasX, canvasY, context);

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
  drawUnactiveTelegraph(canvasX, canvasY, context);

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
};

export type ErasureTool = typeof ErasureTool;
