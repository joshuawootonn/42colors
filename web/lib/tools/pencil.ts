import { Canvas } from "../canvas";
import { clientToCanvasConversion } from "../utils/clientToCanvasConversion";

export class PencilTool {
  constructor(private readonly canvas: Canvas) {}

  onPointerDown() {
    const draw = (e: PointerEvent) => {
      const camera = this.canvas.camera;

      const x = camera.x + clientToCanvasConversion(e.clientX);
      const y = camera.y + clientToCanvasConversion(e.clientY);

      this.canvas.pushPixel({ x, y, color: "black" });
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
