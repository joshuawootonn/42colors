import { z } from 'zod';

import { Camera, ZoomMultiplier, getZoomMultiplier } from '../camera';
import { CANVAS_PIXEL_RATIO } from '../constants';
import { Pixel } from '../geometry/coord';
import { COLOR_TABLE } from '../palette';
import { InitializedStore } from '../store';
import { getCameraOffset } from '../tools/brush/brush';
import { Plot } from '../tools/claimer/claimer.rest';

export function createRealtimeCanvas(camera: Camera) {
    const canvas = document.createElement('canvas');
    return resizeRealtimeCanvas(canvas, camera);
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

export function redrawRealtimePixels(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    pixels: Pixel[],
    camera: Camera,
) {
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < pixels.length; i++) {
        const block: Pixel = pixels[i];

        context.fillStyle = COLOR_TABLE[block.colorRef];
        context.fillRect(
            block.x - Math.floor(camera.x),
            block.y - Math.floor(camera.y),
            1,
            1,
        );
    }
}

type Color = [number, number, number, number];

const BLUE: Color = [0, 0, 1, 1];
const BLACK: Color = [0, 0, 0, 1];

export function redrawUserPlots(context: InitializedStore) {
    const webgpuManager = context.canvas.webGPUManager;
    if (!webgpuManager) return;

    const userPlotData: Plot[] | undefined = context.queryClient.getQueryData([
        'user',
        'plots',
    ]);

    if (userPlotData == null) {
        return;
    }

    const pixelSize = getPixelSize(getZoomMultiplier(context.camera));
    const { xOffset, yOffset } = getCameraOffset(context.camera);

    // Prepare all polygons for batch rendering
    const polygonRenderData = userPlotData.map((plot) => ({
        polygon: plot.polygon,
        options: {
            containsMatchingEndpoints: true,
            xOffset,
            yOffset,
            xCamera: context.camera.x,
            yCamera: context.camera.y,
            pixelSize,
            lineWidth: 0.25, // 3px thick lines
            color:
                plot.id === context.toolSettings.claimer.selectedPlotId
                    ? BLUE
                    : BLACK,
        },
    }));

    webgpuManager.redrawPolygons(polygonRenderData);
}
