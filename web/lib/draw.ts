import { BACKGROUND_SIZE, CANVAS_PIXEL_RATIO, CHUNK_LENGTH } from "./constants";
import { canvasToClient } from "./utils/clientToCanvasConversion";
import { InitializedStore } from "./store";

export function draw(context: InitializedStore) {
  const zoomMultiplier = context.camera.zoom / 100;
  const cameraXStart = Math.floor(context.camera.x);
  const cameraYStart = Math.floor(context.camera.y);
  context.canvas.rootCanvas.width = window.innerWidth;
  context.canvas.rootCanvas.height = window.innerHeight;
  context.canvas.rootCanvasContext.imageSmoothingEnabled = false;
  context.canvas.rootCanvasContext.clearRect(
    0,
    0,
    context.canvas.rootCanvas.width,
    context.canvas.rootCanvas.height,
  );

  context.canvas.rootCanvasContext.translate(
    -canvasToClient(context.camera.x, context.camera.zoom),
    -canvasToClient(context.camera.y, context.camera.zoom),
  );

  const x = canvasToClient(cameraXStart, context.camera.zoom);
  const y = canvasToClient(cameraYStart, context.camera.zoom);

  context.canvas.rootCanvasContext.drawImage(
    context.canvas.backgroundCanvas,
    x,
    y,
    window.innerWidth * zoomMultiplier * BACKGROUND_SIZE,
    window.innerHeight * zoomMultiplier * BACKGROUND_SIZE,
  );

  Object.values(context.canvas.chunkCanvases).forEach((chunk) => {
    context.canvas.rootCanvasContext.imageSmoothingEnabled = false;
    context.canvas.rootCanvasContext.drawImage(
      chunk.element,
      canvasToClient(chunk.x, context.camera.zoom),
      canvasToClient(chunk.y, context.camera.zoom),
      CANVAS_PIXEL_RATIO * CHUNK_LENGTH * zoomMultiplier,
      CANVAS_PIXEL_RATIO * CHUNK_LENGTH * zoomMultiplier,
    );
  });

  context.canvas.rootCanvasContext.drawImage(
    context.canvas.realtimeCanvas,
    x,
    y,
    window.innerWidth,
    window.innerHeight,
  );

  context.canvas.rootCanvasContext.drawImage(
    context.canvas.userCanvas,
    x,
    y,
    window.innerWidth,
    window.innerHeight,
  );

  context.canvas.rootCanvasContext.drawImage(
    context.canvas.telegraphCanvas,
    x,
    y,
    window.innerWidth,
    window.innerHeight,
  );
}
