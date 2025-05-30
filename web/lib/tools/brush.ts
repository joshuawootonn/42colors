import { InitializedStore, store } from "../store";
import {
  canvasToClient,
  clientToCanvas,
} from "../utils/clientToCanvasConversion";
import { COLOR_TABLE, ColorRef } from "../palette";
import {
  AbsolutePoint,
  absolutePointSchema,
  cursorPositionSchema,
  Pixel,
  pixelSchema,
  Point,
  pointSchema,
} from "../coord";
import { Camera, getZoomMultiplier } from "../camera";
import { getPixelSize } from "../realtime";

import { EnqueueObject } from "../xstate-internal-types";
import { dedupeCoords } from "../utils/dedupe-coords";
import { newNewCoords } from "../utils/net-new-coords";
import { drawBrushOutline } from "./brush-rendering";

export type BrushSettings = {
  size: number;
};

export function getCameraOffset(camera: Camera): {
  xOffset: number;
  yOffset: number;
  xFloor: number;
  yFloor: number;
} {
  const xFloor = Math.floor(camera.x);
  const yFloor = Math.floor(camera.y);

  const xOffset = camera.x - xFloor;
  const yOffset = camera.y - yFloor;
  return { xOffset, yOffset, xFloor, yFloor };
}

export function getRelativePoint(
  clientX: number,
  clientY: number,
  context: InitializedStore,
): Point {
  const { xOffset, yOffset } = getCameraOffset(context.camera);

  const x = clientToCanvas(clientX, context.camera.zoom, xOffset);
  const y = clientToCanvas(clientY, context.camera.zoom, yOffset);
  return pointSchema.parse({ x, y, camera: context.camera });
}

export function getAbsolutePoint(
  clientX: number,
  clientY: number,
  context: InitializedStore,
): AbsolutePoint {
  const { xOffset, yOffset, xFloor, yFloor } = getCameraOffset(context.camera);

  const x = clientToCanvas(clientX, context.camera.zoom, xOffset) + xFloor;
  const y = clientToCanvas(clientY, context.camera.zoom, yOffset) + yFloor;
  return absolutePointSchema.parse({ x, y });
}

export function getBrushPoints(
  points: AbsolutePoint[],
  brushSize: number,
  pixelSize: number,
): AbsolutePoint[] {
  const nextPoints: AbsolutePoint[] = [];
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
            nextPoints.push(
              absolutePointSchema.parse({
                x: point.x + i * pixelSize,
                y: point.y + j * pixelSize,
              }),
            );
          }
        }
        break;

      case 5:
        for (let i = -2; i <= 2; i++) {
          for (let j = -2; j <= 2; j++) {
            if (Math.abs(i) === 2 && Math.abs(j) === 2) continue;
            nextPoints.push(
              absolutePointSchema.parse({
                x: point.x + i * pixelSize,
                y: point.y + j * pixelSize,
              }),
            );
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
  const relativePoint = getRelativePoint(clientX, clientY, context);
  const ctx = context.canvas.telegraphCanvasContext;
  const canvas = context.canvas.telegraphCanvas;

  const pixelSize = getPixelSize(getZoomMultiplier(context.camera));

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = COLOR_TABLE[context.toolSettings.palette.currentColorRef];

  const cursorPosition = cursorPositionSchema.parse({
    x: canvasToClient(relativePoint.x, context.camera.zoom),
    y: canvasToClient(relativePoint.y, context.camera.zoom),
  });

  drawBrushOutline(
    ctx,
    cursorPosition,
    context.toolSettings.brush.size,
    pixelSize,
  );
  ctx.fill();
}

export function bresenhamLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): AbsolutePoint[] {
  const points: AbsolutePoint[] = [];

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    points.push(absolutePointSchema.parse({ x: x0, y: y0 }));

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

export function pointsToPixels(
  points: AbsolutePoint[],
  colorRef: ColorRef,
): Pixel[] {
  return points.map((point) =>
    pixelSchema.parse({
      ...point,
      colorRef: colorRef,
    }),
  );
}

export type BrushActive = {
  type: "brush-active";
  colorRef: ColorRef;
  points: AbsolutePoint[];
  anchorPoints: AbsolutePoint[];
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
  anchorPoint: AbsolutePoint,
  brushPoints: AbsolutePoint[],
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
  newAnchorPoints: AbsolutePoint[],
  newBrushPoints: AbsolutePoint[],
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
  const anchorPoint = getAbsolutePoint(e.clientX, e.clientY, context);

  const brushPoints = getBrushPoints(
    [anchorPoint],
    context.toolSettings.brush.size,
    1,
  );

  const nextActiveAction = startBrushAction(
    anchorPoint,
    brushPoints,
    context.toolSettings.palette.currentColorRef,
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
  const { x, y } = getAbsolutePoint(e.clientX, e.clientY, context);

  if (
    context.activeAction?.type !== "brush-active" ||
    isDuplicatePoint(x, y, context)
  ) {
    return context;
  }

  const newAnchorPoints = bresenhamLine(
    context.activeAction.anchorPoints.at(-1)!.x,
    context.activeAction.anchorPoints.at(-1)!.y,
    x,
    y,
  );

  const netNewAnchors = newNewCoords(
    context.activeAction.anchorPoints,
    newAnchorPoints,
  );
  const newBrushPoints = getBrushPoints(
    netNewAnchors,
    context.toolSettings.brush.size,
    1,
  );
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
  const { x, y } = getAbsolutePoint(e.clientX, e.clientY, context);

  if (
    context.activeAction?.type !== "brush-active" ||
    isDuplicatePoint(x, y, context)
  ) {
    return context;
  }

  const newAnchorPoints = bresenhamLine(
    context.activeAction.anchorPoints.at(-1)!.x,
    context.activeAction.anchorPoints.at(-1)!.y,
    x,
    y,
  );

  const netNewAnchors = newNewCoords(
    context.activeAction.anchorPoints,
    newAnchorPoints,
  );
  const newBrushPoints = getBrushPoints(
    netNewAnchors,
    context.toolSettings.brush.size,
    1,
  );
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
