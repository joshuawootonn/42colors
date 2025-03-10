import { toast } from "@/components/ui/toast";
import { Canvas } from "../canvas";

export class BrushTool {
  constructor(private readonly canvas: Canvas) {}

  onPointerDown() {
    const draw = () => {
      console.log("brushing");

      toast({
        title: "The brush tool isn't implemented (yet)",
        description: "Actually good editing coming soon!!",
      });
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
