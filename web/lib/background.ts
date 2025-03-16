import { CANVAS_PIXEL_RATIO } from "./constants";
import { roundToFive } from "./utils/round-to-five";

export function createBackgroundCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  return canvas;
}

export function drawBackgroundCanvas(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
) {
  context.imageSmoothingEnabled = false;
  const buffer = 100;

  const startPoint = {
    x: roundToFive(-buffer),
    y: roundToFive(-buffer),
  };

  const endPoint = {
    x: roundToFive(canvas.width + buffer),
    y: roundToFive(canvas.height + buffer),
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

  for (let x = startPoint.x; x <= endPoint.x; x += CANVAS_PIXEL_RATIO) {
    context.moveTo(x, startPoint.y);
    context.lineTo(x, endPoint.y);
  }

  for (let y = startPoint.y; y <= endPoint.y; y += CANVAS_PIXEL_RATIO) {
    context.moveTo(startPoint.x, y);
    context.lineTo(endPoint.x, y);
  }
  context.strokeStyle = "#eee";
  context.stroke();
}
