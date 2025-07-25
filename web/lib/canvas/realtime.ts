import { z } from 'zod';

import { Camera, ZoomMultiplier, getZoomMultiplier } from '../camera';
import { CANVAS_PIXEL_RATIO } from '../constants';
import { InitializedStore } from '../store';
import { derivePixelsFromActions, deriveUnsetPixelsFromActions } from '../actions';
import { unsetChunkPixels, clearChunkPixels } from './chunk';
import { dedupeCoords } from '../utils/dedupe-coords';
import { isInitialStore } from '../utils/is-initial-store';

export function createRealtimeCanvas(camera: Camera) {
    const canvas = document.createElement('canvas');
    resizeRealtimeCanvas(canvas, camera);
    return canvas;
}

const pixelSizeSchema = z.number().brand<'PixelSize'>();
export type PixelSize = z.infer<typeof pixelSizeSchema>;

export function getPixelSize(zoomMultiplier: ZoomMultiplier): PixelSize {
    return pixelSizeSchema.parse(CANVAS_PIXEL_RATIO * zoomMultiplier);
}

export function getSizeInPixelsPlusBleed(length: number, pixelSize: PixelSize) {
    return Math.ceil(length / pixelSize) + 1;
}

export function resizeRealtimeCanvas(
    canvas: HTMLCanvasElement,
    camera: Camera,
) {
    const pixelSize = getPixelSize(getZoomMultiplier(camera));

    canvas.width = getSizeInPixelsPlusBleed(window.innerWidth, pixelSize);
    canvas.height = getSizeInPixelsPlusBleed(window.innerHeight, pixelSize);
    return canvas;
}

export function renderRealtime(context: InitializedStore) {
    if (isInitialStore(context)) return;

    const actions = context.activeAction
        ? context.actions.concat(context.activeAction)
        : context.actions;

    const pixels = derivePixelsFromActions(actions);

    const unsetPixels = deriveUnsetPixelsFromActions(actions);

    unsetChunkPixels(context.canvas.chunkCanvases, unsetPixels);

    const dedupedPixels = dedupeCoords(pixels);

    context.canvas.realtimeWebGPUManager.redrawPixels(
        dedupedPixels,
        context.camera,
    );

    clearChunkPixels(context.canvas.chunkCanvases, dedupedPixels);
}
