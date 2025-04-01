import { EnqueueObject } from "@xstate/store";
import { CANVAS_PIXEL_RATIO } from "../constants";
import { Camera, InitializedStore, Point } from "../store";
import {
  clientToCanvas,
  canvasToClient,
} from "../utils/clientToCanvasConversion";

function getCanvasXY(
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

function drawUnActiveTelegraph(
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
  context.canvas.telegraphCanvasContext.fillRect(
    canvasToClient(canvasX, context.camera.zoom),
    canvasToClient(canvasY, context.camera.zoom),
    CANVAS_PIXEL_RATIO * zoomMultiplier,
    CANVAS_PIXEL_RATIO * zoomMultiplier,
  );
}

type Pixel = [number, number];

function bresenhamLine(
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
    points.push([x0, y0]);

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

function drawActiveTelegraph(action: BrushActive, context: InitializedStore) {
  context.canvas.telegraphCanvasContext.clearRect(
    0,
    0,
    context.canvas.telegraphCanvasContext.canvas.width,
    context.canvas.telegraphCanvasContext.canvas.height,
  );

  let pixels: Pixel[] = [];

  //todo what about just one point
  for (let index = 0; index < action.points.length - 1; index++) {
    const element = action.points[index];
    const next = action.points[index + 1];

    const p = bresenhamLine(element.x, element.y, next.x, next.y);
    pixels = pixels.concat(p);
  }

  const zoomMultiplier = context.camera.zoom / 100;
  for (let index = 0; index < pixels.length; index++) {
    const pixel = pixels[index];
    // console.log(
    //   pixel,
    //   canvasToClient(pixel[0], context.camera.zoom),
    //   canvasToClient(pixel[1], context.camera.zoom),
    // );
    context.canvas.telegraphCanvasContext.fillRect(
      canvasToClient(pixel[0], context.camera.zoom),
      canvasToClient(pixel[1], context.camera.zoom),
      CANVAS_PIXEL_RATIO * zoomMultiplier,
      CANVAS_PIXEL_RATIO * zoomMultiplier,
    );
  }
}

export function redrawTelegraph(
  clientX: number,
  clientY: number,
  context: InitializedStore,
) {
  const { canvasX, canvasY } = getCanvasXY(clientX, clientY, context);
  drawUnActiveTelegraph(canvasX, canvasY, context);
}

type BrushActive = {
  type: "brush-active";
  camera: Camera;
  points: Point[];
};

type BrushActions = BrushActive;

export function startBrushing(
  canvasX: number,
  canvasY: number,
  context: InitializedStore,
): BrushActive {
  return {
    type: "brush-active",
    camera: context.camera,
    points: [{ x: canvasX, y: canvasY }],
  };
}
export function continueBrushing(
  canvasX: number,
  canvasY: number,
  context: InitializedStore,
): BrushActive {
  if (context.activeAction?.type !== "brush-active")
    throw new Error("continueBrushing was called when you weren't brushing");

  const lastPoint = context.activeAction.points.at(-1);
  if (lastPoint?.x === canvasX && lastPoint?.y === canvasY)
    return context.activeAction;

  return {
    type: "brush-active",
    camera: context.camera,
    points: context.activeAction.points.concat({ x: canvasX, y: canvasY }),
  };
}

function onPointerDown(
  e: PointerEvent,
  context: InitializedStore,
  _: EnqueueObject<{ type: string }>,
): InitializedStore {
  const { canvasX, canvasY } = getCanvasXY(e.clientX, e.clientY, context);
  drawUnActiveTelegraph(canvasX, canvasY, context);

  const x = Math.floor(canvasX);
  const y = Math.floor(canvasY);

  return {
    ...context,
    activeAction: startBrushing(x, y, context),
  };
}

function onPointerMove(
  e: PointerEvent,
  context: InitializedStore,
  _: EnqueueObject<{ type: string }>,
): InitializedStore {
  const { canvasX, canvasY } = getCanvasXY(e.clientX, e.clientY, context);

  if (context.activeAction?.type !== "brush-active") {
    drawUnActiveTelegraph(canvasX, canvasY, context);
    return context;
  }

  const x = Math.floor(canvasX);
  const y = Math.floor(canvasY);
  const nextActiveAction = continueBrushing(x, y, context);
  drawActiveTelegraph(nextActiveAction, context);

  return {
    ...context,
    activeAction: nextActiveAction,
  };
}

function onPointerOut(
  e: PointerEvent,
  context: InitializedStore,
  _: EnqueueObject<{ type: string }>,
): InitializedStore {
  if (context.activeAction?.type !== "brush-active") return context;

  return {
    ...context,
    activeAction: null,
    actions: context.actions.concat(context.activeAction),
  };
}

function onPointerUp(
  e: PointerEvent,
  context: InitializedStore,
  _: EnqueueObject<{ type: string }>,
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
};

export type BrushTool = typeof BrushTool;
