import { z } from "zod";
import { CANVAS_PIXEL_RATIO } from "../constants";
import { COLOR_TABLE } from "../palette";
import { Pixel } from "../geometry/coord";
import { Camera, getZoomMultiplier, ZoomMultiplier } from "../camera";
import { InitializedStore } from "../store";
import { Plot } from "../tools/claimer/claimer.rest";
import { redrawPolygon } from "../tools/claimer/claimer";
import { getCameraOffset } from "../tools/brush";

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

export function redrawUserPlots(context: InitializedStore) {
  const ctx = context.canvas.nonPixelCanvasContext;
  const userPlotData: Plot[] | undefined = context.queryClient.getQueryData([
    "user",
    "plots",
  ]);

  if (userPlotData == null) {
    return context;
  }

  ctx.imageSmoothingEnabled = false;

  const pixelSize = getPixelSize(getZoomMultiplier(context.camera));

  const { xOffset, yOffset } = getCameraOffset(context.camera);
  for (let i = 0; i < userPlotData.length; i++) {
    if (userPlotData[i].id === context.toolSettings.claimer.selectedPlotId) {
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.strokeStyle = "rgba(0,0,255,1)";
    } else {
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    }

    redrawPolygon(ctx, userPlotData[i].polygon, {
      containsMatchingEndpoints: true,
      xOffset,
      yOffset,
      xCamera: context.camera.x,
      yCamera: context.camera.y,
      pixelSize,
    });
  }
}
