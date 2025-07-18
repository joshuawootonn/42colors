import { Pixel } from '../geometry/coord';
import { Polygon } from '../geometry/polygon';
import { COLOR_TABLE } from '../palette';
import { hexToRgbaColor } from './colors';
import {
    WebGPUPixelRenderer,
    createWebGPUPixelRenderer,
    destroyWebGPUPixelRenderer,
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

        // Process any pending buffer returns after submission
        this.polygonRenderer.bufferPool.processFrameCompletion();
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

        // Update transform uniform buffer
        const transformData = new Float32Array([
            Math.floor(camera.x),
            Math.floor(camera.y),
            1, // pixelSize
            canvas.width,
            canvas.height,
            0, // padding
            0, // padding
            0, // padding
        ]);
        this.pixelRenderer.device.queue.writeBuffer(
            this.pixelRenderer.transformBuffer,
            0,
            transformData,
        );

        // Generate vertex data for all pixels
        const vertexData = this.generatePixelQuads(pixels);

        if (vertexData.length > 0) {
            // Get a buffer from the pool
            const vertexBuffer = this.pixelRenderer.bufferPool.getBuffer(
                vertexData.length * 4,
            );
            this.pixelRenderer.device.queue.writeBuffer(
                vertexBuffer,
                0,
                vertexData,
            );

            // Render pixels
            renderPass.setPipeline(this.pixelRenderer.renderPipeline);
            renderPass.setBindGroup(0, this.pixelRenderer.transformBindGroup);
            renderPass.setVertexBuffer(0, vertexBuffer);
            renderPass.draw(vertexData.length / 6); // 6 floats per vertex

            // Schedule buffer to be returned after GPU work completes
            this.pixelRenderer.bufferPool.returnBufferAfterFrame(vertexBuffer);
        }

        renderPass.end();
        this.device.queue.submit([commandEncoder.finish()]);

        // Process any pending buffer returns after submission
        this.pixelRenderer.bufferPool.processFrameCompletion();
    }

    /**
     * Generate vertex data for pixels as quads (2 triangles per pixel)
     */
    private generatePixelQuads(pixels: Pixel[]): Float32Array {
        const vertices: number[] = [];

        for (const pixel of pixels) {
            // Get color from palette
            const colorRef = pixel.colorRef;
            const color = this.getColorFromRef(colorRef);

            // Create a 1x1 pixel quad
            const x = pixel.x;
            const y = pixel.y;
            const x1 = x + 1;
            const y1 = y + 1;

            // Triangle 1: top-left, bottom-left, top-right
            vertices.push(
                x,
                y,
                ...color, // top-left
                x,
                y1,
                ...color, // bottom-left
                x1,
                y,
                ...color, // top-right
            );

            // Triangle 2: bottom-left, bottom-right, top-right
            vertices.push(
                x,
                y1,
                ...color, // bottom-left
                x1,
                y1,
                ...color, // bottom-right
                x1,
                y,
                ...color, // top-right
            );
        }

        return new Float32Array(vertices);
    }

    /**
     * Convert color reference to RGBA color
     */
    private getColorFromRef(
        colorRef: number,
    ): [number, number, number, number] {
        const colorHex = COLOR_TABLE[colorRef as keyof typeof COLOR_TABLE];
        return hexToRgbaColor(colorHex);
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
