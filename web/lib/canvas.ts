import { CANVAS_PIXEL_RATIO } from "./constants";
import { Pixel } from "./pixel";
import { Camera } from "./store";
import { canvasToClient } from "./utils/clientToCanvasConversion";

export function createCanvas() {
  const canvas = document.createElement("canvas");
  return resizeCanvas(canvas);
}

export function resizeCanvas(canvas: HTMLCanvasElement) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  return canvas;
}

export function redrawPixels(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  pixels: Pixel[],
  camera: Camera,
) {
  const zoomMultiplier = camera.zoom / 100;
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < pixels.length; i++) {
    const block = pixels[i];

    context.fillStyle = block.color;
    context.fillRect(
      canvasToClient(block.x - Math.floor(camera.x), camera.zoom),
      canvasToClient(block.y - Math.floor(camera.y), camera.zoom),
      CANVAS_PIXEL_RATIO * zoomMultiplier,
      CANVAS_PIXEL_RATIO * zoomMultiplier,
    );
  }
}
