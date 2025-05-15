import {
  canvasToClient,
  clientToCanvas,
} from "../utils/clientToCanvasConversion";
import { InitializedStore, store } from "../store";
import { pixelSchema } from "../coord";
import { getZoomMultiplier } from "../camera";
import { COLOR_TABLE } from "../palette";
import { getPixelSize } from "../realtime";
import { EnqueueObject } from "../xstate-internal-types";

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

export function redrawTelegraph(
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
  ctx.fillRect(
    canvasToClient(canvasX, context.camera.zoom),
    canvasToClient(canvasY, context.camera.zoom),
    pixelSize,
    pixelSize,
  );
}

function onPointerMove(
  e: PointerEvent,
  context: InitializedStore,
  enqueue: EnqueueObject<{ type: string }>,
) {
  const camera = context.camera;

  const { canvasX, canvasY } = getCanvasXY(e.clientX, e.clientY, context);

  if (context.interaction.isPressed) {
    const x = Math.floor(camera.x + canvasX);
    const y = Math.floor(camera.y + canvasY);
    enqueue.effect(() =>
      store.trigger.newPixels({
        pixels: [
          pixelSchema.parse({ x, y, colorRef: context.currentColorRef }),
        ],
      }),
    );
  }
}

export const PencilTool = { redrawTelegraph, onPointerMove };
export type PencilTool = typeof PencilTool;
