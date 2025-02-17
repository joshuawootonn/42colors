import { Canvas } from "./canvas";

export type CameraState = {
  x: number;
  y: number;
  zoom: number;
};

export class Camera {
  x: number;
  y: number;
  zoom: number;

  constructor(
    private readonly canvas: Canvas,
    x: number,
    y: number,
    zoom: number,
  ) {
    this.x = x;
    this.y = y;
    this.zoom = zoom;
  }

  relativeMove(x: number, y: number) {
    this.x += x;
    this.y += y;
    this.canvas.emitChange();
  }

  static is(a: CameraState, b: CameraState) {
    return a.zoom === b.zoom && a.x === b.x && a.y === b.y;
  }

  static state(a: Camera) {
    return { x: a.x, y: a.y, zoom: a.zoom };
  }

  clone() {
    return new Camera(this.canvas, this.x, this.y, this.zoom);
  }
}
