import { WebGPUBufferPool } from './buffer-pool';

export interface WebGPUPixelRenderer {
    device: GPUDevice;
    renderPipeline: GPURenderPipeline;
    transformBuffer: GPUBuffer;
    transformBindGroup: GPUBindGroup;
    bufferPool: WebGPUBufferPool;
}

export interface PixelRenderOptions {
    xCamera?: number;
    yCamera?: number;
    pixelSize?: number;
    canvasWidth: number;
    canvasHeight: number;
}

export async function createWebGPUPixelRenderer(
    device: GPUDevice,
    canvasFormat: GPUTextureFormat,
): Promise<WebGPUPixelRenderer> {
    // Vertex shader for pixel rendering
    const vertexShader = device.createShaderModule({
        code: `
            struct Transform {
                camera_x: f32,
                camera_y: f32,
                pixel_size: f32,
                canvas_width: f32,
                canvas_height: f32,
                padding1: f32,
                padding2: f32,
                padding3: f32,
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
                
                // Apply camera transformation
                let world_x = (input.position.x - transform.camera_x) * transform.pixel_size;
                let world_y = (input.position.y - transform.camera_y) * transform.pixel_size;
                
                // Convert to normalized device coordinates
                let ndc_x = (world_x / transform.canvas_width) * 2.0 - 1.0;
                let ndc_y = 1.0 - (world_y / transform.canvas_height) * 2.0;
                
                output.position = vec4<f32>(ndc_x, ndc_y, 0.0, 1.0);
                output.color = input.color;
                
                return output;
            }
        `,
    });

    // Fragment shader for pixel rendering
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

    // Create bind group layout
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

    // Create render pipeline for pixel rendering
    const renderPipeline = device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
            module: vertexShader,
            entryPoint: 'main',
            buffers: [
                {
                    arrayStride: 24, // 6 floats * 4 bytes (position + color)
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
            targets: [{ format: canvasFormat }],
        },
        primitive: {
            topology: 'triangle-list',
            stripIndexFormat: undefined,
        },
    });

    // Create uniform buffer
    const transformBuffer = device.createBuffer({
        size: 32, // 8 floats * 4 bytes (padded for alignment)
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Create bind group
    const transformBindGroup = device.createBindGroup({
        layout: transformBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: { buffer: transformBuffer },
            },
        ],
    });

    // Create buffer pool for efficient vertex buffer management
    const bufferPool = new WebGPUBufferPool(device);

    return {
        device,
        renderPipeline,
        transformBuffer,
        transformBindGroup,
        bufferPool,
    };
}

// generatePixelQuads function moved to RealtimeWebGPUManager

// This function is not used - rendering is handled by RealtimeWebGPUManager

export function destroyWebGPUPixelRenderer(
    renderer: WebGPUPixelRenderer,
): void {
    renderer.transformBuffer.destroy();
    renderer.bufferPool.destroy();
}
