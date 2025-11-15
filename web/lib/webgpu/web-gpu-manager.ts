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

type TextureDimensions = {
    width: number;
    height: number;
};

export class WebGPUManager {
    private polygonRenderer: WebGPUPolygonRenderer | null = null;
    private pixelRenderer: WebGPUPixelRenderer | null = null;
    private lineRenderer: WebGPULineRenderer | null = null;
    private textureRenderPipeline: GPURenderPipeline | null = null;
    private textureSampler: GPUSampler | null = null;
    private persistentTexture: GPUTexture | null = null;
    private persistentTextureSize: TextureDimensions | null = null;
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
        this.initializeTextureRenderer();
    }

    createRenderTexture(size: TextureDimensions): GPUTexture {
        return this.device.createTexture({
            size: {
                width: size.width,
                height: size.height,
                depthOrArrayLayers: 1,
            },
            format: this.canvasFormat,
            usage:
                GPUTextureUsage.RENDER_ATTACHMENT |
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_SRC |
                GPUTextureUsage.COPY_DST,
        });
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
                    loadOp: 'load',
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

    private renderPixelsToTexture(
        targetTexture: GPUTexture,
        size: TextureDimensions,
        pixels: Pixel[],
        options: Partial<PixelRenderOptions> = {},
        clear = false,
    ): void {
        if (!this.pixelRenderer) {
            throw new Error(
                'WebGPU pixel renderer not initialized. Call initialize() first.',
            );
        }

        const commandEncoder = this.device.createCommandEncoder();
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: targetTexture.createView(),
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
                    loadOp: clear ? 'clear' : 'load',
                    storeOp: 'store',
                },
            ],
        });
        const renderOptions: PixelRenderOptions = {
            ...options,
            canvasWidth: size.width,
            canvasHeight: size.height,
        };

        const shouldRender = pixels.length > 0;
        if (shouldRender) {
            renderPixels(this.pixelRenderer, pixels, renderOptions, renderPass);
        }

        renderPass.end();
        this.device.queue.submit([commandEncoder.finish()]);

        if (shouldRender) {
            this.pixelRenderer.bufferPool.processFrameCompletion();
        }
    }

    initializePersistentTexture(size: TextureDimensions): void {
        const needsNewTexture =
            !this.persistentTexture ||
            !this.persistentTextureSize ||
            this.persistentTextureSize.width !== size.width ||
            this.persistentTextureSize.height !== size.height;

        if (!needsNewTexture) {
            return;
        }

        this.persistentTexture?.destroy();
        this.persistentTexture = this.createRenderTexture(size);
        this.persistentTextureSize = size;
    }

    renderPersistentPixels(
        pixels: Pixel[],
        options: Partial<PixelRenderOptions> = {},
        clear = false,
    ): void {
        if (!this.persistentTexture || !this.persistentTextureSize) {
            throw new Error('Persistent texture not initialized.');
        }

        if (clear || pixels.length > 0) {
            this.renderPixelsToTexture(
                this.persistentTexture,
                this.persistentTextureSize,
                pixels,
                options,
                clear,
            );
        }

        this.presentTexture(this.persistentTexture);
    }

    private initializeTextureRenderer(): void {
        const vertexModule = this.device.createShaderModule({
            code: `
                struct VertexOutput {
                    @builtin(position) position: vec4<f32>,
                    @location(0) texCoords: vec2<f32>,
                };

                @vertex
                fn main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
                    var positions = array<vec2<f32>, 4>(
                        vec2<f32>(-1.0, -1.0),
                        vec2<f32>(1.0, -1.0),
                        vec2<f32>(-1.0, 1.0),
                        vec2<f32>(1.0, 1.0)
                    );

                    var uvs = array<vec2<f32>, 4>(
                        vec2<f32>(0.0, 1.0),
                        vec2<f32>(1.0, 1.0),
                        vec2<f32>(0.0, 0.0),
                        vec2<f32>(1.0, 0.0)
                    );

                    var output: VertexOutput;
                    output.position = vec4<f32>(positions[vertexIndex], 0.0, 1.0);
                    output.texCoords = uvs[vertexIndex];
                    return output;
                }
            `,
        });

        const fragmentModule = this.device.createShaderModule({
            code: `
                struct VertexOutput {
                    @builtin(position) position: vec4<f32>,
                    @location(0) texCoords: vec2<f32>,
                };

                @group(0) @binding(0) var mySampler: sampler;
                @group(0) @binding(1) var myTexture: texture_2d<f32>;

                @fragment
                fn main(input: VertexOutput) -> @location(0) vec4<f32> {
                    return textureSample(myTexture, mySampler, input.texCoords);
                }
            `,
        });

        this.textureSampler = this.device.createSampler({
            magFilter: 'nearest',
            minFilter: 'nearest',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
        });

        this.textureRenderPipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: vertexModule,
                entryPoint: 'main',
            },
            fragment: {
                module: fragmentModule,
                entryPoint: 'main',
                targets: [{ format: this.canvasFormat }],
            },
            primitive: {
                topology: 'triangle-strip',
                stripIndexFormat: undefined,
            },
        });
    }

    private presentTexture(sourceTexture: GPUTexture): void {
        if (!this.textureRenderPipeline || !this.textureSampler) {
            throw new Error('Texture renderer not initialized.');
        }

        const bindGroup = this.device.createBindGroup({
            layout: this.textureRenderPipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: this.textureSampler,
                },
                {
                    binding: 1,
                    resource: sourceTexture.createView(),
                },
            ],
        });

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

        renderPass.setPipeline(this.textureRenderPipeline);
        renderPass.setBindGroup(0, bindGroup);
        renderPass.draw(4);
        renderPass.end();

        this.device.queue.submit([commandEncoder.finish()]);
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
        this.textureRenderPipeline = null;
        this.textureSampler = null;
        this.persistentTexture?.destroy();
        this.persistentTexture = null;
        this.persistentTextureSize = null;
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
