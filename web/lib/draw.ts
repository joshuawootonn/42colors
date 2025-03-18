import { BACKGROUND_SIZE, CANVAS_PIXEL_RATIO, CHUNK_LENGTH } from "./constants";
import { canvasToClientConversion } from "./utils/clientToCanvasConversion";
import { InitializedStore } from "./store";
import { roundToFive } from "./utils/round-to-five";

export function draw(context: InitializedStore) {
  const zoomMultiplier = context.camera.zoom / 100;
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
    -canvasToClientConversion(context.camera.x, context.camera.zoom),
    -canvasToClientConversion(context.camera.y, context.camera.zoom),
  );

  context.canvas.rootCanvasContext.drawImage(
    context.canvas.backgroundCanvas,
    canvasToClientConversion(context.camera.x, context.camera.zoom),
    canvasToClientConversion(context.camera.y, context.camera.zoom),
    window.innerWidth * zoomMultiplier * BACKGROUND_SIZE,
    window.innerHeight * zoomMultiplier * BACKGROUND_SIZE,
  );

  Object.values(context.canvas.chunkCanvases).forEach((chunk) => {
    context.canvas.rootCanvasContext.imageSmoothingEnabled = false;
    context.canvas.rootCanvasContext.drawImage(
      chunk.element,
      canvasToClientConversion(chunk.x, context.camera.zoom),
      canvasToClientConversion(chunk.y, context.camera.zoom),
      CANVAS_PIXEL_RATIO * CHUNK_LENGTH * zoomMultiplier,
      CANVAS_PIXEL_RATIO * CHUNK_LENGTH * zoomMultiplier,
    );
  });

  context.canvas.rootCanvasContext.drawImage(
    context.canvas.realtimeCanvas,
    canvasToClientConversion(context.camera.x, context.camera.zoom),
    canvasToClientConversion(context.camera.y, context.camera.zoom),
    roundToFive(window.innerWidth),
    roundToFive(window.innerHeight),
  );

  context.canvas.rootCanvasContext.drawImage(
    context.canvas.userCanvas,
    canvasToClientConversion(context.camera.x, context.camera.zoom),
    canvasToClientConversion(context.camera.y, context.camera.zoom),
    roundToFive(window.innerWidth),
    roundToFive(window.innerHeight),
  );
}
