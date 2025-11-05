import { X_MAX, X_MIN, Y_MAX, Y_MIN, ZOOM_MAX, ZOOM_MIN } from '../constants';
import { roundTo1Place } from '../round-to-five';
import { Store, store } from '../store';
import { clamp } from '../utils/clamp';
import { isInitialStore } from '../utils/is-initial-store';
import { EnqueueObject } from '../xstate-internal-types';

function fetchPixels() {
    store.trigger.fetchPixels();
}

let timeout: NodeJS.Timeout;

function onWheel(
    context: Store,
    e: WheelEvent,
    enqueue: EnqueueObject<{ type: string }>,
) {
    if (isInitialStore(context)) return;

    const pixelWidth = context.camera.zoom / 20;

    // Differentiating pinch gestures from scroll wheels doesn't look possible.
    // Pinch gestures seem to have around 40x smaller deltas though,
    // which is why I have this assumption based on the delta being less than 5.
    // console.log(e.deltaY, e.deltaZ);
    const deltaZoom = e.metaKey
        ? Math.abs(e.deltaY) < 25
            ? e.deltaY * -4
            : e.deltaY * -0.3
        : 0;
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
        : e.shiftKey || e.metaKey
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
                zoom: roundTo1Place(nextZoom),
                x: roundTo1Place(
                    clamp(context.camera.x + deltaX, X_MIN, X_MAX),
                ),
                y: roundTo1Place(
                    clamp(context.camera.y + deltaY, Y_MIN, Y_MAX),
                ),
            },
        });
    });
}

export const WheelTool = { onWheel };
export type WheelTool = typeof WheelTool;
