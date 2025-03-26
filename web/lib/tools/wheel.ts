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
  console.log("wheel", e);
  if (isInitialStore(context)) return;

  const pixelWidth = context.camera.zoom / 25;

  const deltaZoom = e.ctrlKey ? e.deltaY * -0.1 : 0;
  const nextZoom = roundToFive(
    clamp(context.camera.zoom + deltaZoom, ZOOM_MIN, ZOOM_MAX),
  );

  const pixelX = Math.floor(e.clientX / pixelWidth);
  const pixelY = Math.floor(e.clientY / pixelWidth);

  const nextPixelWidth = nextZoom / 25;

  const nextPixelX = Math.floor(e.clientX / nextPixelWidth);
  const nextPixelY = Math.floor(e.clientY / nextPixelWidth);

  // const deltaZoomX = Math.round(
  //   (nextCanvasWidthInPixels - canvasWidthInPixels) *
  //     ((canvasWidthInPixels - clientXInPixels) / canvasWidthInPixels),
  // );
  // const deltaZoomY = Math.round(
  //   (nextCanvasHeightInPixels - canvasHeightInPixels) *
  //     ((canvasHeightInPixels - clientYInPixels) / canvasHeightInPixels),
  // );
  //
  //

  // const deltaZoomX = pixelX - (pixelX * nextZoom) / context.camera.zoom;
  // const deltaZoomY = pixelY - (pixelY * nextZoom) / context.camera.zoom;

  const deltaZoomX2 = pixelX - nextPixelX;
  const deltaZoomY2 = pixelY - nextPixelY;

  const deltaX = deltaZoom
    ? -deltaZoomX2
    : e.shiftKey
      ? e.deltaY / pixelWidth
      : e.deltaX / pixelWidth;
  const deltaY = deltaZoom
    ? -deltaZoomY2
    : e.shiftKey || e.ctrlKey
      ? 0
      : e.deltaY / pixelWidth;

  // console.log({
  //   deltaZoomX,
  //   deltaZoomY,
  //   deltaZoomX2,
  //   deltaZoomY2,
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
        zoom: nextZoom,
        x: Math.round(clamp(context.camera.x + deltaX, X_MIN, X_MAX)),
        y: Math.round(clamp(context.camera.y + deltaY, Y_MIN, Y_MAX)),
      },
    });
  });
}

export const WheelTool = { onWheel };
export type WheelTool = typeof WheelTool;
