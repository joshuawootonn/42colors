// Backup WebGPU type declarations
// This file provides additional WebGPU types if @webgpu/types doesn't cover everything

declare global {
    interface Navigator {
        gpu?: GPU;
    }

    interface GPU {
        requestAdapter(
            options?: GPURequestAdapterOptions,
        ): Promise<GPUAdapter | null>;
        getPreferredCanvasFormat(): GPUTextureFormat;
    }

    interface GPUAdapter {
        requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
    }

    interface GPUDevice {
        createShaderModule(
            descriptor: GPUShaderModuleDescriptor,
        ): GPUShaderModule;
        createRenderPipeline(
            descriptor: GPURenderPipelineDescriptor,
        ): GPURenderPipeline;
        createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer;
        createTexture(descriptor: GPUTextureDescriptor): GPUTexture;
        createSampler(descriptor?: GPUSamplerDescriptor): GPUSampler;
        createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup;
        createBindGroupLayout(
            descriptor: GPUBindGroupLayoutDescriptor,
        ): GPUBindGroupLayout;
        createPipelineLayout(
            descriptor: GPUPipelineLayoutDescriptor,
        ): GPUPipelineLayout;
        createCommandEncoder(
            descriptor?: GPUCommandEncoderDescriptor,
        ): GPUCommandEncoder;
        queue: GPUQueue;
    }

    interface GPUQueue {
        submit(commandBuffers: GPUCommandBuffer[]): void;
        writeBuffer(
            buffer: GPUBuffer,
            bufferOffset: number,
            data: ArrayBuffer | ArrayBufferView,
        ): void;
        writeTexture(
            destination: GPUImageCopyTexture,
            data: ArrayBuffer | ArrayBufferView,
            dataLayout: GPUImageDataLayout,
            size: GPUExtent3D,
        ): void;
    }

    // Enum-like constants
    const GPUBufferUsage: {
        readonly VERTEX: number;
        readonly UNIFORM: number;
        readonly COPY_DST: number;
    };

    const GPUTextureUsage: {
        readonly TEXTURE_BINDING: number;
        readonly COPY_DST: number;
    };

    const GPUShaderStage: {
        readonly VERTEX: number;
        readonly FRAGMENT: number;
    };
}

export {};
