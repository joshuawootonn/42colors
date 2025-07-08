import { Polygon } from '../geometry/polygon';
import {
    RenderOptions,
    WebGPUPolygonRenderer,
    createWebGPUPolygonRenderer,
    destroyWebGPUPolygonRenderer,
    renderPolygonWebGPU,
} from './polygon-renderer';

export class WebGPUPolygonManager {
    private renderer: WebGPUPolygonRenderer | null = null;
    private device: GPUDevice;
    private context: GPUCanvasContext;
    private canvasFormat: GPUTextureFormat;

    constructor(
        device: GPUDevice,
        context: GPUCanvasContext,
        canvasFormat: GPUTextureFormat,
    ) {
        this.device = device;
        this.context = context;
        this.canvasFormat = canvasFormat;
    }

    async initialize(): Promise<void> {
        this.renderer = await createWebGPUPolygonRenderer(
            this.device,
            this.canvasFormat,
        );
    }

    /**
     * WebGPU version of the original redrawPolygon function
     * Maintains the same API and behavior as the Canvas 2D version
     */
    redrawPolygon(
        polygon: Polygon,
        options: {
            xOffset?: number;
            yOffset?: number;
            xCamera?: number;
            yCamera?: number;
            pixelSize?: number;
            containsMatchingEndpoints?: boolean;
            color?: [number, number, number, number];
            lineWidth?: number;
        } = {},
    ): void {
        if (!this.renderer) {
            throw new Error(
                'WebGPU renderer not initialized. Call initialize() first.',
            );
        }

        const canvas = this.context.canvas as HTMLCanvasElement;
        const renderOptions: RenderOptions = {
            ...options,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
        };

        // Create command encoder and render pass
        const commandEncoder = this.device.createCommandEncoder();
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.context.getCurrentTexture().createView(),
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        });

        // Render the polygon
        renderPolygonWebGPU(this.renderer, polygon, renderOptions, renderPass);

        renderPass.end();
        this.device.queue.submit([commandEncoder.finish()]);

        // Process any pending buffer returns after submission
        this.renderer.bufferPool.processFrameCompletion();
    }

    /**
     * Render multiple polygons in a single render pass for better performance
     */
    redrawPolygons(
        polygons: Array<{
            polygon: Polygon;
            options?: {
                xOffset?: number;
                yOffset?: number;
                xCamera?: number;
                yCamera?: number;
                pixelSize?: number;
                containsMatchingEndpoints?: boolean;
                color?: [number, number, number, number];
                lineWidth?: number;
            };
        }>,
    ): void {
        if (!this.renderer) {
            throw new Error(
                'WebGPU renderer not initialized. Call initialize() first.',
            );
        }

        const canvas = this.context.canvas as HTMLCanvasElement;

        // Create command encoder and render pass
        const commandEncoder = this.device.createCommandEncoder();
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.context.getCurrentTexture().createView(),
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        });

        // Render all polygons
        for (const { polygon, options = {} } of polygons) {
            const renderOptions: RenderOptions = {
                ...options,
                canvasWidth: canvas.width,
                canvasHeight: canvas.height,
            };

            renderPolygonWebGPU(
                this.renderer,
                polygon,
                renderOptions,
                renderPass,
            );
        }

        renderPass.end();
        this.device.queue.submit([commandEncoder.finish()]);

        // Process any pending buffer returns after submission
        this.renderer.bufferPool.processFrameCompletion();
    }

    /**
     * Extract camera offset values (equivalent to getCameraOffset from the original)
     */
    getCameraOffset(camera: { x: number; y: number }): {
        xOffset: number;
        yOffset: number;
    } {
        // Extract decimal parts for sub-pixel positioning
        const xOffset = camera.x - Math.floor(camera.x);
        const yOffset = camera.y - Math.floor(camera.y);

        return { xOffset, yOffset };
    }

    destroy(): void {
        if (this.renderer) {
            destroyWebGPUPolygonRenderer(this.renderer);
            this.renderer = null;
        }
    }
}

/**
 * Drop-in replacement for the original redrawPolygon function
 * This maintains the exact same API as the Canvas 2D version
 */
export function redrawPolygonWebGPU(
    manager: WebGPUPolygonManager,
    polygon: Polygon,
    options: {
        xOffset?: number;
        yOffset?: number;
        xCamera?: number;
        yCamera?: number;
        pixelSize?: number;
        containsMatchingEndpoints?: boolean;
    } = {},
): void {
    // Default yellow color to match the original claimer styling
    const color: [number, number, number, number] = [
        246 / 255,
        240 / 255,
        74 / 255,
        1.0,
    ];

    manager.redrawPolygon(polygon, {
        ...options,
        color,
    });
}

/**
 * Example usage in your existing claimer tool:
 *
 * // Replace the original redrawTelegraph function
 * async function redrawTelegraphWebGPU(context: InitializedStore, webgpuManager: WebGPUPolygonManager) {
 *     if (context.activeAction?.type !== 'claimer-active') {
 *         return;
 *     }
 *
 *     const pixelSize = getPixelSize(getZoomMultiplier(context.camera));
 *     const { xOffset, yOffset } = webgpuManager.getCameraOffset(context.camera);
 *
 *     const rects = [...context.activeAction.rects];
 *     if (context.activeAction.nextRect != null) {
 *         rects.push(context.activeAction.nextRect);
 *     }
 *
 *     const polygons = rects.map((rect) => rectToPolygonSchema.parse(rect));
 *     const aggregatedPolygons = getCompositePolygons(polygons);
 *
 *     const polygonRenderData = aggregatedPolygons.map(polygon => ({
 *         polygon,
 *         options: {
 *             pixelSize,
 *             xOffset,
 *             yOffset,
 *             xCamera: context.camera.x,
 *             yCamera: context.camera.y,
 *         }
 *     }));
 *
 *     await webgpuManager.redrawPolygons(polygonRenderData);
 * }
 */

export async function createWebGPUUICanvas(
    canvas: HTMLCanvasElement,
): Promise<WebGPUPolygonManager | null> {
    if (navigator.gpu) {
        try {
            const adapter = await navigator.gpu.requestAdapter();
            if (adapter) {
                const device = await adapter.requestDevice();
                const webgpuContext = canvas.getContext('webgpu');
                console.log({ device, webgpuContext });
                if (webgpuContext) {
                    const canvasFormat =
                        navigator.gpu.getPreferredCanvasFormat();
                    webgpuContext.configure({
                        device,
                        format: canvasFormat,
                        alphaMode: 'premultiplied',
                    });
                    const webgpuPolygonManager = new WebGPUPolygonManager(
                        device,
                        webgpuContext,
                        canvasFormat,
                    );
                    await webgpuPolygonManager.initialize();

                    console.log(
                        'WebGPU polygon manager initialized successfully',
                    );

                    return webgpuPolygonManager;
                }
            }
        } catch (error) {
            console.warn(
                'Failed to initialize WebGPU for polygon rendering:',
                error,
            );
        }
    }

    return null;
}
