import {
    derivePixelsFromActions,
    deriveUnsetPixelsFromActions,
} from '../actions';
import { Camera, getZoomMultiplier } from '../camera';
import { InitializedStore } from '../store';
import { dedupeCoords } from '../utils/dedupe-coords';
import { isInitialStore } from '../utils/is-initial-store';
import { getPixelSize, getSizeInPixelsPlusBleed } from './canvas';
import { clearChunkPixels, unsetChunkPixels } from './chunk';

export function createRealtimeCanvas(camera: Camera) {
    const canvas = document.createElement('canvas');
    resizeRealtimeCanvas(canvas, camera);
    return canvas;
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

    context.canvas.realtimeWebGPUManager.redrawPixels(dedupedPixels, {
        xCamera: context.camera.x,
        yCamera: context.camera.y,
    });

    clearChunkPixels(context.canvas.chunkCanvases, dedupedPixels);
}
