import earcut from 'earcut';

import { Polygon } from '../geometry/polygon';
import { WebGPUBufferPool } from './buffer-pool';
import { Color } from './colors';

export interface WebGPUPolygonRenderer {
    device: GPUDevice;
    renderPipeline: GPURenderPipeline;
    transformBuffer: GPUBuffer;
    transformBindGroup: GPUBindGroup;
    colorBuffer: GPUBuffer;
    colorBindGroup: GPUBindGroup;
    paletteTexture: GPUTexture;
    paletteSampler: GPUSampler;
    bufferPool: WebGPUBufferPool;
}

export interface RenderOptions {
    xOffset?: number;
    yOffset?: number;
    xCamera?: number;
    yCamera?: number;
    pixelSize?: number;
    containsMatchingEndpoints?: boolean;
    color?: Color;
    canvasWidth: number;
    canvasHeight: number;
    lineWidth?: number;
    filled?: boolean;
}

export async function createWebGPUPolygonRenderer(
    device: GPUDevice,
    canvasFormat: GPUTextureFormat,
): Promise<WebGPUPolygonRenderer> {
    // Vertex shader that handles camera transformation and pixel-perfect positioning
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
                padding: f32,
            }
            
            @group(0) @binding(0) var<uniform> transform: Transform;
            
            @vertex
            fn main(@location(0) pos: vec2<f32>) -> @builtin(position) vec4<f32> {
                // The position is already in world coordinates with pixel offsets applied
                // Just need to scale by pixel size and convert to NDC
                let world_x = pos.x * transform.pixel_size;
                let world_y = pos.y * transform.pixel_size;
                
                // Convert to normalized device coordinates
                let ndc_x = (world_x / transform.canvas_width) * 2.0 - 1.0;
                let ndc_y = 1.0 - (world_y / transform.canvas_height) * 2.0;
                
                return vec4<f32>(ndc_x, ndc_y, 0.0, 1.0);
            }
        `,
    });

    // Fragment shader for solid color rendering
    const fragmentShader = device.createShaderModule({
        code: `
            @group(1) @binding(0) var<uniform> color: vec4<f32>;
            
            @fragment
            fn main() -> @location(0) vec4<f32> {
                return color;
            }
        `,
    });

    // Create bind group layouts
    const transformBindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'uniform' },
            },
        ],
    });

    const colorBindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: { type: 'uniform' },
            },
        ],
    });

    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [transformBindGroupLayout, colorBindGroupLayout],
    });

    // Create render pipeline for line rendering
    const renderPipeline = device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
            module: vertexShader,
            entryPoint: 'main',
            buffers: [
                {
                    arrayStride: 8, // 2 floats * 4 bytes
                    attributes: [
                        {
                            format: 'float32x2',
                            offset: 0,
                            shaderLocation: 0,
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

    // Create uniform buffers
    const transformBuffer = device.createBuffer({
        size: 32, // 8 floats * 4 bytes (padded for alignment)
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const colorBuffer = device.createBuffer({
        size: 16, // 4 floats * 4 bytes
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Create bind groups
    const transformBindGroup = device.createBindGroup({
        layout: transformBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: { buffer: transformBuffer },
            },
        ],
    });

    const colorBindGroup = device.createBindGroup({
        layout: colorBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: { buffer: colorBuffer },
            },
        ],
    });

    // Create dummy palette texture and sampler (for compatibility)
    const paletteTexture = device.createTexture({
        size: [1, 1, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    const paletteSampler = device.createSampler({
        minFilter: 'nearest',
        magFilter: 'nearest',
    });

    // Create buffer pool for efficient vertex buffer management
    const bufferPool = new WebGPUBufferPool(device);

    return {
        device,
        renderPipeline,
        transformBuffer,
        transformBindGroup,
        colorBuffer,
        colorBindGroup,
        paletteTexture,
        paletteSampler,
        bufferPool,
    };
}

/**
 * Generate a thick line as a quad (two triangles)
 */
function generateThickLineQuad(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    thickness: number,
): number[] {
    // Calculate line direction and perpendicular
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return [];

    // Normalize and get perpendicular vector
    const ux = dx / length;
    const uy = dy / length;
    const perpX = -uy * thickness * 0.5;
    const perpY = ux * thickness * 0.5;

    // Calculate quad corners
    const p1x = x1 + perpX;
    const p1y = y1 + perpY;
    const p2x = x1 - perpX;
    const p2y = y1 - perpY;
    const p3x = x2 + perpX;
    const p3y = y2 + perpY;
    const p4x = x2 - perpX;
    const p4y = y2 - perpY;

    // Return two triangles that form the quad
    return [
        // Triangle 1: p1, p2, p3
        p1x,
        p1y,
        p2x,
        p2y,
        p3x,
        p3y,

        // Triangle 2: p2, p4, p3
        p2x,
        p2y,
        p4x,
        p4y,
        p3x,
        p3y,
    ];
}

function generatePolygonLineSegments(
    polygon: Polygon,
    options: Partial<RenderOptions> = {},
): Float32Array {
    const {
        xOffset = 0,
        yOffset = 0,
        xCamera = 0,
        yCamera = 0,
        containsMatchingEndpoints = false,
        lineWidth = 0.25,
    } = options;

    const vertices: number[] = [];

    // Get the actual vertices to use (excluding matching endpoints if needed)
    const points = containsMatchingEndpoints
        ? polygon.vertices.slice(0, -1)
        : polygon.vertices;

    // Generate thick line quads for each edge
    for (let i = 0; i < points.length; i++) {
        const currentPoint = points[i];
        const nextPoint = points[(i + 1) % points.length];

        // Apply camera transformation
        const x1 = currentPoint[0] - xCamera + xOffset;
        const y1 = currentPoint[1] - yCamera + yOffset;
        const x2 = nextPoint[0] - xCamera + xOffset;
        const y2 = nextPoint[1] - yCamera + yOffset;

        // Generate thick line quad
        const quadVertices = generateThickLineQuad(x1, y1, x2, y2, lineWidth);
        vertices.push(...quadVertices);
    }

    return new Float32Array(vertices);
}

function generateFilledPolygonTriangles(
    polygon: Polygon,
    options: Partial<RenderOptions> = {},
): Float32Array {
    const {
        xOffset = 0,
        yOffset = 0,
        xCamera = 0,
        yCamera = 0,
        containsMatchingEndpoints = false,
    } = options;

    const points = containsMatchingEndpoints
        ? polygon.vertices.slice(0, -1)
        : polygon.vertices;

    if (points.length < 3) {
        return new Float32Array([]);
    }

    const flatVertices: number[] = [];
    for (const point of points) {
        flatVertices.push(
            point[0] - xCamera + xOffset,
            point[1] - yCamera + yOffset,
        );
    }

    const triangleIndices = earcut(flatVertices);

    const triangleVertices: number[] = [];
    for (let i = 0; i < triangleIndices.length; i++) {
        const vertexIndex = triangleIndices[i] * 2;
        triangleVertices.push(
            flatVertices[vertexIndex],
            flatVertices[vertexIndex + 1],
        );
    }

    return new Float32Array(triangleVertices);
}

export function renderPolygon(
    renderer: WebGPUPolygonRenderer,
    polygon: Polygon,
    options: RenderOptions,
    renderPass: GPURenderPassEncoder,
): void {
    const {
        xOffset = 0,
        yOffset = 0,
        xCamera = 0,
        yCamera = 0,
        pixelSize = 5,
        color = [1, 1, 0, 1], // Default yellow
        canvasWidth,
        canvasHeight,
        filled = false,
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
        0, // padding
    ]);
    renderer.device.queue.writeBuffer(
        renderer.transformBuffer,
        0,
        transformData,
    );

    // Update color uniform buffer
    const colorData = new Float32Array(color);
    renderer.device.queue.writeBuffer(renderer.colorBuffer, 0, colorData);

    // Generate vertex data based on filled or outline mode
    const vertexData = filled
        ? generateFilledPolygonTriangles(polygon, options)
        : generatePolygonLineSegments(polygon, options);

    if (vertexData.length === 0) {
        return;
    }

    // Get a buffer from the pool
    const vertexBuffer = renderer.bufferPool.getBuffer(vertexData.length * 4);
    renderer.device.queue.writeBuffer(vertexBuffer, 0, vertexData);

    // Set up render pass
    renderPass.setPipeline(renderer.renderPipeline);
    renderPass.setBindGroup(0, renderer.transformBindGroup);
    renderPass.setBindGroup(1, renderer.colorBindGroup);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.draw(vertexData.length / 2); // 2 vertices per triangle vertex

    // Schedule buffer to be returned after GPU work completes
    renderer.bufferPool.returnBufferAfterFrame(vertexBuffer);
}

export function destroyWebGPUPolygonRenderer(
    renderer: WebGPUPolygonRenderer,
): void {
    renderer.transformBuffer.destroy();
    renderer.colorBuffer.destroy();
    renderer.paletteTexture.destroy();
    renderer.bufferPool.destroy();
}
