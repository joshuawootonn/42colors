import { CANVAS_PIXEL_RATIO } from "./constants";
import { COLOR_TABLE } from "./palette";
import { Pixel } from "./pixel";
import { Camera } from "./store";
import { canvasToClient } from "./utils/clientToCanvasConversion";
import { roundTo3Places } from "./utils/round-to-five";

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
  const pixelSize = roundTo3Places(zoomMultiplier * CANVAS_PIXEL_RATIO);

  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < pixels.length; i++) {
    const block: Pixel = pixels[i];

    context.fillStyle = COLOR_TABLE[block.colorRef];
    context.fillRect(
      canvasToClient(block.x - Math.floor(camera.x), camera.zoom),
      canvasToClient(block.y - Math.floor(camera.y), camera.zoom),
      pixelSize,
      pixelSize,
    );
  }
}
