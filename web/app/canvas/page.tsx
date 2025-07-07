'use client'

import { useEffect, useRef, useState } from 'react'

// Polygon data with varying complexity
const polygonData = [
  // Triangle
  { name: 'Triangle', vertices: [0, 0.5, -0.5, -0.5, 0.5, -0.5], color: [1, 0, 0, 1] },
  // Square
  { name: 'Square', vertices: [-0.3, 0.3, -0.3, -0.3, 0.3, -0.3, 0.3, 0.3], color: [0, 1, 0, 1] },
  // Pentagon
  { name: 'Pentagon', vertices: [0, 0.4, -0.38, 0.12, -0.23, -0.32, 0.23, -0.32, 0.38, 0.12], color: [0, 0, 1, 1] },
  // Hexagon
  { name: 'Hexagon', vertices: [0, 0.3, -0.26, 0.15, -0.26, -0.15, 0, -0.3, 0.26, -0.15, 0.26, 0.15], color: [1, 1, 0, 1] },
  // Octagon
  { name: 'Octagon', vertices: [0, 0.25, -0.18, 0.18, -0.25, 0, -0.18, -0.18, 0, -0.25, 0.18, -0.18, 0.25, 0, 0.18, 0.18], color: [1, 0, 1, 1] },
  // Star (5-pointed)
  { name: 'Star', vertices: [0, 0.4, -0.12, 0.12, -0.38, 0.12, -0.19, -0.08, -0.23, -0.32, 0, -0.2, 0.23, -0.32, 0.19, -0.08, 0.38, 0.12, 0.12, 0.12], color: [0, 1, 1, 1] },
  // Complex star (8-pointed)
  { name: 'Complex Star', vertices: [0, 0.35, -0.1, 0.1, -0.25, 0.25, -0.1, 0.1, -0.35, 0, -0.1, -0.1, -0.25, -0.25, -0.1, -0.1, 0, -0.35, 0.1, -0.1, 0.25, -0.25, 0.1, -0.1, 0.35, 0, 0.1, 0.1, 0.25, 0.25, 0.1, 0.1], color: [0.5, 0.5, 1, 1] },
  // Arrow
  { name: 'Arrow', vertices: [0, 0.4, -0.15, 0.1, -0.08, 0.1, -0.08, -0.4, 0.08, -0.4, 0.08, 0.1, 0.15, 0.1], color: [1, 0.5, 0, 1] },
  // Complex polygon (irregular)
  { name: 'Complex Polygon', vertices: [0, 0.3, -0.2, 0.2, -0.3, 0.1, -0.25, -0.1, -0.35, -0.25, -0.1, -0.3, 0.1, -0.25, 0.25, -0.1, 0.3, 0.05, 0.2, 0.15], color: [0.8, 0.2, 0.8, 1] },
  // Heart shape
  { name: 'Heart', vertices: [0, -0.3, -0.15, -0.1, -0.25, 0, -0.35, 0.1, -0.25, 0.25, -0.1, 0.15, 0, 0.05, 0.1, 0.15, 0.25, 0.25, 0.35, 0.1, 0.25, 0, 0.15, -0.1], color: [1, 0.2, 0.2, 1] }
]

