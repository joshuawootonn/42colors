import { WebGPUBufferPool } from './buffer-pool';
import { Color } from './colors';

export type LineItem = {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color: Color;
    thickness?: number;
};

export type LineRenderOptions = {
    /** The number of pixels between the viewport edge and your first full pixel on the X-axis */
    xOffset?: number;

    /** The number of pixels between the viewport edge and your first full pixel on the  Y-axis */
    yOffset?: number;

    /** Camera X position for viewport transformation */
    xCamera?: number;

    /** Camera Y position for viewport transformation */
    yCamera?: number;

    /** Size of each pixel in the grid system */
    pixelSize?: number;

    /** Width of the canvas in pixels */
    canvasWidth: number;

    /** Height of the canvas in pixels */
    canvasHeight: number;

    cameraMode?: 'relative' | 'absolute';
};

export type WebGPULineRenderer = {
    device: GPUDevice;
    renderPipeline: GPURenderPipeline;
    transformBuffer: GPUBuffer;
    transformBindGroup: GPUBindGroup;
    bufferPool: WebGPUBufferPool;
};

export async function createWebGPULineRenderer(
    device: GPUDevice,
    canvasFormat: GPUTextureFormat,
): Promise<WebGPULineRenderer> {
    const vertexShader = device.createShaderModule({
        code: `
            struct Transform {
                camera_x: f32,
                camera_y: f32,
                pixel_size: f32,
                x_offset: f32,
                y_offset: f32,
                canvas_width: f32,
                canvas_height: f32,
                camera_mode: f32, // 0.0 = absolute, 1.0 = relative
            }
            
            struct VertexInput {
                @location(0) position: vec2<f32>,
                @location(1) color: vec4<f32>,
            }
            
            struct VertexOutput {
                @builtin(position) position: vec4<f32>,
                @location(0) color: vec4<f32>,
            }
            
            @group(0) @binding(0) var<uniform> transform: Transform;
            
            @vertex
            fn main(input: VertexInput) -> VertexOutput {
                var output: VertexOutput;
                
                var world_x: f32;
                var world_y: f32;
                
                if (transform.camera_mode > 0.5) {
                    // Relative mode: apply camera transformation
                    world_x = (input.position.x - transform.camera_x + transform.x_offset) * transform.pixel_size;
                    world_y = (input.position.y - transform.camera_y + transform.y_offset) * transform.pixel_size;
                } else {
                    // Absolute mode: ignore camera, just apply offset
                    world_x = (input.position.x + transform.x_offset) * transform.pixel_size;
                    world_y = (input.position.y + transform.y_offset) * transform.pixel_size;
                }
                
                // Convert to normalized device coordinates
                let ndc_x = (world_x / transform.canvas_width) * 2.0 - 1.0;
                let ndc_y = 1.0 - (world_y / transform.canvas_height) * 2.0;
                
                output.position = vec4<f32>(ndc_x, ndc_y, 0.0, 1.0);
                output.color = input.color;
                
                return output;
            }
        `,
    });

    const fragmentShader = device.createShaderModule({
        code: `
            struct VertexOutput {
                @builtin(position) position: vec4<f32>,
                @location(0) color: vec4<f32>,
            }
            
            @fragment
            fn main(input: VertexOutput) -> @location(0) vec4<f32> {
                return input.color;
            }
        `,
    });

    const transformBindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'uniform' },
            },
        ],
    });

    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [transformBindGroupLayout],
    });

    const renderPipeline = device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
            module: vertexShader,
            entryPoint: 'main',
            buffers: [
                {
                    arrayStride: 24, // 6 floats * 4 bytes (vec2 position + vec4 color)
                    attributes: [
                        {
                            format: 'float32x2',
                            offset: 0,
                            shaderLocation: 0, // position
                        },
                        {
                            format: 'float32x4',
                            offset: 8,
                            shaderLocation: 1, // color
                        },
                    ],
                },
            ],
        },
        fragment: {
            module: fragmentShader,
            entryPoint: 'main',
            targets: [
                {
                    format: canvasFormat,
                    blend: {
                        color: {
                            srcFactor: 'src-alpha',
                            dstFactor: 'one-minus-src-alpha',
                            operation: 'add',
                        },
                        alpha: {
                            srcFactor: 'one',
                            dstFactor: 'one-minus-src-alpha',
                            operation: 'add',
                        },
                    },
                },
            ],
        },
        primitive: {
            topology: 'triangle-list',
            stripIndexFormat: undefined,
        },
    });

    const transformBuffer = device.createBuffer({
        size: 32, // 8 floats * 4 bytes (padded for alignment)
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const transformBindGroup = device.createBindGroup({
        layout: transformBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: { buffer: transformBuffer },
            },
        ],
    });

    const bufferPool = new WebGPUBufferPool(device);

    return {
        device,
        renderPipeline,
        transformBuffer,
        transformBindGroup,
        bufferPool,
    };
}

