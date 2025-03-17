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

  const deltaZoom = e.ctrlKey ? e.deltaY * -0.1 : 0;
  const deltaX = e.shiftKey ? e.deltaY : e.deltaX;
  const deltaY = e.shiftKey || e.ctrlKey ? 0 : e.deltaY * 1;

  clearTimeout(timeout);

  enqueue.effect(() => {
    timeout = setTimeout(fetchPixels, 100);
  });

  console.log({
    zoom: roundToFive(
      clamp(context.camera.zoom + deltaZoom, ZOOM_MIN, ZOOM_MAX),
    ),
    x: roundToFive(clamp(context.camera.x + deltaX, X_MIN, X_MAX)),
    y: roundToFive(clamp(context.camera.y + deltaY, Y_MIN, Y_MAX)),
  });

  return {
    ...context,
    camera: {
      ...context.camera,
      zoom: roundToFive(
        clamp(context.camera.zoom + deltaZoom, ZOOM_MIN, ZOOM_MAX),
      ),
      x: roundToFive(clamp(context.camera.x + deltaX, X_MIN, X_MAX)),
      y: roundToFive(clamp(context.camera.y + deltaY, Y_MIN, Y_MAX)),
    },
  };
}

export const WheelTool = { onWheel };
export type WheelTool = typeof WheelTool;
