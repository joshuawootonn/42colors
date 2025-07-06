import { Store, store } from '../store';
import { clientToCanvas } from '../utils/clientToCanvasConversion';
import { isInitialStore } from '../utils/is-initial-store';

function onPointerDown(e: PointerEvent, context: Store) {
    if (isInitialStore(context)) return;

    const startingCamera = { ...context.camera };
    const startingX = e.clientX;
    const startingY = e.clientY;

    const pan = (e: PointerEvent) => {
        store.trigger.moveCamera({
            camera: {
                x:
                    startingCamera.x +
                    clientToCanvas(startingX - e.clientX, context.camera.zoom),
                y:
                    startingCamera.y +
                    clientToCanvas(startingY - e.clientY, context.camera.zoom),
            },
        });
    };

    context.canvas.rootCanvas.addEventListener('pointermove', pan);

    const cleanUp = () => {
        context.canvas?.rootCanvas.removeEventListener('pointermove', pan);

        store.trigger.setIsPressed({ isPressed: false });
        store.trigger.fetchPixels();
    };

    context.canvas.rootCanvas.addEventListener('pointerup', cleanUp, {
        once: true,
    });

    context.canvas.bodyElement.addEventListener('pointerout', cleanUp, {
        once: true,
    });
}

export const PanTool = { onPointerDown };
export type PanTool = typeof PanTool;
