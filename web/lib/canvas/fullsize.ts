export function createFullsizeCanvas() {
  const canvas = document.createElement("canvas");
  return resizeFullsizeCanvas(canvas);
}

export const FULLSIZE_CANVAS_BLEED = 20;

export function resizeFullsizeCanvas(canvas: HTMLCanvasElement) {
  canvas.width = window.innerWidth + FULLSIZE_CANVAS_BLEED;
  canvas.height = window.innerHeight + FULLSIZE_CANVAS_BLEED;
  return canvas;
}
