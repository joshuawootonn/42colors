import {
  CHUNK_RENDER_SCALE,
  CANVAS_BUFFER,
  CANVAS_PIXEL_RATIO,
  CHUNK_LENGTH,
} from "./constants";
import { canvasToClientConversion } from "./utils/clientToCanvasConversion";
import { InitializedStore } from "./store";

export function draw(context: InitializedStore) {
  const zoomMultiplier = context.camera.zoom / 100;
  context.canvas.rootCanvas.width = window.innerWidth;
  context.canvas.rootCanvas.height = window.innerHeight;

  context.canvas.rootCanvasContext.translate(
    -canvasToClientConversion(context.camera.x, context.camera.zoom),
    -canvasToClientConversion(context.camera.y, context.camera.zoom),
  );

  context.canvas.rootCanvasContext.drawImage(
    context.canvas.backgroundCanvas,
    -CANVAS_BUFFER,
    -CANVAS_BUFFER,
    window.innerWidth + CANVAS_BUFFER,
    window.innerHeight + CANVAS_BUFFER,
    -CANVAS_BUFFER +
      canvasToClientConversion(context.camera.x, context.camera.zoom),
    -CANVAS_BUFFER +
      canvasToClientConversion(context.camera.y, context.camera.zoom),
    (window.innerWidth + CANVAS_BUFFER) * zoomMultiplier,
    (window.innerHeight + CANVAS_BUFFER) * zoomMultiplier,
  );

  Object.values(context.canvas.chunkCanvases).forEach((chunk) => {
    context.canvas.rootCanvasContext.drawImage(
      chunk.element,
      0,
      0,
      CANVAS_PIXEL_RATIO * CHUNK_LENGTH * CHUNK_RENDER_SCALE,
      CANVAS_PIXEL_RATIO * CHUNK_LENGTH * CHUNK_RENDER_SCALE,
      canvasToClientConversion(chunk.x, context.camera.zoom),
      canvasToClientConversion(chunk.y, context.camera.zoom),
      CANVAS_PIXEL_RATIO * CHUNK_LENGTH * zoomMultiplier,
      CANVAS_PIXEL_RATIO * CHUNK_LENGTH * zoomMultiplier,
    );
  });

  // for (let i = 0; i < context.realtimePixels.length; i++) {
  //   const block = context.realtimePixels[i];
  //   context.canvas.rootCanvasContext.fillRect(
  //     block.x * CANVAS_PIXEL_RATIO,
  //     block.y * CANVAS_PIXEL_RATIO,
  //     CANVAS_PIXEL_RATIO,
  //     CANVAS_PIXEL_RATIO,
  //   );
  // }
  // for (let i = 0; i < context.pixels.length; i++) {
  //   const block = context.pixels[i];
  //   context.canvas.rootCanvasContext.fillRect(
  //     block.x * CANVAS_PIXEL_RATIO,
  //     block.y * CANVAS_PIXEL_RATIO,
  //     CANVAS_PIXEL_RATIO,
  //     CANVAS_PIXEL_RATIO,
  //   );
  // }
}
