import { getZoomMultiplier } from '../camera';
import {
    BACKGROUND_SIZE,
    CANVAS_PIXEL_RATIO,
    CHUNK_LENGTH,
} from '../constants';
import { InitializedStore } from '../store';
import { canvasToClient } from '../utils/clientToCanvasConversion';
import { getPixelSize, getSizeInPixelsPlusBleed } from './canvas';
import { clearChunk, renderPlotsToChunk } from './chunk';
import { FULLSIZE_CANVAS_BLEED } from './fullsize';
import { renderRealtime } from './realtime';
import { renderTelegraph } from './telegraph';
import { renderUI } from './ui';

export function draw(context: InitializedStore) {
    const zoomMultiplier = getZoomMultiplier(context.camera);
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

    // Math.floor to avoid sub pixel offsets
    // Math.floor after canvasToClient so zooming in and out is smooth
    context.canvas.rootCanvasContext.translate(
        -Math.floor(canvasToClient(context.camera.x, context.camera.zoom)),
        -Math.floor(canvasToClient(context.camera.y, context.camera.zoom)),
    );

    const nonChunkX = Math.floor(context.camera.x);
    const nonChunkY = Math.floor(context.camera.y);
    const x = canvasToClient(nonChunkX, context.camera.zoom);
    const y = canvasToClient(nonChunkY, context.camera.zoom);

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
    });

    const pixelSize = getPixelSize(zoomMultiplier);
    const canvasWidthPlusBleed =
        pixelSize * getSizeInPixelsPlusBleed(window.innerWidth, pixelSize);
    const canvasHeightPlusBleed =
        pixelSize * getSizeInPixelsPlusBleed(window.innerHeight, pixelSize);

    renderRealtime(context);
    context.canvas.rootCanvasContext.drawImage(
        context.canvas.realtimeCanvas,
        x,
        y,
        canvasWidthPlusBleed,
        canvasHeightPlusBleed,
    );

    renderTelegraph(context);
    context.canvas.rootCanvasContext.drawImage(
        context.canvas.telegraphCanvas,
        x,
        y,
        window.innerWidth + FULLSIZE_CANVAS_BLEED,
        window.innerHeight + FULLSIZE_CANVAS_BLEED,
    );

    Object.values(context.canvas.chunkCanvases).forEach((chunk) => {
        if (
            context.adminSettings.plotBordersVisible &&
            chunk.uiCanvas != null &&
            chunk.uiWebGPUManager != null &&
            chunk.plots.length > 0
        ) {
            renderPlotsToChunk(chunk);
            context.canvas.rootCanvasContext.drawImage(
                chunk.uiCanvas,
                canvasToClient(chunk.x, context.camera.zoom),
                canvasToClient(chunk.y, context.camera.zoom),
                CANVAS_PIXEL_RATIO * CHUNK_LENGTH * zoomMultiplier,
                CANVAS_PIXEL_RATIO * CHUNK_LENGTH * zoomMultiplier,
            );
        } else {
            clearChunk(chunk);
        }
    });

    renderUI(context);
    context.canvas.rootCanvasContext.drawImage(
        context.canvas.uiCanvas,
        x,
        y,
        window.innerWidth + FULLSIZE_CANVAS_BLEED,
        window.innerHeight + FULLSIZE_CANVAS_BLEED,
    );
}
