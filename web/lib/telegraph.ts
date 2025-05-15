export function createTelegraphCanvas() {
  const canvas = document.createElement("canvas");
  return resizeTelegraphCanvas(canvas);
}

export function resizeTelegraphCanvas(canvas: HTMLCanvasElement) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  return canvas;
}
