import {
  BACKGROUND_SCALE,
  BACKGROUND_SIZE,
  CANVAS_PIXEL_RATIO,
} from "../constants";
import { roundToTen } from "../round-to-five";

export function createBackgroundCanvas() {
  const canvas = document.createElement("canvas");
  return resizeBackgroundCanvas(canvas);
}

export function resizeBackgroundCanvas(canvas: HTMLCanvasElement) {
  canvas.width = window.innerWidth * BACKGROUND_SCALE * BACKGROUND_SIZE;
  canvas.height = window.innerHeight * BACKGROUND_SCALE * BACKGROUND_SIZE;
  return canvas;
}

export function drawBackgroundCanvas(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
) {
  context.imageSmoothingEnabled = false;

  const startPoint = {
    x: 0,
    y: 0,
  };

  const endPoint = {
    x: roundToTen(canvas.width * BACKGROUND_SCALE * BACKGROUND_SIZE),
    y: roundToTen(canvas.height * BACKGROUND_SCALE * BACKGROUND_SIZE),
  };

  for (
    let x = startPoint.x;
    x <= endPoint.x;
    x += CANVAS_PIXEL_RATIO * BACKGROUND_SCALE
  ) {
    context.moveTo(x, startPoint.y);
    context.lineTo(x, endPoint.y);
  }

  for (
    let y = startPoint.y;
    y <= endPoint.y;
    y += CANVAS_PIXEL_RATIO * BACKGROUND_SCALE
  ) {
    context.moveTo(startPoint.x, y);
    context.lineTo(endPoint.x, y);
  }
  context.strokeStyle = "#eee";
  context.lineWidth = 1;
  context.stroke();
}
