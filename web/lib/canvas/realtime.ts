import { z } from 'zod';

import { Camera, ZoomMultiplier, getZoomMultiplier } from '../camera';
import { CANVAS_PIXEL_RATIO } from '../constants';

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
