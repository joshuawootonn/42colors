import { EnqueueObject } from "@xstate/store";
import { CANVAS_PIXEL_RATIO } from "../constants";
import { InitializedStore, Point, store } from "../store";
import {
  clientToCanvas,
  canvasToClient,
} from "../utils/clientToCanvasConversion";
import { COLOR_TABLE } from "../palette";
import { ErasureActive } from "./erasure";
import { pixelSchema } from "../pixel";

export function getCanvasXY(
  clientX: number,
  clientY: number,
  context: InitializedStore,
): { canvasX: number; canvasY: number } {
  const camera = context.camera;
  const xFloor = Math.floor(camera.x);
  const yFloor = Math.floor(camera.y);

  const xOffset = camera.x - xFloor;
  const yOffset = camera.y - yFloor;

  const canvasX = clientToCanvas(clientX, camera.zoom, xOffset);
  const canvasY = clientToCanvas(clientY, camera.zoom, yOffset);
  return { canvasX, canvasY };
}

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
  context.canvas.telegraphCanvasContext.fillRect(
    canvasToClient(canvasX, context.camera.zoom),
    canvasToClient(canvasY, context.camera.zoom),
    CANVAS_PIXEL_RATIO * zoomMultiplier,
    CANVAS_PIXEL_RATIO * zoomMultiplier,
  );
}

type Pixel = { x: number; y: number };

export function bresenhamLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Pixel[] {
  const points: Pixel[] = [];

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    points.push({ x: x0, y: y0 });

    if (x0 === x1 && y0 === y1) {
      break;
    }

    const e2 = 2 * err;

    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }

    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }

  return points;
}

export function normalizedPointToCurrentCamera(
  point: Point,
  context: InitializedStore,
): Point {
  const canvasX2 = (point.canvasX * context.camera.zoom) / point.camera.zoom;

  const cameraX2 = (point.camera.x * context.camera.zoom) / point.camera.zoom;

  const canvasY2 = (point.canvasY * context.camera.zoom) / point.camera.zoom;

  const cameraY2 = (point.camera.y * context.camera.zoom) / point.camera.zoom;

  const x = Math.floor(canvasX2 + cameraX2 - context.camera.x);
  const y = Math.floor(canvasY2 + cameraY2 - context.camera.y);
  return {
    canvasX: x,
    canvasY: y,
    camera: context.camera,
  };
}

export function getNewPixels(
  action: BrushActive | ErasureActive,
  context: InitializedStore,
): Pixel[] {
  if (action.points.length < 2) {
    console.info(
      `"drawLastPoints" was called with ${action.points.length} points`,
    );
    return [];
  }

  const normalizedFirstPoint = normalizedPointToCurrentCamera(
    action.points.at(-2)!,
    context,
  );
  const secondPoint = action.points.at(-1)!;

  const points = bresenhamLine(
    normalizedFirstPoint.canvasX,
    normalizedFirstPoint.canvasY,
    secondPoint.canvasX,
    secondPoint.canvasY,
  );

  return points;
}

type BrushActive = {
  type: "brush-active";
  points: Point[];
};

export function isDuplicatePoint(
  canvasX: number,
  canvasY: number,
  context: InitializedStore,
) {
  if (context.activeAction?.type !== "brush-active") return false;
  const lastPoint = context.activeAction?.points.at(-1);
  return lastPoint?.canvasX === canvasX && lastPoint?.canvasX === canvasY;
}

export function startBrushAction(
  canvasX: number,
  canvasY: number,
  context: InitializedStore,
): BrushActive {
  return {
    type: "brush-active",
    points: [{ canvasX, canvasY, camera: context.camera }],
  };
}

export function nextBrushAction(
  canvasX: number,
  canvasY: number,
  context: InitializedStore,
): BrushActive {
  if (context.activeAction?.type !== "brush-active")
    throw new Error("continueBrushing was called when you weren't brushing");

  return {
    type: "brush-active",
    points: context.activeAction.points.concat({
      canvasX,
      canvasY,
      camera: context.camera,
    }),
  };
}

function onPointerDown(
  e: PointerEvent,
  context: InitializedStore,
  _: EnqueueObject<{ type: string }>,
): InitializedStore {
  const { canvasX, canvasY } = getCanvasXY(e.clientX, e.clientY, context);
  drawUnactiveTelegraph(canvasX, canvasY, context);

  return {
    ...context,
    activeAction: startBrushAction(canvasX, canvasY, context),
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
    context.activeAction?.type !== "brush-active" ||
    isDuplicatePoint(canvasX, canvasY, context)
  ) {
    return context;
  }

  const nextActiveAction = nextBrushAction(canvasX, canvasY, context);
  const pixels = getNewPixels(nextActiveAction, context);
  const absolutePixels = pixels.map((pixel) =>
    pixelSchema.parse({
      x: Math.floor(context.camera.x + pixel.x),
      y: Math.floor(context.camera.y + pixel.y),
      colorRef: context.currentColorRef,
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
    context.activeAction?.type !== "brush-active" ||
    isDuplicatePoint(canvasX, canvasY, context)
  ) {
    return context;
  }

  const nextActiveAction = nextBrushAction(canvasX, canvasY, context);
  const pixels = getNewPixels(nextActiveAction, context);

  enqueue.effect(() =>
    store.trigger.newPixels({
      pixels: pixels.map((point) =>
        pixelSchema.parse({
          x: point.x,
          y: point.y,
          colorRef: context.currentColorRef,
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
  if (context.activeAction?.type !== "brush-active") return context;

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
  if (context.activeAction?.type !== "brush-active") return context;

  return {
    ...context,
    activeAction: null,
    actions: context.actions.concat(context.activeAction),
  };
}

export const BrushTool = {
  onPointerMove,
  onPointerDown,
  onPointerUp,
  onPointerOut,
  onWheel,
};

export type BrushTool = typeof BrushTool;
