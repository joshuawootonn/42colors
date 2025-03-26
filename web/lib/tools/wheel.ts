import { store, Store } from "../store";
import { isInitialStore } from "../utils/is-initial-store";
import { ZOOM_MIN, ZOOM_MAX, X_MIN, X_MAX, Y_MIN, Y_MAX } from "../constants";
import { roundTo3Places } from "../utils/round-to-five";
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

  const pixelWidth = context.camera.zoom / 20;

  const deltaZoom = e.ctrlKey ? e.deltaY * -0.1 : 0;
  const nextZoom = clamp(context.camera.zoom + deltaZoom, ZOOM_MIN, ZOOM_MAX);

  const pixelX = e.clientX / pixelWidth;
  const pixelY = e.clientY / pixelWidth;

  const nextPixelWidth = nextZoom / 20;

  const nextPixelX = e.clientX / nextPixelWidth;
  const nextPixelY = e.clientY / nextPixelWidth;

  const deltaXFromZoom = pixelX - nextPixelX;
  const deltaYFromZoom = pixelY - nextPixelY;

  const deltaX = deltaZoom
    ? deltaXFromZoom
    : e.shiftKey
      ? e.deltaY / pixelWidth
      : e.deltaX / pixelWidth;
  const deltaY = deltaZoom
    ? deltaYFromZoom
    : e.shiftKey || e.ctrlKey
      ? 0
      : e.deltaY / pixelWidth;

  // console.log({
  //   deltaXFromZoom,
  //   deltaYFromZoom,
  //   nextZoom,
  //   pixelX,
  //   pixelY,
  //   nextPixelX,
  //   nextPixelY,
  //   zoom: context.camera.zoom,
  // });

  clearTimeout(timeout);

  enqueue.effect(() => {
    timeout = setTimeout(fetchPixels, 100);
  });

  enqueue.effect(() => {
    store.trigger.moveCamera({
      camera: {
        zoom: roundTo3Places(nextZoom),
        x: roundTo3Places(clamp(context.camera.x + deltaX, X_MIN, X_MAX)),
        y: roundTo3Places(clamp(context.camera.y + deltaY, Y_MIN, Y_MAX)),
      },
    });
  });
}

export const WheelTool = { onWheel };
export type WheelTool = typeof WheelTool;
