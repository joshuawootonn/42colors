import { Point } from "../coord";

export function drawBrushOutline(
  ctx: CanvasRenderingContext2D,
  point: Point,
  brushSize: number,
  pixelSize: number,
) {
  ctx.beginPath();
  if (brushSize === 1) {
    ctx.strokeRect(point.x, point.y, pixelSize, pixelSize);
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x + pixelSize, point.y);
    ctx.lineTo(point.x + pixelSize, point.y + pixelSize);
    ctx.lineTo(point.x, point.y + pixelSize);
    ctx.lineTo(point.x, point.y);
  } else if (brushSize === 2) {
    ctx.moveTo(point.x - pixelSize, point.y - pixelSize);
    ctx.lineTo(point.x + pixelSize, point.y - pixelSize);
    ctx.lineTo(point.x + pixelSize, point.y + pixelSize);
    ctx.lineTo(point.x - pixelSize, point.y + pixelSize);
    ctx.lineTo(point.x - pixelSize, point.y - pixelSize);
  } else if (brushSize === 3) {
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x, point.y - pixelSize);
    ctx.lineTo(point.x + pixelSize, point.y - pixelSize);
    ctx.lineTo(point.x + pixelSize, point.y);
    ctx.lineTo(point.x + pixelSize * 2, point.y);
    ctx.lineTo(point.x + pixelSize * 2, point.y + pixelSize);
    ctx.lineTo(point.x + pixelSize, point.y + pixelSize);
    ctx.lineTo(point.x + pixelSize, point.y + pixelSize * 2);
    ctx.lineTo(point.x, point.y + pixelSize * 2);
    ctx.lineTo(point.x, point.y + pixelSize);
    ctx.lineTo(point.x - pixelSize, point.y + pixelSize);
    ctx.lineTo(point.x - pixelSize, point.y);
    ctx.lineTo(point.x, point.y);
  } else if (brushSize === 4) {
    ctx.moveTo(point.x - pixelSize, point.y - pixelSize);
    ctx.lineTo(point.x - pixelSize, point.y - pixelSize * 2);
    ctx.lineTo(point.x + pixelSize, point.y - pixelSize * 2);
    ctx.lineTo(point.x + pixelSize, point.y - pixelSize);
    ctx.lineTo(point.x + pixelSize * 2, point.y - pixelSize);
    ctx.lineTo(point.x + pixelSize * 2, point.y + pixelSize);
    ctx.lineTo(point.x + pixelSize, point.y + pixelSize);
    ctx.lineTo(point.x + pixelSize, point.y + pixelSize * 2);
    ctx.lineTo(point.x - pixelSize, point.y + pixelSize * 2);
    ctx.lineTo(point.x - pixelSize, point.y + pixelSize);
    ctx.lineTo(point.x - pixelSize * 2, point.y + pixelSize);
    ctx.lineTo(point.x - pixelSize * 2, point.y - pixelSize);
    ctx.lineTo(point.x - pixelSize, point.y - pixelSize);
  } else if (brushSize === 5) {
    ctx.moveTo(point.x - pixelSize, point.y - pixelSize);
    ctx.lineTo(point.x - pixelSize, point.y - pixelSize * 2);
    ctx.lineTo(point.x + pixelSize * 2, point.y - pixelSize * 2);
    ctx.lineTo(point.x + pixelSize * 2, point.y - pixelSize);
    ctx.lineTo(point.x + pixelSize * 3, point.y - pixelSize);
    ctx.lineTo(point.x + pixelSize * 3, point.y + pixelSize * 2);
    ctx.lineTo(point.x + pixelSize * 2, point.y + pixelSize * 2);
    ctx.lineTo(point.x + pixelSize * 2, point.y + pixelSize * 3);
    ctx.lineTo(point.x - pixelSize, point.y + pixelSize * 3);
    ctx.lineTo(point.x - pixelSize, point.y + pixelSize * 2);
    ctx.lineTo(point.x - pixelSize * 2, point.y + pixelSize * 2);
    ctx.lineTo(point.x - pixelSize * 2, point.y - pixelSize);
    ctx.lineTo(point.x - pixelSize * 1, point.y - pixelSize);
  }
}
