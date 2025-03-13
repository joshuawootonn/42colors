import { CANVAS_PIXEL_RATIO } from "./constants";
import { roundDown } from "./utils";

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
  const buffer = 100;

  const startPoint = {
    x: roundDown(-buffer),
    y: roundDown(-buffer),
  };

  const endPoint = {
    x: roundDown(canvas.width + buffer),
    y: roundDown(canvas.height + buffer),
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
