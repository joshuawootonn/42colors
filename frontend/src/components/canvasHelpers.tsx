import { Point } from './canvas.todo';
import { lazy } from 'react';
import { CanvasSettings } from '../models/canvas';

export const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.beginPath();
    ctx.setLineDash([5, 1]);
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(150,150,150,0.17)';
    ctx.lineWidth = 0.5;

    const gridSize = 25;

    let countX = 0;
    while (countX < ctx.canvas.width) {
        countX += gridSize;
        ctx.moveTo(countX, 0);
        ctx.lineTo(countX, ctx.canvas.height);
    }
    ctx.stroke();

    let countY = 0;
    while (countY < ctx.canvas.height) {
        countY += gridSize;
        ctx.moveTo(0, countY);
        ctx.lineTo(ctx.canvas.width, countY);
    }
    ctx.stroke();
};

export const drawInterface = (
    ctx: CanvasRenderingContext2D,
    lazyBrush: any,
    catenary: any,
    pointer: Point,
    brush: Point,
    canvasSettings: CanvasSettings
) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw brush preview
    ctx.beginPath();
    ctx.fillStyle = canvasSettings.brushColor;
    ctx.arc(brush.x, brush.y, canvasSettings.brushRadius, 0, Math.PI * 2, true);
    ctx.fill();

    // Draw mouse point (the one directly at the cursor)
    ctx.beginPath();
    ctx.fillStyle = canvasSettings.catenaryColor;
    ctx.arc(pointer.x, pointer.y, 4, 0, Math.PI * 2, true);
    ctx.fill();

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = canvasSettings.catenaryColor;
    catenary.drawToCanvas(ctx, brush, pointer, canvasSettings.lazyRadius);
    ctx.stroke();

    // Draw brush point (the one in the middle of the brush preview)
    ctx.beginPath();
    ctx.fillStyle = canvasSettings.catenaryColor;
    ctx.arc(brush.x, brush.y, 2, 0, Math.PI * 2, true);
    ctx.fill();
};
