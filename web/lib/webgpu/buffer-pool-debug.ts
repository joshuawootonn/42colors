import { WebGPUBufferPool } from "./buffer-pool";

/**
 * Debug utilities for monitoring buffer pool performance
 */
export class BufferPoolDebugger {
  private pool: WebGPUBufferPool;
  private intervalId: number | null = null;

  constructor(pool: WebGPUBufferPool) {
    this.pool = pool;
  }

  /**
   * Start logging pool statistics at regular intervals
   * @param intervalMs How often to log stats (default: 5 seconds)
   */
  startLogging(intervalMs: number = 5000): void {
    if (this.intervalId !== null) {
      this.stopLogging();
    }

    this.intervalId = window.setInterval(() => {
      this.logStats();
    }, intervalMs);

    console.log("🔧 Buffer pool debugging started");
  }

  /**
   * Stop logging pool statistics
   */
  stopLogging(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("🔧 Buffer pool debugging stopped");
    }
  }

  /**
   * Log current pool statistics
   */
  logStats(): void {
    const stats = this.pool.getStats();
    console.group("🎯 WebGPU Buffer Pool Stats");
    console.log(`📊 Total buffers: ${stats.totalBuffers}`);
    console.log(`🔄 Buffers in use: ${stats.buffersInUse}`);
    console.log(`💾 Total memory: ${this.formatBytes(stats.totalMemory)}`);
    console.log(`🔥 Memory in use: ${this.formatBytes(stats.memoryInUse)}`);
    console.log(`📈 Pool efficiency: ${this.calculateEfficiency(stats)}%`);
    console.groupEnd();
  }

  /**
   * Calculate pool efficiency (how much of allocated memory is being used)
   */
  private calculateEfficiency(stats: ReturnType<WebGPUBufferPool["getStats"]>): number {
    if (stats.totalMemory === 0) return 100;
    return Math.round((stats.memoryInUse / stats.totalMemory) * 100);
  }

  /**
   * Format bytes into human-readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  /**
   * Get a snapshot of current stats for manual inspection
   */
  getSnapshot(): ReturnType<WebGPUBufferPool["getStats"]> & {
    efficiency: number;
  } {
    const stats = this.pool.getStats();
    return {
      ...stats,
      efficiency: this.calculateEfficiency(stats),
    };
  }
}

/**
 * Quick debug function to check pool status
 */
export function debugBufferPool(pool: WebGPUBufferPool): void {
  const debuger = new BufferPoolDebugger(pool);
  debuger.logStats();
}
