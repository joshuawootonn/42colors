import { Canvas } from "../canvas";
import {
  canvasToClientConversion,
  clientToCanvasConversion,
} from "../utils/clientToCanvasConversion";

export class PanTool {
  constructor(private readonly canvas: Canvas) {}

  onPointerDown(e: PointerEvent) {
    const startingCamera = this.canvas.camera.clone();
    const startingX = e.clientX;
    const startingY = e.clientY;

    const pan = (e: PointerEvent) => {
      this.canvas.camera.x =
        startingCamera.x + clientToCanvasConversion(startingX - e.clientX);
      this.canvas.camera.y =
        startingCamera.y + clientToCanvasConversion(startingY - e.clientY);
      this.canvas.emitChange();
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
