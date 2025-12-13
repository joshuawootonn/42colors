/**
 * Buffer pool for efficient WebGPU vertex buffer management
 * Reuses buffers to avoid constant allocation/deallocation
 */

interface PooledBuffer {
  buffer: GPUBuffer;
  size: number;
  inUse: boolean;
  lastUsed: number;
}

export class WebGPUBufferPool {
  private device: GPUDevice;
  private buffers: PooledBuffer[] = [];
  private maxPoolSize: number;
  private maxBufferAge: number; // milliseconds
  private pendingReturns: Array<{ buffer: GPUBuffer; frameId: number }> = [];
  private currentFrameId: number = 0;

  constructor(
    device: GPUDevice,
    maxPoolSize: number = 100,
    maxBufferAge: number = 30000, // 30 seconds
  ) {
    this.device = device;
    this.maxPoolSize = maxPoolSize;
    this.maxBufferAge = maxBufferAge;
  }

  /**
   * Get a buffer from the pool or create a new one
   * @param size Size in bytes needed for the buffer
   * @returns A GPUBuffer ready for use
   */
  getBuffer(size: number): GPUBuffer {
    // First, try to find an existing buffer that's large enough and not in use
    const availableBuffer = this.buffers.find(
      (pooledBuffer) => !pooledBuffer.inUse && pooledBuffer.size >= size,
    );

    if (availableBuffer) {
      availableBuffer.inUse = true;
      availableBuffer.lastUsed = Date.now();
      return availableBuffer.buffer;
    }

    // If no suitable buffer found, create a new one
    // Round up size to next power of 2 for better reusability
    const actualSize = this.roundUpToPowerOfTwo(Math.max(size, 64));

    const buffer = this.device.createBuffer({
      size: actualSize,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    const pooledBuffer: PooledBuffer = {
      buffer,
      size: actualSize,
      inUse: true,
      lastUsed: Date.now(),
    };

    this.buffers.push(pooledBuffer);

    // Clean up old buffers if pool is getting too large
    this.cleanup();

    return buffer;
  }

  /**
   * Return a buffer to the pool when done using it
   * @param buffer The buffer to return
   */
  returnBuffer(buffer: GPUBuffer): void {
    const pooledBuffer = this.buffers.find((pb) => pb.buffer === buffer);
    if (pooledBuffer) {
      pooledBuffer.inUse = false;
      pooledBuffer.lastUsed = Date.now();
    }
  }

  /**
   * Schedule a buffer to be returned after the current frame's GPU work completes
   * @param buffer The buffer to return later
   */
  returnBufferAfterFrame(buffer: GPUBuffer): void {
    this.pendingReturns.push({ buffer, frameId: this.currentFrameId });
  }

  /**
   * Process deferred buffer returns after GPU work is complete
   * Call this after submitting command buffers to the queue
   */
  async processFrameCompletion(): Promise<void> {
    this.currentFrameId++;

    // Wait for GPU to finish current work
    await this.device.queue.onSubmittedWorkDone();

    // Process returns from previous frames (keep a small buffer for safety)
    const safeFrameId = this.currentFrameId - 2;
    const toReturn = this.pendingReturns.filter((item) => item.frameId <= safeFrameId);

    toReturn.forEach((item) => {
      this.returnBuffer(item.buffer);
    });

    // Remove processed returns
    this.pendingReturns = this.pendingReturns.filter((item) => item.frameId > safeFrameId);
  }

  /**
   * Clean up old or excess buffers
   */
  private cleanup(): void {
    const now = Date.now();

    // Remove old buffers that haven't been used recently
    const activeBuffers = this.buffers.filter((pooledBuffer) => {
      const isOld = now - pooledBuffer.lastUsed > this.maxBufferAge;
      const shouldRemove = !pooledBuffer.inUse && isOld;

      if (shouldRemove) {
        pooledBuffer.buffer.destroy();
        return false;
      }
      return true;
    });

    // If still too many buffers, remove the oldest unused ones
    if (activeBuffers.length > this.maxPoolSize) {
      const unusedBuffers = activeBuffers
        .filter((pb) => !pb.inUse)
        .sort((a, b) => a.lastUsed - b.lastUsed);

      const toRemove = unusedBuffers.slice(0, activeBuffers.length - this.maxPoolSize);
      toRemove.forEach((pooledBuffer) => {
        pooledBuffer.buffer.destroy();
        const index = activeBuffers.indexOf(pooledBuffer);
        if (index > -1) {
          activeBuffers.splice(index, 1);
        }
      });
    }

    this.buffers = activeBuffers;
  }

  /**
   * Get pool statistics for debugging
   */
  getStats(): {
    totalBuffers: number;
    buffersInUse: number;
    totalMemory: number;
    memoryInUse: number;
  } {
    const totalBuffers = this.buffers.length;
    const buffersInUse = this.buffers.filter((pb) => pb.inUse).length;
    const totalMemory = this.buffers.reduce((sum, pb) => sum + pb.size, 0);
    const memoryInUse = this.buffers.filter((pb) => pb.inUse).reduce((sum, pb) => sum + pb.size, 0);

    return {
      totalBuffers,
      buffersInUse,
      totalMemory,
      memoryInUse,
    };
  }

  /**
   * Force cleanup of all buffers (call when shutting down)
   */
  destroy(): void {
    this.buffers.forEach((pooledBuffer) => {
      pooledBuffer.buffer.destroy();
    });
    this.buffers = [];
  }

  /**
   * Round up to next power of 2 for better buffer reusability
   */
  private roundUpToPowerOfTwo(n: number): number {
    if (n <= 0) return 1;
    if ((n & (n - 1)) === 0) return n; // Already power of 2

    let power = 1;
    while (power < n) {
      power <<= 1;
    }
    return power;
  }
}

/**
 * Wrapper class for managing a buffer that will be automatically returned to pool
 */
export class PooledBufferHandle {
  private pool: WebGPUBufferPool;
  private _buffer: GPUBuffer;
  private returned: boolean = false;

  constructor(pool: WebGPUBufferPool, buffer: GPUBuffer) {
    this.pool = pool;
    this._buffer = buffer;
  }

  get buffer(): GPUBuffer {
    if (this.returned) {
      throw new Error("Buffer has already been returned to pool");
    }
    return this._buffer;
  }

  /**
   * Return the buffer to the pool
   */
  return(): void {
    if (!this.returned) {
      this.pool.returnBuffer(this._buffer);
      this.returned = true;
    }
  }

  /**
   * Auto-return when garbage collected (fallback safety)
   */
  finalize(): void {
    this.return();
  }
}
