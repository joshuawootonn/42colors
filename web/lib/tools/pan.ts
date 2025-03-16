import { clientToCanvasConversion } from "../utils/clientToCanvasConversion";
import { store, Store } from "../store";

function onPointerDown(e: PointerEvent, context: Store) {
  if (context.canvas == null) {
    console.warn("`PencilTool.onPointerDown` attempted in uninitialized state");
    return;
  }

  const startingCamera = { ...context.camera };
  const startingX = e.clientX;
  const startingY = e.clientY;

  const pan = (e: PointerEvent) => {
    store.trigger.moveCamera({
      camera: {
        x:
          startingCamera.x +
          clientToCanvasConversion(startingX - e.clientX, context.camera.zoom),
        y:
          startingCamera.y +
          clientToCanvasConversion(startingY - e.clientY, context.camera.zoom),
      },
    });
  };

  context.canvas.rootCanvas.addEventListener("pointermove", pan);

  const cleanUp = () => {
    context.canvas?.rootCanvas.removeEventListener("pointermove", pan);

    store.trigger.setIsPressed({ isPressed: false });
    store.trigger.fetchPixels();
  };

  context.canvas.rootCanvas.addEventListener("pointerup", cleanUp, {
    once: true,
  });

  context.canvas.bodyElement.addEventListener("pointerout", cleanUp, {
    once: true,
  });
}

export const PanTool = { onPointerDown };
export type PanTool = typeof PanTool;
