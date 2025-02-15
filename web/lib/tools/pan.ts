import { Canvas } from "../canvas";

export class PanTool {
  constructor(private readonly canvas: Canvas) {}

  onPointerDown(e: PointerEvent) {
    const startingCamera = this.canvas.camera.clone();
    const startingX = e.clientX;
    const startingY = e.clientY;

    const pan = (e: PointerEvent) => {
      this.canvas.camera.x = startingCamera.x - e.clientX + startingX;
      this.canvas.camera.y = startingCamera.y - e.clientY + startingY;
    };

    this.canvas.canvas.addEventListener("pointermove", pan);

    const cleanUp = () => {
      this.canvas.canvas.removeEventListener("pointermove", pan);
    };

    this.canvas.canvas.addEventListener("pointerup", cleanUp, {
      once: true,
    });

    document.addEventListener("pointerout", cleanUp, {
      once: true,
    });
  }
}
