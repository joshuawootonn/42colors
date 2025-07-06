import { CursorPosition } from '../geometry/coord';

export function drawBrushOutline(
    ctx: CanvasRenderingContext2D,
    cursorPosition: CursorPosition,
    brushSize: number,
    pixelSize: number,
) {
    ctx.beginPath();
    if (brushSize === 1) {
        ctx.strokeRect(
            cursorPosition.x,
            cursorPosition.y,
            pixelSize,
            pixelSize,
        );
        ctx.moveTo(cursorPosition.x, cursorPosition.y);
        ctx.lineTo(cursorPosition.x + pixelSize, cursorPosition.y);
        ctx.lineTo(cursorPosition.x + pixelSize, cursorPosition.y + pixelSize);
        ctx.lineTo(cursorPosition.x, cursorPosition.y + pixelSize);
        ctx.lineTo(cursorPosition.x, cursorPosition.y);
    } else if (brushSize === 2) {
        ctx.moveTo(cursorPosition.x - pixelSize, cursorPosition.y - pixelSize);
        ctx.lineTo(cursorPosition.x + pixelSize, cursorPosition.y - pixelSize);
        ctx.lineTo(cursorPosition.x + pixelSize, cursorPosition.y + pixelSize);
        ctx.lineTo(cursorPosition.x - pixelSize, cursorPosition.y + pixelSize);
        ctx.lineTo(cursorPosition.x - pixelSize, cursorPosition.y - pixelSize);
    } else if (brushSize === 3) {
        ctx.moveTo(cursorPosition.x, cursorPosition.y);
        ctx.lineTo(cursorPosition.x, cursorPosition.y - pixelSize);
        ctx.lineTo(cursorPosition.x + pixelSize, cursorPosition.y - pixelSize);
        ctx.lineTo(cursorPosition.x + pixelSize, cursorPosition.y);
        ctx.lineTo(cursorPosition.x + pixelSize * 2, cursorPosition.y);
        ctx.lineTo(
            cursorPosition.x + pixelSize * 2,
            cursorPosition.y + pixelSize,
        );
        ctx.lineTo(cursorPosition.x + pixelSize, cursorPosition.y + pixelSize);
        ctx.lineTo(
            cursorPosition.x + pixelSize,
            cursorPosition.y + pixelSize * 2,
        );
        ctx.lineTo(cursorPosition.x, cursorPosition.y + pixelSize * 2);
        ctx.lineTo(cursorPosition.x, cursorPosition.y + pixelSize);
        ctx.lineTo(cursorPosition.x - pixelSize, cursorPosition.y + pixelSize);
        ctx.lineTo(cursorPosition.x - pixelSize, cursorPosition.y);
        ctx.lineTo(cursorPosition.x, cursorPosition.y);
    } else if (brushSize === 4) {
        ctx.moveTo(cursorPosition.x - pixelSize, cursorPosition.y - pixelSize);
        ctx.lineTo(
            cursorPosition.x - pixelSize,
            cursorPosition.y - pixelSize * 2,
        );
        ctx.lineTo(
            cursorPosition.x + pixelSize,
            cursorPosition.y - pixelSize * 2,
        );
        ctx.lineTo(cursorPosition.x + pixelSize, cursorPosition.y - pixelSize);
        ctx.lineTo(
            cursorPosition.x + pixelSize * 2,
            cursorPosition.y - pixelSize,
        );
        ctx.lineTo(
            cursorPosition.x + pixelSize * 2,
            cursorPosition.y + pixelSize,
        );
        ctx.lineTo(cursorPosition.x + pixelSize, cursorPosition.y + pixelSize);
        ctx.lineTo(
            cursorPosition.x + pixelSize,
            cursorPosition.y + pixelSize * 2,
        );
        ctx.lineTo(
            cursorPosition.x - pixelSize,
            cursorPosition.y + pixelSize * 2,
        );
        ctx.lineTo(cursorPosition.x - pixelSize, cursorPosition.y + pixelSize);
        ctx.lineTo(
            cursorPosition.x - pixelSize * 2,
            cursorPosition.y + pixelSize,
        );
        ctx.lineTo(
            cursorPosition.x - pixelSize * 2,
            cursorPosition.y - pixelSize,
        );
        ctx.lineTo(cursorPosition.x - pixelSize, cursorPosition.y - pixelSize);
    } else if (brushSize === 5) {
        ctx.moveTo(cursorPosition.x - pixelSize, cursorPosition.y - pixelSize);
        ctx.lineTo(
            cursorPosition.x - pixelSize,
            cursorPosition.y - pixelSize * 2,
        );
        ctx.lineTo(
            cursorPosition.x + pixelSize * 2,
            cursorPosition.y - pixelSize * 2,
        );
        ctx.lineTo(
            cursorPosition.x + pixelSize * 2,
            cursorPosition.y - pixelSize,
        );
        ctx.lineTo(
            cursorPosition.x + pixelSize * 3,
            cursorPosition.y - pixelSize,
        );
        ctx.lineTo(
            cursorPosition.x + pixelSize * 3,
            cursorPosition.y + pixelSize * 2,
        );
        ctx.lineTo(
            cursorPosition.x + pixelSize * 2,
            cursorPosition.y + pixelSize * 2,
        );
        ctx.lineTo(
            cursorPosition.x + pixelSize * 2,
            cursorPosition.y + pixelSize * 3,
        );
        ctx.lineTo(
            cursorPosition.x - pixelSize,
            cursorPosition.y + pixelSize * 3,
        );
        ctx.lineTo(
            cursorPosition.x - pixelSize,
            cursorPosition.y + pixelSize * 2,
        );
        ctx.lineTo(
            cursorPosition.x - pixelSize * 2,
            cursorPosition.y + pixelSize * 2,
        );
        ctx.lineTo(
            cursorPosition.x - pixelSize * 2,
            cursorPosition.y - pixelSize,
        );
        ctx.lineTo(
            cursorPosition.x - pixelSize * 1,
            cursorPosition.y - pixelSize,
        );
    }
}
