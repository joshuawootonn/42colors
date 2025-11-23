import { getChunkKey, getChunkOrigin } from '../../canvas/chunk';
import { getCachedPixelsFromActions } from '../../canvas/realtime';
import { Pixel, getLastPixelValue } from '../../geometry/coord';
import { ColorRef, TRANSPARENT_REF } from '../../palette';
import { InitializedStore, store } from '../../store';
import { EnqueueObject } from '../../xstate-internal-types';
import { getAbsolutePoint } from '../brush/brush';

function getPixelColor(
    x: number,
    y: number,
    context: InitializedStore,
): ColorRef {
    // First check realtime actions (most recent changes) using cached pixels
    const { dedupedPixels: actionPixels } = getCachedPixelsFromActions(context);
    const pixelFromActions = getLastPixelValue(actionPixels, {
        x,
        y,
        color_ref: TRANSPARENT_REF,
    } as Pixel);
    if (pixelFromActions != null) {
        return pixelFromActions.color_ref;
    }

    // Fall back to checking chunk canvases
    const chunkOrigin = getChunkOrigin(x, y);
    const chunkKey = getChunkKey(x, y);
    const chunk = context.canvas.chunkCanvases[chunkKey];

    if (chunk == null) {
        return TRANSPARENT_REF;
    }

    const chunkPixelX = x - chunkOrigin.x;
    const chunkPixelY = y - chunkOrigin.y;

    const pixel = chunk.getPixelValue(chunkPixelX, chunkPixelY);
    if (pixel != null) {
        return pixel.color_ref;
    }

    return TRANSPARENT_REF;
}

function onPointerDown(
    e: PointerEvent,
    context: InitializedStore,
    enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
    const absolutePoint = getAbsolutePoint(e.clientX, e.clientY, context);
    const colorRef = getPixelColor(absolutePoint.x, absolutePoint.y, context);

    // If we got a transparent color, don't update the palette
    if (colorRef === TRANSPARENT_REF) {
        return context;
    }

    // Determine which color to update based on mouse button
    // Left button (0) updates foreground color, right button (2) updates background color
    const paletteUpdate =
        e.button === 2
            ? { backgroundColorRef: colorRef }
            : { foregroundColorRef: colorRef };

    enqueue.effect(() => {
        store.trigger.updatePaletteSettings({
            palette: paletteUpdate,
        });
    });

    return context;
}

function onPointerMove(
    e: PointerEvent,
    context: InitializedStore,
    _enqueue: EnqueueObject<{ type: string }>,
): InitializedStore {
    const canvas = context.canvas.rootCanvas;
    canvas.style.cursor = 'crosshair';
    return context;
}

function redrawTelegraph(_context: InitializedStore) {
    // Eyedropper doesn't need telegraph preview
}

export const EyedropperTool = {
    onPointerDown,
    onPointerMove,
    redrawTelegraph,
};

export type EyedropperTool = typeof EyedropperTool;
