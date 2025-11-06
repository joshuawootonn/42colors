import { z } from 'zod';

import { CANVAS_PIXEL_RATIO, CHUNK_LENGTH } from '../constants';
import { Coord, Pixel, pixelSchema } from '../geometry/coord';
import { COLOR_TABLE } from '../palette';
import { Plot } from '../tools/claimer/claimer.rest';
import { dedupe } from '../utils/dedupe';
import { BLACK } from '../webgpu/colors';
import { WebGPUManager, createWebGPUManager } from '../webgpu/web-gpu-manager';

export type Chunk = {
    x: number;
    y: number;
    pixels: Pixel[];
    element: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    plots: Plot[];
    renderConditions: {
        zoom: number;
    };
    webgpuManager?: WebGPUManager | null;
    webgpuCanvas?: HTMLCanvasElement;
};

export type ChunkCanvases = Record<string, Chunk>;

export function createChunkCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = CHUNK_LENGTH;
    canvas.height = CHUNK_LENGTH;
    return canvas;
}

export function createUIChunkCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = CHUNK_LENGTH * CANVAS_PIXEL_RATIO;
    canvas.height = CHUNK_LENGTH * CANVAS_PIXEL_RATIO;
    return canvas;
}

export async function initializeChunkWebGPU(
    chunkCanvas: HTMLCanvasElement,
): Promise<WebGPUManager | null> {
    try {
        const webgpuManager = await createWebGPUManager(chunkCanvas);
        if (webgpuManager) {
            console.debug('Chunk WebGPU manager initialized successfully');
            return webgpuManager;
        }
    } catch (error) {
        console.warn('Failed to initialize chunk WebGPU manager:', error);
    }
    return null;
}

export function cleanupChunkWebGPU(
    webgpuManager: WebGPUManager | null | undefined,
): void {
    webgpuManager?.destroy();
}

export function renderPlotsToChunk(chunk: Chunk): void {
    if (!chunk.webgpuManager || chunk.plots.length === 0) {
        return;
    }

    const polygonRenderData = chunk.plots.map((plot) => ({
        polygon: plot.polygon,
    }));

    chunk.webgpuManager.redrawPolygons(polygonRenderData, {
        containsMatchingEndpoints: true,
        xOffset: 0,
        yOffset: 0,
        xCamera: 0,
        yCamera: 0,
        pixelSize: 5,
        lineWidth: 0.25,
        color: BLACK,
    });
}

export function clearChunk(chunk: Chunk): void {
    chunk.webgpuManager?.clear();
}

export function drawPixelsToChunkCanvas(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    pixels: Pixel[],
): HTMLCanvasElement {
    context.imageSmoothingEnabled = false;

    for (let i = 0; i < pixels.length; i++) {
        const pixel = pixels[i];
        context.fillStyle = COLOR_TABLE[pixel.color_ref];
        context.fillRect(pixel.x, pixel.y, 1, 1);
    }

    return canvas;
}

export function unsetChunkPixels(
    chunkCanvases: ChunkCanvases,
    pixels: Pixel[],
) {
    const chunkKeys = [];
    for (let i = 0; i < pixels.length; i++) {
        const pixel = pixels[i];
        chunkKeys.push(getChunkKey(pixel.x, pixel.y));
    }
    const uniqueChunkKeys = dedupe(chunkKeys);
    for (let i = 0; i < uniqueChunkKeys.length; i++) {
        const chunk = chunkCanvases[uniqueChunkKeys[i]];
        drawPixelsToChunkCanvas(chunk.element, chunk.context, chunk.pixels);
    }
}

export function clearChunkPixels(
    chunkCanvases: ChunkCanvases,
    pixels: Pixel[],
) {
    for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i];
        const chunkOrigin = getChunkOrigin(p.x, p.y);
        const chunk = chunkCanvases[getChunkKey(p.x, p.y)];
        const chunkPixel = getChunkPixel(chunkOrigin, p);

        chunk.context.clearRect(chunkPixel.x, chunkPixel.y, 1, 1);
    }
}

export function clearChunkCanvas(
    chunkCanvases: ChunkCanvases,
    chunkKey: string,
) {
    const chunk = chunkCanvases[chunkKey];
    chunk.context.clearRect(0, 0, CHUNK_LENGTH, CHUNK_LENGTH);
}

export const chunkPixelSchema = pixelSchema.brand<'ChunkPixel'>();
export type ChunkPixel = z.infer<typeof chunkPixelSchema>;

function getChunkPixel(chunkOrigin: Coord, pixel: Pixel): ChunkPixel {
    return {
        x: pixel.x - chunkOrigin.x,
        y: pixel.y - chunkOrigin.y,
        color_ref: pixel.color_ref,
    } as ChunkPixel;
}

export function getChunkOrigin(x: number, y: number): Coord {
    const chunkX = Math.floor(x / CHUNK_LENGTH) * CHUNK_LENGTH;
    const chunkY = Math.floor(y / CHUNK_LENGTH) * CHUNK_LENGTH;
    return { x: chunkX, y: chunkY };
}

export function getChunkKey(x: number, y: number): string {
    const chunkOrigin = getChunkOrigin(x, y);
    return `x: ${chunkOrigin.x} y: ${chunkOrigin.y}`;
}

export function getUniqueChunksFromPixels(pixels: Pixel[]): string[] {
    const chunks: Set<string> = new Set();
    for (let i = 0; i < pixels.length; i++) {
        const pixel = pixels[i];
        chunks.add(getChunkKey(pixel.x, pixel.y));
    }
    return Array.from(chunks);
}
