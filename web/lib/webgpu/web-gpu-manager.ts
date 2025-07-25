import { Pixel } from '../geometry/coord';
import { Polygon } from '../geometry/polygon';
import {
    WebGPUPixelRenderer,
    createWebGPUPixelRenderer,
    destroyWebGPUPixelRenderer,
    renderPixels,
} from './pixel-renderer';
import {
    RenderOptions,
    WebGPUPolygonRenderer,
    createWebGPUPolygonRenderer,
    destroyWebGPUPolygonRenderer,
    renderPolygon,
} from './polygon-renderer';

export class WebGPUManager {
    private polygonRenderer: WebGPUPolygonRenderer | null = null;
    private pixelRenderer: WebGPUPixelRenderer | null = null;
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
        if (!this.polygonRenderer) {
            throw new Error(
                'WebGPU polygon renderer not initialized. Call initialize() first.',
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

            renderPolygon(
                this.polygonRenderer,
                polygon,
                renderOptions,
                renderPass,
            );
        }

        renderPass.end();
        this.device.queue.submit([commandEncoder.finish()]);
    }

    /**
     * Render pixels using WebGPU
     */
    redrawPixels(pixels: Pixel[], camera: { x: number; y: number }): void {
        if (!this.pixelRenderer) {
            throw new Error(
                'WebGPU pixel renderer not initialized. Call initialize() first.',
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

        // Use the renderPixels function
        renderPixels(
            this.pixelRenderer,
            pixels,
            {
                xCamera: Math.floor(camera.x),
                yCamera: Math.floor(camera.y),
                pixelSize: 1,
                canvasWidth: canvas.width,
                canvasHeight: canvas.height,
            },
            renderPass,
        );

        renderPass.end();
        this.device.queue.submit([commandEncoder.finish()]);
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
        if (this.polygonRenderer) {
            destroyWebGPUPolygonRenderer(this.polygonRenderer);
            this.polygonRenderer = null;
        }
        if (this.pixelRenderer) {
            destroyWebGPUPixelRenderer(this.pixelRenderer);
            this.pixelRenderer = null;
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

                    console.log('WebGPU manager initialized successfully');

                    return manager;
                }
            }
        } catch (error) {
            console.warn('Failed to initialize WebGPU for rendering:', error);
        }
    }

    return null;
}
