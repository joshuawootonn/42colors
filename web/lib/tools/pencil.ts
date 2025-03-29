import { clientToCanvasConversion } from "../utils/clientToCanvasConversion";
import { store, Store } from "../store";

function onPointerDown(_: PointerEvent, context: Store) {
  const draw = (e: PointerEvent) => {
    const camera = context.camera;
    const x =
      Math.floor(camera.x) + clientToCanvasConversion(e.clientX, camera.zoom);
    const y =
      Math.floor(camera.y) + clientToCanvasConversion(e.clientY, camera.zoom);
    store.trigger.newPixel({ pixel: { x, y, color: "black" } });
  };

  context.canvas?.bodyElement.addEventListener("pointermove", draw);

  const cleanUp = () => {
    context.canvas?.bodyElement.removeEventListener("pointermove", draw);
  };

  context.canvas?.bodyElement.addEventListener("pointerup", cleanUp, {
    once: true,
  });

  document.addEventListener("pointerout", cleanUp, {
    once: true,
  });
}

export const PencilTool = { onPointerDown };
export type PencilTool = typeof PencilTool;
