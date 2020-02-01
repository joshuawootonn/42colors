import { Point } from './canvas.todo';
import { lazy, MutableRefObject, RefObject } from 'react';
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

export const drawBrush = (
    canvas: RefObject<HTMLCanvasElement>,
    lazy: any,
    catenary: any,
    pointer: Point,
    brush: Point,
    canvasSettings: CanvasSettings
) => {
    if (canvas.current && canvas.current.getContext('2d')) {
        const c = canvas.current.getContext('2d') as any;
        c.clearRect(0, 0, c.canvas.width, c.canvas.height);

        // Draw brush preview
        c.beginPath();
        c.fillStyle = canvasSettings.brushColor;
        c.arc(brush.x, brush.y, canvasSettings.brushRadius, 0, Math.PI * 2, true);
        c.fill();

        // Draw mouse point (the one directly at the cursor)
        c.beginPath();
        c.fillStyle = canvasSettings.catenaryColor;
        c.arc(pointer.x, pointer.y, 4, 0, Math.PI * 2, true);
        c.fill();

        if (lazy.isEnabled()) {
            c.beginPath();

            c.lineWidth = 2;
            c.lineCap = 'round';
            c.setLineDash([2, 4]);
            c.strokeStyle = canvasSettings.catenaryColor;
            catenary.drawToCanvas(c, brush, pointer, canvasSettings.lazyRadius);
            c.stroke();
        }
        // Draw brush point (the one in the middle of the brush preview)
        c.beginPath();
        c.fillStyle = canvasSettings.catenaryColor;
        c.arc(brush.x, brush.y, 2, 0, Math.PI * 2, true);
        c.fill();
    }
};
