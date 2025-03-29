import { CANVAS_PIXEL_RATIO } from "./constants";
import { Pixel } from "./pixel";
import { Camera } from "./store";
import { canvasToClientConversion } from "./utils/clientToCanvasConversion";
import { roundToFive } from "./utils/round-to-five";

export function createCanvas() {
  const canvas = document.createElement("canvas");
  return resizeCanvas(canvas);
}

export function resizeCanvas(canvas: HTMLCanvasElement) {
  canvas.width = roundToFive(window.innerWidth);
  canvas.height = roundToFive(window.innerHeight);
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

    context.fillRect(
      canvasToClientConversion(block.x - Math.floor(camera.x), camera.zoom),
      canvasToClientConversion(block.y - Math.floor(camera.y), camera.zoom),
      CANVAS_PIXEL_RATIO * zoomMultiplier,
      CANVAS_PIXEL_RATIO * zoomMultiplier,
    );
  }
}
