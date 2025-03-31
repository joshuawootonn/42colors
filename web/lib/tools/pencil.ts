import {
  canvasToClient,
  clientToCanvas,
} from "../utils/clientToCanvasConversion";
import { InitializedStore, store } from "../store";
import { CANVAS_PIXEL_RATIO } from "../constants";
import { EnqueueObject } from "@xstate/store";

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

function drawTelegraph(
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

export function redrawTelegraph(
  clientX: number,
  clientY: number,
  context: InitializedStore,
) {
  const { canvasX, canvasY } = getCanvasXY(clientX, clientY, context);
  drawTelegraph(canvasX, canvasY, context);
}

function onPointerMove(
  e: PointerEvent,
  context: InitializedStore,
  enqueue: EnqueueObject<{ type: string }>,
) {
  const camera = context.camera;

  const { canvasX, canvasY } = getCanvasXY(e.clientX, e.clientY, context);
  drawTelegraph(canvasX, canvasY, context);

  if (context.interaction.isPressed) {
    const x = Math.floor(camera.x + canvasX);
    const y = Math.floor(camera.y + canvasY);
    enqueue.effect(() =>
      store.trigger.newPixel({ pixel: { x, y, color: "black" } }),
    );
  }
}

export const PencilTool = { redrawTelegraph, onPointerMove };
export type PencilTool = typeof PencilTool;
