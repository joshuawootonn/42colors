import { InitializedStore, store } from "../store";
import {
  canvasToClient,
  clientToCanvas,
} from "../utils/clientToCanvasConversion";
import { COLOR_TABLE, ColorRef } from "../palette";
import { Pixel, pixelSchema, Point } from "../coord";
import { Camera, getZoomMultiplier } from "../camera";
import { getPixelSize, PixelSize } from "../realtime";

import { createAtom } from "@xstate/store";
import { EnqueueObject } from "../xstate-internal-types";
import { dedupeCoords } from "../utils/dedupe-coords";

export const brushSizeState = createAtom(1);

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

function drawBrush(
  ctx: CanvasRenderingContext2D,
  clientX: number,
  clientY: number,
  pixelSize: PixelSize,
) {
  const brushSize = brushSizeState.get();

  switch (brushSize) {
    case 1:
      ctx.fillRect(clientX, clientY, pixelSize, pixelSize);
      break;
    case 2:
      ctx.fillRect(
        clientX - pixelSize,
        clientY - pixelSize,
        pixelSize * 2,
        pixelSize * 2,
      );
      break;
    case 3:
      ctx.fillRect(clientX - pixelSize, clientY, pixelSize * 3, pixelSize);
      ctx.fillRect(clientX, clientY - pixelSize, pixelSize, pixelSize * 3);
      break;
    case 4:
      ctx.fillRect(
        clientX - pixelSize * 2,
        clientY - pixelSize,
        pixelSize * 4,
        pixelSize * 2,
      );
      ctx.fillRect(
        clientX - pixelSize,
        clientY - pixelSize * 2,
        pixelSize * 2,
        pixelSize * 4,
      );
      break;
    case 5:
      ctx.fillRect(
        clientX - pixelSize * 2,
        clientY - pixelSize,
        pixelSize * 5,
        pixelSize * 3,
      );
      ctx.fillRect(
        clientX - pixelSize,
        clientY - pixelSize * 2,
        pixelSize * 3,
        pixelSize * 5,
      );
      break;
    default:
      break;
  }
}

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

  ctx.fillStyle = COLOR_TABLE[context.currentColorRef];

  drawBrush(
    ctx,
    canvasToClient(canvasX, context.camera.zoom),
    canvasToClient(canvasY, context.camera.zoom),
    pixelSize,
  );
}

export function bresenhamLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  camera: Camera,
): Point[] {
  const points: Point[] = [];

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    points.push({ x: x0, y: y0, camera });

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

export function normalizedPointsToCamera(
  points: Point[],
  camera: Camera,
): Point[] {
  return points.map((point) => {
    const canvasX2 = (point.x * camera.zoom) / point.camera.zoom;

    const cameraX2 = (point.camera.x * camera.zoom) / point.camera.zoom;

    const canvasY2 = (point.y * camera.zoom) / point.camera.zoom;

    const cameraY2 = (point.camera.y * camera.zoom) / point.camera.zoom;

    const x = Math.floor(canvasX2 + cameraX2 - camera.x);
    const y = Math.floor(canvasY2 + cameraY2 - camera.y);
    return {
      x,
      y,
      camera,
    };
  });
}

export function pointsToPixels(points: Point[], colorRef: ColorRef): Pixel[] {
  return points.map((point) =>
    pixelSchema.parse({
      x: Math.floor(point.x + point.camera.x),
      y: Math.floor(point.y + point.camera.y),
      colorRef: colorRef,
    }),
  );
}

export type BrushActive = {
  type: "brush-active";
  colorRef: ColorRef;
  points: Point[];
};

export function isDuplicatePoint(
  canvasX: number,
  canvasY: number,
  context: InitializedStore,
) {
  if (context.activeAction?.type !== "brush-active") return false;
  const lastPoint = context.activeAction?.points.at(-1);
  return lastPoint?.x === canvasX && lastPoint?.x === canvasY;
}

export function startBrushAction(
  canvasX: number,
  canvasY: number,
  context: InitializedStore,
): BrushActive {
  return {
    type: "brush-active",
    colorRef: context.currentColorRef,
    points: [{ x: canvasX, y: canvasY, camera: context.camera }],
  };
}

export function nextBrushAction(
  activeBrushAction: BrushActive,
  newPoints: Point[],
): BrushActive {
  return {
    ...activeBrushAction,
    points: dedupeCoords(activeBrushAction.points.concat(newPoints)),
  };
}

function onPointerDown(
  e: PointerEvent,
  context: InitializedStore,
  enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
  const { canvasX, canvasY } = getCanvasXY(e.clientX, e.clientY, context);

  const nextActiveAction = startBrushAction(canvasX, canvasY, context);

  enqueue.effect(() => {
    store.trigger.newPixels({
      pixels: pointsToPixels(
        nextActiveAction.points,
        nextActiveAction.colorRef,
      ),
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
    context.activeAction?.type !== "brush-active" ||
    isDuplicatePoint(canvasX, canvasY, context)
  ) {
    return context;
  }

  const newPoints = bresenhamLine(
    context.activeAction.points.at(-1)!.x,
    context.activeAction.points.at(-1)!.y,
    canvasX,
    canvasY,
    context.camera,
  );

  const nextActiveAction = nextBrushAction(context.activeAction, newPoints);
  enqueue.effect(() => {
    store.trigger.newPixels({
      pixels: pointsToPixels(newPoints, nextActiveAction.colorRef),
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
    context.activeAction?.type !== "brush-active" ||
    isDuplicatePoint(canvasX, canvasY, context)
  ) {
    return context;
  }

  const newPoints = bresenhamLine(
    context.activeAction.points.at(-1)!.x,
    context.activeAction.points.at(-1)!.y,
    canvasX,
    canvasY,
    context.camera,
  );
  const dedupedNewPoints = dedupeCoords(newPoints);

  const nextActiveAction = nextBrushAction(
    context.activeAction,
    dedupedNewPoints,
  );
  enqueue.effect(() => {
    store.trigger.newPixels({
      pixels: pointsToPixels(newPoints, nextActiveAction.colorRef),
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
  redrawTelegraph,
};

export type BrushTool = typeof BrushTool;
