import { getZoomMultiplier } from '../camera';
import {
    BACKGROUND_SIZE,
    CANVAS_PIXEL_RATIO,
    CHUNK_LENGTH,
} from '../constants';
import { HydratedStore } from '../store';
import { canvasToClient } from '../utils/clientToCanvasConversion';
import { FULLSIZE_CANVAS_BLEED } from './fullsize';
import { getPixelSize, getSizeInPixelsPlusBleed } from './realtime';

export function draw(context: HydratedStore) {
    const zoomMultiplier = getZoomMultiplier(context.camera);
    const cameraXStart = Math.floor(context.camera.x);
    const cameraYStart = Math.floor(context.camera.y);
    context.canvas.rootCanvas.width = window.innerWidth;
    context.canvas.rootCanvas.height = window.innerHeight;

    context.canvas.rootCanvasContext.imageSmoothingEnabled = false;
    context.canvas.rootCanvas.style.imageRendering = 'pixelated';

    context.canvas.rootCanvasContext.clearRect(
        0,
        0,
        context.canvas.rootCanvas.width,
        context.canvas.rootCanvas.height,
    );

    context.canvas.rootCanvasContext.translate(
        -canvasToClient(context.camera.x, context.camera.zoom),
        -canvasToClient(context.camera.y, context.camera.zoom),
    );

    const x = canvasToClient(cameraXStart, context.camera.zoom);
    const y = canvasToClient(cameraYStart, context.camera.zoom);

    context.canvas.rootCanvasContext.drawImage(
        context.canvas.backgroundCanvas,
        x,
        y,
        window.innerWidth * zoomMultiplier * BACKGROUND_SIZE,
        window.innerHeight * zoomMultiplier * BACKGROUND_SIZE,
    );

    Object.values(context.canvas.chunkCanvases).forEach((chunk) => {
        context.canvas.rootCanvasContext.imageSmoothingEnabled = false;
        context.canvas.rootCanvasContext.drawImage(
            chunk.element,
            canvasToClient(chunk.x, context.camera.zoom),
            canvasToClient(chunk.y, context.camera.zoom),
            CANVAS_PIXEL_RATIO * CHUNK_LENGTH * zoomMultiplier,
            CANVAS_PIXEL_RATIO * CHUNK_LENGTH * zoomMultiplier,
        );

        context.canvas.rootCanvasContext.drawImage(
            chunk.elementUI,
            canvasToClient(chunk.x, context.camera.zoom),
            canvasToClient(chunk.y, context.camera.zoom),
            CANVAS_PIXEL_RATIO * CHUNK_LENGTH * zoomMultiplier,
            CANVAS_PIXEL_RATIO * CHUNK_LENGTH * zoomMultiplier,
        );
    });

    const pixelSize = getPixelSize(zoomMultiplier);
    const canvasWidthPlusBleed =
        pixelSize * getSizeInPixelsPlusBleed(window.innerWidth, pixelSize);
    const canvasHeightPlusBleed =
        pixelSize * getSizeInPixelsPlusBleed(window.innerHeight, pixelSize);

    context.canvas.rootCanvasContext.drawImage(
        context.canvas.realtimeCanvas,
        x,
        y,
        canvasWidthPlusBleed,
        canvasHeightPlusBleed,
    );

    context.canvas.rootCanvasContext.drawImage(
        context.canvas.telegraphCanvas,
        x,
        y,
        window.innerWidth + FULLSIZE_CANVAS_BLEED,
        window.innerHeight + FULLSIZE_CANVAS_BLEED,
    );

    context.canvas.rootCanvasContext.drawImage(
        context.canvas.uiCanvas,
        x,
        y,
        window.innerWidth + FULLSIZE_CANVAS_BLEED,
        window.innerHeight + FULLSIZE_CANVAS_BLEED,
    );
}
