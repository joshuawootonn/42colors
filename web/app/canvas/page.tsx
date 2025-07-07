'use client';

import { useEffect, useRef, useState } from 'react';

const polygonData = [
    {
        name: 'Complex Polygon',
        vertices: [
            0, 0.3, -0.2, 0.2, -0.3, 0.1, -0.25, -0.1, -0.35, -0.25, -0.1, -0.3,
            0.1, -0.25, 0.25, -0.1, 0.3, 0.05, 0.2, 0.15,
        ],
        color: [0.8, 0.2, 0.8, 1],
    },
    {
        name: 'Triangle',
        vertices: [0, 0.5, -0.4, -0.3, 0.4, -0.3],
        color: [1, 0.3, 0.3, 1],
    },
    {
        name: 'Pentagon',
        vertices: [0, 0.4, -0.38, 0.12, -0.24, -0.32, 0.24, -0.32, 0.38, 0.12],
        color: [0.3, 0.7, 0.3, 1],
    },
    {
        name: 'Star',
        vertices: [
            0, 0.5, -0.12, 0.15, -0.48, 0.15, -0.19, -0.08, -0.29, -0.4, 0,
            -0.2, 0.29, -0.4, 0.19, -0.08, 0.48, 0.15, 0.12, 0.15,
        ],
        color: [0.3, 0.3, 1, 1],
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

                const vertexShader = device.createShaderModule({
                    code: `
            @vertex
            fn main(@location(0) pos: vec2<f32>) -> @builtin(position) vec4<f32> {
              return vec4<f32>(pos, 0.0, 1.0);
            }
          `,
                });

                const fragmentShader = device.createShaderModule({
                    code: `
            @group(0) @binding(0) var<uniform> color: vec4<f32>;
            
            @fragment
            fn main() -> @location(0) vec4<f32> {
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

                const polygonBuffers = polygonData.map((polygon) => {
                    const vertices: number[] = [];
                    const numVertices = polygon.vertices.length / 2;

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

                    // Create uniform buffer for color
                    const colorBuffer = device.createBuffer({
                        size: 16, // 4 floats * 4 bytes each
                        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                    });

                    device.queue.writeBuffer(
                        colorBuffer,
                        0,
                        new Float32Array(polygon.color),
                    );

                    // Create bind group for this polygon's color
                    const bindGroup = device.createBindGroup({
                        layout: renderPipeline.getBindGroupLayout(0),
                        entries: [
                            {
                                binding: 0,
                                resource: {
                                    buffer: colorBuffer,
                                },
                            },
                        ],
                    });

                    return {
                        buffer: vertexBuffer,
                        vertexCount: vertices.length / 2,
                        name: polygon.name,
                        colorBuffer,
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
                        pb.colorBuffer.destroy();
                    });
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
