'use client';

import { useEffect, useRef, useState } from 'react';

// Define your 42-color palette
const colorPalette = [
    [1.0, 0.0, 0.0, 1.0], // 0: Red
    [0.0, 1.0, 0.0, 1.0], // 1: Green
    [0.0, 0.0, 1.0, 1.0], // 2: Blue
    [1.0, 1.0, 0.0, 1.0], // 3: Yellow
    [1.0, 0.0, 1.0, 1.0], // 4: Magenta
    [0.0, 1.0, 1.0, 1.0], // 5: Cyan
    [1.0, 0.5, 0.0, 1.0], // 6: Orange
    [0.5, 0.0, 1.0, 1.0], // 7: Purple
    [0.8, 0.2, 0.8, 1.0], // 8: Pink
    [0.3, 0.7, 0.3, 1.0], // 9: Forest Green
    // Add 32 more colors to reach 42...
    [0.9, 0.9, 0.9, 1.0], // 10: Light Gray
    [0.1, 0.1, 0.1, 1.0], // 11: Dark Gray
    // ... continue with more colors
] as const;

// POLYGON ((36 20, 44 20, 44 27, 33 27, 33 21, 29 21, 29 14, 36 14, 36 20))
// POLYGON ((43 38, 43 36, 51 36, 51 40, 44 40, 44 44, 35 44, 35 38, 43 38))
// POLYGON ((15 23, 15 24, 9 24, 9 22, 12 22, 12 19, 8 19, 8 13, 14 13, 14 18, 17 18, 17 14, 22 14, 22 19, 18 19, 18 23, 15 23))
// POLYGON ((149 189, 154 189, 154 195, 148 195, 148 190, 143 190, 143 186, 149 186, 149 189))
const polygonData = [
    {
        name: 'Complex Polygon',
        vertices: [
            36, 20, 44, 20, 44, 27, 33, 27, 33, 21, 29, 21, 29, 14, 36, 14, 36,
            20,
        ],
        colorIndex: 8, // Pink
    },
    {
        name: 'Triangle',
        vertices: [
            43, 38, 43, 36, 51, 36, 51, 40, 44, 40, 44, 44, 35, 44, 35, 38, 43,
            38,
        ],
        colorIndex: 0, // Red
    },
    {
        name: 'Pentagon',
        vertices: [
            15, 23, 15, 24, 9, 24, 9, 22, 12, 22, 12, 19, 8, 19, 8, 13, 14, 13,
            14, 18, 17, 18, 17, 14, 22, 14, 22, 19, 18, 19, 18, 23, 15, 23,
        ],
        colorIndex: 9, // Forest Green
    },
    {
        name: 'Star',
        vertices: [
            149, 189, 154, 189, 154, 195, 148, 195, 148, 190, 143, 190, 143,
            186, 149, 186, 149, 189,
        ],
        colorIndex: 2, // Blue
    },
];

