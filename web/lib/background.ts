import {
  BACKGROUND_SCALE,
  BACKGROUND_SIZE,
  CANVAS_PIXEL_RATIO,
} from "./constants";
import { roundToTen } from "./utils/round-to-five";

export function createBackgroundCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth * BACKGROUND_SCALE * BACKGROUND_SIZE;
  canvas.height = window.innerHeight * BACKGROUND_SCALE * BACKGROUND_SIZE;
  return canvas;
}

export function drawBackgroundCanvas(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
) {
  context.imageSmoothingEnabled = false;
  const buffer = 100;

  const startPoint = {
    x: roundToTen(-buffer),
    y: roundToTen(-buffer),
  };

  const endPoint = {
    x: roundToTen(canvas.width * BACKGROUND_SCALE + buffer),
    y: roundToTen(canvas.height * BACKGROUND_SCALE + buffer),
  };

  context.fillRect(
    startPoint.x,
    startPoint.y,
    CANVAS_PIXEL_RATIO,
    CANVAS_PIXEL_RATIO,
  );
  context.fillRect(
    endPoint.x,
    endPoint.y,
    CANVAS_PIXEL_RATIO,
    CANVAS_PIXEL_RATIO,
  );

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
