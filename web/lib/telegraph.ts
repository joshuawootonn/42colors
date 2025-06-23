export function createTelegraphCanvas() {
  const canvas = document.createElement("canvas");
  return resizeTelegraphCanvas(canvas);
}

export const TELEGRAPH_BLEED = 20;

export function resizeTelegraphCanvas(canvas: HTMLCanvasElement) {
  canvas.width = window.innerWidth + TELEGRAPH_BLEED;
  canvas.height = window.innerHeight + TELEGRAPH_BLEED;
  return canvas;
}
