import { Canvas } from "../canvas";
import { roundDown } from "../utils";

export class PencilTool {
  constructor(private readonly canvas: Canvas) {}

  onPointerDown() {
    const draw = (e: PointerEvent) => {
      const camera = this.canvas.camera;

      const x = roundDown(camera.x + e.clientX);
      const y = roundDown(camera.y + e.clientY);

      this.canvas.pushPixel({ x, y });
    };

    this.canvas.canvas.addEventListener("pointermove", draw);

    const cleanUp = () => {
      this.canvas.canvas.removeEventListener("pointermove", draw);
    };

    this.canvas.canvas.addEventListener("pointerup", cleanUp, {
      once: true,
    });

    document.addEventListener("pointerout", cleanUp, {
      once: true,
    });
  }
}
