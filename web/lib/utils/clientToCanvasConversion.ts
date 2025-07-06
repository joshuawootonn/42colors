import { CANVAS_PIXEL_RATIO, ZOOM_DEFAULT } from '../constants';
import { roundTo3Places } from '../round-to-five';

export function clientToCanvas(
    clientPosition: number,
    zoom: number,
    canvasOffset: number = 0,
): number {
    const pixelDensity = zoom / (ZOOM_DEFAULT / CANVAS_PIXEL_RATIO);
    return Math.floor(clientPosition / pixelDensity + canvasOffset);
}

export function canvasToClient(canvasX: number, zoom: number): number {
    const pixelDensity = zoom / (ZOOM_DEFAULT / CANVAS_PIXEL_RATIO);
    return roundTo3Places(canvasX * pixelDensity);
}
