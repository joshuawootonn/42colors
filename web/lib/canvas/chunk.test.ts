import { describe, expect, it } from 'vitest';

import { Pixel, pixelArraySchema } from '../geometry/coord';
import { getUniqueChunksFromPixels } from './chunk';

describe('getUniqueChunksFromPixels', () => {
    it('should return unique chunk keys for pixels in different chunks', () => {
        const pixels: Pixel[] = pixelArraySchema.parse([
            { x: 100, y: 100, color_ref: 1 }, // Chunk x: 0 y: 0
            { x: 500, y: 200, color_ref: 2 }, // Chunk x: 400 y: 0
            { x: 150, y: 600, color_ref: 3 }, // Chunk x: 0 y: 400
        ]);

        const result = getUniqueChunksFromPixels(pixels);

        expect(result).toHaveLength(3);
        expect(result).toContain('x: 0 y: 0');
        expect(result).toContain('x: 400 y: 0');
        expect(result).toContain('x: 0 y: 400');
    });

    it('should deduplicate pixels from the same chunk', () => {
        const pixels = pixelArraySchema.parse([
            { x: 10, y: 20, color_ref: 1 }, // All in chunk x: 0 y: 0
            { x: 50, y: 100, color_ref: 2 },
            { x: 200, y: 300, color_ref: 3 },
            { x: 15, y: 25, color_ref: 4 }, // Same chunk as first pixel
        ]);

        const result = getUniqueChunksFromPixels(pixels);

        expect(result).toHaveLength(1);
        expect(result).toContain('x: 0 y: 0');
    });

    it('should handle empty pixel array', () => {
        const pixels: Pixel[] = [];

        const result = getUniqueChunksFromPixels(pixels);

        expect(result).toHaveLength(0);
        expect(result).toEqual([]);
    });
});
