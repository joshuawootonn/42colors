import { EnqueueObject } from "@xstate/store";
import { CANVAS_PIXEL_RATIO } from "../constants";
import { COLOR_TABLE, TRANSPARENT_REF } from "../palette";
import { InitializedStore, Point, store } from "../store";
import { canvasToClient } from "../utils/clientToCanvasConversion";
import { getCanvasXY, isDuplicatePoint, getNewPixels } from "./brush";
import { pixelSchema } from "../pixel";

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
  const pixels = getNewPixels(nextActiveAction, context);
  const absolutePixels = pixels.map((pixel) =>
    pixelSchema.parse({
      x: Math.floor(context.camera.x + pixel.x),
      y: Math.floor(context.camera.y + pixel.y),
      colorRef: TRANSPARENT_REF,
    }),
  );

  enqueue.effect(() =>
    store.trigger.newPixels({
      pixels: absolutePixels,
    }),
  );

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
  canvasX: number,
  canvasY: number,
  context: InitializedStore,
): ErasureActive {
  if (context.activeAction?.type !== "erasure-active")
    throw new Error("nextErasureAction was called when you weren't erasing");

  return {
    type: "erasure-active",
    points: context.activeAction.points.concat({
      canvasX,
      canvasY,
      camera: context.camera,
    }),
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

  const nextActiveAction = nextErasureAction(canvasX, canvasY, context);
  const pixels = getNewPixels(nextActiveAction, context);
  const absolutePixels = pixels.map((pixel) =>
    pixelSchema.parse({
      x: Math.floor(context.camera.x + pixel.x),
      y: Math.floor(context.camera.y + pixel.y),
      colorRef: TRANSPARENT_REF,
    }),
  );

  enqueue.effect(() =>
    store.trigger.newPixels({
      pixels: absolutePixels,
    }),
  );

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

  const nextActiveAction = nextErasureAction(canvasX, canvasY, context);
  const pixels = getNewPixels(nextActiveAction, context);

  enqueue.effect(() =>
    store.trigger.newPixels({
      pixels: pixels.map((point) =>
        pixelSchema.parse({
          x: point.x,
          y: point.y,
          colorRef: TRANSPARENT_REF,
        }),
      ),
    }),
  );

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
