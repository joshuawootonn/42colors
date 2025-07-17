import { ErasureSettings } from './erasure';

export function clampErasureSize(size: number): ErasureSettings['size'] {
    return Math.max(Math.min(size, 5), 1);
}
