import { Pixel } from '../geometry/coord';
import {
    LineRenderItem,
    LineRenderOptions,
    WebGPULineRenderer,
    createWebGPULineRenderer,
    destroyWebGPULineRenderer,
    renderLines,
} from './line-renderer';
import {
    PixelRenderOptions,
    WebGPUPixelRenderer,
    createWebGPUPixelRenderer,
    destroyWebGPUPixelRenderer,
    renderPixels,
} from './pixel-renderer';
import {
    PolygonRenderItem,
    PolygonRenderOptions,
    WebGPUPolygonRenderer,
    createWebGPUPolygonRenderer,
    destroyWebGPUPolygonRenderer,
    renderPolygons,
} from './polygon-renderer';

export type { LineRenderItem as LineItem };

export class WebGPUManager {
    private polygonRenderer: WebGPUPolygonRenderer | null = null;
    private pixelRenderer: WebGPUPixelRenderer | null = null;
    private lineRenderer: WebGPULineRenderer | null = null;
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
        this.polygonRenderer = await createWebGPUPolygonRenderer(
            this.device,
            this.canvasFormat,
        );
        this.pixelRenderer = await createWebGPUPixelRenderer(
            this.device,
            this.canvasFormat,
        );
        this.lineRenderer = await createWebGPULineRenderer(
            this.device,
            this.canvasFormat,
        );
    }

    redrawPolygons(
        items: PolygonRenderItem[],
        options: Partial<PolygonRenderOptions> = {},
    ): void {
        if (!this.polygonRenderer) {
            throw new Error(
                'WebGPU polygon renderer not initialized. Call initialize() first.',
            );
        }

        const canvas = this.context.canvas as HTMLCanvasElement;

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

        const renderOptions: PolygonRenderOptions = {
            ...options,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
        };

        renderPolygons(this.polygonRenderer, items, renderOptions, renderPass);

        renderPass.end();
        this.device.queue.submit([commandEncoder.finish()]);

        this.polygonRenderer.bufferPool.processFrameCompletion();
    }

    redrawLines(
        lines: LineRenderItem[],
        options: Partial<LineRenderOptions> = {},
    ): void {
        if (!this.lineRenderer) {
            throw new Error(
                'WebGPU line renderer not initialized. Call initialize() first.',
            );
        }

        const canvas = this.context.canvas as HTMLCanvasElement;

        const commandEncoder = this.device.createCommandEncoder();
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.context.getCurrentTexture().createView(),
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
                    loadOp: 'load',
                    storeOp: 'store',
                },
            ],
        });

        const renderOptions: LineRenderOptions = {
            ...options,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
        };

        renderLines(this.lineRenderer, lines, renderOptions, renderPass);

        renderPass.end();
        this.device.queue.submit([commandEncoder.finish()]);

        this.lineRenderer.bufferPool.processFrameCompletion();
    }

    /**
     * Render pixels using WebGPU
     */
    redrawPixels(
        pixels: Pixel[],
        options: Partial<PixelRenderOptions> = {},
    ): void {
        if (!this.pixelRenderer) {
            throw new Error(
                'WebGPU pixel renderer not initialized. Call initialize() first.',
            );
        }

        const canvas = this.context.canvas as HTMLCanvasElement;

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

        const renderOptions: PixelRenderOptions = {
            ...options,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
        };

        renderPixels(this.pixelRenderer, pixels, renderOptions, renderPass);

        renderPass.end();
        this.device.queue.submit([commandEncoder.finish()]);

        this.pixelRenderer.bufferPool.processFrameCompletion();
    }

    clear(): void {
        // Create command encoder and render pass that just clears
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

        // End the render pass immediately - we just wanted to clear
        renderPass.end();
        this.device.queue.submit([commandEncoder.finish()]);
    }

    destroy(): void {
        if (this.polygonRenderer) {
            destroyWebGPUPolygonRenderer(this.polygonRenderer);
            this.polygonRenderer = null;
        }
        if (this.pixelRenderer) {
            destroyWebGPUPixelRenderer(this.pixelRenderer);
            this.pixelRenderer = null;
        }
        if (this.lineRenderer) {
            destroyWebGPULineRenderer(this.lineRenderer);
            this.lineRenderer = null;
        }
    }
}

export async function createWebGPUManager(
    canvas: HTMLCanvasElement,
): Promise<WebGPUManager | null> {
    if (navigator.gpu) {
        try {
            const adapter = await navigator.gpu.requestAdapter();
            if (adapter) {
                const device = await adapter.requestDevice();
                const webgpuContext = canvas.getContext('webgpu');
                if (webgpuContext) {
                    const canvasFormat =
                        navigator.gpu.getPreferredCanvasFormat();
                    webgpuContext.configure({
                        device,
                        format: canvasFormat,
                        alphaMode: 'premultiplied',
                    });
                    const manager = new WebGPUManager(
                        device,
                        webgpuContext,
                        canvasFormat,
                    );
                    await manager.initialize();

                    console.debug('WebGPU manager initialized successfully');

                    return manager;
                }
            }
        } catch (error) {
            console.warn('Failed to initialize WebGPU for rendering:', error);
        }
    }

    return null;
}
