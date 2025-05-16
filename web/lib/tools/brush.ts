import { InitializedStore, store } from "../store";
import {
  canvasToClient,
  clientToCanvas,
} from "../utils/clientToCanvasConversion";
import { COLOR_TABLE, ColorRef } from "../palette";
import { Pixel, pixelSchema, Point, pointSchema } from "../coord";
import { Camera, getZoomMultiplier } from "../camera";
import { getPixelSize } from "../realtime";

import { createAtom } from "@xstate/store";
import { EnqueueObject } from "../xstate-internal-types";
import { dedupeCoords } from "../utils/dedupe-coords";
import { newNewCoords } from "../utils/net-new-coords";

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

export function getBrushPoints(
  points: Point[],
  brushSize: number,
  pixelSize: number,
): Point[] {
  const nextPoints: Point[] = [];
  for (let i = 0; i < points.length; i++) {
    const point = points[i];

    switch (brushSize) {
      case 1:
        nextPoints.push({ ...point });
        break;

      case 2:
        nextPoints.push({ ...point });
        nextPoints.push({ ...point, x: point.x - pixelSize });
        nextPoints.push({ ...point, y: point.y - pixelSize });
        nextPoints.push({
          ...point,
          x: point.x - pixelSize,
          y: point.y - pixelSize,
        });
        break;

      case 3:
        nextPoints.push({ ...point });
        nextPoints.push({ ...point, x: point.x - pixelSize });
        nextPoints.push({ ...point, y: point.y - pixelSize });
        nextPoints.push({ ...point, x: point.x + pixelSize });
        nextPoints.push({ ...point, y: point.y + pixelSize });
        break;

      case 4:
        for (let i = -2; i <= 1; i++) {
          for (let j = -2; j <= 1; j++) {
            if ((i === -2 || i === 1) && (j === 1 || j === -2)) continue;
            nextPoints.push({
              x: point.x + i * pixelSize,
              y: point.y + j * pixelSize,
              camera: point.camera,
            });
          }
        }
        break;

      case 5:
        for (let i = -2; i <= 2; i++) {
          for (let j = -2; j <= 2; j++) {
            if (Math.abs(i) === 2 && Math.abs(j) === 2) continue;
            nextPoints.push({
              x: point.x + i * pixelSize,
              y: point.y + j * pixelSize,
              camera: point.camera,
            });
          }
        }

        break;

      default:
        break;
    }
  }

  return dedupeCoords(nextPoints);
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

  const point = pointSchema.parse({
    x: canvasToClient(canvasX, context.camera.zoom),
    y: canvasToClient(canvasY, context.camera.zoom),
    camera: context.camera,
  });
  const brushPoints = getBrushPoints([point], brushSizeState.get(), pixelSize);

  for (let i = 0; i < brushPoints.length; i++) {
    const point = brushPoints[i];
    ctx.fillRect(point.x, point.y, pixelSize, pixelSize);
  }
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
  anchorPoints: Point[];
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
  anchorPoint: Point,
  brushPoints: Point[],
  colorRef: ColorRef,
): BrushActive {
  return {
    type: "brush-active",
    colorRef: colorRef,
    points: brushPoints,
    anchorPoints: [anchorPoint],
  };
}

export function nextBrushAction(
  activeBrushAction: BrushActive,
  newAnchorPoints: Point[],
  newBrushPoints: Point[],
): BrushActive {
  return {
    ...activeBrushAction,
    anchorPoints: activeBrushAction.anchorPoints.concat(newAnchorPoints),
    points: activeBrushAction.points.concat(newBrushPoints),
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
  const brushPoints = getBrushPoints([anchorPoint], brushSizeState.get(), 1);

  const nextActiveAction = startBrushAction(
    anchorPoint,
    brushPoints,
    context.currentColorRef,
  );

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
  const newBrushPoints = getBrushPoints(netNewAnchors, brushSizeState.get(), 1);
  const netNewPixels = newNewCoords(
    context.activeAction.points,
    newBrushPoints,
  );
  const nextActiveAction = nextBrushAction(
    context.activeAction,
    newAnchorPoints,
    newBrushPoints,
  );
  enqueue.effect(() => {
    store.trigger.newPixels({
      pixels: pointsToPixels(netNewPixels, nextActiveAction.colorRef),
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
  const newBrushPoints = getBrushPoints(netNewAnchors, brushSizeState.get(), 1);
  const netNewPixels = newNewCoords(
    context.activeAction.points,
    newBrushPoints,
  );
  const nextActiveAction = nextBrushAction(
    context.activeAction,
    newAnchorPoints,
    newBrushPoints,
  );
  enqueue.effect(() => {
    store.trigger.newPixels({
      pixels: pointsToPixels(netNewPixels, nextActiveAction.colorRef),
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
