import {
  canvasToClient,
  clientToCanvas,
} from "../utils/clientToCanvasConversion";
import { InitializedStore, store } from "../store";
import { CANVAS_PIXEL_RATIO } from "../constants";

function onPointerMove(e: PointerEvent, context: InitializedStore) {
  const camera = context.camera;

  const xFloor = Math.floor(camera.x);
  const yFloor = Math.floor(camera.y);

  const xOffset = camera.x - xFloor;
  const yOffset = camera.y - yFloor;

  const canvasX = clientToCanvas(e.clientX, camera.zoom, xOffset);
  const canvasY = clientToCanvas(e.clientY, camera.zoom, yOffset);

  context.canvas.telegraphCanvasContext.clearRect(
    0,
    0,
    context.canvas.telegraphCanvasContext.canvas.width,
    context.canvas.telegraphCanvasContext.canvas.height,
  );

  const zoomMultiplier = camera.zoom / 100;
  context.canvas.telegraphCanvasContext.fillRect(
    canvasToClient(canvasX, camera.zoom),
    canvasToClient(canvasY, camera.zoom),
    CANVAS_PIXEL_RATIO * zoomMultiplier,
    CANVAS_PIXEL_RATIO * zoomMultiplier,
  );

  if (context.interaction.isPressed) {
    const x = Math.floor(camera.x + canvasX);
    const y = Math.floor(camera.y + canvasY);
    store.trigger.newPixel({ pixel: { x, y, color: "black" } });
  }
}

export const PencilTool = { onPointerMove };
export type PencilTool = typeof PencilTool;