export function destroyWebGPULineRenderer(renderer: WebGPULineRenderer): void {
    renderer.transformBuffer.destroy();
    renderer.bufferPool.destroy();
}

export function renderLines(
    renderer: WebGPULineRenderer,
    lines: LineItem[],
    options: LineRenderOptions,
    renderPass: GPURenderPassEncoder,
): void {
    const {
        xOffset = 0,
        yOffset = 0,
        xCamera = 0,
        yCamera = 0,
        pixelSize = 1,
        canvasWidth,
        canvasHeight,
        cameraMode = 'relative',
    } = options;

    // Update transform uniform buffer
    const transformData = new Float32Array([
        xCamera,
        yCamera,
        pixelSize,
        xOffset,
        yOffset,
        canvasWidth,
        canvasHeight,
        cameraMode === 'relative' ? 1.0 : 0.0,
    ]);

    renderer.device.queue.writeBuffer(
        renderer.transformBuffer,
        0,
        transformData,
    );

    // Render each line as a thin rectangle
    for (const line of lines) {
        const thickness = line.thickness || 1;
        const halfThickness = thickness / 2;

        const dx = line.endX - line.startX;
        const dy = line.endY - line.startY;
        const length = Math.sqrt(dx * dx + dy * dy);

        let vertices: Float32Array;

        if (length === 0) {
            // Point line - create a small square
            vertices = new Float32Array([
                // Triangle 1
                line.startX - halfThickness,
                line.startY - halfThickness,
                ...line.color,
                line.startX + halfThickness,
                line.startY - halfThickness,
                ...line.color,
                line.startX + halfThickness,
                line.startY + halfThickness,
                ...line.color,
                // Triangle 2
                line.startX - halfThickness,
                line.startY - halfThickness,
                ...line.color,
                line.startX + halfThickness,
                line.startY + halfThickness,
                ...line.color,
                line.startX - halfThickness,
                line.startY + halfThickness,
                ...line.color,
            ]);
        } else {
            // Normalize direction vector
            const ndx = dx / length;
            const ndy = dy / length;

            // Perpendicular vector for thickness
            const perpX = -ndy * halfThickness;
            const perpY = ndx * halfThickness;

            // Create rectangle vertices for the line
            vertices = new Float32Array([
                // Triangle 1
                line.startX + perpX,
                line.startY + perpY,
                ...line.color,
                line.endX + perpX,
                line.endY + perpY,
                ...line.color,
                line.endX - perpX,
                line.endY - perpY,
                ...line.color,
                // Triangle 2
                line.startX + perpX,
                line.startY + perpY,
                ...line.color,
                line.endX - perpX,
                line.endY - perpY,
                ...line.color,
                line.startX - perpX,
                line.startY - perpY,
                ...line.color,
            ]);
        }

        // Get a buffer from the pool and upload vertex data
        const vertexBuffer = renderer.bufferPool.getBuffer(vertices.byteLength);
        renderer.device.queue.writeBuffer(vertexBuffer, 0, vertices);

        renderPass.setPipeline(renderer.renderPipeline);
        renderPass.setBindGroup(0, renderer.transformBindGroup);
        renderPass.setVertexBuffer(0, vertexBuffer);
        renderPass.draw(6); // 2 triangles = 6 vertices

        // Schedule buffer to be returned after GPU work completes
        renderer.bufferPool.returnBufferAfterFrame(vertexBuffer);
    }
}
