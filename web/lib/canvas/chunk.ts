import { z } from 'zod';

import { CANVAS_PIXEL_RATIO, CHUNK_LENGTH } from '../constants';
import { AbsolutePoint, Coord, Pixel, pixelSchema } from '../geometry/coord';
import { AbsolutePointTuple } from '../line';
import { Plot } from '../tools/claimer/claimer.rest';
import { BLACK } from '../webgpu/colors';
import { WebGPUManager, createWebGPUManager } from '../webgpu/web-gpu-manager';

export type ChunkCanvases = Record<string, Chunk>;

export const chunkPixelSchema = pixelSchema.brand<'ChunkPixel'>();
export type ChunkPixel = z.infer<typeof chunkPixelSchema>;

export function getChunkOrigin(x: number, y: number): Coord {
    const chunkX = Math.floor(x / CHUNK_LENGTH) * CHUNK_LENGTH;
    const chunkY = Math.floor(y / CHUNK_LENGTH) * CHUNK_LENGTH;
    return { x: chunkX, y: chunkY };
}

export function getChunkKey(x: number, y: number): string {
    const chunkOrigin = getChunkOrigin(x, y);
    return `x: ${chunkOrigin.x} y: ${chunkOrigin.y}`;
}

// todo(josh): It would be cool to get all action types onto one pixel format,
// so this kinda glue code isn't necessary
export function getUniqueChunksFromPoints(points: AbsolutePoint[]): string[] {
    const chunks: Set<string> = new Set();
    for (let i = 0; i < points.length; i++) {
        const pixel = points[i];
        chunks.add(getChunkKey(pixel.x, pixel.y));
    }
    return Array.from(chunks);
}

export function getUniqueChunksFromAbsolutePointTuples(
    points: AbsolutePointTuple[],
): string[] {
    const chunks: Set<string> = new Set();
    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        chunks.add(getChunkKey(point[0], point[1]));
    }
    return Array.from(chunks);
}

export function getUniqueChunksFromPixels(pixels: Pixel[]): string[] {
    const chunks: Set<string> = new Set();
    for (let i = 0; i < pixels.length; i++) {
        const pixel = pixels[i];
        chunks.add(getChunkKey(pixel.x, pixel.y));
    }
    return Array.from(chunks);
}

export function getChunkPixel(chunkOrigin: Coord, pixel: Pixel): ChunkPixel {
    return {
        x: pixel.x - chunkOrigin.x,
        y: pixel.y - chunkOrigin.y,
        color_ref: pixel.color_ref,
    } as ChunkPixel;
}

export class Chunk {
    public readonly pixelCanvas: HTMLCanvasElement;
    public readonly uiCanvas: HTMLCanvasElement;
    private pixels: Pixel[] = [];
    private pixelMap: Map<string, Pixel> = new Map();

    public plots: Plot[] = [];

    private pixelWebGPUManager: WebGPUManager | null = null;
    private uiWebGPUManager: WebGPUManager | null = null;

    public isInitialized(): boolean {
        return this.pixelWebGPUManager != null && this.uiWebGPUManager != null;
    }

    private key(): string {
        return `${this.x}-${this.y}`;
    }

    createChunkCanvas(): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = CHUNK_LENGTH;
        canvas.height = CHUNK_LENGTH;
        return canvas;
    }

    createUIChunkCanvas(): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = CHUNK_LENGTH * CANVAS_PIXEL_RATIO;
        canvas.height = CHUNK_LENGTH * CANVAS_PIXEL_RATIO;
        return canvas;
    }

    constructor(
        public readonly x: number,
        public readonly y: number,
    ) {
        this.pixelCanvas = this.createChunkCanvas();
        createWebGPUManager(this.pixelCanvas)
            .then((manager) => {
                this.pixelWebGPUManager = manager;
                console.debug(
                    'Chunk Pixel WebGPU manager initialized successfully',
                    this.key(),
                );
            })
            .catch((error) => {
                console.error(
                    'Failed to initialize chunk Pixel WebGPU manager',
                    this.key(),
                    error,
                );
            });
        this.uiCanvas = this.createUIChunkCanvas();
        createWebGPUManager(this.uiCanvas)
            .then((manager) => {
                this.uiWebGPUManager = manager;
                console.debug(
                    'Chunk UI WebGPU manager initialized successfully',
                    this.key(),
                );
                this.plotRender();
            })
            .catch((error) => {
                console.error(
                    'Failed to initialize chunk UI WebGPU manager',
                    this.key(),
                    error,
                );
            });
    }

    private getPixelKey(x: number, y: number): string {
        return `${x}_${y}`;
    }

    initializeWithPixels(pixels: Pixel[]): void {
        this.pixels = pixels;
        this.pixelMap = new Map(
            pixels.map((pixel) => [this.getPixelKey(pixel.x, pixel.y), pixel]),
        );
        this.pixelWebGPUManager?.initializePersistentTexture({
            width: CHUNK_LENGTH,
            height: CHUNK_LENGTH,
        });

        this.pixelWebGPUManager?.renderPersistentPixels(
            pixels,
            {
                xCamera: 0,
                yCamera: 0,
            },
            true,
        );
    }

    clearPixels(pixels: Pixel[]): void {
        const transparentPixels = pixels.map(
            (pixel) =>
                ({
                    x: pixel.x,
                    y: pixel.y,
                    color_ref: 0,
                }) as Pixel,
        );

        this.pixelWebGPUManager?.renderPersistentPixels(
            transparentPixels,
            { xCamera: 0, yCamera: 0 },
            false,
        );
    }

    unsetPixels(pixels: Pixel[]): void {
        const unsetPixels = pixels.map((pixel) => {
            return {
                x: pixel.x,
                y: pixel.y,
                color_ref:
                    this.pixelMap.get(this.getPixelKey(pixel.x, pixel.y))
                        ?.color_ref ?? 0,
            } as Pixel;
        });

        this.pixelWebGPUManager?.renderPersistentPixels(
            unsetPixels,
            { xCamera: 0, yCamera: 0 },
            false,
        );
    }

    getPixelValue(x: number, y: number): Pixel | null {
        return this.pixelMap.get(this.getPixelKey(x, y)) ?? null;
    }

    //////////////// Plot methods ////////////////

    private plotRender(): void {
        this.uiWebGPUManager?.clear();

        console.log('redrawing plots', this.plots);
        this.uiWebGPUManager?.redrawPolygons(
            this.plots.map((plot) => ({
                polygon: plot.polygon,
            })),
            {
                containsMatchingEndpoints: true,
                xOffset: 0,
                yOffset: 0,
                xCamera: 0,
                yCamera: 0,
                pixelSize: 5,
                lineWidth: 0.25,
                color: BLACK,
            },
        );
    }

    upsertPlots(plots: Plot[]): void {
        this.plots = [
            ...this.plots.filter(
                (plot) => !plots.some((p) => p.id === plot.id),
            ),
            ...plots,
        ];
        this.plotRender();
    }

    deletePlots(plotIds: number[]): void {
        this.plots = this.plots.filter((plot) => !plotIds.includes(plot.id));
        this.plotRender();
    }

    public destroy(): void {
        this.pixelWebGPUManager?.destroy();
    }
}
