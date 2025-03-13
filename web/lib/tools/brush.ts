import { toast } from "@/components/ui/toast";
import { Store } from "../store";

function onPointerDown(e: PointerEvent, context: Store) {
  const draw = () => {
    toast({
      title: "The brush tool isn't implemented (yet)",
      description: "Actually good editing coming soon!!",
    });
  };

  context.canvas?.rootCanvas.addEventListener("pointermove", draw);

  const cleanUp = () => {
    context.canvas?.rootCanvas.removeEventListener("pointermove", draw);
  };

  context.canvas?.rootCanvas.addEventListener("pointerup", cleanUp, {
    once: true,
  });

  document.addEventListener("pointerout", cleanUp, {
    once: true,
  });
}

export const BrushTool = { onPointerDown };
export type BrushTool = typeof BrushTool;
