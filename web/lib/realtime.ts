import { z } from "zod";
import { CANVAS_PIXEL_RATIO } from "./constants";
import { COLOR_TABLE } from "./palette";
import { Pixel } from "./pixel";
import { Camera, getZoomMultiplier, ZoomMultiplier } from "./camera";

export function createRealtimeCanvas(camera: Camera) {
  const canvas = document.createElement("canvas");
  return resizeRealtimeCanvas(canvas, camera);
}

const pixelSizeSchema = z.number().brand<"PixelSize">();
export type PixelSize = z.infer<typeof pixelSizeSchema>;

export function getPixelSize(zoomMultiplier: ZoomMultiplier): PixelSize {
  return pixelSizeSchema.parse(CANVAS_PIXEL_RATIO * zoomMultiplier);
}

export function getSizeInPixelsPlusBleed(length: number, pixelSize: PixelSize) {
  return Math.ceil(length / pixelSize) + 1;
}

export function resizeRealtimeCanvas(
  canvas: HTMLCanvasElement,
  camera: Camera,
) {
  const pixelSize = getPixelSize(getZoomMultiplier(camera));

  canvas.width = getSizeInPixelsPlusBleed(window.innerWidth, pixelSize);
  canvas.height = getSizeInPixelsPlusBleed(window.innerHeight, pixelSize);
  return canvas;
}

export function redrawRealtimePixels(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  pixels: Pixel[],
  camera: Camera,
) {
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < pixels.length; i++) {
    const block: Pixel = pixels[i];

    context.fillStyle = COLOR_TABLE[block.colorRef];
    context.fillRect(
      block.x - Math.floor(camera.x),
      block.y - Math.floor(camera.y),
      1,
      1,
    );
  }
}
