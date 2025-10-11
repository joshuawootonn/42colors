export function createFullsizeCanvas() {
    const canvas = document.createElement('canvas');
    return resizeFullsizeCanvas(canvas);
}

export const FULLSIZE_CANVAS_BLEED = 20;
/**
 * @returns the width of your screen plus a bleed of 20 pixels
 */
export function getFullsizeWidth() {
    return window.innerWidth + FULLSIZE_CANVAS_BLEED;
}

/**
 * @returns the height of your screen plus a bleed of 20 pixels
 */
export function getFullsizeHeight() {
    return window.innerHeight + FULLSIZE_CANVAS_BLEED;
}

export function resizeFullsizeCanvas(canvas: HTMLCanvasElement) {
    canvas.width = getFullsizeWidth();
    canvas.height = getFullsizeHeight();
    return canvas;
}