// Vertex shader with transform uniforms
const vertexShaderSource = \`
  struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
  }

  struct Transform {
    scale: f32,
    offsetX: f32,
    offsetY: f32,
    rotation: f32,
  }

  @group(0) @binding(0) var<uniform> transform: Transform;

  @vertex
  fn main(@location(0) position: vec2<f32>, @location(1) color: vec4<f32>) -> VertexOutput {
    var output: VertexOutput;
    
    // Apply scale and rotation
    let cosR = cos(transform.rotation);
    let sinR = sin(transform.rotation);
    let scaledPos = position * transform.scale;
    let rotatedPos = vec2<f32>(
      scaledPos.x * cosR - scaledPos.y * sinR,
      scaledPos.x * sinR + scaledPos.y * cosR
    );
    
    // Apply offset
    let finalPos = rotatedPos + vec2<f32>(transform.offsetX, transform.offsetY);
    
    output.position = vec4<f32>(finalPos, 0.0, 1.0);
    output.color = color;
    return output;
  }
\`

const fragmentShaderSource = \`
  @fragment
  fn main(@location(0) color: vec4<f32>) -> @location(0) vec4<f32> {
    return color;
  }
\`

export default function CanvasPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isWebGPUSupported, setIsWebGPUSupported] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentPolygon, setCurrentPolygon] = useState(0)
  const [animationSpeed, setAnimationSpeed] = useState(1)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    if (typeof window !== 'undefined') {
      handleResize()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return

    const initWebGPU = async () => {
      try {
        if (!navigator.gpu) {
          setIsWebGPUSupported(false)
          return
        }

        const adapter = await navigator.gpu.requestAdapter()
        if (!adapter) {
          setIsWebGPUSupported(false)
          return
        }

        const device = await adapter.requestDevice()
        const canvas = canvasRef.current!
        const context = canvas.getContext('webgpu')!
        
        const canvasFormat = navigator.gpu.getPreferredCanvasFormat()
        context.configure({
          device,
          format: canvasFormat,
        })

        // Create shader module
        const shaderModule = device.createShaderModule({
          code: vertexShaderSource + fragmentShaderSource,
        })

        // Create uniform buffer layout
        const uniformBufferLayout = device.createBindGroupLayout({
          entries: [
            {
              binding: 0,
              visibility: GPUShaderStage.VERTEX,
              buffer: {
                type: 'uniform',
              },
            },
          ],
        })

        // Create render pipeline
        const renderPipeline = device.createRenderPipeline({
          layout: device.createPipelineLayout({
            bindGroupLayouts: [uniformBufferLayout],
          }),
          vertex: {
            module: shaderModule,
            entryPoint: 'main',
            buffers: [
              {
                arrayStride: 6 * 4, // 2 position + 4 color floats
                attributes: [
                  {
                    format: 'float32x2',
                    offset: 0,
                    shaderLocation: 0,
                  },
                  {
                    format: 'float32x4',
                    offset: 2 * 4,
                    shaderLocation: 1,
                  },
                ],
              },
            ],
          },
          fragment: {
            module: shaderModule,
            entryPoint: 'main',
            targets: [
              {
                format: canvasFormat,
              },
            ],
          },
          primitive: {
            topology: 'triangle-list',
          },
        })

        // Create uniform buffer
        const uniformBuffer = device.createBuffer({
          size: 4 * 4, // 4 floats (scale, offsetX, offsetY, rotation)
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        })

        // Create bind group
        const bindGroup = device.createBindGroup({
          layout: uniformBufferLayout,
          entries: [
            {
              binding: 0,
              resource: {
                buffer: uniformBuffer,
              },
            },
          ],
        })

        // Create vertex buffers for all polygons
        const polygonBuffers = polygonData.map((polygon) => {
          const vertices = []
          
          // Convert polygon to triangles using fan triangulation
          const numVertices = polygon.vertices.length / 2
          for (let i = 1; i < numVertices - 1; i++) {
            // Triangle: vertex 0, vertex i, vertex i+1
            vertices.push(polygon.vertices[0], polygon.vertices[1], ...polygon.color)
            vertices.push(polygon.vertices[i * 2], polygon.vertices[i * 2 + 1], ...polygon.color)
            vertices.push(polygon.vertices[(i + 1) * 2], polygon.vertices[(i + 1) * 2 + 1], ...polygon.color)
          }

          const vertexBuffer = device.createBuffer({
            size: vertices.length * 4,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
          })

          device.queue.writeBuffer(vertexBuffer, 0, new Float32Array(vertices))

          return {
            buffer: vertexBuffer,
            vertexCount: vertices.length / 6,
            name: polygon.name,
          }
        })

        setIsInitialized(true)

        // Animation loop
        let animationId: number
        let lastTime = 0
        let polygonSwitchTime = 0
        
        const render = (currentTime: number) => {
          const deltaTime = currentTime - lastTime
          lastTime = currentTime

          // Update current polygon based on animation speed
          if (currentTime - polygonSwitchTime > 2000 / animationSpeed) {
            setCurrentPolygon((prev) => (prev + 1) % polygonData.length)
            polygonSwitchTime = currentTime
          }

          const encoder = device.createCommandEncoder()
          const pass = encoder.beginRenderPass({
            colorAttachments: [
              {
                view: context.getCurrentTexture().createView(),
                clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store',
              },
            ],
          })

          pass.setPipeline(renderPipeline)
          pass.setBindGroup(0, bindGroup)

          // Render all polygons in a grid layout
          const gridSize = Math.ceil(Math.sqrt(polygonData.length))
          const cellSize = 1.8 / gridSize
          
          polygonBuffers.forEach((polygonBuffer, index) => {
            const row = Math.floor(index / gridSize)
            const col = index % gridSize
            
            // Calculate position for grid layout
            const x = -0.9 + col * cellSize + cellSize / 2
            const y = 0.9 - row * cellSize - cellSize / 2
            
            // Highlight current polygon with animation
            const isCurrentPolygon = index === currentPolygon
            const scale = isCurrentPolygon ? 0.8 + 0.2 * Math.sin(currentTime * 0.01) : 0.6
            const rotation = isCurrentPolygon ? currentTime * 0.002 : 0
            
            // Update uniform buffer for this polygon
            const uniformData = new Float32Array([scale, x, y, rotation])
            device.queue.writeBuffer(uniformBuffer, 0, uniformData)
            
            pass.setVertexBuffer(0, polygonBuffer.buffer)
            pass.draw(polygonBuffer.vertexCount)
          })

          pass.end()
          device.queue.submit([encoder.finish()])

          animationId = requestAnimationFrame(render)
        }

        animationId = requestAnimationFrame(render)

        return () => {
          cancelAnimationFrame(animationId)
          polygonBuffers.forEach(pb => pb.buffer.destroy())
          uniformBuffer.destroy()
        }
      } catch (error) {
        console.error('WebGPU initialization failed:', error)
        setIsWebGPUSupported(false)
      }
    }

    initWebGPU()
  }, [animationSpeed, canvasSize])

  if (!isWebGPUSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">WebGPU Not Supported</h1>
          <p className="text-lg mb-4">
            Your browser doesn't support WebGPU. Please try using a modern Chrome, Firefox, or Safari browser.
          </p>
          <p className="text-sm text-gray-400">
            Make sure to enable WebGPU in your browser settings if available.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 p-4 rounded-lg">
        <h2 className="text-white text-lg font-bold mb-2">WebGPU Polygon Showcase</h2>
        <div className="text-white text-sm mb-2">
          Current: {polygonData[currentPolygon]?.name}
        </div>
        <div className="mb-2">
          <label className="text-white text-sm block mb-1">Animation Speed:</label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="text-white text-xs">
          {isInitialized ? 'WebGPU Initialized' : 'Loading...'}
        </div>
      </div>

      {/* Polygon list */}
      <div className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 p-4 rounded-lg max-w-xs">
        <h3 className="text-white text-sm font-bold mb-2">Polygons ({polygonData.length})</h3>
        <div className="text-white text-xs space-y-1">
          {polygonData.map((polygon, index) => (
            <div
              key={index}
              className={\`cursor-pointer hover:bg-gray-700 p-1 rounded \${
                index === currentPolygon ? 'bg-blue-600' : ''
              }\`}
              onClick={() => setCurrentPolygon(index)}
            >
              {polygon.name} ({polygon.vertices.length / 2} vertices)
            </div>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  )
}
