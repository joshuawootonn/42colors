import { LineSettings } from './line';

export function clampLineSize(size: number): LineSettings['size'] {
    return Math.max(Math.min(size, 10), 1);
}