export default function CanvasPage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isWebGPUSupported, setIsWebGPUSupported] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const [currentPolygon, setCurrentPolygon] = useState(0);
    const [animationSpeed, setAnimationSpeed] = useState(1);

    useEffect(() => {
        if (!canvasRef.current) return;

        const initWebGPU = async () => {
            try {
                if (!('gpu' in navigator)) {
                    setIsWebGPUSupported(false);
                    return;
                }

                const adapter = await navigator.gpu.requestAdapter();
                if (!adapter) {
                    setIsWebGPUSupported(false);
                    return;
                }

                const device = await adapter.requestDevice();
                const canvas = canvasRef.current!;
                const context = canvas.getContext('webgpu') as GPUCanvasContext;

                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;

                const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
                context.configure({
                    device,
                    format: canvasFormat,
                });

                // Calculate bounding box for all polygons to determine scale
                let minX = Infinity,
                    maxX = -Infinity;
                let minY = Infinity,
                    maxY = -Infinity;

                polygonData.forEach((polygon) => {
                    for (let i = 0; i < polygon.vertices.length; i += 2) {
                        const x = polygon.vertices[i];
                        const y = polygon.vertices[i + 1];
                        minX = Math.min(minX, x);
                        maxX = Math.max(maxX, x);
                        minY = Math.min(minY, y);
                        maxY = Math.max(maxY, y);
                    }
                });

                // Calculate transformation to fit polygons in viewport
                const width = maxX - minX;
                const height = maxY - minY;
                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;

                // Scale to fit in [-0.8, 0.8] range (leaving some margin)
                const scale = Math.min(1.6 / width, 1.6 / height);

                console.log(
                    `Coordinate bounds: X[${minX}, ${maxX}], Y[${minY}, ${maxY}]`,
                );
                console.log(
                    `Scale: ${scale}, Center: (${centerX}, ${centerY})`,
                );

                const vertexShader = device.createShaderModule({
                    code: `
            @group(1) @binding(0) var<uniform> transform: mat3x3<f32>;
            
            @vertex
            fn main(@location(0) pos: vec2<f32>) -> @builtin(position) vec4<f32> {
              // Apply transformation matrix to convert world coordinates to NDC
              let worldPos = vec3<f32>(pos, 1.0);
              let transformedPos = transform * worldPos;
              return vec4<f32>(transformedPos.xy, 0.0, 1.0);
            }
          `,
                });

                const fragmentShader = device.createShaderModule({
                    code: `
            @group(0) @binding(0) var<uniform> colorIndex: f32;
            @group(0) @binding(1) var paletteTexture: texture_2d<f32>;
            @group(0) @binding(2) var paletteSampler: sampler;
            
            @fragment
            fn main() -> @location(0) vec4<f32> {
              // Sample the palette texture using the color index
              let u = (colorIndex + 0.5) / 42.0; // Map index to UV coordinate
              let color = textureSample(paletteTexture, paletteSampler, vec2<f32>(u, 0.5));
              return color;
            }
          `,
                });

                const renderPipeline = device.createRenderPipeline({
                    layout: 'auto',
                    vertex: {
                        module: vertexShader,
                        entryPoint: 'main',
                        buffers: [
                            {
                                arrayStride: 8,
                                attributes: [
                                    {
                                        format: 'float32x2' as const,
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
                        topology: 'triangle-list' as const,
                    },
                });

                // Create transformation matrix
                // This transforms from world coordinates to normalized device coordinates
                const transformMatrix = new Float32Array([
                    scale,
                    0,
                    -centerX * scale, // Scale X and translate to center
                    0,
                    -scale,
                    centerY * scale, // Scale Y (flip) and translate to center
                    0,
                    0,
                    1, // Homogeneous coordinate
                ]);

                const transformBuffer = device.createBuffer({
                    size: transformMatrix.length * 4, // 9 floats * 4 bytes each
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                });

                device.queue.writeBuffer(transformBuffer, 0, transformMatrix);

                // Create bind group for transformation
                const transformBindGroup = device.createBindGroup({
                    layout: renderPipeline.getBindGroupLayout(1),
                    entries: [
                        {
                            binding: 0,
                            resource: { buffer: transformBuffer },
                        },
                    ],
                });

                // Create palette texture
                const paletteTexture = device.createTexture({
                    size: [42, 1, 1], // 42 pixels wide, 1 pixel tall
                    format: 'rgba8unorm',
                    usage:
                        GPUTextureUsage.TEXTURE_BINDING |
                        GPUTextureUsage.COPY_DST,
                });

                // Convert palette colors to Uint8Array for texture
                const paletteData = new Uint8Array(42 * 4); // 42 colors * 4 components (RGBA)
                colorPalette.forEach((color, index) => {
                    const offset = index * 4;
                    paletteData[offset] = Math.round(color[0] * 255); // R
                    paletteData[offset + 1] = Math.round(color[1] * 255); // G
                    paletteData[offset + 2] = Math.round(color[2] * 255); // B
                    paletteData[offset + 3] = Math.round(color[3] * 255); // A
                });

                // Upload palette data to texture
                device.queue.writeTexture(
                    { texture: paletteTexture },
                    paletteData,
                    { bytesPerRow: 42 * 4 },
                    { width: 42, height: 1 },
                );

                // Create sampler for palette texture
                const paletteSampler = device.createSampler({
                    minFilter: 'nearest',
                    magFilter: 'nearest',
                    addressModeU: 'clamp-to-edge',
                    addressModeV: 'clamp-to-edge',
                });

                const polygonBuffers = polygonData.map((polygon) => {
                    const vertices: number[] = [];
                    const numVertices = polygon.vertices.length / 2;

                    // Use original coordinates - transformation happens in vertex shader
                    for (let i = 1; i < numVertices - 1; i++) {
                        vertices.push(polygon.vertices[0], polygon.vertices[1]);
                        vertices.push(
                            polygon.vertices[i * 2],
                            polygon.vertices[i * 2 + 1],
                        );
                        vertices.push(
                            polygon.vertices[(i + 1) * 2],
                            polygon.vertices[(i + 1) * 2 + 1],
                        );
                    }

                    const vertexBuffer = device.createBuffer({
                        size: vertices.length * 4,
                        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                    });

                    device.queue.writeBuffer(
                        vertexBuffer,
                        0,
                        new Float32Array(vertices),
                    );

                    // Create uniform buffer for color index (just a single float)
                    const colorIndexBuffer = device.createBuffer({
                        size: 4, // 1 float * 4 bytes
                        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                    });

                    device.queue.writeBuffer(
                        colorIndexBuffer,
                        0,
                        new Float32Array([polygon.colorIndex]),
                    );

                    // Create bind group for this polygon
                    const bindGroup = device.createBindGroup({
                        layout: renderPipeline.getBindGroupLayout(0),
                        entries: [
                            {
                                binding: 0,
                                resource: { buffer: colorIndexBuffer },
                            },
                            {
                                binding: 1,
                                resource: paletteTexture.createView(),
                            },
                            {
                                binding: 2,
                                resource: paletteSampler,
                            },
                        ],
                    });

                    return {
                        buffer: vertexBuffer,
                        vertexCount: vertices.length / 2,
                        name: polygon.name,
                        colorIndexBuffer,
                        bindGroup,
                    };
                });

                setIsInitialized(true);

                let animationId: number;

                const render = (currentTime: number) => {
                    const encoder = device.createCommandEncoder();
                    const pass = encoder.beginRenderPass({
                        colorAttachments: [
                            {
                                view: context.getCurrentTexture().createView(),
                                clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
                                loadOp: 'clear' as const,
                                storeOp: 'store' as const,
                            },
                        ],
                    });

                    pass.setPipeline(renderPipeline);
                    pass.setBindGroup(1, transformBindGroup); // Set the transformation bind group

                    polygonBuffers.forEach((polygonBuffer) => {
                        pass.setBindGroup(0, polygonBuffer.bindGroup);
                        pass.setVertexBuffer(0, polygonBuffer.buffer);
                        pass.draw(polygonBuffer.vertexCount);
                    });

                    pass.end();
                    device.queue.submit([encoder.finish()]);
                    animationId = requestAnimationFrame(render);
                };

                animationId = requestAnimationFrame(render);

                return () => {
                    cancelAnimationFrame(animationId);
                    polygonBuffers.forEach((pb) => {
                        pb.buffer.destroy();
                        pb.colorIndexBuffer.destroy();
                    });
                    paletteTexture.destroy();
                    transformBuffer.destroy();
                    // Note: Samplers don't have a destroy method
                };
            } catch (error) {
                console.error('WebGPU failed:', error);
                setIsWebGPUSupported(false);
            }
        };

        initWebGPU();
    }, [animationSpeed]);

    if (!isWebGPUSupported) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">
                        WebGPU Not Supported
                    </h1>
                    <p className="text-lg mb-4">
                        Your browser does not support WebGPU. Please use Chrome
                        with WebGPU enabled.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 relative">
            <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 p-4 rounded-lg">
                <h2 className="text-white text-lg font-bold mb-2">
                    WebGPU Polygon Showcase
                </h2>
                <div className="text-white text-sm mb-2">
                    Current: {polygonData[currentPolygon]?.name}
                </div>
                <div className="mb-2">
                    <label className="text-white text-sm block mb-1">
                        Animation Speed:
                    </label>
                    <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={animationSpeed}
                        onChange={(e) =>
                            setAnimationSpeed(parseFloat(e.target.value))
                        }
                        className="w-full"
                    />
                </div>
                <div className="text-white text-xs">
                    {isInitialized ? 'WebGPU Initialized' : 'Loading...'}
                </div>
            </div>

            <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 p-4 rounded-lg max-w-xs">
                <h3 className="text-white text-sm font-bold mb-2">
                    Polygons ({polygonData.length})
                </h3>
                <div className="text-white text-xs space-y-1">
                    {polygonData.map((polygon, index) => (
                        <div
                            key={index}
                            className={`cursor-pointer hover:bg-gray-700 p-1 rounded ${
                                index === currentPolygon ? 'bg-blue-600' : ''
                            }`}
                            onClick={() => setCurrentPolygon(index)}
                        >
                            {polygon.name} ({polygon.vertices.length / 2}{' '}
                            vertices)
                        </div>
                    ))}
                </div>
            </div>

            <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ display: 'block' }}
            />
        </div>
    );
}
