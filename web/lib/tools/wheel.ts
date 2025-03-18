import { store, Store } from "../store";
import { isInitialStore } from "../utils/is-initial-store";
import { ZOOM_MIN, ZOOM_MAX, X_MIN, X_MAX, Y_MIN, Y_MAX } from "../constants";
import { roundToFive } from "../utils/round-to-five";
import { clamp } from "../utils/clamp";
import { EnqueueObject } from "@xstate/store";

function fetchPixels() {
  store.trigger.fetchPixels();
}

let timeout: Timer;

function onWheel(
  context: Store,
  e: WheelEvent,
  enqueue: EnqueueObject<{ type: string }>,
) {
  if (isInitialStore(context)) return;

  const zoomAdjustment = 25 / context.camera.zoom;

  const deltaZoom = e.ctrlKey ? e.deltaY * -0.1 : 0;
  const deltaX = e.shiftKey ? e.deltaY : e.deltaX;
  const deltaY = e.shiftKey || e.ctrlKey ? 0 : e.deltaY * 1;

  const zoomAdjustedDeltaX = deltaX * zoomAdjustment;
  const zoomAdjustedDeltaY = deltaY * zoomAdjustment;

  clearTimeout(timeout);

  enqueue.effect(() => {
    timeout = setTimeout(fetchPixels, 100);
  });

  enqueue.effect(() => {
    store.trigger.moveCamera({
      camera: {
        zoom: roundToFive(
          clamp(context.camera.zoom + deltaZoom, ZOOM_MIN, ZOOM_MAX),
        ),
        x: roundToFive(
          clamp(context.camera.x + zoomAdjustedDeltaX, X_MIN, X_MAX),
        ),
        y: roundToFive(
          clamp(context.camera.y + zoomAdjustedDeltaY, Y_MIN, Y_MAX),
        ),
      },
    });
  });
}

export const WheelTool = { onWheel };
export type WheelTool = typeof WheelTool;
