export type Color = [number, number, number, number];

export const BLUE: Color = [0, 0, 1, 1];
export const BLACK: Color = [0, 0, 0, 1];
export const WHITE: Color = [1, 1, 1, 1];
export const LIGHT_GRAY: Color = [0.9, 0.9, 0.9, 1];
export const DARK_RED: Color = [0.8, 0, 0, 1]; // Darker red for outline
export const CLAIMER_YELLOW: Color = [246 / 255, 240 / 255, 74 / 255, 1];

export function hexToRgbaColor(hex: string): Color {
    // Remove # if present
    hex = hex.replace('#', '');

    // Handle 'transparent' case
    if (hex === 'transparent') {
        return [0, 0, 0, 0];
    }

    // Parse hex color
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    return [r, g, b, 1];
}
